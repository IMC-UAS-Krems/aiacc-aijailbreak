# Robin Hoodie: local Level 1 implementation plan

Date: 17 November 2026. Status: implementation added; acceptance execution blocked by environment setup. See [the verification record](LOCAL_LEVEL1_VERIFICATION.md).

**User decision after planning:** use Python, React and Vite; do not use FastAPI or an intermediary plain-JavaScript application. The implementation uses Flask for the Python HTTP API and React/TypeScript with Vite. The four approved visual references have now been attached and reviewed. The original plan below records the behavior contract; these decisions supersede its earlier technology and missing-reference assumptions. The user subsequently requested removal of browser automation: keep the backend checks, use Node for frontend logic, and perform UI checks manually in an existing browser.

The current user request and [acceptance contract](../tests/README.md) define this iteration. The goal is to make the existing tests pass through real application behavior. At planning time the application did not exist; implementation has since been added, but the tests are still not a verified passing baseline. See the linked verification record for measured results.

## 1. Findings at planning time

| Item | Evidence and implication |
|---|---|
| Existing application | `concept/` contains a plain HTML/CSS/JavaScript design playground. There is no game backend or application dependency manifest. Its scripted responses, client-side passwords and sequential unlocking are unsuitable for the real game. |
| Backend language | Python is accepted in `architecture.md` and `DEVELOPMENT_GUIDE.md`. Python 3.13.3 is installed here. |
| Frameworks | FastAPI, React/TypeScript/Vite and Mantine are proposals in the older documents, not an installed stack or confirmed requirement. |
| Current test approach | 19 unchanged backend cases, 17 Node logic cases, 2 API-only live checks, 25 manual functional cases and 10 broader manual acceptance cases. Public interfaces and gameplay requirements remain unchanged. |
| Installed model files | Ollama executable found. Local manifest identifies `qwen2.5:1.5b`; its configuration reports Qwen2 family, 1.5B parameters and Q4_K_M quantization. All referenced layer files exist with the expected byte sizes. This establishes local files, not successful inference. |
| Runtime endpoint | `ollama list` attempted `http://127.0.0.1:11434`. Both it and an HTTP inventory probe were blocked by Windows socket permissions. No running Ollama process was visible to the inspection, and no `OLLAMA_HOST` override was found in process/user/machine environment settings. The active endpoint and service health remain unverified. |
| Design references | No newly attached approved menu/level images are visible in this conversation or workspace. `assets/branding/` contains the neon final-stage logo and icon exports. The early-level character, precise composition, font and final color values remain unconfirmed. |
| Test tooling | Python unittest and Node test runner; the frontend suite reuses the existing TypeScript compiler. No separate test-package installation or browser download. |
| Documentation paths | README links to root `AGENTS.md` and `DEVELOPMENT_GUIDE.md`, but the actual documents are under `docs/`. Some older internal links also point to nonexistent `outputs/` locations. Correct relevant links when updating setup documentation. |

The current prompt explicitly narrows the older roadmap. For this iteration, browser-local progress replaces the planned Postgres progress store; only Level 1 is implemented; completion does not unlock Level 2; model failure returns an error without fallback. Containers, Kubernetes, accounts, guards, filters, monitoring infrastructure and carbon features remain outside this work. This does not claim to satisfy the entire later course submission.

## 2. Recommended implementation shape

**Confirmed frontend/language decision:** Python + React/TypeScript + Vite. The selected Python framework is Flask, with a standard-library Ollama HTTP adapter. Vite serves the frontend during development and proxies `/api` to the Python backend. The backend can also serve Vite's built output. No FastAPI dependency is used.

Use one browser origin for the frontend and `/api/` routes through Vite's proxy. Vite runs on 127.0.0.1:5173 and the API on 127.0.0.1:8000 by default. Built frontend files can instead be served by the API at port 8000. Both use explicit loopback binding. Serve only intended public files, never the repository root or backend configuration.

