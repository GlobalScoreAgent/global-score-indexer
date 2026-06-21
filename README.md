# Global Score Indexer — Subgraph ERC-8004

Subgraph de **The Graph** (AssemblyScript) que indexa registros de agentes y feedback del estándar **ERC-8004** para [Global Score Agent](https://www.globalscoreagent.com). Se despliega en **Ormi 0xGraph**, un subgraph por chain.

## Qué indexa

| Contrato | Address | Eventos |
|----------|---------|---------|
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `Registered` |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | `NewFeedback`, `ResponseAppended`, `FeedbackRevoked` |

Entidades GraphQL: `Agent`, `Feedback`, `FeedbackResponse`.

## Chains en producción (Ormi)

| Chain | Subgraph Ormi |
|-------|---------------|
| Ethereum | `erc-8004-agent-eth` |
| Base | `erc-8004-agent-base` |
| BSC | `erc-8004-agent-bsc` |
| Polygon | `erc-8004-agent-poly` |
| Arbitrum | `erc-8004-agent-arbitrum` |

## Roadmap

4 chains planificadas: **X Layer → Celo → Gnosis → Optimism**. Ver [docs/propuesta-chains-erc8004.md](docs/propuesta-chains-erc8004.md).

## Quick start

```bash
npm install
npm run codegen
npm run build
```

Despliegue a Ormi (requiere API key en `.env`):

```bash
# Editar subgraph.yaml: network + startBlock para la chain objetivo
graph deploy erc-8004-agent-<chain> \
  --node https://subgraph.api.ormilabs.com/deploy \
  --ipfs https://subgraph.api.ormilabs.com/ipfs \
  --deploy-key %ORMI_DEPLOY_KEY%
```

Copiar `.env.example` → `.env` y configurar `ORMI_DEPLOY_KEY`.

## Documentación

| Documento | Audiencia |
|-----------|-----------|
| [docs/negocio.md](docs/negocio.md) | Producto / stakeholders |
| [docs/arquitectura.md](docs/arquitectura.md) | Arquitectura técnica |
| [docs/operaciones.md](docs/operaciones.md) | Runbook de deploy y mantenimiento |
| [docs/propuesta-chains-erc8004.md](docs/propuesta-chains-erc8004.md) | Roadmap de chains |
| [AGENTS.md](AGENTS.md) | Agentes de IA (Cursor, etc.) |

## Nota sobre `subgraph.yaml`

El manifest apunta a **una sola red** a la vez. Antes de cada deploy, actualizar `network` y `startBlock` en ambos dataSources. Valores de referencia en [`networks.json`](networks.json) y [docs/operaciones.md](docs/operaciones.md).

**Start block:** desde ~enero 2026 (despliegue ERC-8004), no desde el genesis de la chain.
