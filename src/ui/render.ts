import type { DetectionResult } from '../types'
import type { Rectangle } from '../types'
import type { QuickFollowElements } from './elements'

const hideDebugPreview = (elements: QuickFollowElements): void => {
  elements.preview.hidden = true
  elements.previewFrame.classList.remove('scanner__preview-frame--zoomed')
  elements.previewFrame.removeAttribute('style')
  elements.previewImage.removeAttribute('src')
  elements.previewImage.removeAttribute('style')
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

const calculateZoomScale = (
  previewElement: HTMLElement,
  previewImage: HTMLImageElement,
  bounds: Rectangle,
  naturalWidth: number,
  naturalHeight: number,
): number => {
  const previewRectangle = previewElement.getBoundingClientRect()
  const displayedPhoneWidth = (bounds.width / naturalWidth) * Math.max(1, previewImage.offsetWidth)
  const displayedPhoneHeight = (bounds.height / naturalHeight) * Math.max(1, previewImage.offsetHeight)
  const widthScale = previewRectangle.width / Math.max(1, displayedPhoneWidth)
  const heightScale = previewRectangle.height / Math.max(1, displayedPhoneHeight)

  return Math.max(1, Math.min(widthScale, heightScale))
}

const calculateZoomTranslation = (
  previewImage: HTMLImageElement,
  bounds: Rectangle,
  naturalWidth: number,
  naturalHeight: number,
): { readonly x: number; readonly y: number } => {
  const focusCenterX = ((bounds.x + bounds.width / 2) / naturalWidth) * Math.max(1, previewImage.offsetWidth)
  const focusCenterY = ((bounds.y + bounds.height / 2) / naturalHeight) * Math.max(1, previewImage.offsetHeight)
  const imageCenterX = previewImage.offsetWidth / 2
  const imageCenterY = previewImage.offsetHeight / 2

  return {
    x: imageCenterX - focusCenterX,
    y: imageCenterY - focusCenterY,
  }
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
  preserveZoom = false,
): void => {
  elements.preview.hidden = false
  elements.video.hidden = true
  elements.shade.hidden = true
  elements.guide.hidden = true

  if (!preserveZoom) {
    elements.previewFrame.classList.remove('scanner__preview-frame--zoomed')
    elements.previewFrame.removeAttribute('style')
    elements.previewImage.removeAttribute('style')
  }

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

export const renderZoomedDebugPreview = (
  elements: QuickFollowElements,
  imageUrl: string,
  bounds: Rectangle,
  naturalWidth: number,
  naturalHeight: number,
  ocrLineBounds: readonly Rectangle[] = [],
): void => {
  renderDebugPreview(elements, imageUrl, bounds, naturalWidth, naturalHeight, ocrLineBounds, true)

  requestAnimationFrame(() => {
    const scale = calculateZoomScale(elements.preview, elements.previewImage, bounds, naturalWidth, naturalHeight)
    const translation = calculateZoomTranslation(elements.previewImage, bounds, naturalWidth, naturalHeight)

    elements.previewFrame.style.setProperty('--preview-origin-x', '50%')
    elements.previewFrame.style.setProperty('--preview-origin-y', '50%')
    elements.previewFrame.style.setProperty('--preview-scale', `${scale}`)
    elements.previewFrame.style.setProperty('--preview-translate-x', `${translation.x * scale}px`)
    elements.previewFrame.style.setProperty('--preview-translate-y', `${translation.y * scale}px`)
    elements.previewFrame.style.setProperty('--focus-left', `${(bounds.x / naturalWidth) * 100}%`)
    elements.previewFrame.style.setProperty('--focus-top', `${(bounds.y / naturalHeight) * 100}%`)
    elements.previewFrame.style.setProperty('--focus-right', `${100 - ((bounds.x + bounds.width) / naturalWidth) * 100}%`)
    elements.previewFrame.style.setProperty('--focus-bottom', `${100 - ((bounds.y + bounds.height) / naturalHeight) * 100}%`)
    elements.previewFrame.classList.add('scanner__preview-frame--zoomed')
  })
}

export const renderError = (elements: QuickFollowElements, message: string): void => {
  elements.startButton.disabled = false
  elements.stopButton.disabled = true
  elements.openLink.hidden = true
  elements.statusText.textContent = message
}
