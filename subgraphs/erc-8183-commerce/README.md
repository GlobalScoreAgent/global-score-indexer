# ERC-8183 Agentic Commerce subgraph

Indexa kernels `AgenticCommerce` (estándar ERC-8183) para señales HUMI de comercio entre agentes.

| Chain | Manifest | Ormi deploy | Implementación |
|-------|----------|-------------|----------------|
| Base | `subgraph.base.yaml` | `erc-8183-commerce-base` | UFX `AgenticCommerceHooked` |
| BSC | `subgraph.bsc.yaml` | `erc-8183-commerce-bsc` | BNB Agent SDK APEX |

**Nota:** Virtual ACP (`virtual-acp-base`) indexa por separado el despliegue Virtual en Base. Ver [`docs/erc-8183-commerce-indexer.md`](../../docs/erc-8183-commerce-indexer.md).

## Build

```bash
npm run codegen:8183-base && npm run build:8183-base
npm run codegen:8183-bsc && npm run build:8183-bsc
```

## Deploy

```bash
npm run deploy:8183-base
npm run deploy:8183-bsc
```

Requiere `ORMI_DEPLOY_KEY` en el entorno.
