import type { HandleCandidate, OcrTextLine } from '../types'
import { extractValidHandle, hasXProfileKeyword, normalizeHandleText } from './xProfile'

const textOnlyNoisePattern = /^[^\p{L}\p{N}@_]+$/u

const isNoiseLine = (text: string): boolean => text.length === 0 || textOnlyNoisePattern.test(text)

const isNameLikeLine = (line: OcrTextLine | undefined): boolean =>
  line !== undefined &&
  !line.text.startsWith('@') &&
  line.text.length >= 1 &&
  line.text.length <= 40 &&
  /[\p{L}\p{N}]/u.test(line.text)

const isDescriptionLikeLine = (line: OcrTextLine | undefined): boolean =>
  line !== undefined && !line.text.startsWith('@') && line.text.length >= 8

const hasProfileUiNearby = (lines: readonly OcrTextLine[], candidate: OcrTextLine): boolean =>
  lines.some((line) => Math.abs(line.index - candidate.index) <= 4 && hasXProfileKeyword(line.text))

const calculateCandidateScore = (
  candidate: OcrTextLine,
  lines: readonly OcrTextLine[],
  canvasHeight: number,
): HandleCandidate | undefined => {
  const handle = extractValidHandle(candidate.text)
  const normalizedText = normalizeHandleText(candidate.text)

  if (handle === undefined || normalizedText !== handle) {
    return undefined
  }

  const previousLine = lines.find((line) => line.index === candidate.index - 1)
  const nextLine = lines.find((line) => line.index === candidate.index + 1)
  const verticalScore = Math.max(0, 50 - (candidate.top / canvasHeight) * 50)
  const nameScore = isNameLikeLine(previousLine) ? 18 : 0
  const descriptionScore = isDescriptionLikeLine(nextLine) ? 14 : 0
  const uiScore = hasProfileUiNearby(lines, candidate) ? 12 : 0
  const confidenceScore = Math.max(0, candidate.confidence / 5)
  const reasons = [
    verticalScore > 0 ? 'upper-position' : '',
    nameScore > 0 ? 'previous-name-like' : '',
    descriptionScore > 0 ? 'next-description-like' : '',
    uiScore > 0 ? 'profile-ui-nearby' : '',
    confidenceScore > 0 ? 'ocr-confidence' : '',
  ].filter((reason) => reason.length > 0)

  return {
    handle,
    line: candidate,
    score: verticalScore + nameScore + descriptionScore + uiScore + confidenceScore,
    reasons,
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
  canvasHeight: number,
): readonly HandleCandidate[] =>
  normalizeOcrLines(lines)
    .map((line) => calculateCandidateScore(line, lines, canvasHeight))
    .filter((candidate): candidate is HandleCandidate => candidate !== undefined)
    .sort((first, second) => second.score - first.score)
