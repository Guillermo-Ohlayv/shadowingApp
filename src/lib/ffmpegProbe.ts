/** Detect subtitle streams from ffmpeg -i log output. */
export function parseFfmpegHasSubtitleStream(logText: string): boolean {
  return /Stream\s+#\d+:\d+.*Subtitle:/i.test(logText)
}
