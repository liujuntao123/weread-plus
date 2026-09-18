# 03: WeRead Session Extraction and Notes Stream Sync

**What to build:**
Automatic session cookie extraction and data synchronization engine. Once the user logs in via QR code in the reader viewport, the Rust backend captures the `wr_vid` and `wr_skey` cookies and proxies calls to WeRead internal APIs (`/web/book/info`, `/web/book/bookmarklist`, `/web/review/list`, and `/web/book/bestbookmarks`). The retrieved highlights, thoughts, and community bookmarks are stored in the local SQLite database and displayed in the sidebar's Notes stream tab, organized chronologically or by chapter.

**Blocked by:** 02: Injected Script and Context State Transition

**Status:** resolved

- [x] Rust backend extracts active `wr_vid` and `wr_skey` cookies upon successful login.
- [x] Backend issues authenticated requests to WeRead Web APIs to fetch book details, highlights, and thoughts.
- [x] Community best bookmarks are retrieved and annotated with total reader count.
- [x] Data is normalized and persisted to the local SQLite database (`annotations` table).
- [x] Sidebar Notes tab displays highlights with color styles (straight, wave, mark).
- [x] User thoughts appear linked to their associated quote passages.
- [x] Filter controls allow toggling between All, Personal Highlights, Personal Thoughts, and Community Bookmarks.
- [x] Notes list supports keyword filtering across text and chapter titles.

## Implementation Details

- **Annotation Data Model & Filtering**: `src/services/wereadApi.ts` supports `highlight`, `thought`, `best_bookmark` styles (straight, wave, yellow mark).
- **Notes Stream Component**: `src/components/notes/NotesStream.tsx` provides multi-pill filter toggles, real-time search, and click-to-locate event dispatching.
- **Tests**: 4 unit tests passing in `src/services/wereadApi.test.ts`. Total 10 tests green.
