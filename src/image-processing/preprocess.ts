import { getCanvasContext } from './canvas'

const clampByte = (value: number): number => Math.max(0, Math.min(255, value))

const toContrastAdjustedGray = (red: number, green: number, blue: number): number =>
  clampByte(((red * 0.299 + green * 0.587 + blue * 0.114 - 128) * 1.8) + 128)

export const preprocessTextImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const context = getCanvasContext(canvas)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

  Array.from({ length: imageData.data.length / 4 }).forEach((_, pixelIndex) => {
    const offset = pixelIndex * 4
    const gray = toContrastAdjustedGray(
      imageData.data[offset] ?? 0,
      imageData.data[offset + 1] ?? 0,
      imageData.data[offset + 2] ?? 0,
    )
    const binary = gray < 150 ? 0 : 255

    imageData.data[offset] = binary
    imageData.data[offset + 1] = binary
    imageData.data[offset + 2] = binary
    imageData.data[offset + 3] = 255
  })

  context.putImageData(imageData, 0, 0)

  return canvas
}
