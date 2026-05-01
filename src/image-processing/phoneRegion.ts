import type { Rectangle } from '../types'
import { createCanvas, cropCanvas, getCanvasContext } from './canvas'

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

const clampRectangle = (rectangle: Rectangle, maxWidth: number, maxHeight: number): Rectangle => {
  const x = clamp(rectangle.x, 0, maxWidth - 1)
  const y = clamp(rectangle.y, 0, maxHeight - 1)

  return {
    x,
    y,
    width: clamp(rectangle.width, 1, maxWidth - x),
    height: clamp(rectangle.height, 1, maxHeight - y),
  }
}

export const cropPhoneRegionFromVideo = (
  video: HTMLVideoElement,
  bounds: Rectangle,
): HTMLCanvasElement => {
  const rectangle = clampRectangle(bounds, video.videoWidth, video.videoHeight)
  const canvas = createCanvas(rectangle.width, rectangle.height)
  const context = getCanvasContext(canvas)

  context.drawImage(
    video,
    rectangle.x,
    rectangle.y,
    rectangle.width,
    rectangle.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return canvas
}

export const cropPhoneRegionFromCanvas = (
  sourceCanvas: HTMLCanvasElement,
  bounds: Rectangle,
): HTMLCanvasElement => {
  const rectangle = clampRectangle(bounds, sourceCanvas.width, sourceCanvas.height)

  return cropCanvas(sourceCanvas, rectangle)
}

export const cropUpperProfileRegion = (canvas: HTMLCanvasElement): HTMLCanvasElement =>
  cropCanvas(canvas, {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height * 0.5,
  })
