export const startCameraStream = (): Promise<MediaStream> =>
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  })

export const stopCameraStream = (stream: MediaStream | undefined): void => {
  stream?.getTracks().forEach((track) => {
    track.stop()
  })
}
