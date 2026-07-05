# Ethos subgraph — entidades y `query_data` para import GSA

Documento de referencia para seed futuro en `graphs.entities` (edge `graph_entity_execution`).  
Subgraph Goldsky: `ethos-network-base/prod` en Base. Ver [`networks-ethos.json`](../networks-ethos.json).

**Fuera de alcance v1:** `EthosProjectVote` — no hay eventos on-chain de votos de temporada; esos datos viven en API Ethos v2.

### Errores GraphQL frecuentes (no son bugs de mapping)

| Query / campo | Error | Motivo |
|---------------|-------|--------|
| `ethosProjectVotes` | `Query` has no field `ethosProjectVotes` | Entidad **no existe** en el subgraph v1 (sin eventos on-chain en `EthosProject`). No usar en `query_data`. |
| `EthosBond.subjectProfile` | `EthosBond` has no field `subjectProfile` | `BondCreated` solo emite `authorProfileId`; no hay `subjectProfileId` en el contrato. Usar solo `authorProfile`. |

Validar queries contra prod: `node scripts/validate-ethos-queries.mjs`

---

## Orden de import sugerido

1. `ethosProfiles`
2. `ethosProfileAddresses`
3. `ethosAttestations`
4. `ethosReviews`
5. `ethosVouches`
6. `ethosSlashes`
7. `ethosReputationMarkets`
8. `ethosMarketTrades`
9. `ethosBrokerPosts`
10. `ethosProjects`
11. `ethosBonds`

---

## 1. EthosProfile

| Campo | Valor |
|-------|-------|
| `name` | `ethos_profile` |
| `root_query` | `ethosProfiles` |
| `filter_field` | `createdAt` |
| `order_by_field` | `createdAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Perfil base para linking wallet owner ↔ `profileId` |

```graphql
id
profileId
createdAt
archived
isMock
invitedByProfileId
availableInvites
addressCount
reviewCountGiven
reviewCountReceived
vouchCountGiven
vouchCountReceived
totalVouchedReceived
attestationCount
```

---

## 2. EthosProfileAddress

| Campo | Valor |
|-------|-------|
| `name` | `ethos_profile_address` |
| `root_query` | `ethosProfileAddresses` |
| `filter_field` | `claimedAt` |
| `order_by_field` | `claimedAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | **Crítico:** `address` ↔ owner ERC-8004 (`erc_8004.wallet_updates`) |

```graphql
id
address
claimedAt
status
profile {
  id
  profileId
}
```

---

## 3. EthosAttestation

| Campo | Valor |
|-------|-------|
| `name` | `ethos_attestation` |
| `root_query` | `ethosAttestations` |
| `filter_field` | `createdAt` |
| `order_by_field` | `createdAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Linking handle X (`service` + `account`) |

```graphql
id
attestationId
service
account
evidence
createdAt
archived
profile {
  id
  profileId
}
```

---

## 4. EthosReview

| Campo | Valor |
|-------|-------|
| `name` | `ethos_review` |
| `root_query` | `ethosReviews` |
| `filter_field` | `createdAt` |
| `order_by_field` | `createdAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Señal cualitativa autor → subject |

```graphql
id
reviewId
score
author
subject
attestationHash
comment
metadata
createdAt
archived
authorProfile {
  id
  profileId
}
subjectProfile {
  id
  profileId
}
```

---

## 5. EthosVouch

| Campo | Valor |
|-------|-------|
| `name` | `ethos_vouch` |
| `root_query` | `ethosVouches` |
| `filter_field` | `vouchedAt` |
| `order_by_field` | `vouchedAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Skin in the game (ETH staked) |

```graphql
id
vouchId
balance
archived
unhealthy
vouchedAt
unvouchedAt
comment
metadata
authorProfile {
  id
  profileId
}
subjectProfile {
  id
  profileId
}
```

---

## 6. EthosSlash

| Campo | Valor |
|-------|-------|
| `name` | `ethos_slash` |
| `root_query` | `ethosSlashes` |
| `filter_field` | `createdAt` |
| `order_by_field` | `createdAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Penalización on-chain sobre perfil |

```graphql
id
slashId
amount
createdAt
archived
slashType
comment
metadata
subject
attestationHash
authorProfile {
  id
  profileId
}
subjectProfile {
  id
  profileId
}
```

---

## 7. EthosReputationMarket

| Campo | Valor |
|-------|-------|
| `name` | `ethos_reputation_market` |
| `root_query` | `ethosReputationMarkets` |
| `filter_field` | `updatedAt` |
| `order_by_field` | `updatedAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Sentimiento mercado trust/distrust del owner linkable |

```graphql
id
profileId
graduated
voteTrust
voteDistrust
trustPrice
distrustPrice
liquidity
basePrice
createdAt
updatedAt
profile {
  id
  profileId
}
```

---

## 8. EthosMarketTrade

| Campo | Valor |
|-------|-------|
| `name` | `ethos_market_trade` |
| `root_query` | `ethosMarketTrades` |
| `filter_field` | `timestamp` |
| `order_by_field` | `timestamp` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Actividad compra/venta votos (sentimiento) |

```graphql
id
profileId
trader
isPositive
isBuy
amount
funds
timestamp
txHash
market {
  id
  profileId
}
```

---

## 9. EthosBrokerPost

| Campo | Valor |
|-------|-------|
| `name` | `ethos_broker_post` |
| `root_query` | `ethosBrokerPosts` |
| `filter_field` | `createdAt` |
| `order_by_field` | `createdAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Actividad comercial del owner (on-chain) |

```graphql
id
postId
authorProfileId
type
title
description
cost
tags
level
createdAt
updatedAt
txHash
authorProfile {
  id
  profileId
}
```

**Limitación:** `status`, `isArchived`, `expiresAt`, `completedAt` pueden actualizarse off-chain vía API Ethos v2 — no están en el subgraph.

---

## 10. EthosProject

| Campo | Valor |
|-------|-------|
| `name` | `ethos_project` |
| `root_query` | `ethosProjects` |
| `filter_field` | `createdAt` |
| `order_by_field` | `createdAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Proyecto ↔ perfil owner (`managerProfileIds[0]`) |

```graphql
id
projectId
userkey
status
name
description
createdAt
updatedAt
ownerProfile {
  id
  profileId
}
```

**Limitación:** `status` on-chain refleja solo `archived`/`active` por eventos `ProjectArchived`; estados de listing off-chain no están indexados.

---

## 11. EthosBond

| Campo | Valor |
|-------|-------|
| `name` | `ethos_bond` |
| `root_query` | `ethosBonds` |
| `filter_field` | `createdAt` |
| `order_by_field` | `createdAt` |
| `batch_size` | `500` |
| `edge_function` | `graph_entity_execution` |
| `notas_normalize` | Compromiso económico adicional al vouch |

```graphql
id
bondId
amount
bondType
amountType
status
createdAt
releasedAt
authorProfile {
  id
  profileId
}
```

---

## Formato `raw_json` esperado (fase import)

Array plano por batch — mismo contrato que ERC-8004:

```json
[{ "id": "1", "profileId": "1", "createdAt": "1735689600" }]
```

---

## Endpoint GraphQL

```text
https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/ethos-network-base/prod/gn
```

Smoke test (cuando sync ≥ 100%):

```graphql
{
  ethosProfiles(first: 1, orderBy: createdAt, orderDirection: asc) {
    id profileId createdAt archived
  }
}
```
