# GitHub Actions and automatic deployment to the demo laptop

A passing push to `main` produces a game image. While the demo laptop is online, a PowerShell watcher checks GitHub Container Registry (GHCR) every 60 seconds and rolls the new image out to Minikube. The repo is public, so GitHub-hosted machines execute workflow code and the laptop pulls finished images. This arrangement is called pull-based continuous deployment.

## 1. Submit CD as a second pull request

Once the CI pull request is merged, run the following from the project folder with the prepared CD edits. Fetch the merged version first because the local main branch may still point to the earlier build. Creating the new branch this way carries your working changes onto the merged code.

```powershell
git fetch origin
git switch --no-track -c cd-minikube origin/main
git add -- .github/workflows/ci.yml scripts/watch-demo.ps1 README.md docs/CI_CD_IMPLEMENTATION_PLAN.md
git --no-pager diff --cached --stat
git commit -m "Publish tested game images and deploy them to Minikube"
git push -u origin cd-minikube
```

On GitHub, open a pull request with base `main` and compare `cd-minikube`. Expect two passing CI checks and a skipped publish job. Merge the pull request to trigger the first release.

## 2. Watch the first build on GitHub

Open the repository's **Actions** tab, choose **Robin Hoodie CI and deployment**, and open the run for your commit. If Actions is disabled, a repository admin can enable it in **Settings → Actions → General**. The workflow needs permission to publish a GHCR package under the university organization.

| Job | What happens |
| --- | --- |
| Test Flask | Python 3.12 runs backend unit and HTTP integration tests against the scripted model. |
| Test and build React | Node 22 installs locked dependencies, runs the frontend tests, and builds the production app. |
| Check and publish game image | After both checks pass on main, Docker builds the game, starts it, fetches its home page, and checks that the API lists the Treasury. It publishes this same image with the commit SHA and the moving `demo` tag. The summary records the digest, which identifies the image contents. |

Pull requests run the first two jobs. A failed test or image check stops promotion. Hosted checks can run while the laptop, Minikube, and Ollama are off. The deployment result appears on the laptop. [GitHub image publishing guide](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)

## 3. Give the laptop read access to the image once

After the first successful publish, run this in PowerShell:

```powershell
docker pull ghcr.io/imc-uas-krems/aiacc-aijailbreak:demo
```

If the pull succeeds, continue to step 4. A public repository can have a private package. For a private package, use a GitHub account with package read access and a personal access token (classic) with `read:packages`. Run `docker login ghcr.io -u YOUR_GITHUB_USERNAME` and paste the token at the password prompt. If the university organization uses SSO, authorize the token for that organization. Retry the pull. If the package has never been published, check the publish job first. [GitHub Container Registry authentication and visibility](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 4. Start the demo laptop

Start Docker Desktop, Ollama and Minikube using the [README demo instructions](../README.md#quick-kubernetes-demo). The watcher targets the existing single-container deployment named `robin-hoodie`, in the `default` namespace of the `minikube` context. If this is a fresh cluster, follow the README's one-time deployment steps first. The watcher preserves the existing Ollama address and cluster configuration.

Open another PowerShell window in the project folder and run:

```powershell
.\scripts\watch-demo.ps1
```

Leave that window open during development or the demo. Starting it once per session connects the laptop to the release feed. Subsequent successful pushes deploy automatically. When the laptop comes back online, it picks up the current release. To check once and exit for troubleshooting, run `.\scripts\watch-demo.ps1 -Once`.

## 5. Confirm the deployment

Look for **Demo verified** in the watcher window. Compare its commit and digest with the GitHub run summary. The watcher loads the published image into Minikube with a unique tag, waits for the rollout, then checks the frontend, level catalogue, and a Level 1 chat reply inside the pod. If a new rollout or smoke test fails, it attempts to restore the previous revision. After a successful rollback it waits for a new digest. Restart the watcher to retry the same release after fixing a local problem such as Ollama being offline.

In another PowerShell window, run:

```powershell
kubectl --context=minikube -n default port-forward deployment/robin-hoodie 8080:8000
```

Open [the game on the laptop](http://localhost:8080). If a port-forward was open before the rollout and its connection ends, run the command again. For the course demo, show the GitHub run, the matching **Demo verified** line, and the Treasury in the game. A green GitHub run confirms publication. The watcher confirms the deployed game answered a chat request.

## 6. Stop after the demo

Press **Ctrl+C** in the watcher window and in the port-forward window. Follow the README teardown for Minikube and Ollama. GitHub continues to test new commits independently.

## Course work still planned

The [course specification](exp_architecture.md#11-cicd-and-verification) also calls for linting, security scans, and Kubernetes template validation. These are follow-up checks. The current workflow verifies the application tests, production build, and packaged game. The deployment uses the existing README deployment.
