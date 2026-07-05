# Propuesta de Chains para Agregar al Indexing

> **Estado jul 2026:** import prod ERC-8004 en ETH, Base, BSC, Polygon, Arbitrum vía **Agent0** (The Graph). **Ormi retirado.** Chains fuera del pack Agent0 (Gnosis, Optimism, X Layer, Celo) requieren subgraph Agent0 o decisión de producto antes de reactivar. Ver [`arquitectura-grafos-gsa.md`](arquitectura-grafos-gsa.md).

**Proyecto:** Global Score Agent (HUMI Index + WAMI)  
**Fecha:** 21 de junio de 2026  
**Objetivo:** Expandir la cobertura de chains con actividad real de ERC-8004 para mejorar la calidad y representatividad del índice.

---

## Resumen Ejecutivo

Se propone agregar **4 chains** adicionales al pipeline de indexing actual. La priorización se basa en:

- Volumen y crecimiento de agents registrados en ERC-8004
- Facilidad de integración (mismos contratos singleton)
- Relevancia estratégica para el ecosistema de agents (commerce, stablecoins, etc.)
- Balance entre esfuerzo y valor

### Tabla de Prioridades Recomendada

| Prioridad | Chain       | chain_id | Agentes Aprox. | Justificación Principal                     | Esfuerzo Estimado |
|-----------|-------------|----------|----------------|---------------------------------------------|-------------------|
| **Alta**  | X Layer     | 196      | ~1.622        | Mayor crecimiento reciente + contratos idénticos | Bajo             |
| **Alta**  | Celo        | 42220    | ~9.000+       | Volumen alto + ecosistema real de stablecoins | Bajo             |
| **Media-Alta** | Gnosis | 100      | ~3.682        | Buen volumen actual, mejor que Optimism     | Bajo             |
| **Baja**  | Optimism    | 10       | ~507          | Actividad baja actualmente                  | Bajo             |

---

## 1. X Layer (chain_id: 196)

### Datos Actuales
- **Agents registrados**: ~1.622
- **Feedbacks**: Alto crecimiento reciente
- **Crecimiento 30 días**: +823 agents / +964 feedbacks (Top 5 mainnets)

### Razones para Agregar
- **Momentum actual muy fuerte**: Está siendo destacada por 8004scan como una de las chains con mayor crecimiento en el ecosistema ERC-8004.
- **Contratos idénticos**: Usa exactamente los mismos addresses de Identity y Reputation Registry que Ethereum, Base, Celo, etc. (`0x8004A169...`).
- **Fit estratégico**: Es un L2 enfocado en commerce, mercados financieros y pagos on-chain. Esto genera agents con utilidad real (no solo speculative), lo cual enriquece los pilares de **Usage** y **Measures**.
- **Bajo esfuerzo técnico**: Al usar los mismos contratos singleton, la integración en el pipeline actual es mínima.

**Recomendación**: Agregar con **alta prioridad**.

---

## 2. Celo (chain_id: 42220)

### Datos Actuales
- **Agents registrados**: ~9.000+
- **Ecosistema**: Fuerte en stablecoins (cUSD, USDT), pagos reales y adopción mobile.

### Razones para Agregar
- **Volumen significativo**: Una de las chains con más agents registrados actualmente.
- **Utilidad real**: El enfoque de Celo en pagos y stablecoins genera agents con comportamiento más cercano a casos de uso productivos (lo cual ayuda mucho en los pilares de **History** y **Usage**).
- **Contratos idénticos**: Mismos addresses que el resto de chains EVM.
- **Diversificación**: Aporta exposición a un ecosistema diferente (no solo L2s generales).

**Recomendación**: Agregar con **alta prioridad** (ya fue evaluada positivamente anteriormente).

---

## 3. Gnosis Chain

### Datos Actuales
- **Agents registrados**: ~3.682
- **Feedbacks**: ~4.341

### Razones para Agregar
- **Volumen decente**: Supera claramente a Optimism en cantidad de agents y feedback.
- **Contratos desplegados**: Tiene los mismos addresses de Identity y Reputation Registry.
- **Buena relación esfuerzo/valor**: No tiene el mismo hype que X Layer, pero tiene actividad real y consistente.
- **Complementariedad**: Añade diversidad a la cobertura actual.

**Recomendación**: Agregar con **prioridad media-alta**.

---

## 4. Optimism (chain_id: 10)

### Datos Actuales
- **Agents registrados**: ~507
- **Feedbacks**: ~30 (muy bajo)

### Razones para Agregar
- **Contratos desplegados**: Sí tiene los registries oficiales.
- **Cobertura de L2 grande**: Es una de las L2s más conocidas del ecosistema Ethereum.

