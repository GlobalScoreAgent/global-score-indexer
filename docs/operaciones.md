# Operaciones — Deploy y mantenimiento

Runbook para desarrolladores que despliegan o mantienen subgraphs ERC-8004 en Ormi.

---

## Prerrequisitos

- Node.js 18+
- Graph CLI: `npm install -g @graphprotocol/graph-cli`
- API key de deploy en [Ormi App](https://app.ormilabs.com)
- Copiar `.env.example` → `.env` con `ORMI_DEPLOY_KEY`

---

## Comandos locales

```bash
npm install
npm run codegen    # Genera types en generated/
npm run build      # Compila WASM → build/
npm test           # Tests Matchstick (opcional)
```

---

## Tabla de chains en producción

| Chain | `network` en subgraph.yaml | Deploy Ormi | startBlock |
|-------|---------------------------|-------------|------------|
| Ethereum | `mainnet` | `erc-8004-agent-eth` | 21805560 |
| Base | `base` | `erc-8004-agent-base` | 41453265 |
| BSC | `bsc` | `erc-8004-agent-bsc` | 46850000 |
| Polygon | `matic` | `erc-8004-agent-poly` | 68450000 |
| Arbitrum | `arbitrum-one` | `erc-8004-agent-arbitrum` | 245348700 |

Valores también en [`networks.json`](../networks.json).

---

## Roadmap pendiente

| Orden | Chain | Deploy Ormi | `network` | startBlock | Estado |
|-------|-------|-------------|-----------|------------|--------|
| 1 | X Layer | `erc-8004-agent-xlayer` | `x-layer` (verificar) | TBD | pendiente |
| 2 | Celo | `erc-8004-agent-celo` | `celo` | TBD | pendiente |
| 3 | Gnosis | `erc-8004-agent-gnosis` | `gnosis` | TBD | pendiente |
| 4 | Optimism | `erc-8004-agent-optimism` | `optimism` | TBD | pendiente |

Detalle de negocio: [propuesta-chains-erc8004.md](propuesta-chains-erc8004.md)

---

## Checklist: añadir una chain nueva

1. **Verificar soporte Ormi** — confirmar que 0xGraph indexa la red.
2. **Verificar contratos ERC-8004** — mismas direcciones singleton (`0x8004A169...`, `0x8004BAa1...`).
3. **Calcular startBlock** — bloque ~enero 2026 en esa chain (no genesis, no posterior al primer evento).
4. **Actualizar `networks.json`** — añadir entrada con `startBlock`, `ormiDeployName`, `status: live`.
5. **Editar `subgraph.yaml`** — cambiar `network` y `startBlock` en **ambos** dataSources (AgentRegistry y AgentReputation).
6. **Compilar:**
   ```bash
   npm run codegen
   npm run build
   ```
7. **Desplegar a Ormi:**
   ```bash
   graph deploy erc-8004-agent-<chain> \
     --node https://subgraph.api.ormilabs.com/deploy \
     --ipfs https://subgraph.api.ormilabs.com/ipfs \
     --deploy-key %ORMI_DEPLOY_KEY%
   ```
8. **Verificar sync** — dashboard Ormi debe mostrar 100%.
9. **Query de prueba** — consultar `{ agents(first: 1) { id name } }` en el endpoint GraphQL.
10. **Backend GSA** — registrar nuevo endpoint en la config de queries HUMI.

---

## Checklist: actualizar subgraph existente

1. Hacer cambios en código/schema.
2. `npm run codegen && npm run build`
3. Asegurar `subgraph.yaml` apunta a la chain correcta.
4. `graph deploy erc-8004-agent-<chain> ...` (mismo nombre que el deploy existente).
5. Verificar sync y queries en Ormi.

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
| Deploy en chain incorrecta | No se cambió `network` | Revisar subgraph.yaml antes de deploy |
| Datos faltantes | startBlock posterior al primer evento | Bajar startBlock a ~enero 2026 |
| IDs inconsistentes | Formato distinto entre entidades | Usar `{network}-{agentId}` y variantes documentadas |

---

## Desarrollo local (opcional)

```bash
docker compose up -d   # graph-node + ipfs + postgres
npm run deploy-local
```

Ver [`docker-compose.yml`](../docker-compose.yml).

---

## Referencias

- [Ormi CLI deploy docs](https://ormilabs.com/docs/subgraphs/deploy-a-subgraph/deploy-subgraphs-via-cli)
- [ERC-8004 contracts](https://github.com/erc-8004/erc-8004-contracts)
