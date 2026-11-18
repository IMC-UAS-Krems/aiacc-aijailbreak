# Testing Robin Hoodie

The project uses Python's `unittest` and Node's built-in test runner. There are no extra testing dependencies or browser downloads.

| Check | Command from project root | What runs |
|---|---|---|
| All deterministic checks | `.\scripts\test.ps1` | 19 backend cases and 17 frontend logic cases |
| Backend only | `.\scripts\test.ps1 -Suite backend` | Real API process; only the model service is scripted |
| Frontend logic only | `.\scripts\test.ps1 -Suite frontend` | Actual save and API modules, with fake storage/fetch boundaries |
| Real model | `.\scripts\test.ps1 -Suite live` | 2 opt-in API checks against the installed model; setup below |
| UI behavior | [Functional checklist](functional_checklist.md) | 25 manual cases in your usual browser |

Run project dependency installation from the main README first. Deterministic tests need neither Ollama nor a running frontend. Missing dependencies/configuration cause a failure, never a passing skip. Do not run backend tests concurrently: they share one scripted model server.

## Direct commands

If PowerShell blocks the helper script, use these commands instead. Do not change the machine's execution policy just to run tests.

```powershell
$pythonPath = (Resolve-Path '.venv\Scripts\python.exe').Path
$env:ROBIN_TEST_BACKEND_COMMAND = ConvertTo-Json -Compress -InputObject @($pythonPath, '-m', 'backend', '--port', '{port}')
& $pythonPath -m unittest discover -s tests/backend -v
cd frontend
npm test
cd ..
```

The backend harness starts the real application on a temporary loopback port and injects its test password, model URL/name and 0.3-second timeout. It terminates its own processes afterwards. It does not start or modify Ollama. The application's normal timeout is longer.

The frontend suite uses the existing TypeScript compiler to load the actual `progress.ts` and `api.ts` modules into Node. It checks save sanitization, storage failures, reset isolation, request payloads, error handling, explicit retries and cancellation. It does not render React or verify scrolling, layout, keyboard interaction or the completed browser journey.

## Live model checks

Start Ollama and the backend. Vite is not required for these API checks. In the test terminal, set:

```powershell
$env:ROBIN_LIVE_API_URL = 'http://127.0.0.1:8000'
$env:ROBIN_LIVE_MODEL_BASE_URL = 'http://127.0.0.1:11434'
$env:ROBIN_LIVE_MODEL_NAME = 'qwen2.5:1.5b'
$env:ROBIN_LIVE_PASSWORD = '<actual fictional password configured on the backend>'
.\.venv\Scripts\python.exe -m unittest tests.live.check_local_model -v
```

Use the password from `backend/config.py` or the override used to start the backend. Model files for `qwen2.5:1.5b` were identified locally; verify the active service with `ollama list` before running this suite. Tests never download a model.

L01 checks the runtime inventory, makes three direct password requests and one follow-up (**at most four inference calls**). At least two direct requests must disclose the password. L02 checks public metadata, incorrect/correct separate validation and locked future levels without additional inference. Record failures instead of repeatedly rerunning until green.

Browser completion, save persistence and frontend asset inspection are now manual checks, not part of the live API suite. Complete [F01-F25](functional_checklist.md) and [M01-M10](manual_acceptance.md) before declaring the app verified.

## Application contract


These public interfaces remain the application contract. Backend assertions are unchanged. UI behavior is checked manually, with Node tests covering save handling and API transport. Do not treat a passing logic test as proof that the screen works.

### HTTP API

All game endpoints use JSON. Only integer `1` is a supported playable level. Reject missing, boolean, fractional, string, null and collection level IDs rather than coercing them. Reject malformed request data with 400/422; reject unsupported levels with 400/403/404/422. These schema checks are not an AI input guard: valid user text, including direct password requests, reaches the model.

| Endpoint | Input | Required successful response |
|---|---|---|
| `GET /api/levels` | None | `{"levels":[{"id":1,"implemented":true,"available":true}, ...]}`; exactly IDs 1–5, others false |
| `GET /api/levels/1` | None | `{"id":1,...}`; public level context, optional `opening_message`; no password |
| `POST /api/chat` | `{"level_id":1,"messages":[{"role":"user","content":"Hello"}]}` | `{"reply":"actual model output"}`; no completion side effect |
| `POST /api/validate` | `{"level_id":1,"password":"guess"}` | `{"level_id":1,"correct":true,"completed":true}` or both booleans false |

