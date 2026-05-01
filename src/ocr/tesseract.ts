import { createWorker } from 'tesseract.js'
import type { OcrTextLine } from '../types'

export type OcrWorker = Awaited<ReturnType<typeof createWorker>>
type WorkerParameters = Parameters<OcrWorker['setParameters']>[0]

const sparseTextPageSegmentationMode = '11' as unknown as Tesseract.PSM

export const createOcrWorker = async (): Promise<OcrWorker> => {
  const worker = await createWorker('eng+jpn')

  await worker.setParameters({
    tessedit_pageseg_mode: sparseTextPageSegmentationMode,
    preserve_interword_spaces: '0',
  } satisfies WorkerParameters)

  return worker
}

export const recognizeProfileLines = async (
  worker: OcrWorker,
  canvas: HTMLCanvasElement,
): Promise<readonly OcrTextLine[]> => {
  await worker.setParameters({
    tessedit_pageseg_mode: sparseTextPageSegmentationMode,
  } satisfies WorkerParameters)

  const result = await worker.recognize(canvas)

  return result.data.blocks
    ?.flatMap((block) => block.paragraphs)
    .flatMap((paragraph) => paragraph.lines)
    .map((line, index) => ({
      text: line.text.trim(),
      index,
      top: line.bbox.y0,
      bounds: {
        x: line.bbox.x0,
        y: line.bbox.y0,
        width: line.bbox.x1 - line.bbox.x0,
        height: line.bbox.y1 - line.bbox.y0,
      },
      confidence: line.confidence,
    })) ?? []
}

export const terminateOcrWorker = (worker: OcrWorker | undefined): Promise<unknown> =>
  worker?.terminate() ?? Promise.resolve()
