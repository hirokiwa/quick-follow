export type QuickFollowElements = {
  readonly video: HTMLVideoElement
  readonly shade: HTMLElement
  readonly guide: HTMLElement
  readonly preview: HTMLElement
  readonly previewImage: HTMLImageElement
  readonly previewOverlay: HTMLElement
  readonly statusText: HTMLElement
  readonly startButton: HTMLButtonElement
  readonly stopButton: HTMLButtonElement
  readonly uploadInput: HTMLInputElement
  readonly openLink: HTMLAnchorElement
}

const queryElement = <ElementType extends HTMLElement>(selector: string): ElementType => {
  const element = document.querySelector<ElementType>(selector)

  if (element === null) {
    throw new Error(`${selector} was not found`)
  }

  return element
}

export const getQuickFollowElements = (): QuickFollowElements => ({
  video: queryElement<HTMLVideoElement>('#camera-video'),
  shade: queryElement<HTMLElement>('#scanner-shade'),
  guide: queryElement<HTMLElement>('#camera-guide'),
  preview: queryElement<HTMLElement>('#debug-preview'),
  previewImage: queryElement<HTMLImageElement>('#debug-preview-image'),
  previewOverlay: queryElement<HTMLElement>('#debug-preview-overlay'),
  statusText: queryElement<HTMLElement>('#status-text'),
  startButton: queryElement<HTMLButtonElement>('#start-button'),
  stopButton: queryElement<HTMLButtonElement>('#stop-button'),
  uploadInput: queryElement<HTMLInputElement>('#upload-input'),
  openLink: queryElement<HTMLAnchorElement>('#open-link'),
})
