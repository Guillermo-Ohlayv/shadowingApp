/** Embedded caption tracks are intentionally unused in the MVP. */
export function hasUsableTextTracks(
  video: Pick<HTMLVideoElement, 'textTracks'> | null | undefined,
): boolean {
  if (!video?.textTracks) {
    return false
  }

  try {
    return video.textTracks.length > 0
  } catch {
    return false
  }
}
