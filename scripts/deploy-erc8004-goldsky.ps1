# Deploy ERC-8004 subgraphs to Goldsky extension account (project_cmra5abu7bwp901xf5kbz3wqr)
# Usage: .\scripts\deploy-erc8004-goldsky.ps1 [-Chain celo|xlayer|gnosis|all]
# Requires: GOLDSKY_ERC8004_API_KEY in .env or environment

param(
    [ValidateSet('celo', 'xlayer', 'gnosis', 'all')]
    [string]$Chain = 'all'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $env:GOLDSKY_ERC8004_API_KEY) {
    Get-Content .env -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_ -match '^\s*GOLDSKY_ERC8004_API_KEY=(.+)$') {
            $env:GOLDSKY_ERC8004_API_KEY = $matches[1].Trim()
        }
    }
}

if (-not $env:GOLDSKY_ERC8004_API_KEY) {
    Write-Error 'GOLDSKY_ERC8004_API_KEY not set. Add to .env or environment.'
}

$token = $env:GOLDSKY_ERC8004_API_KEY
goldsky login --token $token | Out-Null

$chains = @(
    @{ Id = 'celo'; Network = 'celo'; StartBlock = 58396724; Deploy = 'erc-8004-agent-celo/1.0.0'; Npm = 'deploy:celo-goldsky'; Tag = 'tag:celo-goldsky' },
    @{ Id = 'xlayer'; Network = 'x1'; StartBlock = 48428000; Deploy = 'erc-8004-agent-xlayer/1.0.0'; Npm = 'deploy:xlayer-goldsky'; Tag = 'tag:xlayer-goldsky' },
    @{ Id = 'gnosis'; Network = 'gnosis'; StartBlock = 44505010; Deploy = 'erc-8004-agent-gnosis/1.0.0'; Npm = 'deploy:gnosis-goldsky'; Tag = 'tag:gnosis-goldsky' }
)

function Set-SubgraphYaml($network, $startBlock) {
    $yaml = Get-Content subgraph.yaml -Raw
    $yaml = $yaml -replace 'network: \w+', "network: $network"
    $yaml = $yaml -replace 'startBlock: \d+', "startBlock: $startBlock"
    Set-Content subgraph.yaml $yaml -NoNewline
}

$selected = if ($Chain -eq 'all') { $chains } else { $chains | Where-Object { $_.Id -eq $Chain } }

foreach ($c in $selected) {
    Write-Host "=== Deploy $($c.Id) (network=$($c.Network)) ===" -ForegroundColor Cyan
    Set-SubgraphYaml $c.Network $c.StartBlock
    npm run codegen
    npm run build
    goldsky subgraph deploy $($c.Deploy) --path . --tag prod --token $token
    Write-Host "Done: $($c.Deploy) tag prod" -ForegroundColor Green
}

goldsky subgraph list
Write-Host "Monitor: .\scripts\monitor-erc8004-goldsky-sync.ps1"