| Proposed location | Responsibility |
|---|---|
| `backend/__main__.py` | Direct local launcher; host/port configuration and test-harness compatibility; no reloader or worker supervisor in test runs. |
| `backend/app.py` | Four API endpoints, controlled errors, frontend routes and static asset serving. |
| `backend/config.py` | One backend password setting plus runtime address, model name and timeout. |
| `backend/levels.py` | Catalogue and explicit implemented-level allowlist containing only integer `1`; public opening/context text. |
| `backend/model_client.py` | Castle context, request-scoped history and one real Ollama HTTP call per chat request. |
| `frontend/index.html`, `frontend/src/styles.css` | Semantic app shell, responsive layout and shared visual tokens. |
| `frontend/src/` | React components, typed API calls, local progress and attempt state. |
| `frontend/src/Artwork.tsx` | Temporary SVG adaptations of the approved early-level character and scenery; separate from neon branding. |
| `requirements.txt` | Pinned Python runtime dependencies; there is no separate test requirements file. |
| `README.md` | Verified PowerShell setup, model verification, startup, play, saves and test instructions. |

Leave `concept/` as the historical design playground. Reuse useful layout ideas and safe text-rendering patterns selectively. Do not import its game logic, passwords, settings controls, external mixed-font imports or neon character into the playable app.

## 3. Backend contract and model boundary

Retain these interfaces exactly as specified by the tests:

| Endpoint | Planned behavior |
|---|---|
| `GET /api/levels` | Return IDs 1-5 in order. Only ID 1 has `implemented: true` and `available: true`, independent of any progress. |
| `GET /api/levels/1` | Public Level 1 context and opening message; never return password configuration. Reject unsupported level detail requests. |
| `POST /api/chat` | Accept integer `level_id: 1` and ordered user/assistant messages. Prepend backend castle instructions and the configured fictional password. Return only the actual model reply, without completing the level. |
| `POST /api/validate` | Accept integer `level_id: 1` and a string password. Compare `strip().casefold()` values; preserve internal characters. Return `level_id`, `correct` and `completed`, with the two booleans agreeing. No model call or server-side progress session is needed. |

Implementation details that matter to existing tests:

- Validate JSON types strictly before checking level membership. Python equality alone would accept `True` as `1`; strings, floats, nulls and collections must also fail. Use strict schema fields or explicit exact-type checks.
- Reject malformed JSON, missing fields, blank chat content and client-supplied system/tool roles with controlled 400/422 JSON errors. Unsupported integer level IDs return a controlled 404. These are request-schema checks, not an AI prompt-injection guard.
- Return sanitized error objects. Do not echo submitted passwords, entire invalid request bodies, model context or exception tracebacks through framework validation errors.
- Wrong and empty string password guesses return 200 with both booleans false. Missing or non-string passwords are client errors. Repeated correct guesses remain idempotent.
- Configure the development password once in backend settings, with `ROBIN_LEVEL1_PASSWORD` override support. Do not import test constants or place the value in frontend assets, schema examples/defaults, public JSON or logs.
- The persona is a concise castle stores assistant that knows the fictional password and may answer direct requests for it. No disclosure prohibition, guard, output filter or hardcoded successful response. Use the required opening: “Welcome to the castle stores. What would you like to know?” The opening is interface copy, not evidence of model inference.
- Honor all six harness settings: `ROBIN_HOST`, `ROBIN_PORT`, `ROBIN_MODEL_BASE_URL`, `ROBIN_MODEL_NAME`, `ROBIN_LEVEL1_PASSWORD`, and `ROBIN_MODEL_TIMEOUT_SECONDS`.
- Ollama transport stays `POST /api/chat` with configured `model`, ordered `messages` and `stream: false`. Do not add inventory calls or model loading to application startup or validation; the deterministic model double supports chat only, and validation must work during outages.
- Keep history request-local, without a shared global transcript. Start with the current attempt's ordered exchanges; if live testing shows context-size problems, document and bound retained recent complete exchanges while preserving the latest user message and system context. Do not silently claim unlimited memory.
- Map unreachable service to 503, invalid/upstream failed responses to 502, and timeout to 504, each with a nonempty friendly `error` and no successful `reply`. Reject empty/whitespace/non-string reply content; otherwise return the model text unchanged.
- Make timeout bounded and configurable, including the harness's 0.3-second setting. A proposed 90-second normal-play deadline must be checked against laptop cold-start behavior. Use an overall request deadline as well as transport timeouts; never silently retry or substitute another model.

## 4. Frontend behavior and state

Keep four kinds of state distinct: implemented levels, saved progress, the current attempt, and pending requests. Neither model text nor a forged save may change the implemented-level list.

### Navigation and progress

