import type { ObjectDetector } from '@mediapipe/tasks-vision'
import { analyzePhoneCanvas } from './analyzeFrame'
import { startCameraStream, stopCameraStream } from './camera/stream'
import { createDebugLogger } from './debug/logger'
import { createPhoneDetector, detectLargestPhone, detectLargestPhoneInImage } from './detection/mediaPipePhoneDetector'
import { cropPhoneRegionFromCanvas } from './image-processing/phoneRegion'
import { createCanvasFromFile, createCanvasFromVideo } from './image-processing/upload'
import { createOcrWorker, terminateOcrWorker } from './ocr/tesseract'
import { getQuickFollowElements } from './ui/elements'
import { renderAnalyzing, renderDebugPreview, renderDetection, renderError, renderIdle, renderPhoneDetected, renderPhoneNotDetected, renderPhoneSearching, renderPreparing, renderScanning, renderStartDialog, renderStatus, renderZoomedDebugPreview } from './ui/render'

type AppState = {
  stream: MediaStream | undefined
  intervalId: number | undefined
  worker: Awaited<ReturnType<typeof createOcrWorker>> | undefined
  detector: ObjectDetector | undefined
  imageDetector: ObjectDetector | undefined
  isAnalyzing: boolean
  shouldResumeAfterResultDialogClose: boolean
}

const analysisIntervalMilliseconds = 750
const logger = createDebugLogger('app')

const state: AppState = {
  stream: undefined,
  intervalId: undefined,
  worker: undefined,
  detector: undefined,
  imageDetector: undefined,
  isAnalyzing: false,
  shouldResumeAfterResultDialogClose: false,
}

const clearAnalysisInterval = (): void => {
  if (state.intervalId !== undefined) {
    window.clearInterval(state.intervalId)
    state.intervalId = undefined
  }
}

const stopScanning = (): void => {
  logger.info('stop scanning')
  clearAnalysisInterval()
  stopCameraStream(state.stream)
  state.stream = undefined
  state.isAnalyzing = false
}

const freezeScanning = (): void => {
  logger.info('freeze scanning')
  clearAnalysisInterval()
  stopCameraStream(state.stream)
  state.stream = undefined
}

