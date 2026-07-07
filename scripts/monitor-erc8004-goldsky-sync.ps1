# Monitor Goldsky ERC-8004 extension subgraphs (cuenta project_cmra5abu7bwp901xf5kbz3wqr)
# Usage: .\scripts\monitor-goldsky-sync.ps1

$ErrorActionPreference = 'Stop'
$query = '{"query":"{ _meta { block { number } hasIndexingErrors } agents(first: 1, orderBy: id) { id } }"}'

$base = 'https://api.goldsky.com/api/public/project_cmra5abu7bwp901xf5kbz3wqr/subgraphs'

$subgraphs = @(
    @{ Name = 'celo'; Url = "$base/erc-8004-agent-celo/prod/gn" },
    @{ Name = 'xlayer'; Url = "$base/erc-8004-agent-xlayer/prod/gn" },
    @{ Name = 'gnosis'; Url = "$base/erc-8004-agent-gnosis/prod/gn" }
)

function Get-Meta($url) {
    try {
        $r = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body $query -TimeoutSec 60
        return [pscustomobject]@{
            Block = [long]$r.data._meta.block.number
            Errors = $r.data._meta.hasIndexingErrors
            SampleAgent = $r.data.agents[0].id
            Ok = $true
        }
    } catch {
        return [pscustomobject]@{ Block = 0; Errors = $true; SampleAgent = $null; Ok = $false; Error = $_.Exception.Message }
    }
}

Write-Host "ERC-8004 Goldsky sync — $(Get-Date -Format o)"
Write-Host ""
foreach ($s in $subgraphs) {
    $m = Get-Meta $s.Url
    Write-Host "=== $($s.Name) ==="
    if (-not $m.Ok) {
        Write-Host "  ERROR: $($m.Error)"
    } else {
        Write-Host "  block: $($m.Block)  errors: $($m.Errors)  sample: $($m.SampleAgent)"
    }
    Write-Host ""
}
