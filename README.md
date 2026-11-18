# Robin Hoodie

**Outsmart the castle. Share the wealth.**

A university AI-security game built with Python/Flask, React, TypeScript and Vite. Play as Robin Hoodie, chat with the castle's local AI, and recover a fictional password for the villagers.

**Only Level 1 is playable.** Levels 2–5 are coming later.

## Requirements

- Python 3.11 or newer
- uv (Python environment and package manager)
- Node.js 20.10 or newer, with npm
- Ollama with `qwen2.5:1.5b` installed
- Your usual web browser

## Setup

Open PowerShell in the project folder. For a new checkout, create the Python environment:

```powershell
uv venv .venv
```

If `.venv` already exists, keep it and skip that command. Install the backend dependencies:

```powershell
uv pip install --python .venv\Scripts\python.exe -r requirements.txt
```

Install the frontend dependencies **from inside the frontend folder**:

```powershell
cd frontend
npm install
cd ..
```

Wait for installation to finish successfully before starting the app. uv manages Python packages; npm manages the React/Vite packages. No pip installation or environment activation is needed.

No additional test packages or test browsers are needed.

## Run

1. Open Ollama and check that your model appears:

   ```powershell
   ollama list
   ```

   Look for `qwen2.5:1.5b`. If Ollama is not running, run `ollama serve` in a separate terminal. If the model is missing, check with the team before downloading another one.

2. Start the backend:

   ```powershell
   .\.venv\Scripts\python.exe -m backend
   ```

3. In another terminal, from the same project folder, start the frontend:

   ```powershell
   cd frontend
   npm run dev
   ```

4. Open **[http://127.0.0.1:5173](http://127.0.0.1:5173)** once Vite says it is ready. Port `8000` is the backend; use port `5173` to play during development.

Keep both terminals open. Press Ctrl+C to stop a server.

## Play

- Choose **Start game** or **Continue**.
- Ask **Castle AI** for the castle stores password. Level 1 is deliberately easy.
- Enter the password in the separate field and click **Submit password**. Finding it in chat does not complete the level.
- After success, replay Level 1 or return to the menu. Other levels stay locked.

Progress is saved in your browser. Continue starts a fresh conversation while keeping completion history. Use **Reset progress** on the menu to start over; it asks for confirmation. Use the same browser and address to keep your save.

## Checks

Run the automated backend and frontend logic checks after setup:

```powershell
.\scripts\test.ps1
```

These checks do not need Ollama or a running app. To run one group, add `-Suite backend` or `-Suite frontend`. Test libraries are built into Python and Node; the frontend tests reuse the project's TypeScript compiler.

Check the interface in your normal browser using the [functional checklist](tests/functional_checklist.md). See [tests/README.md](tests/README.md) for real-model checks and direct commands if PowerShell blocks the helper script.

## Troubleshooting

- **`vite` is not recognized:** in the project folder, run `cd frontend`, then `npm install`. After it succeeds, run `npm run dev` in that same folder.
- **npm cannot find `package.json`:** the npm terminal must be in `aiacc-aijailbreak\frontend`, where `package.json` lives.
- **“Frontend is not built” at port 8000:** start Vite as above and open port `5173`. Serving from port 8000 requires a frontend build; see [configuration](docs/LOCAL_SETUP.md).
- **No module named flask:** from the project folder, run `uv pip install --python .venv\Scripts\python.exe -r requirements.txt`.
- **Chat cannot connect:** check that the backend and Ollama are running, then click **Retry**. The failed message is preserved.
- **Different model or port:** see [configuration](docs/LOCAL_SETUP.md). The defaults are backend port `8000`, Vite port `5173`, and Ollama at `http://127.0.0.1:11434`.

## Project

- `backend/` — Python API, model connection and password validation
- `frontend/` — React interface and Vite configuration
- `tests/` — backend/live-model checks and manual acceptance cases
- `docs/` — architecture, development notes and verification status

[Development guide](docs/DEVELOPMENT_GUIDE.md) · [Architecture](docs/architecture.md) · [Verification status](docs/LOCAL_LEVEL1_VERIFICATION.md)

IMC Krems · AI Architecture and Cloud Computing

Team: Mario Palagyi, Jerome Puthuparampil, Balqiz Azami

Submission: December 4, 2026
