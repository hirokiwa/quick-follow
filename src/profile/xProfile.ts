import type { DetectionResult } from '../types'
import type { Rectangle } from '../types'

const xHandlePattern = /^@[A-Za-z0-9_]{1,15}$/

const xProfileKeywords = ['フォロー', 'フォロワー', 'ポスト', 'Followers', 'Following', 'Posts']

export const normalizeHandleText = (text: string): string =>
  text
    .replace(/\s/g, '')
    .replace(/[＠]/g, '@')
    .replace(/[|]/g, 'I')
    .replace(/^([^@])/, '@$1')

export const extractValidHandle = (text: string): string | undefined => {
  const normalizedText = normalizeHandleText(text)
  const candidate = normalizedText.match(/@[A-Za-z0-9_]{1,15}/)?.[0]

  return candidate !== undefined && xHandlePattern.test(candidate) ? candidate : undefined
}

export const hasXProfileKeyword = (text: string): boolean =>
  xProfileKeywords.some((keyword) => text.includes(keyword))

export const createDetectionResult = (
  handle: string,
  profileConfirmed: boolean,
  bounds?: Rectangle,
): DetectionResult => ({
  handle,
  profileUrl: `https://x.com/${handle.slice(1)}`,
  profileConfirmed,
  bounds,
})
