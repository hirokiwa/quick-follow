import { createCanvas, getCanvasContext } from './canvas'

export type UploadedImageCanvas = {
  readonly sourceCanvas: HTMLCanvasElement
  readonly previewImageUrl: string
  readonly naturalWidth: number
  readonly naturalHeight: number
}

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()

    image.addEventListener('load', () => {
      resolve(image)
    }, { once: true })
    image.addEventListener('error', () => {
      reject(new Error('Image load failed'))
    }, { once: true })
    image.src = source
  })

const canvasToImageUrl = (canvas: HTMLCanvasElement): string => canvas.toDataURL('image/png')

const drawImageToCanvas = (image: HTMLImageElement): HTMLCanvasElement => {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight)
  const context = getCanvasContext(canvas)

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

export const createCanvasFromFile = async (file: File): Promise<UploadedImageCanvas> => {
  const objectUrl = URL.createObjectURL(file)
  const image = await loadImage(objectUrl).finally(() => {
    URL.revokeObjectURL(objectUrl)
  })
  const sourceCanvas = drawImageToCanvas(image)

  return {
    previewImageUrl: canvasToImageUrl(sourceCanvas),
    naturalWidth: sourceCanvas.width,
    naturalHeight: sourceCanvas.height,
    sourceCanvas,
  }
}
