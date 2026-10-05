# Shadowing Video App — Build Plan

---

## 1. Goal

Build a web app for shadowing practice using user-provided videos.

Core features:

- Load a local video file.
- Play videos in the browser.
- Load subtitles from `.srt` or `.vtt`.
- Display subtitles as a clickable list.
- Click a subtitle cue to seek to that segment.
- Loop that subtitle segment until the user exits loop mode.
- Provide a button to return to normal playback.
- Handle videos with no subtitles without crashing.

---



## 2. Important Constraints



### 2.1 “Any video format” is not fully possible in the browser

The browser `<video>` element only supports certain codecs and containers.

To support arbitrary formats, you need one of these:

- **Server-side FFmpeg**: upload/probe/transcode to MP4 H.264/AAC.
- **Browser-side ffmpeg.wasm**: transcode locally, slower and memory-heavy.
- **Hybrid**: try native playback first; if unsupported, offer conversion.



### 2.2 Embedded subtitles are not always available

Browsers do not reliably expose embedded subtitle tracks from every container.

Plan for:

- MVP: user provides separate `.srt` or `.vtt`.
- Advanced: extract embedded subtitles with FFmpeg.
- Always handle the case where no subtitles exist.

---



## 3. Recommended MVP

Start with this exact scope:

1. User loads a local video: MP4/WebM.
2. User loads a subtitle file: `.srt` or `.vtt`.
3. Subtitles appear in a clickable side panel.
4. Clicking a subtitle seeks to that cue.
5. That cue loops until “Exit loop” is pressed.
6. If no subtitles exist, app shows a safe empty state.
7. No backend required for MVP.

---



## 4. Suggested Tech Stack

- React + Vite + TypeScript
- CSS modules, Tailwind, or plain CSS
- State: React state first, Zustand if needed later
- Optional backend later: Node/Express + FFmpeg
- Optional local processing later: ffmpeg.wasm

---



## 5. Suggested File Structure

```txt
src/
  App.tsx
  main.tsx
  components/
    VideoLoader.tsx
    VideoPlayer.tsx
    SubtitlePanel.tsx
    SubtitleCue.tsx
    PlayerControls.tsx
    ErrorMessage.tsx
  lib/
    parseSubtitles.ts
    formatTime.ts
    videoSupport.ts
  types/
    subtitle.ts
    loop.ts
  hooks/
    useVideoPlayer.ts
    useSubtitleSync.ts
    useSegmentLoop.ts
  styles/
    app.css
```

---



## 6. Data Types

```ts
export type Cue = {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
};

export type LoopState = {
  activeCueId: string;
  start: number;
  end: number;
} | null;
```

---



## 7. Build Phases



### Phase 0 — Define MVP and architecture

Tasks:

- [x] Choose React + Vite + TypeScript.
- [x] Decide local-only MVP, no backend.
- [x] Decide MVP formats: MP4/WebM only.
- [x] Decide MVP subtitles: uploaded `.srt` / `.vtt` only.
- [x] Decide advanced feature later: FFmpeg transcode and embedded subtitle extraction.
- [x] Write a one-page spec.

Deliverable:

- One-page spec saved as `SPEC.md`.

---



### Phase 1 — Project skeleton

Tasks:

- [x] Create Vite React TypeScript app.
- [x] Create component files listed above.
- [x] Create basic layout:
  - Video area
  - Subtitle panel
  - Controls
  - Error area
- [x] Add placeholder text for empty states.

Deliverable:

- App runs locally.
- Layout is visible.
- No real video logic yet.

---



### Phase 2 — Video loading and playback

Tasks:

- [x] Add file input or drag-and-drop for video.
- [x] Create object URL with `URL.createObjectURL(file)`.
- [x] Load into `<video>`.
- [x] Revoke object URL when changing video.
- [x] Handle video events:
  - `loadedmetadata`
  - `timeupdate`
  - `ended`
  - `error`
- [x] Add controls:
  - Play
  - Pause
  - Seek
  - Volume
  - Playback speed
- [x] Detect unsupported format and show error.

Deliverable:

- User can play any browser-supported video.

Acceptance criteria:

- Video plays.
- Pause works.
- Seek works.
- Changing video does not leak old object URLs.
- Unsupported video shows a clear error.

---



### Phase 3 — Subtitle file loading and parsing

Tasks:

