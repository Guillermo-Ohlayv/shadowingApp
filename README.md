# Shadowing Video App

A web application designed for language learners to practice shadowing by looping specific segments of videos based on subtitles.

## 🚀 Features (Planned)
- Local video loading (MP4, WebM).
- Subtitle loading and parsing (`.srt`, `.vtt`).
- Clickable subtitle list for quick seeking.
- Segment looping for focused shadowing practice.
- Safe handling of videos without subtitles.

## 🛠️ Tech Stack

### Core
- **React 19**: UI Library.
- **TypeScript**: Static typing for better maintainability.
- **Vite**: Fast build tool and development server.
- **Tailwind CSS v4**: Utility-first styling via `@tailwindcss/vite`.

### Tooling & Environment
- **pnpm**: Preferred package manager to ensure faster installations and better security/efficiency over npm.
- **Oxlint**: Fast JavaScript/TypeScript linter.

## 📦 Installation & Setup

Since this project uses **pnpm**, please avoid using `npm` or `yarn`.

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

## 🗺️ Roadmap
Detailed implementation steps can be found in [PLAN.md](PLAN.md).
