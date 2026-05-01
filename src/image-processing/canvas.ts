import type { Rectangle } from '../types'

export const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')

  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))

  return canvas
}

export const getCanvasContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (context === null) {
    throw new Error('Canvas context is unavailable')
  }

  return context
}

export const cropCanvas = (sourceCanvas: HTMLCanvasElement, rectangle: Rectangle): HTMLCanvasElement => {
  const canvas = createCanvas(rectangle.width, rectangle.height)
  const context = getCanvasContext(canvas)

  context.drawImage(
    sourceCanvas,
    rectangle.x,
    rectangle.y,
    rectangle.width,
    rectangle.height,
    0,
    0,
    rectangle.width,
    rectangle.height,
  )

  return canvas
}