- `/` is the menu. Start game/Continue opens `/level/1`; browser Back/Forward and direct refresh must work. The chooser may have its own `/levels` route.
- Every other `/level/{id}` displays an unavailable screen with Back to menu and no chat request. Check this in both browser routing and the backend API.
- Show all five chooser buttons with `level-option-1` through `level-option-5`. Level 1 is playable/replayable; the others are disabled and visibly say “Locked” and “Unavailable in this version.” Historical completion may label Level 1 “Completed.”
- Persist only `robin-hoodie.progress.v1`, using `{version: 1, started: true, currentLevel: 1, completedLevels: []}` and adding `1` once after successful backend validation.
- Reject invalid save schemas; recover to a fresh usable state. Normalize unsupported numeric level values to supported progress and discard unsupported completion IDs and injected unlock data. Persist the cleaned form when storage is available.
- Wrap every storage operation, including access to `window.localStorage`, in recovery logic. Use memory for the current session if storage fails and explain that progress cannot be saved. Successful backend validation still shows success if saving fails, as required by F09.
- Continue, choosing Level 1, and Replay start a fresh attempt while retaining historical completion. This is an explicit plan choice allowed by the tests. A refresh restores Level 1/progress, but chat transcript persistence is not promised.
- Reset progress opens a named accessible dialog with Cancel and Reset progress buttons. Cancel leaves everything unchanged; confirm clears only this game's key and active attempt. Never call `localStorage.clear()`.

### Chat, retry and completion

- Every bubble has visible speaker text and an accessible avatar: “Robin (you)” with Robin's face, or “Castle AI” with a castle/tower. Render model and user content as text, never executable markup.
- Use a labelled multiline textarea, visible Send button, Enter to send and Shift+Enter for newline. Ignore empty/whitespace messages and composition events; preserve intentional multiline content.
- Set pending state synchronously before sending, append the user bubble once, and disable duplicate sends. Show `chat-waiting` until the request resolves.
- Keep a snapshot of the failed request. Retry sends that identical payload and reuses the existing user bubble; errors remain outside model conversation history. Never invent an assistant reply for an error.
- Track the active attempt/request identity and abort or ignore obsolete requests on menu navigation, replay and reset. A late reply or validator result must not alter a new attempt. Clear stale waiting states.
- Update chat nodes without rebuilding the scroll viewport. Track whether the reader is near the bottom and update that state on scroll events, including while inference is pending. Only follow new messages when the reader remains near the bottom.
- Use a separate labelled Password form with Submit password. Disable it while its request is pending. Preserve a guess after a network error and re-enable submission. Do not inspect chat for a password, prefill the field or auto-submit it.
- Only a valid successful `/api/validate` response for the current attempt may display `level-complete` and save completion. Incorrect guesses show clear feedback; network failures never show success.
- Success explains that resources were recovered for villagers, offers Replay Level 1 and Back to menu, and says other levels are coming later. No Next level control.

Retain all exact accessible names and `data-testid` hooks from [the test guide](../tests/README.md). Keep waiting/error elements outside the `chat-message` count. Avoid duplicate visible Back to menu buttons in the success state because the existing browser helper selects that name directly.

## 5. Visual implementation plan

The written direction and four attached reference images are now available. Their menu, chooser and chat compositions guide the implementation, while Level 1-only availability and its friendly opening take precedence over the Level 2 content in the examples. Browser visual approval is still pending.

| Screen | Planned hierarchy |
|---|---|
| Menu | Robin Hoodie title, short villagers/castle premise, Start game or Continue, Choose level, and a quiet Reset progress action. Static early-level Robin with restrained woodland/castle scenery. |
| Level chooser | Five simple level rows/buttons, readable availability labels, modest completed state for Level 1 and Back to menu. |
| Level 1 | Compact level context, spacious conversation, composer, and clearly separate password form. Desktop may put validation beside chat; narrow layouts stack it below without hiding controls. |
| Success | Modest in-context success region or accessible dialog using the same controls and spacing, with replay/menu actions and future-level notice. |

Use warm ivory, caramel brown and muted sage; one readable font family and shared spacing, radius, focus and control styles. Keep font loading local or use a consistent system family until an approved font is identified. Use no neon artwork, terminal motifs, decorative underlines, busy animation or nonfunctional controls.

Missing early-level art can use a simple consistent static placeholder as the prompt allows, but it must be identified in the handoff. Confirm the approved image layout before final styling. Test at 1440x900, 390x844 and 320x740, with long unbroken model text, keyboard focus and 200% zoom. Let the page scroll on small screens, keep chat independently scrollable, and allow long words to wrap.