- [x] Accept `.srt` and `.vtt`.
- [x] Parse into normalized cues.
- [x] Convert timestamps to seconds.
- [x] Handle:
  - Empty files
  - Malformed cues
  - CRLF vs LF
  - BOM/encoding issues
  - Overlapping cues
- [x] If no subtitle file is loaded, set `cues = []`.
- [x] Never assume subtitles exist.

Data shape:

```ts
type Cue = {
  id: string;
  start: number;
  end: number;
  text: string;
};
```

Deliverable:

- Subtitle list renders correctly.
- Malformed subtitle file does not crash the app.

Acceptance criteria:

- Valid `.srt` parses.
- Valid `.vtt` parses.
- Empty file produces empty cue list.
- Invalid file shows error message.

---



### Phase 4 — Subtitle display and sync

Tasks:

- [x] Show subtitles over the video.
- [x] Highlight the active cue based on `video.currentTime`.
- [x] Use `timeupdate` or `requestAnimationFrame`.
- [x] Render clickable list of cues.
- [x] Auto-scroll active cue into view.
- [x] If `cues.length === 0`, show “No subtitles loaded”.
- [x] Disable cue actions when there are no cues.

Deliverable:

- Subtitles follow the video.
- Subtitles are clickable.

Acceptance criteria:

- Active cue updates as video plays.
- Clicking a cue seeks to that cue.
- No subtitles means safe empty state.

---



### Phase 5 — Click-to-loop segment

This is the core shadowing feature.

State:

```ts
type LoopState = {
  activeCueId: string;
  start: number;
  end: number;
} | null;
```

Behavior:

- [x] User clicks a subtitle cue.
- [x] App sets `loopState = { activeCueId, start: cue.start, end: cue.end }`.
- [x] Video seeks to `cue.start`.
- [x] Video plays.
- [x] On `timeupdate` or animation frame:
  - If `currentTime >= end`, set `currentTime = start`.
- [x] Keep looping until user exits.
- [x] Add “Exit loop / Normal playback” button.
- [x] Exiting clears loop state and resumes normal playback.

Edge cases:

- [x] Cue end is after video duration.
- [x] Cue is very short.
- [x] User manually seeks outside loop.
- [x] Video ends during loop.
- [x] User changes video or subtitle file.
- [x] Overlapping cues.

Deliverable:

- Clicking a subtitle loops that exact segment until exit.

Acceptance criteria:

- Loop repeats accurately.
- Exit loop returns to normal playback.
- Changing video resets loop state.
- Changing subtitles resets loop state.

---



### Phase 6 — No-subtitle and error handling

This is required because some videos will not have captions.

Handle:

- [x] No subtitle file uploaded.
- [x] Subtitle file has zero cues.
- [x] Video has no embedded subtitle track.
- [x] Subtitle parsing fails.
- [x] Unsupported video format.
- [x] CORS issues if loading remote videos.
- [x] `video.textTracks` is empty.

Rules:

- [x] Wrap subtitle parsing in `try/catch`.
- [x] Check arrays before accessing `[0]`.
- [x] Disable click-to-loop if no cues.
- [x] Show clear user message.
- [x] Never throw an uncaught exception.

Deliverable:

- App works safely with videos that have no subtitles.

Acceptance criteria:

- No subtitles = no crash.
- Bad subtitle file = error message.
- Unsupported video = error message.
- Empty subtitle list = disabled loop controls.

---



### Phase 7 — Advanced: support arbitrary video formats

Only start this after MVP works.

#### Option A: Server-side FFmpeg

- [ ] User uploads video.
- [ ] Backend probes with `ffprobe`.
- [ ] If unsupported, transcode to MP4 H.264/AAC.
- [ ] Extract embedded subtitles to `.vtt` or `.srt`.
- [ ] Return playable URL and subtitle file.



#### Option B: ffmpeg.wasm

- [x] Transcode in browser.
- [x] No server needed.
- [x] Slower and memory-heavy.
- [x] Good for smaller files.

Tasks:

- [x] Detect `video.canPlayType()`.
- [x] If unsupported, offer “Convert for playback”.
- [x] Extract embedded subtitles.
- [x] If no subtitle stream exists, show “No captions found”.

Deliverable:

- MKV, AVI, etc. can be converted and used.

---



### Phase 8 — UX polish for shadowing

Tasks:

- [ ] Playback speed control: `0.5x`, `0.75x`, `1x`.
- [ ] Keyboard shortcuts:
  - Space: play/pause
  - Left/Right: seek
  - `L`: loop current cue
  - `Esc`: exit loop
