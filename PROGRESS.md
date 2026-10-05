# Project Progress Log - Shadowing Video App

This file serves as the persistent memory of the project's development, tracking completed milestones and the current state of the application.

## 📅 Project Status
**Last Updated:** 2026-10-05 | 14:55 (UTC)

---

## ✅ Completed Tasks

### Phase 0 - 2: Infrastructure & Video
- [x] **Project Setup**: React 19, TypeScript, Vite, and `pnpm` configuration.
- [x] **Video Playback**: Implementation of `useVideoPlayer` and `VideoPlayer` components.
- [x] **Object URL Management**: Safe loading and revocation of local video files.

### Phase 3 - 4: Subtitles & Sync
- [x] **Subtitle Parsing**: Full support for `.srt` and `.vtt` in `parseSubtitles.ts`.
- [x] **Subtitle Synchronization**: `useSubtitleSync` hooks to highlight active subtitles based on `currentTime`.
- [x] **Interactive UI**: `SubtitlePanel` allowing users to seek to specific cues.

### Phase 5 - 6: Shadowing Core & Robustness
- [x] **Segment Looping**: Implementation of `useSegmentLoop` to handle the core shadowing behavior (start/end loop).
- [x] **Error Handling**: Integrated `ErrorMessage` and `statusMessages` for safe failure states.
- [x] **Unit Testing**: Extensive test suite for `lib/` utilities (parsing, time formatting, loop logic).

### Phase 7: Advanced Features
- [x] **Media Enhancement**: Added `useMediaEnhance` and `MediaTools` for probing and conversion.
- [x] **Embedded Caption Extraction**: Logic to automatically detect and extract captions from video files.

### Custom Additions (Not in PLAN.md)
- [x] **Logging System**: Implemented a professional, scoped logging system (`src/lib/logger.ts`).
    - Supports multiple levels: `debug`, `info`, `warn`, `error`.
    - Scoped logging (e.g., `log.app`, `log.video`, `log.subtitles`) for easier filtering.
    - Persisted log levels via `localStorage`.
    - Debugging helpers exposed to `window.shadowingLog` for real-time DevTools control.

---

## 🚧 Current State
The project is significantly ahead of the MVP. The core shadowing loop, subtitle synchronization, and basic media enhancement tools are all operational.

- **Core Loop**: Working.
- **Subtitle Sync**: Working.
- **Media Probing**: Logged and implemented.
- **Test Coverage**: High for library functions.

---

## ⏭️ Next Steps
- [ ] **Phase 8 — UX Polish**:
    - Keyboard shortcuts (Space, Left/Right, Esc).
    - Playback speed controls.
    - Mobile-responsive layout refinements.
- [ ] **Phase 10 — Persistence**:
    - `localStorage` for user settings (volume, speed).
- [ ] **Final Integration Testing**: End-to-end verification of the loop-exit-resume flow.
