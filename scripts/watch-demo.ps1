# Run in a PowerShell window on the demo laptop while Minikube is online.
[CmdletBinding()]
param([switch]$Once)

$ErrorActionPreference = 'Stop'
$repository = 'ghcr.io/imc-uas-krems/aiacc-aijailbreak'
$target = @('--context=minikube', '-n', 'default')
$deployment = 'deployment/robin-hoodie'
$verifiedImage = ''
$rejectedImage = ''

function Assert-CommandSucceeded([string]$operation) {
    if ($LASTEXITCODE -ne 0) { throw "$operation failed (exit $LASTEXITCODE)." }
}

function Test-Game {
    # The image already includes Python. Check Flask and Ollama from inside the new pod.
    @'
import json
from urllib.request import Request, urlopen

base = 'http://127.0.0.1:8000'
with urlopen(base + '/', timeout=10) as response:
    if b'id="root"' not in response.read():
        raise RuntimeError('Game frontend missing')
with urlopen(base + '/api/levels', timeout=10) as response:
    if not any(level['id'] == 5 and level['implemented'] for level in json.load(response)['levels']):
        raise RuntimeError('Treasury missing from catalogue')
body = {'level_id': 1, 'messages': [{'role': 'user', 'content': 'Hello!'}]}
request = Request(base + '/api/chat', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
with urlopen(request, timeout=120) as response:
    if not json.load(response)['reply'].strip():
        raise RuntimeError('Castle returned an empty reply')
'@ | kubectl @target exec -i $deployment -- python -
    Assert-CommandSucceeded 'Game smoke test'
}

function Sync-Demo {
    docker pull "${repository}:demo" | Out-Null
    Assert-CommandSucceeded 'Pull published demo image'
    $imageInfo = docker image inspect "${repository}:demo" | ConvertFrom-Json
    Assert-CommandSucceeded 'Read release identity'
    $digest = $imageInfo[0].RepoDigests | Where-Object { $_.StartsWith("${repository}@sha256:") } | Select-Object -First 1
    if (!$digest -or ($digest.Split(':')[-1] -notmatch '^[0-9a-f]{64}$')) { throw 'Published image digest is missing.' }
    $commit = $imageInfo[0].Config.Labels.'org.opencontainers.image.revision'
    # Minikube can start this preloaded image without registry credentials in the pod.
    $localImage = 'robin-hoodie:cd-' + $digest.Split(':')[-1]
    if ($script:rejectedImage -eq $localImage) { return }
    $live = kubectl @target get $deployment -o json | ConvertFrom-Json
    Assert-CommandSucceeded 'Read demo deployment'
    $container = $live.spec.template.spec.containers | Where-Object name -eq 'robin-hoodie'
    if (!$container) { throw 'Expected a container named robin-hoodie. See the README cluster setup.' }
    if ($container.imagePullPolicy -eq 'Always') { throw 'The demo needs imagePullPolicy IfNotPresent or Never for locally loaded images.' }
    $changed = $container.image -ne $localImage
    if (!$changed -and $script:verifiedImage -eq $localImage) { return }
    $revision = $live.metadata.annotations.'deployment.kubernetes.io/revision'
    if ($changed) {
        docker tag $digest $localImage
        Assert-CommandSucceeded 'Tag the verified digest for Minikube'
        minikube -p minikube image load $localImage
        Assert-CommandSucceeded 'Load release into Minikube'
        kubectl @target set image $deployment "robin-hoodie=$localImage"
        Assert-CommandSucceeded 'Update demo image'
    }
    try {
        kubectl @target rollout status $deployment --timeout=120s
        Assert-CommandSucceeded 'Deployment rollout'
        Test-Game
    } catch {
        if ($changed -and $revision) {
            Write-Warning "Release check failed. Restoring revision $revision."
            kubectl @target rollout undo $deployment "--to-revision=$revision"
            Assert-CommandSucceeded 'Restore previous revision'
            kubectl @target rollout status $deployment --timeout=120s
            Assert-CommandSucceeded 'Rollback rollout'
            $script:rejectedImage = $localImage
            Write-Warning 'Restored the previous revision. Waiting for a new digest. Restart the watcher to retry this release.'
        }
        throw
    }
    $script:verifiedImage = $localImage
    Write-Host "Demo verified: commit $commit, image $digest. The frontend, Treasury catalogue and chat passed."
}

Write-Host "Watching ${repository}:demo for Minikube. Press Ctrl+C to stop."
do {
    try { Sync-Demo } catch {
        if ($Once) { throw }
        Write-Warning "$($_.Exception.Message) Checking again in 60 seconds."
    }
    if (!$Once) { Start-Sleep -Seconds 60 }
} while (!$Once)
