export type Rectangle = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type DetectionResult = {
  readonly handle: string
  readonly profileUrl: string
  readonly profileConfirmed: boolean
  readonly bounds: Rectangle | undefined
}

export type Feedback = (message: string) => void

export type OcrTextLine = {
  readonly text: string
  readonly index: number
  readonly top: number
  readonly bounds: Rectangle
  readonly characterBounds: readonly Rectangle[]
  readonly confidence: number
}

export type HandleCandidate = {
  readonly handle: string
  readonly line: OcrTextLine
  readonly score: number
  readonly reasons: readonly string[]
}

export type AnalysisResult =
  | {
      readonly type: 'idle'
      readonly ocrLines: readonly OcrTextLine[]
    }
  | {
      readonly type: 'detected'
      readonly detection: DetectionResult
      readonly ocrLines: readonly OcrTextLine[]
    }
