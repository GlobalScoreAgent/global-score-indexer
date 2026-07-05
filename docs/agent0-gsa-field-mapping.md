# Mapeo ERC-8004: Agent0 (The Graph) → normalize GSA

Documento técnico del **adaptador** en el pipeline `graphs.*` de Supabase. Describe qué objetos espera `graphs.normalize_batch_*_erc` y cómo transformar las respuestas GraphQL de los **subgraphs públicos de Agent0** (fuente de import en producción) al shape canónico de `erc_8004.*`.

**Alcance:** 5 chains de producción — Ethereum, Base, BSC, Polygon, Arbitrum — import diario vía `gateway.thegraph.com`. Ormi retirado (jul 2026).

**Referencia de arquitectura:** [`arquitectura-grafos-gsa.md`](arquitectura-grafos-gsa.md) §3.1 y §8.1.

**Fuentes de verdad en código:**

| Componente | Ruta |
|----------|------|
| Schema subgraph GSA | [`schema.graphql`](../schema.graphql) |
| Mapping GSA | [`src/mapping.ts`](../src/mapping.ts) |
| Manifest / contratos | [`subgraph.yaml`](../subgraph.yaml), [`networks.json`](../networks.json) |
| Schema Agent0 | [agent0lab/subgraph `schema.graphql`](https://github.com/agent0lab/subgraph/blob/main/schema.graphql) |
| Normalize agents | `erc_8004.execution_agents_normalize_single_batch` |
| Normalize feedbacks | `erc_8004.execution_feedbacks_normalize_single_batch` |
| Normalize responses | `erc_8004.execution_feedback_responses_normalize_single_batch` |

---

## 1. Pipeline (contrato entre capas)

```text
GraphQL Agent0 (The Graph Network)
  → edge graph_entity_execution (paginación + checkpoint)
  → staging: import_entities_results (raw_json)
  → normalize batch: graphs.normalize_batch_*_erc
  → erc_8004.agents | registration_feedbacks | registration_feedback_responses
  → URI processors → agent_manifest → index_humi
```

**Regla crítica:** normalize traduce el schema Agent0 al shape canónico de `erc_8004.*` (`p_agent_json ->> 'agentURIRaw'`, etc.). El pipeline legacy Ormi (`execution_*_normalize_*`) está **retirado**.

**Batch sizes actuales (workers SQL):** agents ~500, feedbacks ~600, feedback responses ~500 por llamada edge.

---

## 2. Cinco chains — identificadores

### 2.1 Tabla de redes

| Prod GSA | `dataSource.network()` (GSA subgraph) | Chain ID | Agent0 Subgraph ID | Gateway URL |
|----------|--------------------------------------|----------|-------------------|-------------|
| Ethereum | `mainnet` | `1` | `FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k` | `https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k` |
| Base | `base` | `8453` | `43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb` | `.../43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb` |
| BSC | `bsc` | `56` | `D6aWqowLkWqBgcqmpNKXuNikPkob24ADXCciiP8Hvn1K` | `.../D6aWqowLkWqBgcqmpNKXuNikPkob24ADXCciiP8Hvn1K` |
| Polygon | `matic` | `137` | `9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF` | `.../9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF` |
| Arbitrum | `arbitrum-one` | `42161` | `HZ6yKjjbYpkLTXLJBxfe4HWN3jxkLfLNJXh4zeVj1t9L` | `.../HZ6yKjjbYpkLTXLJBxfe4HWN3jxkLfLNJXh4zeVj1t9L` |

### 2.2 Contratos ERC-8004 (idénticos en las 5 chains)

| Rol | Address |
|-----|---------|
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

### 2.3 Función de slug GSA (`network-agentId`)

El subgraph GSA forma IDs con el **network name de graph-node**, no el chain ID numérico:

```typescript
// Pseudocódigo adaptador
const NETWORK_BY_CHAIN_ID: Record<number, string> = {
  1: "mainnet",
  8453: "base",
  56: "bsc",
  137: "matic",
  42161: "arbitrum-one",
};

function gsaAgentId(chainId: number, agentId: string | number): string {
  return `${NETWORK_BY_CHAIN_ID[chainId]}-${agentId}`;
}
```

**Ejemplo:** Agent0 `id = "8453:42"` → JSON normalize `id = "base-42"`.

---

## 3. Eventos on-chain → entidades

Ambos indexadores (GSA y Agent0) escuchan los mismos eventos del estándar ERC-8004.

### 3.1 Identity Registry (`0x8004A169…`)

| Evento Solidity | Handler GSA | Entidad |
|-----------------|-------------|---------|
| `Registered(indexed uint256 agentId, string agentURI, indexed address owner)` | `handleRegistered` | `Agent` |

### 3.2 Reputation Registry (`0x8004BAa1…`)

| Evento Solidity | Handler GSA | Entidad |
|-----------------|-------------|---------|
| `NewFeedback(...)` (11 args + `receipt: true` en GSA) | `handleNewFeedback` | `Feedback` |
| `ResponseAppended(...)` | `handleResponseAppended` | `FeedbackResponse` |
| `FeedbackRevoked(...)` | `handleFeedbackRevoked` | actualiza `Feedback.isRevoked` |

**Diferencia de indexación:**

| Capacidad | GSA subgraph | Agent0 subgraph |
|-----------|--------------|-----------------|
| Decodifica `data:application/json;base64` en `agentURI` al registrar | Sí (inline en `handleRegistered`) | No; resuelve IPFS/HTTPS vía `AgentRegistrationFile` |
| Campos `gasUsed`, `gasPrice`, `txFrom`, `txNonce`, `blockNumber`, `logIndex` en Feedback | Sí (desde tx/receipt) | **No expuestos** en schema Agent0 |
| Validaciones ERC-8004 | No indexado en GSA | `Validation` (ignorar en adaptador v1) |

---

## 4. Entidad `Agent`

### 4.1 Schema GraphQL GSA (subgraph actual)

Ver [`schema.graphql`](../schema.graphql) — campos principales:

| Campo subgraph | Tipo | Origen GSA mapping |
|----------------|------|-------------------|
| `id` | `ID!` | `{network}-{agentId}` |
| `agentId` | `BigInt!` | event `agentId` |
| `owner` | `Bytes!` | event `owner` |
| `agentURIRaw` | `String` | event `agentURI` (texto tal cual) |
| `agentURIJson` | `String` | hex del JSON decodificado si URI es `data:...;base64,...` |
| `registrationJsonRaw` | `String` | mismo hex si base64 inline |
| `name`, `description`, `imageUrl` | `String` | parseados del JSON inline |
| `active` | `Boolean!` | JSON o default `true` |
| `chainId` | `String!` | `dataSource.network()` |
| `agentWallet` | `Bytes!` | inicialmente = `owner` |
| `createdAt`, `updatedAt`, `lastActivityAt` | `BigInt!` | block timestamp en register |
| `supportedTrust`, `tags`, `oasf_skills`, `oasf_domains` | arrays | JSON inline |
| Servicios (`mcp`, `a2a`, `oasf`, flags `has*`) | varios | JSON inline (parcial en MVP) |

### 4.2 Schema GraphQL Agent0

| Campo Agent0 | Notas |
|--------------|-------|
| `id` | `"chainId:agentId"` p.ej. `"8453:42"` |
| `chainId` | `BigInt` |
| `agentId` | `BigInt` |
| `agentURI` | string on-chain (ipfs/https/data URI) |
| `owner`, `agentWallet` | `Bytes` |
| `createdAt`, `updatedAt` | timestamps |
| `registrationFile` | relación → metadata IPFS/HTTPS resuelta |

`AgentRegistrationFile` (join recomendado en query):

| Campo | Mapeo a JSON GSA |
|-------|------------------|
| `name` | `name` |
| `description` | `description` |
| `image` | `imageUrl` |
| `active` | `active` |
| `mcpEndpoint`, `a2aEndpoint`, `webEndpoint`, `oasfEndpoint` | incluir en `registration_json` completo |

### 4.3 JSON requerido por `execution_agents_normalize_single_batch`

Campos **leídos explícitamente** por normalize (resto se guarda en `registration_json`):

| Clave JSON | Obligatorio | Uso normalize |
|------------|-------------|---------------|
| `id` | **Sí** | `on_chain_agent_id`, `canonical_slug` (= `lower(id)`) |
| `owner` | **Sí** | `agent_profiles.owner`, `wallet_updates` |
| `agentURIRaw` | Recomendado | `agents.agent_uri_raw`, dispara `is_uri_processed=false` si cambia |
| `name` | No (default `Unnamed Agent`) | `agent_profiles.name` |
| `description` | No | `agent_profiles.description` |
| `imageUrl` | No | `agent_profiles.image` |
| `active` | No (default true) | `agents.is_active` |
| `createdAt` | No | `on_chain_created_at` |
| `updatedAt` | No | `on_chain_updated_at`, `source_updated_at` |
| `agentWallet` | No | `wallet_updates` tipo `registration` |

### 4.4 Adaptador Agent → JSON GSA

```typescript
function adaptAgent0Agent(
  agent: Agent0Agent,
  reg?: Agent0RegistrationFile | null,
  network: string
): GsaAgentJson {
  const agentId = agent.agentId.toString();
  return {
    id: `${network}-${agentId}`,
    agentId,
    owner: agent.owner, // hex address
    agentURIRaw: agent.agentURI ?? null,
    name: reg?.name ?? null,
    description: reg?.description ?? null,
    imageUrl: reg?.image ?? null,
    active: reg?.active ?? true,
    chainId: network,
    agentWallet: agent.agentWallet ?? agent.owner,
    createdAt: agent.createdAt.toString(),
    updatedAt: agent.updatedAt.toString(),
    lastActivityAt: agent.updatedAt.toString(),
    // Conservar payload Agent0 completo para trazabilidad:
    registrationJsonRaw: null,
    agentURIJson: null,
    // ...copiar campos extra de reg en el objeto si se desea
  };
}
```

### 4.5 Query GraphQL Agent0 sugerida

```graphql
query AgentsPage($first: Int!, $skip: Int!, $updatedAfter: BigInt) {
  agents(
    first: $first
    skip: $skip
    orderBy: updatedAt
    orderDirection: asc
    where: { updatedAt_gt: $updatedAfter }
  ) {
    id
    chainId
    agentId
    agentURI
    owner
    agentWallet
    createdAt
    updatedAt
    registrationFile {
      name
      description
      image
      active
      x402Support
      mcpEndpoint
      a2aEndpoint
      webEndpoint
      oasfSkills
      oasfDomains
    }
  }
}
```

**Sync incremental:** filtrar por `updatedAt_gt` watermark persistido en `erc_8004.chains` o `chain_entities`.

---

## 5. Entidad `Feedback`

### 5.1 Schema GraphQL GSA

| Campo subgraph | Tipo | Origen GSA mapping |
|----------------|------|-------------------|
| `id` | `ID!` | `{network}-{agentId}-{clientAddress}-{feedbackIndex}` |
| `agent` | `String!` | `{network}-{agentId}` (FK lógica) |
| `chainId` | `String!` | network name |
| `clientAddress` | `Bytes!` | event |
| `value` | `BigInt!` | event `value` (int128) |
| `feedbackIndex` | `BigInt!` | event |
| `feedbackURI` / `feedbackURIRaw` | `String` | **UTF-8 → hex** (`Bytes.fromUTF8(uri).toHexString()`) |
| `feedbackHash` | `Bytes` | event |
| `endpoint` | `String` | event |
| `tag1`, `tag2` | `String` | event |
| `createdAt` | `BigInt!` | block timestamp |
| `isRevoked` | `Boolean!` | `false` o actualizado por `FeedbackRevoked` |
| `revokedAt` | `BigInt` | block timestamp en revoke |
| `txFrom` | `Bytes!` | `event.transaction.from` |
| `txNonce` | `BigInt!` | `event.transaction.nonce` |
| `gasPrice` | `BigInt!` | `event.transaction.gasPrice` |
| `gasUsed` | `BigInt!` | receipt o fallback `135000` |
| `blockNumber` | `BigInt!` | event block |
| `logIndex` | `BigInt!` | event log index |

### 5.2 Schema GraphQL Agent0

| Campo Agent0 | Tipo | Notas |
|--------------|------|-------|
| `id` | `ID!` | `chainId:agentId:clientAddress:feedbackIndex` |
| `agent` | `Agent!` | relación (usar `agent.id` para derivar slug) |
| `clientAddress` | `Bytes!` | |
| `feedbackIndex` | `BigInt!` | |
| `value` | `BigDecimal!` | convertir a entero string |
| `feedbackURI` | `String` | texto plano (https/ipfs/texto) |
| `feedbackURIType` | `String` | metadata Agent0 |
| `feedbackHash` | `Bytes` | |
| `endpoint`, `tag1`, `tag2` | `String` | |
| `isRevoked`, `revokedAt`, `createdAt` | | |
| `feedbackFile` | relación | contenido IPFS (opcional para normalize) |

**No hay:** `txFrom`, `txNonce`, `gasPrice`, `gasUsed`, `blockNumber`, `logIndex`.

### 5.3 JSON requerido por `execution_feedbacks_normalize_single_batch`

| Clave JSON | Obligatorio | Uso normalize |
|------------|-------------|---------------|
| `id` | **Sí** | `registration_feedbacks.on_chain_id` (UNIQUE) |
| `agent` | **Sí** | lookup `agents.on_chain_agent_id` + `chain_id` |
| `clientAddress` | **Sí** | `client_address` |
| `feedbackIndex` | **Sí** | `feedback_index` |
| `value` | **Sí** | `on_chain_value` |
| `feedbackURIRaw` | Condicional | clasificación `feedback_type` |
| `endpoint` | Condicional | `feedback_end_point` vs on-chain |
| `tag1`, `tag2` | No | columnas + reprocess trigger |
| `createdAt` | **Sí** | `on_chain_created_at` |
| `isRevoked`, `revokedAt` | No | revoke |
| `feedbackHash` | No | almacenado |
| `txFrom` | Recomendado | `tx_from`; usado downstream en `agent_manifest` / sentinel |
| `txNonce`, `gasPrice`, `gasUsed` | No* | solo escritura; *no leídos downstream |
| `blockNumber`, `logIndex` | No | almacenados en JSON |

**Clasificación `feedback_type` (normalize):**

1. `feedback_on_chain` — si `endpoint` match sentinel URLs o sin URI/endpoint útiles  
2. `feedback_uri` — si `feedbackURIRaw` presente y no sentinel (`0x`, `0x30`, `0x626164`)  
3. `feedback_end_point` — si `endpoint` parece URL/http  

### 5.4 Adaptador Feedback → JSON GSA

```typescript
function utf8ToHex(s: string): string {
  // Equivalente a Bytes.fromUTF8(s).toHexString() en AssemblyScript
  return "0x" + Buffer.from(s, "utf8").toString("hex");
}

function encodeFeedbackUri(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("0x")) return raw; // ya en formato GSA
  return utf8ToHex(raw);
}

function adaptAgent0Feedback(
  fb: Agent0Feedback,
  network: string
): GsaFeedbackJson {
  const agentId = fb.agent.agentId.toString();
  const client = fb.clientAddress.toLowerCase(); // o checksummed; consistente con BD
  const idx = fb.feedbackIndex.toString();
  const gsaId = `${network}-${agentId}-${client}-${idx}`;

  return {
    id: gsaId,
    agent: `${network}-${agentId}`,
    chainId: network,
    clientAddress: client,
    feedbackIndex: idx,
    value: Math.trunc(Number(fb.value)).toString(), // BigDecimal → entero
    feedbackURIRaw: encodeFeedbackUri(fb.feedbackURI),
    feedbackHash: fb.feedbackHash ?? null,
    endpoint: fb.endpoint ?? null,
    tag1: fb.tag1 ?? null,
    tag2: fb.tag2 ?? null,
    createdAt: fb.createdAt.toString(),
    isRevoked: fb.isRevoked,
    revokedAt: fb.revokedAt?.toString() ?? null,
    // Gas/tx: Agent0 no los tiene — fallback documentado
    txFrom: client, // fallback: 93% casos txFrom === client; ver §7
    txNonce: "0",
    gasPrice: "0",
    gasUsed: "0",
    blockNumber: "0",
    logIndex: "0",
  };
}
```

### 5.5 Query GraphQL Agent0 sugerida

```graphql
query FeedbacksPage($first: Int!, $skip: Int!, $createdAfter: BigInt) {
  feedbacks(
    first: $first
    skip: $skip
    orderBy: createdAt
    orderDirection: asc
    where: { createdAt_gt: $createdAfter }
  ) {
    id
    clientAddress
    feedbackIndex
    value
    feedbackURI
    feedbackHash
    endpoint
    tag1
    tag2
    isRevoked
    revokedAt
    createdAt
    agent {
      agentId
      chainId
    }
  }
}
```

Para revocaciones delta: `where: { isRevoked: true, revokedAt_gt: $watermark }`.

---

## 6. Entidad `FeedbackResponse`

### 6.1 Schema GraphQL GSA

| Campo subgraph | Tipo | Origen GSA mapping |
|----------------|------|-------------------|
| `id` | `ID!` | `{network}-{txHash}-{logIndex}` |
| `feedback` | `String!` | ID del feedback padre GSA |
| `responder` | `Bytes!` | event |
| `responseUri` / `responseURIRaw` | `String` | UTF-8 → hex |
| `responseHash` | `Bytes` | event |
| `createdAt` | `BigInt!` | block timestamp |

### 6.2 Schema GraphQL Agent0

| Campo Agent0 | Tipo | Notas |
|--------------|------|-------|
| `id` | `ID!` | `{feedbackId}:{responseIndex}` |
| `feedback` | `Feedback!` | relación |
| `responder` | `Bytes!` | |
| `responseUri` | `String` | texto plano |
| `responseHash` | `Bytes` | |
| `createdAt` | `BigInt!` | |

### 6.3 JSON requerido por `execution_feedback_responses_normalize_single_batch`

| Clave JSON | Obligatorio | Uso normalize |
|------------|-------------|---------------|
| `id` | **Sí** | `on_chain_id` de la respuesta |
| `feedback` | **Sí** | debe coincidir con `registration_feedbacks.on_chain_id` del padre |
| `responder` | **Sí** | `responder`; determina `responder_type` (agent/owner/external) |
| `responseURIRaw` | No | URI processing |
| `responseHash` | **Sí** | UNIQUE conflict key (`responder_hash` en BD) |
| `createdAt` | No | no usado en INSERT actual |

**Importante:** normalize busca el feedback padre con:

```sql
WHERE rf.on_chain_id = v_feedback_external_id  -- JSON.feedback
  AND a.chain_id = p_chain_internal_id
```

Por tanto `feedback` en el JSON adaptado **debe usar el ID GSA** (`base-42-0x...-3`), no el ID Agent0 (`8453:42:0x...:3`).

### 6.4 Adaptador FeedbackResponse → JSON GSA

```typescript
function adaptAgent0FeedbackResponse(
  res: Agent0FeedbackResponse,
  parentGsaFeedbackId: string,
  network: string,
  txHashPlaceholder: string,
  logIndex: string
): GsaFeedbackResponseJson {
  return {
  // ID estable: si Agent0 no da txHash, derivar de res.id + hash
    id: `${network}-${txHashPlaceholder}-${logIndex}`,
    feedback: parentGsaFeedbackId,
    responder: res.responder,
    responseUri: encodeFeedbackUri(res.responseUri),
    responseURIRaw: encodeFeedbackUri(res.responseUri),
    responseHash: res.responseHash,
    createdAt: res.createdAt.toString(),
  };
}
```

**Estrategia para `id` de respuesta cuando no hay txHash:**

- Opción A (recomendada): `id = lower(network) + "-a0resp-" + res.id.replace(/:/g, "-")`  
- Opción B: hash determinista de `(feedback, responder, responseHash, createdAt)`  
- Mantener **unicidad** de `responseHash` (conflict key en BD).

### 6.5 Query GraphQL Agent0 sugerida

```graphql
query FeedbackResponsesPage($first: Int!, $skip: Int!, $createdAfter: BigInt) {
  feedbackResponses(
    first: $first
    skip: $skip
    orderBy: createdAt
    orderDirection: asc
    where: { createdAt_gt: $createdAfter }
  ) {
    id
    responder
    responseUri
    responseHash
    createdAt
    feedback {
      id
      agent { agentId chainId }
      clientAddress
      feedbackIndex
    }
  }
}
```

En el adaptador, reconstruir `parentGsaFeedbackId` desde `feedback.agent` + `clientAddress` + `feedbackIndex`.

---

## 7. Matriz resumen Agent0 → JSON normalize

### Agents

| Agent0 | JSON GSA / normalize |
|--------|----------------------|
| `agentId` + `chainId` | `id` = `{network}-{agentId}` |
| `agentURI` | `agentURIRaw` |
| `registrationFile.name` | `name` |
| `registrationFile.description` | `description` |
| `registrationFile.image` | `imageUrl` |
| `registrationFile.active` | `active` |
| `owner` | `owner` |
| `agentWallet` | `agentWallet` (fallback `owner`) |
| `createdAt` / `updatedAt` | mismos nombres |

### Feedbacks

| Agent0 | JSON GSA / normalize |
|--------|----------------------|
| compuesto | `id` = `{network}-{agentId}-{client}-{index}` |
| `agent.agentId` | `agent` = `{network}-{agentId}` |
| `feedbackURI` (texto) | `feedbackURIRaw` (hex UTF-8 si no es `0x`) |
| `value` (BigDecimal) | `value` (string entero) |
| `clientAddress` | `clientAddress` y **fallback** `txFrom` |
| resto | `endpoint`, `tag1`, `tag2`, `feedbackHash`, `isRevoked`, `revokedAt`, `createdAt` |
| — | `gasPrice`, `gasUsed`, `txNonce`, `blockNumber`, `logIndex` = `"0"` |

### Feedback responses

| Agent0 | JSON GSA / normalize |
|--------|----------------------|
| `feedback` (relación) | `feedback` = **ID GSA del padre** |
| `responseUri` | `responseURIRaw` (hex) |
| `responseHash` | `responseHash` |
| `responder` | `responder` |
| `id` Agent0 | `id` GSA sintético estable (ver §6.4) |

---

## 8. Ejemplo completo (Base, agente 42)

### Agent0 raw (fragmento)

```json
{
  "id": "8453:42",
  "chainId": "8453",
  "agentId": "42",
  "agentURI": "ipfs://bafy...",
  "owner": "0xabc...",
  "createdAt": "1710000000",
  "updatedAt": "1710001000",
  "registrationFile": {
    "name": "My Agent",
    "description": "Does things",
    "image": "ipfs://bafy.../img",
    "active": true
  }
}
```

### JSON adaptado (entrada normalize)

```json
{
  "id": "base-42",
  "agentId": "42",
  "owner": "0xabc...",
  "agentURIRaw": "ipfs://bafy...",
  "name": "My Agent",
  "description": "Does things",
  "imageUrl": "ipfs://bafy.../img",
  "active": true,
  "chainId": "base",
  "agentWallet": "0xabc...",
  "createdAt": "1710000000",
  "updatedAt": "1710001000"
}
```

### Feedback Agent0 → GSA

| Agent0 `id` | GSA `id` |
|-------------|----------|
| `8453:42:0xclient:7` | `base-42-0xclient-7` |

---

## 9. Deltas conocidos y decisiones

| Tema | Impacto | Acción adaptador |
|------|---------|------------------|
| Sin gas/tx en Agent0 | Bajo para HUMI | `txFrom = clientAddress`; gas a `0` |
| `txFrom` ≠ `client` (~7% en prod) | Medio para sentinel | Mejorar normalize para leer `clientAddress` cuando `txFrom` ausente; opcional RPC `eth_getTransactionReceipt` fuera de scope v1 |
| URI hex vs plain | Medio | Hex-encode en adaptador; o ampliar normalize para aceptar `https://` en `feedbackURIRaw` |
| Agent0 resuelve IPFS | Positivo | `registrationFile` da `name`/`description` sin job URI en Supabase |
| GSA solo decode base64 inline | Neutral | Agentes solo-IPFS dependen más de URI processor Supabase (ya existente) |
| ID responses distintos | Alto si mal mapeado | Siempre derivar `feedback` padre en formato GSA |
| `value` BigDecimal | Bajo | Truncar a entero; alinear con int128 on-chain |
| Validaciones Agent0 | N/A v1 | Ignorar entidad `Validation` |

---

## 10. Checklist de validación (piloto Base)

1. Query Agent0 agents page → `graphs.normalize_batch_agent_erc` → fila en `erc_8004.agents` con `canonical_slug = base-{id}`.
2. Mismo agente: `agent_uri_raw` coherente; `is_uri_processed = false` en primer import.
3. Feedbacks: 100% `agent` FK resuelve contra `agents.on_chain_agent_id`.
4. Distribución `feedback_type` estable (~83% uri / 12% on-chain / 5% endpoint).
5. Feedback responses: padre encontrado; sin errores en normalize.
6. Watermark `updatedAt` / `createdAt` — segundo import no reprocesa todo el grafo.

---

## 11. Referencias

- [Agent0 subgraph README](https://github.com/agent0lab/subgraph)
- [The Graph — Agent0 guide](https://thegraph.com/docs/en/subgraphs/guides/agent0/)
- [Blog Agent0 live](https://thegraph.com/blog/agent0-subgraphs-live-erc-8004-agent-economy/)
- Plan migración: completado Ormi → Agent0 (jul 2026)

---

*Documento de referencia Agent0 → normalize GSA. Actualizar si cambia el schema Agent0 o las funciones `graphs.normalize_batch_*_erc`.*
