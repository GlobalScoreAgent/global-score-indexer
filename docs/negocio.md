# Documentación de negocio — Subgraph ERC-8004

**Proyecto:** Global Score Agent  
**Componente:** Indexer on-chain (subgraph Ormi)  
**Audiencia:** Producto, stakeholders, analistas

---

## Propósito

Este subgraph es la **capa de datos on-chain** que alimenta el cálculo del **Índice HUMI** (reputación de agentes ERC-8004) en Global Score Agent. Indexa:

- **Registro de agentes** (identidad, metadatos decodificados, servicios MCP/A2A/wallet, etc.)
- **Feedback on-chain** (reputación, respuestas, revocaciones)
- **Metadatos de transacción** en feedbacks (gas, nonce, origen) para análisis de calidad

Sin este indexer, GSA no tendría una vista unificada y consultable (GraphQL) de la actividad ERC-8004 por chain.

---

## Relación con HUMI y WAMI

| Índice | Qué mide | Fuente principal |
|--------|----------|------------------|
| **HUMI** | Calidad del agente | Este subgraph (Ormi) + metadatos off-chain + feedback externo |
| **WAMI** | Calidad de la wallet owner | APIs de wallets (Alchemy, Moralis, Zerion) — **no** este repo |

El subgraph aporta datos crudos estructurados que el backend de GSA procesa diariamente para HUMI.

---

## Modelo de despliegue

- **Un subgraph por chain** en Ormi (privado, CLI-deployed)
- Mismos contratos CREATE2 en todas las EVM
- Nomenclatura: `erc-8004-agent-{chain}`

### Chains activas (junio 2026)

Ethereum, Base, BSC, Polygon, Arbitrum — todas en sync 100% en Ormi.

### Chains planificadas

Ver [propuesta-chains-erc8004.md](propuesta-chains-erc8004.md):

1. **X Layer** — alto momentum (+823 agents / 30d), fit commerce/pagos
2. **Celo** — mayor volumen (~9.000+ agents), ecosistema stablecoins
3. **Gnosis** — volumen sólido (~3.682 agents), mejor que Optimism hoy
4. **Optimism** — baja prioridad (~507 agents)

---

## Contratos indexados

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
- [Roadmap de chains](propuesta-chains-erc8004.md)
