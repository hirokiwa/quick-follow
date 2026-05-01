import { createCanvas, getCanvasContext } from './canvas'

const clampByte = (value: number): number => Math.max(0, Math.min(255, value))

const toContrastAdjustedGray = (red: number, green: number, blue: number): number =>
  clampByte(((red * 0.299 + green * 0.587 + blue * 0.114 - 128) * 1.8) + 128)

export const preprocessTextImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const processedCanvas = createCanvas(canvas.width, canvas.height)
  const processedContext = getCanvasContext(processedCanvas)

  processedContext.drawImage(canvas, 0, 0, canvas.width, canvas.height)

  const imageData = processedContext.getImageData(0, 0, processedCanvas.width, processedCanvas.height)

  Array.from({ length: imageData.data.length / 4 }).forEach((_, pixelIndex) => {
    const offset = pixelIndex * 4
    const gray = toContrastAdjustedGray(
      imageData.data[offset] ?? 0,
      imageData.data[offset + 1] ?? 0,
      imageData.data[offset + 2] ?? 0,
    )

    imageData.data[offset] = gray
    imageData.data[offset + 1] = gray
    imageData.data[offset + 2] = gray
    imageData.data[offset + 3] = 255
  })

  processedContext.putImageData(imageData, 0, 0)

  return processedCanvas
}