Chat history contains user/assistant messages in order. The backend adds its own castle persona and the configured password; frontend-supplied system/tool messages are rejected. A wrong or empty string password is a normal unsuccessful guess (200); missing/non-string password is a client error. Normalize only surrounding whitespace and case, not internal characters. Validation needs no inference, remains available if the model is down, and is idempotent. No endpoint exposes the configured password outside a legitimate model reply.

Model refusal must not be scripted into Level 1's password instructions. Do not filter returned password text. Empty, malformed, disconnected, unavailable or timed-out model responses produce 502/503/504 with a nonempty `{"error":"..."}`, no successful reply, no fallback or automatic hidden retries. A new explicit request can recover. General model safety is not disabled by these tests.

### Navigation, persistence and browser hooks

- `/` is the menu; `/level/1` is playable and refreshable. Other `/level/{id}` routes redirect safely or show an unavailable screen with menu navigation. A safe fallback to Level 1 is allowed; an unsupported level must never run.
- Save key: `robin-hoodie.progress.v1`. Example started save: `{"version":1,"started":true,"currentLevel":1,"completedLevels":[]}`. Completion adds `1` once. An absent/reset save can be removed or normalized to an unstarted state.
- Invalid schemas recover to usable progress. Forged unsupported IDs can be discarded or normalized, but cannot become playable; sanitized progress must contain only supported IDs. Saves are convenience, not an anti-cheat trust boundary.
- Continue returns to Level 1. A completed save may resume success or start a replay. Selecting/replaying Level 1 creates a fresh attempt while retaining historical completion until Reset. Chat transcript persistence across a full restart is **not** required.
- Reset uses an accessible dialog named `Reset progress`, with `Cancel` and `Reset progress` buttons. Cancel preserves progress; confirmation clears only this game's save. A failed save write should explain that progress cannot be saved while leaving gameplay usable.

Use native semantic controls. Required accessible names: heading `Robin Hoodie`; buttons `Start game`, `Continue`, `Choose level`, `Back to menu`, `Send`, `Submit password`, `Replay Level 1`, `Retry`, `Reset progress`; textboxes `Your message` (multiline) and `Password`. Buttons need only exist in relevant states. Each message visibly identifies `Robin (you)` or `Castle AI`; its avatar has a matching accessible image name (SVG with `role="img"` is fine).

Use these few `data-testid` hooks where text/role alone is ambiguous:

| Hook | Element |
|---|---|
| `level-context` | Current-level text containing “Level 1” |
| `level-option-1` through `level-option-5` | The five level buttons, with status text; Levels 2–5 are disabled, locked and unavailable |
| `chat-messages` | Scrollable conversation viewport |
| `chat-message` | Each message, including the opening greeting; contains speaker, avatar and body |
| `chat-waiting`, `chat-error` | Visible waiting/error feedback only when applicable |
| `password-feedback` | Incorrect-password and validator-failure feedback |
| `level-complete` | Success region/dialog |
| `save-warning` | Feedback if progress cannot be written |

The tests do not prescribe DOM nesting, CSS classes, exact styling, exact error sentences, or pixel snapshots. Visual approval, honest README setup, and runtime provenance require the [manual acceptance cases](manual_acceptance.md).


## Coverage map

| Requirement | Automated evidence | Manual UI evidence |
|---|---|---|
| Only Level 1 is available | B01-B04, B18; L02 | F01, F04-F06 |
| Save schemas, corruption, storage failures and reset isolation | Node progress tests | F02-F11 |
| Model history and independent conversations | B06-B07; L01 | F18, F21, F23 |
| Separate backend password validation | B11-B14, B17, B19; Node API tests; L02 | F15-F18, F20 |
| No password guard/filter or simulated replies | B05, B08; L01 | M06-M08 |
| Recoverable service failures | B15-B17, B19; Node API tests | F19-F20, F23 |
| Labels, avatars, keyboard, duplicate sends, scrolling and responsive layout | Not covered by Node tests | F12-F14, F22-F25 |
| Artwork, model provenance, setup and scope | Not inferred from test counts | M01-M10 |

B01-B19 are unchanged. The former automated F01-F25 cases were intentionally converted into a manual checklist at the user's request. L02 now checks API behavior rather than controlling a browser. This reduces automated UI coverage; it does not relax the gameplay requirements.

See [verification status](../docs/LOCAL_LEVEL1_VERIFICATION.md) for checks actually performed and environmental blockers.
