export type QuickFollowElements = {
  readonly video: HTMLVideoElement
  readonly mockOverlay: HTMLImageElement
  readonly preview: HTMLElement
  readonly previewFrame: HTMLElement
  readonly previewImage: HTMLImageElement
  readonly previewOverlay: HTMLElement
  readonly statusText: HTMLElement
  readonly startButton: HTMLButtonElement
  readonly stopButton: HTMLButtonElement
  readonly uploadInput: HTMLInputElement
  readonly openLink: HTMLAnchorElement
  readonly startDialog: HTMLDialogElement
  readonly startDialogButton: HTMLButtonElement
  readonly resultDialog: HTMLDialogElement
  readonly resultHandle: HTMLElement
  readonly resultOpenLink: HTMLAnchorElement
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
  mockOverlay: queryElement<HTMLImageElement>('#camera-mock-overlay'),
  preview: queryElement<HTMLElement>('#debug-preview'),
  previewFrame: queryElement<HTMLElement>('#debug-preview-frame'),
  previewImage: queryElement<HTMLImageElement>('#debug-preview-image'),
  previewOverlay: queryElement<HTMLElement>('#debug-preview-overlay'),
  statusText: queryElement<HTMLElement>('#status-text'),
  startButton: queryElement<HTMLButtonElement>('#start-button'),
  stopButton: queryElement<HTMLButtonElement>('#stop-button'),
  uploadInput: queryElement<HTMLInputElement>('#upload-input'),
  openLink: queryElement<HTMLAnchorElement>('#open-link'),
  startDialog: queryElement<HTMLDialogElement>('#start-dialog'),
  startDialogButton: queryElement<HTMLButtonElement>('#start-dialog-button'),
  resultDialog: queryElement<HTMLDialogElement>('#result-dialog'),
  resultHandle: queryElement<HTMLElement>('#result-handle'),
  resultOpenLink: queryElement<HTMLAnchorElement>('#result-open-link'),
})
