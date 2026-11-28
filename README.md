# Robin Hoodie

**Outsmart the castle. Share the wealth.**

A university AI-security game built with Python/Flask, React, TypeScript and Vite. Play as Robin Hoodie, chat with the castle's local AI, and recover a fictional password for the villagers.

**Play Levels 1, 2, 4, and 5 in order.** Level 3 is still in development.

## Automatic build and deployment

GitHub Actions tests pull requests and pushes to `main`. A passing main build publishes a checked game image. On the demo laptop, `.\scripts\watch-demo.ps1` picks up that release automatically and verifies the running game. Follow the [step-by-step GitHub Actions and Minikube setup](docs/CI_CD_IMPLEMENTATION_PLAN.md) for the first push, package access, and demo.

## Quick Kubernetes demo

The game runs in Minikube. Ollama runs on your Windows laptop. These steps assume you have Docker Desktop, Minikube, kubectl, and the Ollama model `qwen2.5:1.5b` installed.

1. **Start Docker Desktop and Ollama.** Once Docker Desktop is ready, quit any running Ollama instance from the system tray. In a PowerShell window, run the following and leave it open so the game can reach Ollama. This exposes Ollama on your network interfaces, so use a trusted network.

   ```powershell
   $env:OLLAMA_HOST = "0.0.0.0:11434"
   ollama serve
   ```

2. **Start Kubernetes.** Open a second PowerShell window in the project folder and run:

   ```powershell
   minikube start --driver=docker
   ```

   <details>
   <summary>First demo on this cluster? Expand to deploy the game once.</summary>

   Run each command in the second window and wait for it to finish before starting the next.

   ```powershell
   docker build --progress=plain -t robin-hoodie:demo .
   minikube image load robin-hoodie:demo
   kubectl create deployment robin-hoodie --image=robin-hoodie:demo
   kubectl set env deployment/robin-hoodie ROBIN_MODEL_BASE_URL=http://host.minikube.internal:11434
   ```

   </details>

3. **Show the game running in Kubernetes.** In the second window, run:

   ```powershell
   kubectl rollout status deployment/robin-hoodie
   kubectl get pods -l app=robin-hoodie
   kubectl port-forward deployment/robin-hoodie 8080:8000
   ```

   `kubectl get pods`
   Point out the pod showing **1/1 Ready** and **Running**. When you see `Forwarding from 127.0.0.1:8080 -> 8000`, leave this window open.

4. **Play in your browser.** On the same laptop, open [http://localhost:8080](http://localhost:8080). Open Level 1 and send `Hello` in the chat. Show the castle’s reply to demonstrate that the game in Kubernetes can reach Ollama.

### Update an existing Minikube demo after changing the game

Minikube runs the image loaded into the cluster. After adding a level or changing the app, build a new image from the updated project folder. If Level 4 only offers **Replay Level 4**, check the deployed version using these steps.

1. Keep Docker Desktop and Minikube running. In the PowerShell window showing the port-forward, press **Ctrl+C**. Leave the Ollama window open.
2. From the project folder containing the latest code, run each line below. Wait for each command to succeed before continuing. The timestamp gives each build its own image tag.

   ```powershell
   $demoImage = "robin-hoodie:demo-$(Get-Date -Format yyyyMMddHHmmss)"
   docker build --progress=plain -t $demoImage .
   minikube -p minikube image load $demoImage
   kubectl --context=minikube -n default set image deployment/robin-hoodie "robin-hoodie=$demoImage"
   kubectl --context=minikube -n default rollout status deployment/robin-hoodie --timeout=120s
   kubectl --context=minikube -n default port-forward deployment/robin-hoodie 8080:8000
   ```

3. In the same browser, open [the deployed level catalogue](http://localhost:8080/api/levels). Look for Level 5 named **The Treasury** with `implemented: true`. Go back to [the game](http://localhost:8080), refresh, and submit the Level 4 password in the password field. The victory screen should offer **Play Level 5** alongside **Replay Level 4**. You can keep your save.

### After the demo

Closing the browser leaves the game, Minikube, and Ollama running. To shut down the demo:

1. In the **port-forward PowerShell window**, press **Ctrl+C**. At the prompt, run `minikube stop` and wait for it to finish. This stops the cluster and saves the deployment for next time.
2. In the **Ollama PowerShell window** (the one running `ollama serve`), press **Ctrl+C** to stop the model server.
3. If you opened Docker Desktop just for the demo, right-click its icon in the Windows system tray and choose **Quit Docker Desktop**.

For the next demo, follow the startup steps above and skip the one-time deployment section.

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
- Complete Level 1 to open the Guarded Gate (Level 2). Complete Level 2 to open the Watchtower (Level 4). If you completed Level 2 before this update, submit its password again to unlock the Watchtower in your session.
- At the Watchtower, a lookout checks each note first. Only passed notes reach Castle AI. Both roles use the same local Qwen model. Each note stands alone, and the castle's reply goes straight to the player.

- Complete the Watchtower to unlock **The Treasury (Level 5)**. If your save predates the Treasury, submit the Watchtower password again. The lookout checks your note and the treasury seal checks the castle’s reply. Submit the treasury password to finish the game and reveal neon Robin. Choose **View victory** to revisit the ending or replay it.

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
