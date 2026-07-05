# Operaciones — Deploy y mantenimiento

Runbook para desarrolladores que despliegan o mantienen subgraphs en **Goldsky** y configuran import **Agent0** en Supabase.

> **Ormi 0xGraph retirado (jul 2026).** No usar `graph deploy` a `subgraph.api.ormilabs.com` en operación normal. Scripts legacy en `package.json` solo para rollback de emergencia.

---

## Prerrequisitos

- Node.js 18+
- Graph CLI: `npm install -g @graphprotocol/graph-cli`
- Goldsky CLI: `npm install -g @goldskycom/cli`
- API key en [Goldsky Project Settings](https://app.goldsky.com)
- API key The Graph (backend Supabase `graphs.graph` — consultas Agent0)
- Copiar `.env.example` → `.env` con `GOLDSKY_API_KEY`

---

## Comandos locales

```bash
npm install
npm run codegen    # Genera types en generated/
npm run build      # Compila WASM → build/
npm test           # Tests Matchstick (opcional)
```

---

## ERC-8004 — Agent0 (producción HUMI)

**No hay deploy desde este repo** para import prod. GSA consume subgraphs públicos de Agent0 en The Graph Network.

| Chain | Subgraph ID | Pipeline Supabase |
|-------|-------------|-------------------|
| Ethereum | `FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k` | `graphs.*` → `normalize_batch_*_erc` |
| Base | `43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb` | idem |
| BSC | `D6aWqowLkWqBgcqmpNKXuNikPkob24ADXCciiP8Hvn1K` | idem |
| Polygon | `9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF` | idem |
| Arbitrum | `HZ6yKjjbYpkLTXLJBxfe4HWN3jxkLfLNJXh4zeVj1t9L` | idem |

Endpoint: `https://gateway.thegraph.com/api/<THE_GRAPH_API_KEY>/subgraphs/id/<SUBGRAPH_ID>`

Configuración en BD: `graphs.subgraph.url`, `graphs.entities.query_data`. Detalle: [`agent0-gsa-field-mapping.md`](agent0-gsa-field-mapping.md), [`arquitectura-grafos-gsa.md`](arquitectura-grafos-gsa.md).

**Código local (referencia):** `subgraph.yaml` + `networks.json` (startBlock por chain). `npm run codegen && npm run build` para validar mapping; Docker Compose para pruebas locales.

**Chains sin Agent0** (Gnosis, Optimism, X Layer, Celo): fuera de import prod desde retirada de Ormi.

---

## Goldsky — proyecto Global Score Agent

Proyecto: `project_cmma0eekxnc4e01vt9klkbya9`. Patrón de endpoint:

```text
https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/<nombre>/prod/gn
```

### Subgraphs en Goldsky (jun 2026)

| Subgraph | Chain slug | Manifest / path | npm deploy | startBlock |
|----------|------------|-----------------|------------|------------|
| `ethos-network-base` | `base` | `subgraphs/ethos-network/build` | `deploy:ethos-base-goldsky` | ver `networks-ethos.json` |
| `virtual-acp-base` | `base` | `subgraphs/virtual-marketplace/build` | `deploy:virtual-base-goldsky` | `44427015` |
| `erc-8183-commerce-bsc` | `bsc` | `subgraphs/erc-8183-commerce/build` | `deploy:8183-bsc-goldsky` | `102000000` |

**Eliminado jun 2026:** `erc-8004-agent-xlayer` (liberar cuota; código en repo para redeploy en otra cuenta).

### X Layer — eliminado de Goldsky (jun 2026)

X Layer ERC-8004 se eliminó de Goldsky para sustituir operativamente por Ethos Network. El código del subgraph raíz (`subgraph.yaml`, `deploy:xlayer-goldsky`) se conserva para redeploy en otra cuenta Goldsky.

```powershell
goldsky subgraph tag delete erc-8004-agent-xlayer/1.0.0 -t prod --force
goldsky subgraph delete erc-8004-agent-xlayer/1.0.0 --force
goldsky subgraph list   # confirmar ausencia
```

### Ethos Network — Base (jun 2026)

| Campo | Valor |
|-------|-------|
| Deploy | `ethos-network-base/1.0.1` |
| Tag estable | `prod` |
| Manifest | `subgraphs/ethos-network/subgraph.base.yaml` |
| Endpoint GraphQL | `https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/ethos-network-base/prod/gn` |
| Metadatos | [`networks-ethos.json`](../networks-ethos.json) |
| Entidades / `query_data` | [`ethos-subgraph-entities-query-data.md`](ethos-subgraph-entities-query-data.md) |

```powershell
npm run codegen:ethos-base
npm run build:ethos-base
goldsky login --token $env:GOLDSKY_API_KEY
npm run deploy:ethos-base-goldsky
goldsky subgraph tag create ethos-network-base/1.0.1 -t prod
```

**Checklist común Goldsky:**

1. `goldsky login --token $env:GOLDSKY_API_KEY`
2. `codegen` + `build` del producto
3. `npm run deploy:*-goldsky`
4. `goldsky subgraph tag create <name>/1.0.0 -t prod` (una vez)
5. Monitorizar sync: `goldsky subgraph list`
6. Cutover backend: [`scripts/supabase-goldsky-cutover.sql`](../scripts/supabase-goldsky-cutover.sql)
7. Tras cutover: confirmar imports en GSA; **Ormi retirado** — no mantener deploys legacy

### Celo — eliminado de Goldsky (jun 2026)

Celo se eliminó de Goldsky **antes** de migrar los 3 subgraphs (liberar almacenamiento). Para redeploy:

| Campo | Valor |
|-------|-------|
| `network` en subgraph.yaml | `celo` |
| Deploy | `erc-8004-agent-celo/1.0.0` |
| startBlock | `58396724` |

```powershell
goldsky subgraph tag delete erc-8004-agent-celo/1.0.0 -t prod --force  # si existe tag
goldsky subgraph delete erc-8004-agent-celo/1.0.0 --force
```

---

## Celo en Goldsky (histórico / redeploy)

| Campo | Valor |
|-------|-------|
| `network` en subgraph.yaml | `celo` |
| Deploy Goldsky | `erc-8004-agent-celo/1.0.0` |
| Tag estable | `prod` |
| startBlock | `58396724` |
| Endpoint GraphQL | `https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8004-agent-celo/prod/gn` |

**Motivo histórico:** Celo no estaba soportada en Ormi (`no network celo found`). Subgraph eliminado de Goldsky jun 2026; fuera de import prod.

### Checklist: deploy Celo en Goldsky

1. Instalar CLI: `npm install -g @goldskycom/cli`
2. Autenticar: `goldsky login --token $env:GOLDSKY_API_KEY` (PowerShell; key en `.env`)
3. Editar `subgraph.yaml` → `network: celo`, `startBlock: 58396724` en ambos dataSources
4. `npm run codegen && npm run build`
5. `goldsky subgraph deploy erc-8004-agent-celo/1.0.0 --path .`
6. Tag estable (una vez): `goldsky subgraph tag create erc-8004-agent-celo/1.0.0 -t prod`
7. Verificar sync en [Goldsky dashboard](https://app.goldsky.com) y queries GraphQL
8. Registrar endpoint en backend GSA

**Windows:** `npm run deploy:celo-goldsky` asume `goldsky login` previo (no usar `%GOLDSKY_API_KEY%` en npm scripts).

**Tras redeploy Celo (si aplica):** `subgraph.yaml` queda en `celo`. Restaurar `network`/`startBlock` antes de otra prueba local.

---

## Ormi — retirado (histórico)

Ormi 0xGraph fue proveedor de mar–jun 2026. Tras migración completa a **Agent0** (ERC-8004) y **Goldsky** (subgraphs propios), **no se usa** en operación normal.

Los scripts `npm run deploy:*` que apuntan a `subgraph.api.ormilabs.com` en `package.json` se conservan solo como referencia de emergencia. No ejecutar salvo rollback explícito aprobado por el equipo.

---

## Olas Mech Marketplace

**Import prod:** subgraph **oficial Autonolas** — GSA no despliega ni mantiene sync de Olas.

| Chain | Endpoint GraphQL |
|-------|------------------|
| Base | `https://api.subgraph.autonolas.tech/api/proxy/marketplace-base` |
| Gnosis | `https://api.subgraph.autonolas.tech/api/proxy/marketplace-gnosis` |

Metadatos de contratos y start blocks: [`networks-olas.json`](../networks-olas.json). Spec de entidades y queries GSA: [`olas-marketplace-indexer.md`](olas-marketplace-indexer.md).

El código en [`subgraphs/olas-marketplace/`](../subgraphs/olas-marketplace/) es **referencia** (schema, ABIs, `query_data`); el subgraph en producción lo opera Valory/Autonolas.

### Checklist: verificar import Olas

1. Confirmar URL en Supabase (`graphs.subgraph.url` o config edges Olas).
2. Query `_meta { block { number } hasIndexingErrors }` contra el proxy Autonolas.
3. Ejecutar queries de verificación (abajo) y comparar con entidades esperadas en spec.
4. Si el schema Autonolas cambia upstream, actualizar `query_data` / adaptador en Supabase — **no** redeploy en Goldsky/Ormi.

**Nota histórica:** existió un deploy propio en Ormi (`olas-mech-base`, `olas-mech-gnosis`) — retirado; prod = Autonolas oficial.

**Firmas de eventos (ABI 0.8.30):** `MarketplaceRequest` incluye `bytes[] requestDatas`; `MarketplaceDelivery` tiene `requesters` sin `indexed`; **`Deliver`** tiene **5** parámetros de datos (`bytes32 requestId`, `uint256 deliveryRate`, `bytes data`) — no dos campos `bytes`; ver [`docs/olas-marketplace-indexer.md`](olas-marketplace-indexer.md) §4.6; `RequesterCreditsRedeemed` en NVM solo tiene `account` + `amount`. Gnosis no tiene BalanceTracker USDC ni NVM USDC.

### Queries de verificación

```graphql
{ _meta { block { number } hasIndexingErrors } }
{ olasMeches(first: 5) { id mech serviceId chainId } }
{ olasMarketplaceRequests(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
    id requester priorityMech
  }
}
{ olasKarmaChanges(first: 3) { mech karmaChange changeType } }
```

Filtros `paymentType` por chain: Base `usdc` / `native` / `olas` / `nvm` / `nvm_usdc`; Gnosis `native` / `olas` / `nvm` (sin USDC).

IDs usan prefijo de red (`base-`, `gnosis-`). La entidad `OlasMech` se consulta como `olasMeches` (pluralización Graph).

---

## Virtual Marketplace

Subgraph independiente del ERC-8004 y Olas. Código en [`subgraphs/virtual-marketplace/`](../subgraphs/virtual-marketplace/). Metadatos en [`networks-virtual.json`](../networks-virtual.json).

| Chain | Manifest | Deploy Goldsky | startBlock | dataSources |
|-------|----------|----------------|------------|-------------|
| Base | `subgraph.base.yaml` | `virtual-acp-base/prod` | `44427015` (todos) | 3 |

Bonding y AgentFactory usan `startBlock` alineado con ACP (`acp_aligned`); no indexan historial previo a abr 2026.

### Scripts npm (desde raíz del repo)

| Script | Acción |
|--------|--------|
| `npm run codegen:virtual-base` | Generar types (`-o subgraphs/virtual-marketplace/generated`) |
| `npm run build:virtual-base` | Compilar WASM |
| `npm run deploy:virtual-base-goldsky` | Deploy Goldsky |

### Endpoint GraphQL

| Chain | Proveedor | Endpoint |
|-------|-----------|----------|
| Base | **Goldsky** | `https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/virtual-acp-base/prod/gn` |

### Checklist: deploy / redeploy Virtual

1. Valores en `networks-virtual.json` y `subgraph.base.yaml`
2. `npm run codegen:virtual-base` y `npm run build:virtual-base`
3. `npm run deploy:virtual-base-goldsky`
4. `goldsky subgraph tag create virtual-acp-base/1.0.0 -t prod` (si primer deploy)
5. Verificar sync y queries GraphQL

### Queries de verificación

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

IDs usan prefijo `base-`. Jobs completados por agente: cruzar `virtualAcpJobs.provider` con `virtualAcpJobStatuses` (`statusType: "completed"`).

---

## ERC-8183 Agentic Commerce

Subgraph independiente para kernels `AgenticCommerce` (estándar ERC-8183). Código en [`subgraphs/erc-8183-commerce/`](../subgraphs/erc-8183-commerce/). Metadatos en [`networks-8183.json`](../networks-8183.json). Spec: [`docs/erc-8183-commerce-indexer.md`](erc-8183-commerce-indexer.md).

| Chain | Manifest | Deploy Goldsky | startBlock | dataSources |
|-------|----------|----------------|------------|-------------|
| Base | `subgraph.base.yaml` | `erc-8183-commerce-base/prod` | `46471674` | 1 (UFX) |
| BSC | `subgraph.bsc.yaml` | `erc-8183-commerce-bsc/prod` | `102000000` | 1 (BNB APEX) |

Virtual ACP en Base (`0x238E…832E0`) **no** está en este subgraph; usar `virtual-acp-base`.

### Scripts npm

| Script | Acción |
|--------|--------|
| `npm run codegen:8183-base` / `codegen:8183-bsc` | Generar types |
| `npm run build:8183-base` / `build:8183-bsc` | Compilar WASM |
| `npm run deploy:8183-bsc-goldsky` | Deploy BSC en Goldsky |

### Endpoints GraphQL

| Chain | Proveedor | Endpoint |
|-------|-----------|----------|
| Base | **Goldsky** | Actualizar en `networks-8183.json` tras deploy |
| BSC | **Goldsky** | `https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8183-commerce-bsc/prod/gn` |

### Queries de verificación

```graphql
{ _meta { block { number } hasIndexingErrors } }
{ erc8183Jobs(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
    id jobId contractAddress implementation client provider
  }
}
{ erc8183JobStatuses(first: 5, where: { statusType: "completed" }) {
    jobId reason statusType
  }
}
```

IDs incluyen dirección de contrato: `base-0x1b32…-1`. BSC sync inicial puede tardar (alto volumen).

---

## Criterio de start block

El start block **no** es el bloque exacto de deploy del contrato ni el genesis de la chain. Se usa un bloque de **~enero 2026** (cuando ERC-8004 se desplegó en la red) para:

- Evitar escanear millones de bloques vacíos
- Garantizar captura de todos los eventos (start block anterior al primer `Registered`)

---

## Errores comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| `gasUsed` null en Feedback | Falta `receipt: true` en NewFeedback | Ya configurado en subgraph.yaml |
| Agentes sin metadatos | URI no es base64 JSON válido | `hasServiceIndexingError = true` (esperado) |
| Deploy en chain incorrecta | No se cambió `network` | Revisar manifest antes de deploy Goldsky |
| Datos faltantes | startBlock posterior al primer evento | Bajar startBlock a ~enero 2026 o bloque de deploy |
| IDs inconsistentes | Formato distinto entre entidades | Usar `{network}-{agentId}` y variantes documentadas |

---

## Desarrollo local (opcional)

```bash
docker compose up -d   # graph-node + ipfs + postgres
npm run deploy-local
```

Ver [`docker-compose.yml`](../docker-compose.yml).

---

## Cutover backend (Supabase)

Los endpoints viven en BD, no en migraciones. Script listo: [`scripts/supabase-goldsky-cutover.sql`](../scripts/supabase-goldsky-cutover.sql).

**Antes de ejecutar:** cada subgraph Goldsky debe estar al 100% de sync (`_meta.block.number` ≈ chain head, sin `hasIndexingErrors`).

| Subgraph | Tabla / campo | chainId / clave |
|----------|---------------|-----------------|
| `erc-8004-agent-xlayer` | `erc_8004.chains.graphql_endpoint` | `196` |
| Celo (eliminado) | `erc_8004.chains.graphql_endpoint` → `NULL` | `42220` |
| `virtual-acp-base` | `graphs.subgraph.url` | graph Virtual (cuando seedeado) |
| `erc-8183-commerce-bsc` | `graphs.subgraph.url` | graph ERC-8183 BSC (cuando seedeado) |

Endpoints Goldsky públicos (sin API key en URL).

```powershell
cd ..\BD_Supabase\gsa-supabase-schema
supabase db query --linked -f ..\..\Desarrollo_Cursor\indexer\scripts\supabase-goldsky-cutover.sql
```

---

## Estado operativo (jul 2026)

| Área | Proveedor |
|------|-----------|
| ERC-8004 import HUMI | **Agent0** (The Graph) |
| Olas Base / Gnosis | **Autonolas** (subgraph oficial) |
| Ethos, Virtual, ERC-8183 | **Goldsky** |
| Ormi | **Retirado** |

## Referencias

- [Ormi CLI deploy docs](https://ormilabs.com/docs/subgraphs/deploy-a-subgraph/deploy-subgraphs-via-cli)
- [Goldsky subgraph deploy](https://docs.goldsky.com/subgraphs/guides/subgraph-deploy)
- [Goldsky GraphQL endpoints](https://docs.goldsky.com/subgraphs/graphql-endpoints)
- [ERC-8004 contracts](https://github.com/erc-8004/erc-8004-contracts)
