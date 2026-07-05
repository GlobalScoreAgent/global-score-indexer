# Ethos Network subgraph (Base)

Subgraph de señales on-chain de [Ethos Network](https://www.ethos.network) en **Base Mainnet**. Desplegado en **Goldsky** como `ethos-network-base/prod`.

## Entidades (11)

| Entidad | Contrato fuente |
|---------|-----------------|
| `EthosProfile`, `EthosProfileAddress` | EthosProfile |
| `EthosReview` | EthosReview |
| `EthosVouch` | EthosVouch |
| `EthosAttestation` | EthosAttestation |
| `EthosSlash` | EthosSlash |
| `EthosReputationMarket`, `EthosMarketTrade` | ReputationMarket |
| `EthosBrokerPost` | EthosBroker |
| `EthosProject` | EthosProject |
| `EthosBond` | EthosBond |

**No incluido v1:** `EthosProjectVote` (votos de temporada off-chain / sin eventos dedicados on-chain).

Metadatos de red, contratos y `startBlock` por datasource: [`networks-ethos.json`](../../networks-ethos.json).

## Build y deploy

```bash
npm run codegen:ethos-base
npm run build:ethos-base
goldsky login --token $env:GOLDSKY_API_KEY
npm run deploy:ethos-base-goldsky
goldsky subgraph tag create ethos-network-base/1.0.0 -t prod   # una vez
```

Endpoint prod:

```text
https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/ethos-network-base/prod/gn
```

## Limitaciones híbridas on-chain/off-chain

- **EthosBroker** y **EthosProject:** creación on-chain; campos como `status` COMPLETED, `isArchived` o votos de temporada pueden actualizarse vía API Ethos v2 y no aparecen en el subgraph.
- **Credibility Score** off-chain: no indexado (por diseño).

Import futuro en GSA: [`docs/ethos-subgraph-entities-query-data.md`](../../docs/ethos-subgraph-entities-query-data.md).
