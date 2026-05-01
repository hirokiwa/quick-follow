import type { HandleCandidate, OcrTextLine } from '../types'

const textOnlyNoisePattern = /^[^\p{L}\p{N}@_]+$/u
const strictHandleLinePattern = /^@[A-Za-z0-9_]{1,15}$/

const isNoiseLine = (text: string): boolean => text.length === 0 || textOnlyNoisePattern.test(text)

const calculateSmallSymbolWordHeightScore = (candidate: OcrTextLine, canvasHeight: number): number =>
  Math.max(0, 100 - (candidate.bounds.height / canvasHeight) * 1000)

const calculateLeftPositionScore = (candidate: OcrTextLine, canvasWidth: number): number =>
  Math.max(0, 100 - (candidate.bounds.x / canvasWidth) * 100)

const calculateCandidateScore = (
  candidate: OcrTextLine,
  canvasWidth: number,
  canvasHeight: number,
): HandleCandidate | undefined => {
  const handle = candidate.text.trim()

  if (!strictHandleLinePattern.test(handle)) {
    return undefined
  }

  const symbolWordHeightScore = calculateSmallSymbolWordHeightScore(candidate, canvasHeight)
  const leftPositionScore = calculateLeftPositionScore(candidate, canvasWidth)

  return {
    handle,
    line: candidate,
    score: symbolWordHeightScore + leftPositionScore,
    reasons: ['smaller-symbol-word-bounds-height', 'left-position'],
  }
}

export const normalizeOcrLines = (lines: readonly OcrTextLine[]): readonly OcrTextLine[] =>
  lines
    .map((line) => ({
      ...line,
      text: line.text.replace(/\s+/g, ' ').trim(),
    }))
    .filter((line) => !isNoiseLine(line.text))

export const scoreHandleCandidates = (
  lines: readonly OcrTextLine[],
  canvasWidth: number,
  canvasHeight: number,
): readonly HandleCandidate[] =>
  normalizeOcrLines(lines)
    .map((line) => calculateCandidateScore(line, canvasWidth, canvasHeight))
    .filter((candidate): candidate is HandleCandidate => candidate !== undefined)
    .sort((first, second) => second.score - first.score)
