# Documentación de negocio — Subgraph ERC-8004

**Proyecto:** Global Score Agent  
**Componente:** Capa de datos on-chain (Agent0 + subgraphs Goldsky)  
**Audiencia:** Producto, stakeholders, analistas

---

## Propósito

Los grafos son la **capa de datos on-chain** que alimenta el cálculo del **Índice HUMI** (reputación de agentes ERC-8004) en Global Score Agent. Para ERC-8004 se consumen los **subgraphs públicos de Agent0** en The Graph Network; el repo indexer mantiene código de referencia y subgraphs propios (Olas, Virtual, Ethos, ERC-8183) en Goldsky.

Datos indexados (ERC-8004 vía Agent0):

- **Registro de agentes** (identidad, metadatos, servicios MCP/A2A/wallet)
- **Feedback on-chain** (reputación, respuestas, revocaciones)

Sin esta capa, GSA no tendría una vista unificada y consultable (GraphQL) de la actividad ERC-8004 por chain.

---

## Relación con HUMI y WAMI

| Índice | Qué mide | Fuente principal |
|--------|----------|------------------|
| **HUMI** | Calidad del agente | Agent0 (ERC-8004) + subgraphs Goldsky (marketplace) + metadatos off-chain |
| **WAMI** | Calidad de la wallet owner | APIs de wallets (Alchemy, Moralis, Zerion) — **no** este repo |

El backend de GSA importa y normaliza datos GraphQL diariamente para HUMI.

---

## Modelo de despliegue

| Capa | Proveedor | Alcance |
|------|-----------|---------|
| **ERC-8004 import prod** | **Agent0** (The Graph Network) | Ethereum, Base, BSC, Polygon, Arbitrum |
| **Olas Mech Marketplace** | **Autonolas** (subgraph oficial) | Base, Gnosis |
| **Subgraphs propios GSA** | **Goldsky** | Ethos, Virtual, ERC-8183 |

- Mismos contratos CREATE2 ERC-8004 en todas las EVM
- **Ormi retirado** (jul 2026) — no es proveedor activo

### Chains activas HUMI (jul 2026)

**ERC-8004:** Ethereum, Base, BSC, Polygon, Arbitrum — vía Agent0.

**Fuera de import prod:** Gnosis, Optimism, X Layer, Celo (sin Agent0 en pack prod; Ormi retirado).

---

## Contratos indexados (ERC-8004)

| Registro | Función | Address |
|----------|---------|---------|
| Identity Registry | Registro de agentes ERC-8004 | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry | Feedback y respuestas | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

---

## Criterio de start block

No indexamos desde el genesis de cada blockchain. El **start block** se fija en la ventana de **~enero 2026**, cuando ERC-8004 se desplegó en la red. Esto:

- Reduce tiempo y costo de sincronización
- Captura **todos** los eventos relevantes del estándar (el start block es anterior al primer `Registered`)

---

## Fuera de alcance

- **Solana** — requiere indexer distinto (no EVM)
- **WAMI** — pipeline separado de wallets
- Scoring HUMI — ocurre en backend GSA, no en el subgraph

---

## Enlaces

- [Global Score Agent](https://www.globalscoreagent.com)
- [Documentación ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
- [Arquitectura de grafos GSA](arquitectura-grafos-gsa.md)
- [Roadmap de chains](propuesta-chains-erc8004.md)