export const initializeApp = (): void => {
  const elements = getQuickFollowElements()

  const runAnalysis = async (): Promise<void> => {
    if (
      state.worker === undefined ||
      state.detector === undefined ||
      state.isAnalyzing ||
      elements.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      logger.info('skip camera analysis', {
        hasWorker: state.worker !== undefined,
        hasDetector: state.detector !== undefined,
        isAnalyzing: state.isAnalyzing,
        videoReadyState: elements.video.readyState,
      })

      return
    }

    state.isAnalyzing = true

    try {
      renderPhoneSearching(elements)
      const phoneDetection = detectLargestPhone(state.detector, elements.video, performance.now())
      logger.info('phone detection', phoneDetection)

      if (phoneDetection === undefined) {
        renderPhoneNotDetected(elements, 'スマホが見つかりません')
        return
      }

      logger.info('phone detected, analyze current frame', phoneDetection)
      renderPhoneDetected(elements)
      const capturedImage = createCanvasFromVideo(elements.video)
      const phoneCanvas = cropPhoneRegionFromCanvas(capturedImage.sourceCanvas, phoneDetection.bounds)
      renderStatus(elements, '透視補正をスキップ中')
      const result = await analyzePhoneCanvas({
        phoneCanvas,
        worker: state.worker,
        logger: createDebugLogger('camera'),
        feedback: (message) => {
          renderStatus(elements, message)
        },
      })

      logger.info('camera analysis result', result)

      if (result.type === 'detected') {
        state.shouldResumeAfterResultDialogClose = true
        freezeScanning()
        renderZoomedDebugPreview(
          elements,
          capturedImage.previewImageUrl,
          phoneDetection.bounds,
          capturedImage.naturalWidth,
          capturedImage.naturalHeight,
        )
        renderDetection(elements, result.detection)
      } else {
        renderPhoneNotDetected(elements, '文字を検出できませんでした')
      }
    } catch (error) {
      logger.error('camera analysis error', error)
      renderError(elements, '読み取りに失敗しました')
      stopScanning()
    } finally {
      state.isAnalyzing = false
    }
  }

  const ensureOcrWorker = async (): Promise<Awaited<ReturnType<typeof createOcrWorker>>> => {
    logger.info('ensure OCR worker', {
      exists: state.worker !== undefined,
    })
    state.worker = state.worker ?? await createOcrWorker()

    return state.worker
  }

  const ensurePhoneDetector = async (): Promise<ObjectDetector> => {
    logger.info('ensure MediaPipe detector', {
      exists: state.detector !== undefined,
    })
    state.detector = state.detector ?? await createPhoneDetector('VIDEO')

    return state.detector
  }

  const ensureImagePhoneDetector = async (): Promise<ObjectDetector> => {
    logger.info('ensure MediaPipe image detector', {
      exists: state.imageDetector !== undefined,
    })
    state.imageDetector = state.imageDetector ?? await createPhoneDetector('IMAGE')

    return state.imageDetector
  }

  const startScanning = async (): Promise<void> => {
    try {
      logger.info('start camera scanning')
      renderPreparing(elements)
      renderStatus(elements, 'カメラを起動中')
      state.stream = await startCameraStream()
      elements.video.srcObject = state.stream
      await elements.video.play()
      renderStatus(elements, 'MediaPipeを準備中')
      await ensurePhoneDetector()
      renderStatus(elements, 'OCRを準備中')
      await ensureOcrWorker()
      renderScanning(elements)
      state.intervalId = window.setInterval(() => {
        void runAnalysis()
      }, analysisIntervalMilliseconds)
    } catch (error) {
      logger.error('start camera error', error)
      renderError(elements, 'カメラを使用できません')
      stopScanning()
    }
  }

  const analyzeUploadedFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined || state.isAnalyzing) {
      logger.info('skip upload analysis', {
        hasFile: file !== undefined,
        isAnalyzing: state.isAnalyzing,
      })

      return
    }

    try {
      logger.group('upload')
      logger.info('file', {
        name: file.name,
        type: file.type,
        size: file.size,
      })
      stopScanning()
      state.isAnalyzing = true
      renderAnalyzing(elements)

      renderStatus(elements, '画像を読み込み中')
      const uploadedImage = await createCanvasFromFile(file)
      renderDebugPreview(elements, uploadedImage.previewImageUrl)

      renderStatus(elements, 'MediaPipeを準備中')
      const detector = await ensureImagePhoneDetector()
      renderStatus(elements, 'スマホを検出中')
      const phoneDetection = detectLargestPhoneInImage(detector, uploadedImage.sourceCanvas)
      logger.info('upload phone detection', phoneDetection)

      if (phoneDetection === undefined) {
        renderDebugPreview(elements, uploadedImage.previewImageUrl)
        renderError(elements, 'スマホが見つかりません')
        return
      }

      renderZoomedDebugPreview(
        elements,
        uploadedImage.previewImageUrl,
        phoneDetection.bounds,
        uploadedImage.naturalWidth,
        uploadedImage.naturalHeight,
      )

      renderStatus(elements, 'スマホ領域を切り出し中')
      const phoneCanvas = cropPhoneRegionFromCanvas(uploadedImage.sourceCanvas, phoneDetection.bounds)
      renderStatus(elements, '透視補正をスキップ中')
      renderStatus(elements, 'OCRを準備中')
      const worker = await ensureOcrWorker()
      const result = await analyzePhoneCanvas({
        phoneCanvas,
        worker,
        logger: createDebugLogger('upload'),
        feedback: (message) => {
          renderStatus(elements, message)
        },
      })
      logger.info('upload analysis result', result)
      renderZoomedDebugPreview(
        elements,
        uploadedImage.previewImageUrl,
        phoneDetection.bounds,
        uploadedImage.naturalWidth,
        uploadedImage.naturalHeight,
      )

      if (result.type === 'detected') {
        state.shouldResumeAfterResultDialogClose = true
        renderDetection(elements, result.detection)
      } else {
        renderError(elements, 'IDを検出できませんでした')
      }
    } catch (error) {
      logger.error('upload analysis error', error)
      renderError(elements, '画像を解析できません')
    } finally {
      state.isAnalyzing = false
      elements.uploadInput.value = ''
      logger.groupEnd()
    }
  }

  elements.startButton.addEventListener('click', () => {
    void startScanning()
  })
  elements.startDialogButton.addEventListener('click', () => {
    void startScanning()
  })
  elements.startDialogCloseButton.addEventListener('click', () => {
    elements.startDialog.close()
  })
  elements.stopButton.addEventListener('click', () => {
    stopScanning()
    renderIdle(elements)
  })
  elements.resultCloseButton.addEventListener('click', () => {
    elements.resultDialog.close()
  })
  elements.resultDialog.addEventListener('close', () => {
    if (state.shouldResumeAfterResultDialogClose) {
      state.shouldResumeAfterResultDialogClose = false
      void startScanning()
    }
  })
  elements.uploadInput.addEventListener('change', () => {
    void analyzeUploadedFile(elements.uploadInput.files?.[0])
  })
  window.addEventListener('pagehide', () => {
    stopScanning()
    void terminateOcrWorker(state.worker)
    state.detector?.close()
    state.imageDetector?.close()
  })

  renderIdle(elements)
  renderStartDialog(elements)
}