### Razones para NO priorizarla ahora
- **Baja actividad actual**: Tiene significativamente menos agents y feedback que Gnosis, X Layer o Celo.
- **Bajo momentum**: No está mostrando crecimiento destacado en el ecosistema ERC-8004 en este momento.
- **Mejor alternativa**: Gnosis ofrece mejor volumen con similar facilidad de integración.

**Recomendación**: Dejar en **baja prioridad** por ahora. Solo agregarla si se busca tener cobertura amplia de las principales L2s independientemente de la actividad actual de agents.

---

## Resumen de Recomendación de Implementación

| Orden | Chain       | Prioridad | Justificación |
|-------|-------------|-----------|---------------|
| 1     | **X Layer** | Alta      | Mejor momentum actual + fácil integración |
| 2     | **Celo**    | Alta      | Alto volumen + ecosistema real |
| 3     | **Gnosis**  | Media-Alta| Buen volumen y actividad actual |
| 4     | **Optimism**| Baja      | Baja actividad actual |

---

## Próximos Pasos Sugeridos

1. **Actualizar `networks.json`** con los metadatos de las chains priorizadas (ver anexo técnico).
2. **Verificar soporte en Ormi 0xGraph** para cada chain.
3. **Preparar / desplegar subgraphs** para las chains de alta prioridad.
4. **Actualizar backend GSA** (queries HUMI / endpoints GraphQL) tras cada deploy.
5. **Monitorear crecimiento** de X Layer y Gnosis durante las próximas semanas.

---

## Anexo técnico (subgraph / Ormi)

### Contratos (CREATE2, idénticos en todas las EVM)

| Registro | Address |
|----------|---------|
| Identity (AgentRegistry) | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation (AgentReputation) | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

No se requieren cambios en `src/mapping.ts` ni en `schema.graphql` para estas chains.

### Tabla de deploy en Ormi (propuesta)

| Orden | Chain | chain_id | Network en subgraph.yaml | Nombre deploy Ormi | startBlock | Estado |
|-------|-------|----------|--------------------------|--------------------|------------|--------|
| — | Ethereum | 1 | `mainnet` | `erc-8004-agent-eth` | 21805560 | live |
| — | Base | 8453 | `base` | `erc-8004-agent-base` | 41453265 | live |
| — | BSC | 56 | `bsc` | `erc-8004-agent-bsc` | 46850000 | live |
| — | Polygon | 137 | `matic` | `erc-8004-agent-poly` | 68450000 | live |
| — | Arbitrum | 42161 | `arbitrum-one` | `erc-8004-agent-arbitrum` | 245348700 | live |
| 1 | X Layer | 196 | `xlayer` | `erc-8004-agent-xlayer` | 48428000 | live |
| — | Celo | 42220 | `celo` | `erc-8004-agent-celo` (Goldsky) | 58396724 | live (Goldsky) |
| 2 | Gnosis | 100 | `gnosis` | `erc-8004-agent-gnosis` | 44505010 | live |
| 3 | Optimism | 10 | `optimism` | `erc-8004-agent-optimism` | 147514947 | live |

**startBlock:** bloque ~enero 2026 cuando aplique; si el deploy ERC-8004 fue posterior, usar bloque de deploy (Celo `58396724`, Gnosis `44505010`, Optimism `147514947`). No usar genesis de la chain.

**Celo en Ormi:** no soportada. Desplegada en **Goldsky** (`erc-8004-agent-celo/prod`). Endpoint en `networks.json`.

**Network names:** X Layer `xlayer`; Gnosis `gnosis`; Optimism `optimism` (Mainnet); Celo `celo` (Goldsky). Testnet OP: `optimism-sepolia`.

### Checklist por chain nueva

1. Confirmar soporte de indexación en Ormi 0xGraph.
2. Confirmar despliegue ERC-8004 con mismas direcciones singleton.
3. Determinar `startBlock` (~enero 2026).
4. Actualizar `subgraph.yaml` (`network` + `startBlock` en ambos dataSources).
5. `npm run codegen` → `npm run build`.
6. `graph deploy <ormiDeployName> --node https://subgraph.api.ormilabs.com/deploy --ipfs https://subgraph.api.ormilabs.com/ipfs --deploy-key $ORMI_DEPLOY_KEY`
7. Verificar sync 100% en dashboard Ormi.
8. Actualizar backend GSA con el nuevo endpoint GraphQL.

---

**Documento preparado para:** Global Score Agent  
**Versión:** 1.0  
**Fecha:** 21 de junio de 2026
