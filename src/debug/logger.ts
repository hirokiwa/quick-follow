export type DebugLogger = {
  readonly group: (label: string) => void
  readonly groupEnd: () => void
  readonly info: (label: string, value?: unknown) => void
  readonly warn: (label: string, value?: unknown) => void
  readonly error: (label: string, value?: unknown) => void
}

export const createDebugLogger = (scope: string): DebugLogger => ({
  group: (label) => {
    console.groupCollapsed(`[Quick Follow] ${scope}: ${label}`)
  },
  groupEnd: () => {
    console.groupEnd()
  },
  info: (label, value) => {
    console.info(`[Quick Follow] ${label}`, value ?? '')
  },
  warn: (label, value) => {
    console.warn(`[Quick Follow] ${label}`, value ?? '')
  },
  error: (label, value) => {
    console.error(`[Quick Follow] ${label}`, value ?? '')
  },
})

export const noopDebugLogger: DebugLogger = {
  group: () => undefined,
  groupEnd: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}
