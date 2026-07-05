# Global Score Indexer — Subgraph ERC-8004



Subgraph de **The Graph** (AssemblyScript) que indexa registros de agentes y feedback del estándar **ERC-8004** para [Global Score Agent](https://www.globalscoreagent.com).



**Producción HUMI (ERC-8004):** subgraphs públicos de **[Agent0](https://github.com/agent0lab/subgraph)** en The Graph Network (`gateway.thegraph.com`) — no se despliega subgraph propio para import.



**Subgraphs propios del repo** (Ethos, Virtual, ERC-8183): despliegue en **Goldsky**.

**Olas Mech Marketplace:** subgraph **oficial Autonolas** (no self-host).



> Ormi 0xGraph fue retirado como proveedor (jul 2026). Ver [`docs/arquitectura-grafos-gsa.md`](docs/arquitectura-grafos-gsa.md).



## Qué indexa



| Contrato | Address | Eventos |

|----------|---------|---------|

| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `Registered` |

| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | `NewFeedback`, `ResponseAppended`, `FeedbackRevoked` |



Entidades GraphQL: `Agent`, `Feedback`, `FeedbackResponse`.



## ERC-8004 en producción — Agent0 (The Graph)



Import diario vía Supabase `graphs.*`. Subgraph IDs y mapeo: [`docs/agent0-gsa-field-mapping.md`](docs/agent0-gsa-field-mapping.md).



| Chain | Subgraph ID (The Graph) |

|-------|-------------------------|

| Ethereum | `FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k` |

| Base | `43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb` |

| BSC | `D6aWqowLkWqBgcqmpNKXuNikPkob24ADXCciiP8Hvn1K` |

| Polygon | `9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF` |

| Arbitrum | `HZ6yKjjbYpkLTXLJBxfe4HWN3jxkLfLNJXh4zeVj1t9L` |



El código en la raíz del repo (`subgraph.yaml`, `src/mapping.ts`) es **referencia** y desarrollo local; no alimenta HUMI en prod.



## Ethos Network (Goldsky)



Subgraph separado; código en [`subgraphs/ethos-network/`](subgraphs/ethos-network/). Señales de reputación Ethos en Base (no sustituye ERC-8004).



| Chain | Subgraph | Endpoint |

|-------|----------|----------|

| Base | `ethos-network-base/prod` | `https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/ethos-network-base/prod/gn` |



Deploy: `npm run deploy:ethos-base-goldsky`. Metadatos: [`networks-ethos.json`](networks-ethos.json). Import futuro: [`docs/ethos-subgraph-entities-query-data.md`](docs/ethos-subgraph-entities-query-data.md).



## Olas Mech Marketplace (Autonolas — oficial)

GSA **no despliega** subgraph Olas. Import desde el proxy público de Valory/Autonolas:

| Chain | Endpoint |
|-------|----------|
| Base | `https://api.subgraph.autonolas.tech/api/proxy/marketplace-base` |
| Gnosis | `https://api.subgraph.autonolas.tech/api/proxy/marketplace-gnosis` |

Referencia: [`subgraphs/olas-marketplace/`](subgraphs/olas-marketplace/), [`networks-olas.json`](networks-olas.json), [`docs/olas-marketplace-indexer.md`](docs/olas-marketplace-indexer.md).



## Virtual Marketplace (Goldsky)



Subgraph separado; código en [`subgraphs/virtual-marketplace/`](subgraphs/virtual-marketplace/).



| Chain | Subgraph | Endpoint |

|-------|----------|----------|

| Base | `virtual-acp-base/prod` | `https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/virtual-acp-base/prod/gn` |



ACP Core + Bonding + AgentFactory. Deploy: `npm run deploy:virtual-base-goldsky`. Metadatos: [`networks-virtual.json`](networks-virtual.json).



## ERC-8183 Agentic Commerce (Goldsky)



Subgraph separado; código en [`subgraphs/erc-8183-commerce/`](subgraphs/erc-8183-commerce/).



| Chain | Subgraph | Endpoint |

|-------|----------|----------|

| Base (UFX) | `erc-8183-commerce-base/prod` | Ver `networks-8183.json` |

| BSC (BNB APEX) | `erc-8183-commerce-bsc/prod` | `https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8183-commerce-bsc/prod/gn` |



Deploy: `npm run deploy:8183-bsc-goldsky`. Spec: [`docs/erc-8183-commerce-indexer.md`](docs/erc-8183-commerce-indexer.md).



## Quick start



```bash

npm install

npm run codegen

npm run build

```



Despliegue Goldsky (requiere `goldsky login` previo):



```powershell

# Ethos / Virtual / 8183: ver docs/operaciones.md

npm run deploy:ethos-base-goldsky

goldsky subgraph tag create ethos-network-base/1.0.1 -t prod

```



Copiar `.env.example` → `.env` y configurar `GOLDSKY_API_KEY`. Para consultas Agent0 en backend: `THE_GRAPH_API_KEY` (Supabase `graphs.graph`).



Cutover Supabase y monitor de sync: [`scripts/supabase-goldsky-cutover.sql`](scripts/supabase-goldsky-cutover.sql), [`scripts/monitor-goldsky-sync.ps1`](scripts/monitor-goldsky-sync.ps1).



## Documentación



| Documento | Audiencia |

|-----------|-----------|

| [docs/arquitectura-grafos-gsa.md](docs/arquitectura-grafos-gsa.md) | **Arquitectura completa de grafos** (Agent0, Goldsky, negocio, Supabase) |

| [docs/negocio.md](docs/negocio.md) | Producto / stakeholders |

| [docs/arquitectura.md](docs/arquitectura.md) | Detalle técnico ERC-8004 (código repo) |

| [docs/operaciones.md](docs/operaciones.md) | Runbook de deploy y mantenimiento |

| [docs/agent0-gsa-field-mapping.md](docs/agent0-gsa-field-mapping.md) | Agent0 → normalize Supabase |

| [docs/propuesta-chains-erc8004.md](docs/propuesta-chains-erc8004.md) | Roadmap de chains |

| [docs/olas-marketplace-indexer.md](docs/olas-marketplace-indexer.md) | Especificación Olas Mech Marketplace |

| [docs/virtual-marketplace-indexer.md](docs/virtual-marketplace-indexer.md) | Especificación Virtual Marketplace |

| [AGENTS.md](AGENTS.md) | Agentes de IA (Cursor, etc.) |



## Nota sobre `subgraph.yaml`



El manifest apunta a **una sola red** a la vez. Sirve para desarrollo local y referencia de mapping; **producción ERC-8004 usa Agent0**. Valores de referencia en [`networks.json`](networks.json).



**Start block:** desde ~enero 2026 (despliegue ERC-8004), no desde el genesis de la chain.

