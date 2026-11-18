# Local Level 1 implementation verification

Date: 17 November 2026. This is an implementation record, not a passing acceptance report.

The user confirmed Python, React and Vite and explicitly excluded FastAPI. The implementation uses a Flask Python API and a React/TypeScript frontend built by Vite. These are the application modules for this slice of the larger project, not a separate throwaway UI. Only Level 1 is implemented.

The user subsequently requested no browser automation dependencies. The former 25 UI automation cases are now a manual checklist, the live suite uses HTTP only, and frontend logic runs in Node. The test-only requirements file and browser harness were removed. No alternative browser package was added.

## Design and assets

Four attached images were reviewed: five character stages, main menu, level chooser and a Level 2 chat screen. The implementation follows their ivory/caramel/sage palette, rounded controls, woodland scenery, large title, character placement and separate bottom password form. Level 1 uses patched clothing, no bow/quiver/cape/neon, and the unprotected castle greeting. Level 2 availability, refusal dialogue and Settings from the references are not implemented.

`frontend/src/Artwork.tsx` contains original simplified SVG adaptations: patched Robin, his face avatar, a castle and background scenery. These are temporary illustrations inspired by the supplied references, not extracted production artwork or screenshot-based interface elements. A final illustrated asset replacement can reuse the same components. Typography uses one local font family throughout, preferring Trebuchet MS; there are no external font requests.

## Verification status

| Check | Result | Evidence / remaining work |
|---|---|---|
| Python syntax/discovery | PASS | All 16 current backend/test modules parse. Discovery finds 19 deterministic backend methods and 2 opt-in live API methods, without a browser import. |
| Frontend syntax | PASS | All six TS/TSX files transpile without syntax errors using WebStorm's locally bundled TypeScript 5.4.3. This is not the project's full type check or Vite build. |
| Frontend logic suite | PASS with local compiler | All 17 committed Node tests passed: 9 storage/progress cases and 8 API transport cases. Because npm installation is blocked, a temporary loader outside the repository resolved TypeScript to WebStorm's installed 5.4.3 compiler. No application or test logic was substituted. Running through the normal npm setup with pinned TypeScript 5.9.3 remains unverified. These tests do not render React. |
| Isolated model adapter | PASS | Direct assertions with a patched HTTP opener cover configured payload/context/history, exact reply forwarding, five invalid reply shapes, timeout/unreachable/reset failures and catalogue availability. No real HTTP round trip or inference is implied. |
| Backend test preservation | PASS | B01-B19 in `tests/backend/test_api.py` retain their pre-change SHA-256 hash. UI automation was intentionally converted to manual cases; L02 now checks the real API's separate validation and locked levels. |
| Python dependency installation | AVAILABLE | Flask is now installed in `.venv`; the user's uv command also confirms requirements are satisfied. Setup now uses uv exclusively. |
| Frontend dependency installation | BLOCKED | npm registry lookup/install failed with ENOTFOUND. No package lock was fabricated. Run installation and retain the generated lockfile before treating the build as reproducible. |
| Backend acceptance suite | BLOCKED | Latest run starts Flask on the harness port, but local HTTP readiness cannot be reached from this restricted environment and times out. Zero backend acceptance assertions ran. In-process Flask client checks pass for the catalogue and updated missing-frontend instructions. |
| Full TypeScript check / Vite build | BLOCKED | `npm run build` from `frontend` stops because `tsc` is not installed; registry access prevents dependency installation. |
| Real model inventory/inference | PARTIAL | The user's terminal successfully lists `qwen2.5:1.5b` (ID `65ec06548149`, 986 MB). Local socket access remains restricted in this execution environment; actual inference is still unverified. |
| Manual functional F01-F25 / acceptance M01-M10 | NOT RUN | Use an existing browser after starting the real services. No extra browser tooling is needed. Screens and full journeys remain unverified. |

Run `scripts/test.ps1` after installing the application dependencies; no running Vite or Ollama is needed for these deterministic checks. Run the explicit live API suite separately with the backend and Ollama running. Use the manual checklists to verify the actual UI. The concise README links to this record so setup instructions and measured status remain separate. No full application pass is claimed.

Setup correction: the user's npm prefix install attempted to read the root `package.json` and failed. All current install/run/build/test instructions now enter `frontend` explicitly before invoking npm; the test helper also changes directory internally. An install from that directory reaches the registry here (rather than reporting a missing root manifest), but registry DNS is blocked. Vite remains unavailable until installation succeeds. The development UI URL is port 5173; backend port 8000 serves the UI only after a frontend build. The backend's missing-build response now explains both paths.

## Remaining runtime limitations

- The current launcher uses Flask's threaded local development server with debugger and reload disabled. Deployment is outside this slice; the `create_app` factory provides a WSGI application for later hosting.
- The Ollama adapter uses a configurable socket timeout (90 seconds by default), with no retry or alternate model. Cold-start timing remains unmeasured. This is not an overall deadline against a service that continually sends partial data.
- Conversation history is kept for the current attempt in browser memory and sent in order with each request. Refresh/replay starts a fresh conversation; only started/completed progress is persisted. Very long conversations remain subject to model context limits. The API accepts requests up to 1 MiB.
- Model responses are shown as text. Asking for the password does not trigger completion; only a successful separate validation response does.
- Continue starts a fresh Level 1 attempt while retaining historical completion. Levels 2-5 stay unavailable regardless of local-save contents.

Dependency decision: Vite 6.4.6 is selected for the installed Node 20.10.0, rather than requiring a system-wide Node upgrade. Its existence and release were checked against [Vite releases](https://github.com/vitejs/vite/releases) and the [official package versions](https://www.npmjs.com/package/vite?activeTab=versions). Vite 6's documented Node requirement is available in its [versioned guide](https://v6.vite.dev/guide/). Installation/build compatibility remains to be exercised here.