- [ ] Progress bar with subtitle markers.
- [ ] Optional A-B manual loop.
- [ ] Mobile-friendly layout.
- [ ] Auto-scroll subtitle panel.
- [ ] Remember last playback speed and volume.

Deliverable:

- App feels like a real practice tool.

---



### Phase 9 — Testing plan

Test these cases:

- [ ] Video with no subtitles.
- [ ] Video with `.srt`.
- [ ] Video with `.vtt`.
- [ ] Empty subtitle file.
- [ ] Malformed subtitle file.
- [ ] Very short cue.
- [ ] Cue at end of video.
- [ ] Overlapping cues.
- [ ] User seeks while looping.
- [ ] User changes video while looping.
- [ ] Unsupported video format.
- [ ] Embedded subtitles present.
- [ ] Embedded subtitles missing.

Unit test:

- [ ] Subtitle parser.
- [ ] Time conversion.
- [ ] Loop logic.
- [ ] Active cue detection.

Deliverable:

- Reliable behavior across edge cases.

---



### Phase 10 — Persistence and deployment

Optional but useful:

- [ ] Save settings in `localStorage`.
- [ ] Save subtitle cues and recent files in IndexedDB.
- [ ] Do not store huge video files unless necessary.
- [ ] Deploy static frontend easily.
- [ ] If using FFmpeg server, deploy backend separately.

---



## 8. Recommended Build Order

1. Video file input + playback.
2. `.srt` / `.vtt` upload + parsing.
3. Subtitle list + click to seek.
4. Click-to-loop + exit loop button.
5. No-subtitle/error handling.
6. UX polish.
7. Embedded subtitle extraction.
8. Arbitrary format transcoding.

Start with:

> MP4/WebM + uploaded VTT/SRT + clickable looping subtitles.

Then add FFmpeg transcoding and embedded subtitle extraction as a separate advanced module.

---



## 9. Cursor Prompts Per Phase

Use prompts like these.

### Phase 1 prompt

```txt
Implement Phase 1 only from PLAN.md.
Create the React + Vite + TypeScript skeleton.
Create components: VideoLoader, VideoPlayer, SubtitlePanel, SubtitleCue, PlayerControls, ErrorMessage.
Do not implement video playback yet.
Add basic layout and placeholder empty states.
```



### Phase 2 prompt

```txt
Implement Phase 2 only from PLAN.md.
Add local video loading, object URL handling, video playback, basic controls, and unsupported format error handling.
Do not implement subtitles yet.
```



### Phase 3 prompt

```txt
Implement Phase 3 only from PLAN.md.
Add .srt and .vtt subtitle file loading and parsing into Cue[].
Handle empty, malformed, CRLF, BOM, and overlapping cues.
Do not implement looping yet.
```



### Phase 4 prompt

```txt
Implement Phase 4 only from PLAN.md.
Display subtitles over video and in a clickable list.
Sync active cue with video.currentTime.
Handle cues.length === 0 safely.
Do not implement loop mode yet.
```



### Phase 5 prompt

```txt
Implement Phase 5 only from PLAN.md.
Add click-to-loop for subtitle cues.
Add LoopState.
Add Exit loop / Normal playback button.
Handle edge cases listed in Phase 5.
```



### Phase 6 prompt

```txt
Implement Phase 6 only from PLAN.md.
Add robust no-subtitle and error handling.
Never crash when subtitles are missing or malformed.
Show clear user messages.
```

---



## 10. Definition of Done for MVP

The MVP is done when:

- [ ] User can load a local MP4/WebM video.
- [ ] User can load `.srt` or `.vtt` subtitles.
- [ ] Subtitles appear in a clickable list.
- [ ] Clicking a cue loops that segment.
- [ ] Exit loop returns to normal playback.
- [ ] No subtitles = safe empty state, no crash.
- [ ] Malformed subtitles = error message, no crash.
- [ ] Unsupported video = error message, no crash.

---



## 11. Final Notes

- Build the MVP first.
- Do not try to support every video format on day one.
- Treat subtitles as optional.
- Treat subtitle parsing as unsafe input.
- Keep loop logic isolated in a hook: `useSegmentLoop`.
- Keep subtitle parsing isolated in `parseSubtitles.ts`.
- Keep video support detection isolated in `videoSupport.ts`.
- Use Cursor phase by phase.
- After each phase, test the acceptance criteria before moving on.

