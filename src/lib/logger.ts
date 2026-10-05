export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogScope =
  | 'app'
  | 'video'
  | 'subtitles'
  | 'loop'
  | 'ffmpeg'
  | 'sync'

type Logger = {
  debug: (message: string, data?: unknown) => void
  info: (message: string, data?: unknown) => void
  warn: (message: string, data?: unknown) => void
  error: (message: string, data?: unknown) => void
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const STORAGE_KEY = 'shadowing:logLevel'

function readMinLevel(): LogLevel {
  if (typeof window === 'undefined') {
    return 'debug'
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (
      stored === 'debug' ||
      stored === 'info' ||
      stored === 'warn' ||
      stored === 'error'
    ) {
      return stored
    }
  } catch {
    // ignore storage access issues
  }

  return 'debug'
}

let minLevel: LogLevel = readMinLevel()

/** Raise/lower verbosity. Also persisted as localStorage `shadowing:logLevel`. */
export function setLogLevel(level: LogLevel): void {
  minLevel = level
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, level)
    } catch {
      // ignore
    }
  }
  console.info(`[Shadowing] log level set to ${level}`)
}

export function getLogLevel(): LogLevel {
  return minLevel
}

export function formatLogPrefix(scope: LogScope, level: LogLevel): string {
  return `[Shadowing:${scope}:${level}]`
}

function write(
  scope: LogScope,
  level: LogLevel,
  message: string,
  data?: unknown,
): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) {
    return
  }

  const prefix = formatLogPrefix(scope, level)
  const args = data === undefined ? [prefix, message] : [prefix, message, data]

  switch (level) {
    case 'debug':
      console.debug(...args)
      break
    case 'info':
      console.info(...args)
      break
    case 'warn':
      console.warn(...args)
      break
    case 'error':
      console.error(...args)
      break
  }
}

export function createLogger(scope: LogScope): Logger {
  return {
    debug: (message, data) => write(scope, 'debug', message, data),
    info: (message, data) => write(scope, 'info', message, data),
    warn: (message, data) => write(scope, 'warn', message, data),
    error: (message, data) => write(scope, 'error', message, data),
  }
}

/** Shared scoped loggers used across the app. */
export const log = {
  app: createLogger('app'),
  video: createLogger('video'),
  subtitles: createLogger('subtitles'),
  loop: createLogger('loop'),
  ffmpeg: createLogger('ffmpeg'),
  sync: createLogger('sync'),
}

declare global {
  interface Window {
    shadowingLog?: {
      setLevel: typeof setLogLevel
      getLevel: typeof getLogLevel
      log: typeof log
    }
  }
}

/** Expose helpers on window for manual debugging in DevTools. */
export function installDebugConsole(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.shadowingLog = {
    setLevel: setLogLevel,
    getLevel: getLogLevel,
    log,
  }

  log.app.info('Logger ready. Use window.shadowingLog.setLevel("debug"|"info"|"warn"|"error")')
}
