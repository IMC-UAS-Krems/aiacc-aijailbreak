param([ValidateSet('all', 'backend', 'frontend', 'live')][string]$Suite = 'all')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    function Invoke-FrontendTests {
        Push-Location (Join-Path $projectRoot 'frontend')
        try {
            npm test
            $script:frontendExitCode = $LASTEXITCODE
        } finally {
            Pop-Location
        }
    }
    $testExitCode = 0
    if ($Suite -ne 'frontend') {
        $pythonPath = (Resolve-Path '.venv\Scripts\python.exe').Path
        $env:ROBIN_TEST_BACKEND_COMMAND = ConvertTo-Json -Compress -InputObject @($pythonPath, '-m', 'backend', '--port', '{port}')
    }
    switch ($Suite) {
        'backend' { & $pythonPath -m unittest discover -s tests/backend -v; $testExitCode = $LASTEXITCODE }
        'frontend' { Invoke-FrontendTests; $testExitCode = $frontendExitCode }
        'live' { & $pythonPath -m unittest tests.live.check_local_model -v; $testExitCode = $LASTEXITCODE }
        'all' {
            & $pythonPath -m unittest discover -s tests/backend -v
            if ($LASTEXITCODE -ne 0) { $testExitCode = $LASTEXITCODE }
            Invoke-FrontendTests
            if ($frontendExitCode -ne 0) { $testExitCode = $frontendExitCode }
        }
    }
} finally {
    Pop-Location
}
exit $testExitCode
