import type { BoundingBox, Detection, ObjectDetector } from '@mediapipe/tasks-vision'
import { FilesetResolver, ObjectDetector as MediaPipeObjectDetector } from '@mediapipe/tasks-vision'
import type { Rectangle } from '../types'

export type PhoneDetection = {
  readonly bounds: Rectangle
  readonly label: string
  readonly score: number
}

const wasmBasePath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const modelAssetPath =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite'

const preferredPhoneLabels = ['cell phone', 'mobile phone', 'phone']

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

const isPhoneLabel = (label: string): boolean => {
  const normalizedLabel = label.toLowerCase()

  return preferredPhoneLabels.some((phoneLabel) => normalizedLabel.includes(phoneLabel))
}

const getCandidateArea = (detection: Detection): number => {
  const boundingBox = detection.boundingBox
  const rectangle = boundingBox === undefined ? undefined : toRectangle(boundingBox)

  return rectangle === undefined ? 0 : rectangle.width * rectangle.height
}

const toPhoneDetection = (detections: readonly Detection[]): PhoneDetection | undefined => {
  const detection = detections
    .filter((candidate) => candidate.boundingBox !== undefined && isPhoneLabel(getDetectionCategory(candidate).label))
    .sort((first, second) => getCandidateArea(second) - getCandidateArea(first))[0]
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

  return toPhoneDetection(result.detections)
}

export const detectLargestPhoneInImage = (
  detector: ObjectDetector,
  image: HTMLCanvasElement,
): PhoneDetection | undefined => {
  const result = detector.detect(image)

  return toPhoneDetection(result.detections)
}
