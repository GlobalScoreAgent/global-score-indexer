# Virtual Marketplace subgraph

Subgraph independiente del ERC-8004 y Olas. Indexa ACP Core, Bonding y AgentFactory en Base.

| Chain | Manifest | Deploy Ormi | dataSources |
|-------|----------|-------------|-------------|
| Base | `subgraph.base.yaml` | `virtual-acp-base` | 3 |

Direcciones y `startBlock`: [`networks-virtual.json`](../../networks-virtual.json).  
Especificación: [`docs/virtual-marketplace-indexer.md`](../../docs/virtual-marketplace-indexer.md).

## Build y deploy (desde raíz del repo)

```powershell
npm run codegen:virtual-base
npm run build:virtual-base
npm run deploy:virtual-base
```

Requiere `ORMI_DEPLOY_KEY` en `.env`. Ver [`docs/operaciones.md`](../../docs/operaciones.md).

## Verificación post-deploy

```graphql
{ _meta { block { number } hasIndexingErrors } }
{ virtualAcpJobs(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
    id jobId client provider hook chainId
  }
}
{ virtualAcpJobStatuses(first: 5, where: { statusType: "completed" }) {
    jobId statusType actor
  }
}
{ virtualAgentGraduations(first: 5) { id token agentToken } }
{ virtualBondLaunches(first: 5) { id token pair launchIndex } }
```

## Monitoreo por agente (provider)

Jobs completados por proveedor ACP: cruzar `VirtualAcpJob.provider` con `VirtualAcpJobStatus` donde `statusType = "completed"`. Agregaciones en Supabase, no en el subgraph.
