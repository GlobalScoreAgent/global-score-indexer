# Compare Ormi vs Goldsky block height for migrated subgraphs.
# Usage: .\scripts\monitor-goldsky-sync.ps1

$ErrorActionPreference = 'Stop'
$query = '{"query":"{ _meta { block { number } hasIndexingErrors } }"}'

$pairs = @(
    @{
        Name = 'xlayer'
        Goldsky = 'https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8004-agent-xlayer/prod/gn'
        Ormi = 'https://subgraph.api.ormilabs.com/api/public/f46db6cd-eefe-4019-b10d-f48b2f2a9ee6/subgraphs/erc-8004-agent-xlayer/v1.0.0/gn'
    },
    @{
        Name = '8183-bsc'
        Goldsky = 'https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8183-commerce-bsc/prod/gn'
        Ormi = 'https://subgraph.api.ormilabs.com/api/public/f46db6cd-eefe-4019-b10d-f48b2f2a9ee6/subgraphs/erc-8183-commerce-bsc/v1.0.0/gn'
    },
    @{
        Name = 'virtual-base'
        Goldsky = 'https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/virtual-acp-base/prod/gn'
        Ormi = 'https://subgraph.api.ormilabs.com/api/public/f46db6cd-eefe-4019-b10d-f48b2f2a9ee6/subgraphs/virtual-acp-base/v1.0.0/gn'
    }
)

function Get-MetaBlock($url) {
    $r = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body $query -TimeoutSec 60
    return [pscustomobject]@{
        Block = [long]$r.data._meta.block.number
        Errors = $r.data._meta.hasIndexingErrors
    }
}

Write-Host "Goldsky vs Ormi sync check - $(Get-Date -Format o)"
Write-Host ""
foreach ($p in $pairs) {
    $g = Get-MetaBlock $p.Goldsky
    $o = Get-MetaBlock $p.Ormi
    $delta = $o.Block - $g.Block
    $pct = if ($o.Block -gt 0) { [math]::Round(100.0 * $g.Block / $o.Block, 2) } else { 0 }
    Write-Host "=== $($p.Name) ==="
    Write-Host "  Goldsky: $($g.Block) (errors=$($g.Errors))"
    Write-Host "  Ormi:    $($o.Block) (errors=$($o.Errors))"
    Write-Host "  Delta:   $delta blocks (~$pct% of Ormi height)"
    Write-Host ""
}
