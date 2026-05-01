import type { BoundingBox, Detection, ObjectDetector } from '@mediapipe/tasks-vision'
import { FilesetResolver, ObjectDetector as MediaPipeObjectDetector } from '@mediapipe/tasks-vision'
import type { Rectangle } from '../types'

export type PhoneDetection = {
  readonly bounds: Rectangle
  readonly label: string
  readonly score: number
}

type SourceSize = {
  readonly width: number
  readonly height: number
}

const wasmBasePath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const modelAssetPath =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite'

const preferredPhoneLabels = ['cell phone', 'mobile phone', 'phone']
const secondaryDeviceLabels = ['remote', 'tv', 'laptop', 'book']

const toRectangle = (boundingBox: BoundingBox): Rectangle => ({
  x: boundingBox.originX,
  y: boundingBox.originY,
  width: boundingBox.width,
  height: boundingBox.height,
})

const getDetectionCategory = (detection: Detection): { readonly label: string; readonly score: number } => {
  const category = detection.categories[0]

  return {
    label: category?.categoryName ?? '',
    score: category?.score ?? 0,
  }
}

const isVerticalLargeObject = (rectangle: Rectangle, sourceSize: SourceSize): boolean =>
  rectangle.height > sourceSize.height * 0.25 &&
  rectangle.width > sourceSize.width * 0.08 &&
  rectangle.height / rectangle.width >= 1.25

const getCandidateWeight = (detection: Detection, sourceSize: SourceSize): number => {
  const boundingBox = detection.boundingBox
  const category = getDetectionCategory(detection)
  const label = category.label.toLowerCase()
  const rectangle = boundingBox === undefined ? undefined : toRectangle(boundingBox)
  const isPreferredPhone = preferredPhoneLabels.some((phoneLabel) => label.includes(phoneLabel))
  const isSecondaryDevice = secondaryDeviceLabels.some((deviceLabel) => label.includes(deviceLabel))
  const shapeBonus = rectangle !== undefined && isVerticalLargeObject(rectangle, sourceSize) ? 0.2 : 0
  const categoryBonus = isPreferredPhone ? 2 : isSecondaryDevice ? 0.6 : 0
  const area = rectangle === undefined ? 0 : rectangle.width * rectangle.height

  return boundingBox === undefined ? 0 : area * (category.score + categoryBonus + shapeBonus)
}

const toPhoneDetection = (
  detections: readonly Detection[],
  sourceSize: SourceSize,
): PhoneDetection | undefined => {
  const detection = detections
    .filter((candidate) => candidate.boundingBox !== undefined)
    .sort((first, second) => getCandidateWeight(second, sourceSize) - getCandidateWeight(first, sourceSize))[0]
  const boundingBox = detection?.boundingBox

  if (detection === undefined || boundingBox === undefined) {
    return undefined
  }

  const category = getDetectionCategory(detection)

  return {
    bounds: toRectangle(boundingBox),
    label: category.label,
    score: category.score,
  }
}

export const createPhoneDetector = async (runningMode: 'IMAGE' | 'VIDEO'): Promise<ObjectDetector> => {
  const vision = await FilesetResolver.forVisionTasks(wasmBasePath)

  return MediaPipeObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath,
      delegate: 'CPU',
    },
    runningMode,
    maxResults: 8,
    scoreThreshold: 0.2,
  })
}

export const detectLargestPhone = (
  detector: ObjectDetector,
  video: HTMLVideoElement,
  timestamp: number,
): PhoneDetection | undefined => {
  const result = detector.detectForVideo(video, timestamp)

  return toPhoneDetection(result.detections, {
    width: video.videoWidth,
    height: video.videoHeight,
  })
}

export const detectLargestPhoneInImage = (
  detector: ObjectDetector,
  image: HTMLCanvasElement,
): PhoneDetection | undefined => {
  const result = detector.detect(image)

  return toPhoneDetection(result.detections, {
    width: image.width,
    height: image.height,
  })
}
