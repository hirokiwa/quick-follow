type CameraFocusCapabilities = MediaTrackCapabilities & {
  readonly focusMode?: readonly string[]
}

type CameraFocusConstraintSet = MediaTrackConstraintSet & {
  readonly focusMode?: string
  readonly pointsOfInterest?: readonly { readonly x: number; readonly y: number }[]
}

const centerFocusPoint = {
  x: 0.5,
  y: 0.5,
} as const

const getPreferredFocusMode = (capabilities: CameraFocusCapabilities): string | undefined =>
  capabilities.focusMode?.includes('continuous') === true
    ? 'continuous'
    : capabilities.focusMode?.includes('single-shot') === true
      ? 'single-shot'
      : undefined

const supportsPointsOfInterest = (capabilities: MediaTrackCapabilities): boolean =>
  'pointsOfInterest' in capabilities

const createCenterFocusConstraints = (track: MediaStreamTrack): MediaTrackConstraints | undefined => {
  const capabilities = track.getCapabilities()
  const focusMode = getPreferredFocusMode(capabilities as CameraFocusCapabilities)
  const focusConstraints: CameraFocusConstraintSet = {
    ...(focusMode === undefined ? {} : { focusMode }),
    ...(supportsPointsOfInterest(capabilities) ? { pointsOfInterest: [centerFocusPoint] } : {}),
  }

  return Object.keys(focusConstraints).length === 0
    ? undefined
    : {
        advanced: [focusConstraints],
      }
}

export const applyCenterFocus = async (stream: MediaStream): Promise<void> => {
  const track = stream.getVideoTracks()[0]
  const constraints = track === undefined ? undefined : createCenterFocusConstraints(track)

  if (track === undefined || constraints === undefined) {
    return
  }

  await track.applyConstraints(constraints).catch(() => undefined)
}

export const startCameraStream = async (): Promise<MediaStream> => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  })

  await applyCenterFocus(stream)

  return stream
}

export const stopCameraStream = (stream: MediaStream | undefined): void => {
  stream?.getTracks().forEach((track) => {
    track.stop()
  })
}
