import type { DetectionResult } from '../types'
import type { Rectangle } from '../types'
import type { QuickFollowElements } from './elements'

const hideDebugPreview = (elements: QuickFollowElements): void => {
  elements.preview.hidden = true
  elements.previewImage.removeAttribute('src')
  elements.previewOverlay.replaceChildren()
  elements.video.hidden = false
  elements.shade.hidden = false
  elements.guide.hidden = false
}

const createPreviewBox = (
  rectangle: Rectangle,
  naturalWidth: number,
  naturalHeight: number,
  className: string,
): HTMLElement => {
  const box = document.createElement('span')

  box.className = className
  box.style.left = `${(rectangle.x / naturalWidth) * 100}%`
  box.style.top = `${(rectangle.y / naturalHeight) * 100}%`
  box.style.width = `${(rectangle.width / naturalWidth) * 100}%`
  box.style.height = `${(rectangle.height / naturalHeight) * 100}%`

  return box
}

export const renderIdle = (elements: QuickFollowElements): void => {
  hideDebugPreview(elements)
  elements.startButton.disabled = false
  elements.stopButton.disabled = true
  elements.openLink.hidden = true
  elements.statusText.textContent = 'カメラを開始してください'
}

export const renderScanning = (elements: QuickFollowElements): void => {
  hideDebugPreview(elements)
  elements.startButton.disabled = true
  elements.stopButton.disabled = false
  elements.openLink.hidden = true
  elements.statusText.textContent = '読み取り中'
}

export const renderAnalyzing = (elements: QuickFollowElements): void => {
  elements.startButton.disabled = true
  elements.stopButton.disabled = true
  elements.openLink.hidden = true
  elements.statusText.textContent = '解析中'
}

export const renderPreparing = (elements: QuickFollowElements): void => {
  hideDebugPreview(elements)
  elements.startButton.disabled = true
  elements.stopButton.disabled = false
  elements.openLink.hidden = true
  elements.statusText.textContent = '準備中'
}

export const renderStatus = (elements: QuickFollowElements, message: string): void => {
  elements.statusText.textContent = message
}

export const renderDetection = (
  elements: QuickFollowElements,
  detection: DetectionResult,
): void => {
  elements.startButton.disabled = false
  elements.stopButton.disabled = true
  elements.openLink.hidden = false
  elements.openLink.href = detection.profileUrl
  elements.statusText.textContent = `${detection.handle} を検出しました`
}

export const renderDebugPreview = (
  elements: QuickFollowElements,
  imageUrl: string,
  bounds: Rectangle | undefined,
  naturalWidth: number,
  naturalHeight: number,
  ocrLineBounds: readonly Rectangle[] = [],
): void => {
  elements.preview.hidden = false
  elements.video.hidden = true
  elements.shade.hidden = true
  elements.guide.hidden = true
  elements.previewImage.src = imageUrl
  elements.previewOverlay.replaceChildren(
    ...[
      bounds === undefined
        ? []
        : [createPreviewBox(bounds, naturalWidth, naturalHeight, 'scanner__preview-box scanner__preview-box--phone')],
      ocrLineBounds.map((lineBounds) =>
        createPreviewBox(lineBounds, naturalWidth, naturalHeight, 'scanner__preview-box scanner__preview-box--ocr-line'),
      ),
    ].flat(),
  )
}

export const renderError = (elements: QuickFollowElements, message: string): void => {
  elements.startButton.disabled = false
  elements.stopButton.disabled = true
  elements.openLink.hidden = true
  elements.statusText.textContent = message
}
