type NamedFile = {
  name: string
  type: string
}

const EXTENSION_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  ogv: 'video/ogg',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
}

/** Detect whether the browser can play a given MIME type. */
export function canPlayVideoType(mimeType: string): boolean {
  if (!mimeType || typeof document === 'undefined') {
    return false
  }

  const video = document.createElement('video')
  return video.canPlayType(mimeType) !== ''
}

/** Prefer File.type; fall back to a known extension. */
export function resolveVideoMimeType(file: NamedFile): string {
  if (file.type) {
    return file.type
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_MIME[extension] ?? ''
}

/** True when the browser reports it can play this file's type. */
export function isSupportedVideoFile(file: NamedFile): boolean {
  const mimeType = resolveVideoMimeType(file)
  if (!mimeType) {
    return false
  }

  return canPlayVideoType(mimeType)
}

/** Extensions we accept for native play or FFmpeg conversion. */
export function isKnownVideoFilename(name: string): boolean {
  const extension = name.split('.').pop()?.toLowerCase() ?? ''
  return extension in EXTENSION_MIME
}
