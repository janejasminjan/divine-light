## Goal
Build a Quran web app with a calm, minimal interface that supports **reading, learning, listening, and memorization** in a single product.

## Scope for initial implementation
1. **Core reading experience**
   - Surah list and Ayah view with clean Arabic typography.
   - Quick jump (surah + ayah), next/previous navigation, and smooth scroll.

2. **Learning layer**
   - Toggleable translation and transliteration.
   - Tafsir/study panel per ayah.

3. **Listening layer**
   - Audio recitation playback (play/pause, seek, speed).
   - Ayah-level repeat and continuous play across ayahs.
   - Reciter selection.

4. **Memorization tools**
   - Repeat loop controls (single ayah / range).
   - “Hide words” mode for active recall.
   - Session progress markers.

5. **Productivity features**
   - Full-text search (surah/ayah/keyword).
   - Bookmarks and “continue reading”.
   - Daily reminder card inside the app.

6. **Multilingual support**
   - Arabic as primary text with language packs for translations.
   - Language switcher and per-user language preferences.

## UX & design direction
- Apply the selected **Calm & minimal** palette.
- Focus on a distraction-free reader, restrained spacing, and high legibility.
- Keep controls compact and functional for long reading/listening sessions.
- Ensure responsive behavior for desktop + mobile.

## Architecture plan
1. **Route structure**
   - ` / `: Reader home (surah browser + resume).
   - `/surah/$surahId`: Reading page.
   - `/search`: Search results.
   - `/memorize`: Memorization workspace.
   - `/bookmarks`: Saved ayahs.

2. **Data layer**
   - Query-driven loading with TanStack Query patterns (`ensureQueryData` + `useSuspenseQuery`).
   - Shared query option factories for surahs, ayahs, translations, reciters, audio URLs.

3. **State model**
   - URL search params for reader state (surah, ayah, language, reciter).
   - Local UI state for temporary controls (panel open/closed, hide-words mode).

4. **Backend enablement**
   - Enable **Lovable Cloud** for persistence.
   - Store bookmarks, progress, user preferences, reminder settings.

5. **Accessibility & quality**
   - Keyboard-friendly navigation, clear focus states, semantic headings.
   - Error and not-found boundaries on data routes.

## Technical details
- Keep existing root router/query setup and extend route files under `src/routes`.
- Replace current placeholder `src/routes/index.tsx` with real reader home.
- Add route-level SEO metadata per page (title/description/og tags).
- Use semantic tokens in `src/styles.css` only (no hardcoded component colors).
- Introduce reusable components for:
  - Ayah row
  - Audio controls
  - Translation/tafsir panel
  - Memorization controls
  - Bookmark button/state

## Delivery sequence
1. Build reader + navigation baseline.
2. Add search and bookmarks.
3. Add audio playback and reciter switching.
4. Add memorization tools.
5. Add multilingual toggles and polish responsive UX.