## 6. Implementation sequence and exit checks

These are future work packages, not completed implementation. Keep backend assertions unchanged. The user authorized converting browser automation to manual cases; this changes test execution, not the required behavior. Report genuine test defects and never weaken assertions to accommodate broken behavior.

| Step | Work | Required evidence before moving on |
|---|---|---|
| 1. Resolve inputs and setup | Receive design references; verify local service inventory and exact endpoint; record stack decision; install/pin application dependencies; establish a direct backend launcher. | Reproducible environment and selected model identified. Do not download a replacement model. If access is blocked, record it and continue independent work. |
| 2. Catalogue and validator | Implement settings, strict request schemas, supported levels, public context, controlled errors and independent validator. | B01-B04, B09-B14, B18; no password in public configuration/errors. |
| 3. Real model adapter | Add castle context, configured HTTP transport, history, bounded failures and explicit retry behavior. | B05-B08, B15-B17, B19; then run the live API check once against the actual model before treating integration as proven. |
| 4. Menu and persistence | Build menu, chooser, route fallback, save sanitization, memory fallback and reset dialog. | Manual F01-F11 plus Node save tests, including refresh, tampering and unavailable storage. |
| 5. Complete playable journey | Add speaker avatars, composer, waiting/retry, scroll handling, separate validator, success and replay. | Manual F12-F23 and F25, plus the backend and Node suites. |
| 6. Approved styling and responsive review | Apply references, early-level artwork and shared visual styles. | Manual F24 and M01/M04; rerun relevant functional checks after styling changes. |
| 7. Local end-to-end handoff | Run unmocked browser journey, outage/restart checks, README walkthrough and final regression suite. | Two live API checks plus F01-F25 and M01-M10 with recorded outcomes; precise remaining blockers, if any. |

Run `.\scripts\test.ps1` for deterministic backend and Node logic tests. Use `-Suite backend`, `-Suite frontend` or the opt-in `-Suite live` to select a group. Detailed direct commands and configuration are in [tests/README.md](../tests/README.md).

The live suite requires explicit API/model/password settings and makes at most four inference calls: three direct requests and one follow-up. At least two direct requests must disclose the password. A second API check covers public metadata and separate validation without inference. Record failures instead of rerunning until green.

The former automated UI cases are preserved in [the functional checklist](../tests/functional_checklist.md). Node tests check save and transport logic only; clicks, rendering, keyboard handling, scrolling, completion and browser persistence require manual verification. Passing logic tests must not be described as a passing browser journey.

## 7. Documentation and definition of done

During implementation, update README with the actual verified PowerShell dependency-install commands, model service verification/start instructions, application startup command and local URL. Do not present a planned command as already working. Explain the separate chat/validator actions, Level 1-only scope, progress/reset behavior, and configurable backend settings. Keep the test guide linked and correct the relevant existing document paths.

Completion of the implementation requires all existing deterministic assertions to pass without relaxed expectations, successful real-model evidence, manual responsive/visual review and a reproducible student walkthrough. Any blocked check remains explicitly BLOCKED, including absent image references, dependency installation or socket access. Report temporary artwork and runtime limitations.

## 8. Inputs still needed and planning verification

1. **Approved design images:** received and incorporated as implementation references. Browser comparison remains pending.
2. **Serving endpoint:** the user installed Ollama and downloaded Qwen without further configuration. The local model identifier is known; 127.0.0.1:11434 remains the expected, configurable endpoint. Verify it in a normal laptop terminal, then run actual inference. No additional model selection question is needed.
3. **Technology decision:** resolved by the user: Python, React and Vite, with no FastAPI. Flask implements the Python API; plain React components and CSS implement the approved design without an additional UI library.

The original planning turn checked syntax/discovery only. Current executed checks and environmental blockers are recorded in LOCAL_LEVEL1_VERIFICATION.md. Backend assertions remain unchanged; UI testing was intentionally converted to manual checks by the user.

Technical references checked during planning: [FastAPI static files](https://fastapi.tiangolo.com/tutorial/static-files/), [Pydantic strict validation](https://docs.pydantic.dev/latest/concepts/strict_mode/), [HTTPX timeouts](https://www.python-httpx.org/advanced/timeouts/), and [Ollama chat protocol](https://docs.ollama.com/api/chat). Select and verify concrete dependency versions when installing; this plan does not claim uninstalled versions have been tested.
