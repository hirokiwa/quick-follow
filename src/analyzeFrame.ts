import type { AnalysisResult, Feedback } from './types'
import type { DebugLogger } from './debug/logger'
import { noopDebugLogger } from './debug/logger'
import { cropUpperProfileRegion } from './image-processing/phoneRegion'
import { preprocessTextImage } from './image-processing/preprocess'
import type { OcrWorker } from './ocr/tesseract'
import { recognizeProfileLines } from './ocr/tesseract'
import { scoreHandleCandidates } from './profile/handleScoring'
import { createDetectionResult, hasXProfileKeyword } from './profile/xProfile'

type PhoneCanvasAnalysisOptions = {
  readonly phoneCanvas: HTMLCanvasElement
  readonly worker: OcrWorker
  readonly logger?: DebugLogger
  readonly feedback?: Feedback
}

export const analyzePhoneCanvas = async ({
  phoneCanvas,
  worker,
  logger = noopDebugLogger,
  feedback = () => undefined,
}: PhoneCanvasAnalysisOptions): Promise<AnalysisResult> => {
  logger.group('analyze phone canvas')
  feedback('プロフィール上部を切り出し中')
  const profileCanvas = cropUpperProfileRegion(phoneCanvas)

  logger.info('phone canvas', {
    width: phoneCanvas.width,
    height: phoneCanvas.height,
  })
  logger.info('profile region canvas', {
    width: profileCanvas.width,
    height: profileCanvas.height,
  })

  feedback('画像を前処理中')
  const processedCanvas = preprocessTextImage(profileCanvas)

  feedback('OCRを実行中')
  const lines = await recognizeProfileLines(worker, processedCanvas)
  const fullText = lines.map((line) => line.text).join('\n')
  logger.info('OCR lines', lines)
  logger.info('OCR line contents', lines.map((line) => ({
    index: line.index,
    text: line.text,
    confidence: line.confidence,
    bounds: line.bounds,
  })))
  logger.info('OCR text', fullText)
  console.table(lines.map((line) => ({
    index: line.index,
    text: line.text,
    confidence: line.confidence,
    x: line.bounds.x,
    y: line.bounds.y,
    width: line.bounds.width,
    height: line.bounds.height,
  })))

  feedback('テキストを整形中')
  feedback('ID候補を抽出中')
  const candidates = scoreHandleCandidates(lines, processedCanvas.height)
  logger.info('handle candidates', candidates)

  feedback('Xプロフィールか判定中')
  const profileConfirmed = hasXProfileKeyword(fullText)
  logger.info('profile confirmation', {
    profileConfirmed,
  })

  feedback('最終候補を決定中')
  const bestCandidate = candidates[0]

  if (bestCandidate === undefined) {
    logger.warn('result', 'no scored handle candidate')
    logger.groupEnd()

    return {
      type: 'idle',
      ocrLines: lines,
    }
  }

  const detection = createDetectionResult(bestCandidate.handle, profileConfirmed, bestCandidate.line.bounds)

  logger.info('result', detection)
  logger.groupEnd()

  return {
    type: 'detected',
    detection,
    ocrLines: lines,
  }
}
