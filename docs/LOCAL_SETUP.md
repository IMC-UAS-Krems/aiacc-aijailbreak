# Local configuration

The [project README](../README.md) covers normal setup. Use these options only if your machine needs different settings.

Set variables in the terminal that starts the corresponding server, then restart that server. There is no automatic `.env` loader.

| Variable | Default | Set in |
|---|---|---|
| `ROBIN_HOST` | `127.0.0.1` | Backend terminal |
| `ROBIN_PORT` | `8000` | Backend terminal |
| `ROBIN_MODEL_BASE_URL` | `http://127.0.0.1:11434` | Backend terminal |
| `ROBIN_MODEL_NAME` | `qwen2.5:1.5b` | Backend terminal |
| `ROBIN_MODEL_TIMEOUT_SECONDS` | `90` | Backend terminal |
| `ROBIN_LEVEL1_PASSWORD` | Fictional default in `backend/config.py` | Backend terminal |
| `ROBIN_LEVEL2_PASSWORD` | Fictional default in `backend/config.py` | Backend terminal |
| `ROBIN_LEVEL4_PASSWORD` | Fictional default in `backend/config.py` | Backend terminal |
| `ROBIN_API_URL` | `http://127.0.0.1:8000` | Vite terminal; use if changing the backend port |

For example:

```powershell
$env:ROBIN_PORT = '8001'
.\.venv\Scripts\python.exe -m backend
```

In the Vite terminal:

```powershell
$env:ROBIN_API_URL = 'http://127.0.0.1:8001'
cd frontend
npm run dev
```

Keep the password on the backend. Do not use `VITE_*` variables for it: those can be exposed to the browser.

## Build the frontend

```powershell
cd frontend
npm run build
cd ..
.\.venv\Scripts\python.exe -m backend
```

Open http://127.0.0.1:8000 to use the built frontend through the backend. Vite is not needed while playing this build. Saves are specific to the browser origin, so port 8000 and port 5173 have separate progress.

Vite 6.4.6 supports the installed Node 20.10.0. `npm install` creates `frontend/package-lock.json`; retain that file once installation succeeds. No registry-generated lockfile is fabricated when downloads are unavailable.

## Save format

Key: `robin-hoodie.progress.v1` in localStorage. Started progress is:

```json
{"version":1,"started":true,"currentLevel":1,"completedLevels":[]}
```

Successful validation records the completed level ID in the browser. The backend session controls access. In this iteration, completing Level 1 unlocks Level 2 and completing Level 2 unlocks Level 4. Chat history is in memory only. Level 4 screens and forwards one note at a time.
