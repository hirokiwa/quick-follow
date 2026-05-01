import { createWorker } from 'tesseract.js'
import type { Rectangle } from '../types'
import type { OcrTextLine } from '../types'

export type OcrWorker = Awaited<ReturnType<typeof createWorker>>
type WorkerParameters = Parameters<OcrWorker['setParameters']>[0]

const sparseTextPageSegmentationMode = '11' as unknown as Tesseract.PSM
const singleBlockPageSegmentationMode = '6' as unknown as Tesseract.PSM
const automaticPageSegmentationMode = '3' as unknown as Tesseract.PSM
const ocrDpi = '300'
const twitterHandleCharacterWhitelist = '@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_'

type TesseractBbox = {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

type TesseractSymbol = {
  readonly bbox: TesseractBbox
}

type TesseractWord = {
  readonly symbols?: readonly TesseractSymbol[]
  readonly bbox: TesseractBbox
}

type TesseractLine = {
  readonly words?: readonly TesseractWord[]
  readonly bbox: TesseractBbox
}

const mergeBboxes = (bboxes: readonly TesseractBbox[]): Rectangle | undefined => {
  if (bboxes.length === 0) {
    return undefined
  }

  const left = Math.min(...bboxes.map((bbox) => bbox.x0))
  const top = Math.min(...bboxes.map((bbox) => bbox.y0))
  const right = Math.max(...bboxes.map((bbox) => bbox.x1))
  const bottom = Math.max(...bboxes.map((bbox) => bbox.y1))

  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  }
}

const getPreciseLineBounds = (line: TesseractLine): Rectangle => {
  const symbolBboxes = line.words
    ?.flatMap((word) => word.symbols ?? [])
    .map((symbol) => symbol.bbox) ?? []
  const wordBboxes = line.words?.map((word) => word.bbox) ?? []
  const mergedBounds = mergeBboxes(symbolBboxes) ?? mergeBboxes(wordBboxes) ?? mergeBboxes([line.bbox])

  return mergedBounds ?? {
    x: line.bbox.x0,
    y: line.bbox.y0,
    width: Math.max(1, line.bbox.x1 - line.bbox.x0),
    height: Math.max(1, line.bbox.y1 - line.bbox.y0),
  }
}

const toRectangle = (bbox: TesseractBbox): Rectangle => ({
  x: bbox.x0,
  y: bbox.y0,
  width: Math.max(1, bbox.x1 - bbox.x0),
  height: Math.max(1, bbox.y1 - bbox.y0),
})

const getCharacterBounds = (line: TesseractLine): readonly Rectangle[] => {
  const symbolBboxes = line.words
    ?.flatMap((word) => word.symbols ?? [])
    .map((symbol) => symbol.bbox) ?? []
  const wordBboxes = line.words?.map((word) => word.bbox) ?? []

  return (symbolBboxes.length > 0 ? symbolBboxes : wordBboxes).map(toRectangle)
}

export const createOcrWorker = async (): Promise<OcrWorker> => {
  const worker = await createWorker('eng')

  await worker.setParameters({
    tessedit_pageseg_mode: sparseTextPageSegmentationMode,
    tessedit_char_whitelist: twitterHandleCharacterWhitelist,
    preserve_interword_spaces: '0',
    user_defined_dpi: ocrDpi,
  } satisfies WorkerParameters)

  return worker
}

export const recognizeProfileLines = async (
  worker: OcrWorker,
  canvas: HTMLCanvasElement,
): Promise<readonly OcrTextLine[]> => {
  const recognizeWithMode = async (pageSegmentationMode: Tesseract.PSM): Promise<readonly OcrTextLine[]> => {
    await worker.setParameters({
      tessedit_pageseg_mode: pageSegmentationMode,
      tessedit_char_whitelist: twitterHandleCharacterWhitelist,
      user_defined_dpi: ocrDpi,
    } satisfies WorkerParameters)

    const result = await worker.recognize(canvas, {}, {
      text: true,
      blocks: true,
    })
    const blockLines = result.data.blocks
      ?.flatMap((block) => block.paragraphs)
      .flatMap((paragraph) => paragraph.lines)
      .map((line, index) => {
        const bounds = getPreciseLineBounds(line)

        return {
          text: line.text.trim(),
          index,
          top: bounds.y,
          bounds,
          characterBounds: getCharacterBounds(line),
          confidence: line.confidence,
        }
      }) ?? []
    const textLines = result.data.text
      .split('\n')
      .map((text) => text.trim())
      .filter((text) => text.length > 0)

    if (blockLines.length > 0) {
      return blockLines
    }

    return textLines.map((text, index) => ({
      text,
      index,
      top: (canvas.height / Math.max(1, textLines.length)) * index,
      bounds: {
        x: 0,
        y: (canvas.height / Math.max(1, textLines.length)) * index,
        width: canvas.width,
        height: canvas.height / Math.max(1, textLines.length),
      },
      characterBounds: [],
      confidence: result.data.confidence,
    }))
  }

  const singleBlockLines = await recognizeWithMode(singleBlockPageSegmentationMode)

  if (singleBlockLines.length > 0) {
    return singleBlockLines
  }

  const sparseTextLines = await recognizeWithMode(sparseTextPageSegmentationMode)

  if (sparseTextLines.length > 0) {
    return sparseTextLines
  }

  return recognizeWithMode(automaticPageSegmentationMode)
}

export const recognizeProfileLinesFromCanvases = async (
  worker: OcrWorker,
  canvases: readonly HTMLCanvasElement[],
): Promise<{ readonly lines: readonly OcrTextLine[]; readonly canvas: HTMLCanvasElement }> => {
  const emptyResult = {
    lines: [],
    canvas: canvases[0] ?? document.createElement('canvas'),
  }
  const firstDetectedResult = await canvases.reduce<Promise<{ readonly lines: readonly OcrTextLine[]; readonly canvas: HTMLCanvasElement }>>(
    async (previousResult, canvas) => {
      const result = await previousResult

      return result.lines.length > 0
        ? result
        : {
            lines: await recognizeProfileLines(worker, canvas),
            canvas,
          }
    },
    Promise.resolve(emptyResult),
  )

  return firstDetectedResult
}

export const terminateOcrWorker = (worker: OcrWorker | undefined): Promise<unknown> =>
  worker?.terminate() ?? Promise.resolve()
