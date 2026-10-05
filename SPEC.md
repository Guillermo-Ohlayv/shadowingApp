# Shadowing Video App — MVP Spec

## Purpose

A local-only web app for language shadowing: load a video, load subtitles, click a cue to loop that segment until the user exits loop mode.

## Scope (MVP)

In scope:

- Load a local video file (browser-native formats only).
- Play / pause / seek / volume / playback speed.
- Load a separate subtitle file (`.srt` or `.vtt`).
- Show cues in a clickable side panel and over the video.
- Click a cue → seek to that segment and loop it.
- Exit loop → resume normal playback.
- Safe empty / error states when subtitles or video are missing or invalid.

Out of scope for MVP:

- Backend / accounts / cloud storage.
- Arbitrary format support (MKV, AVI, etc.).
- Embedded subtitle extraction.
- FFmpeg / ffmpeg.wasm.
- Persistence beyond optional later polish.

## Architecture

- **Stack:** React 19 + Vite + TypeScript + Tailwind CSS + pnpm.
- **Runtime:** Fully client-side. Files stay in the browser via `URL.createObjectURL`.
- **State:** React state first; extract hooks (`useVideoPlayer`, `useSubtitleSync`, `useSegmentLoop`) as logic grows.
- **Parsing:** Isolated in `lib/parseSubtitles.ts`. Treat subtitle input as unsafe.
- **Support checks:** Isolated in `lib/videoSupport.ts` via `canPlayType`.

## Formats

| Kind | MVP | Later |
|------|-----|--------|
| Video | MP4, WebM (what the browser can play) | FFmpeg transcode for other containers |
| Subtitles | User-uploaded `.srt` / `.vtt` | Embedded track extraction |

## Core data types

```ts
type Cue = {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
};

type LoopState = {
  activeCueId: string;
  start: number;
  end: number;
} | null;
```

## UI layout

1. **Video area** — player + on-video subtitle overlay.
2. **Subtitle panel** — scrollable cue list (empty state when none).
3. **Controls** — playback controls + exit-loop action.
4. **Loaders** — video and subtitle file inputs.
5. **Error area** — clear messages for unsupported video / bad subtitles.

## Key behaviors

1. No video → empty player placeholder.
2. No subtitles → empty list message; loop actions disabled.
3. Click cue → set `LoopState`, seek to `start`, play, restart when `currentTime >= end`.
4. Exit loop → clear `LoopState`, continue from current time.
5. Changing video or subtitles → reset loop state and revoke old object URLs.

## Success criteria (MVP done)

- Local MP4/WebM plays.
- `.srt` / `.vtt` parse into a clickable list.
- Cue click loops that segment; exit restores normal playback.
- Missing or bad subtitles / unsupported video never crash the app and show a clear message.

## Build order

Follow `PLAN.md` phases 1 → 6 for MVP, then 7+ for advanced format support.
