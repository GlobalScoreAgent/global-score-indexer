# Guía para agentes de IA

Este documento orienta a agentes autónomos (Cursor, CI bots, etc.) que trabajen en el repositorio **global-score-indexer**.

## Fuente de verdad

- Este repo es un **subgraph The Graph** (AssemblyScript), **no** un indexer Envio.
- Código de producción desplegado en **Ormi 0xGraph**.
- Metadatos por chain: [`networks.json`](networks.json).
- Backlog de chains: [`docs/propuesta-chains-erc8004.md`](docs/propuesta-chains-erc8004.md).

## Reglas estrictas

**No modificar sin confirmación del usuario:**

- Direcciones de contrato (`0x8004A169...`, `0x8004BAa1...`)
- Firmas de eventos en `subgraph.yaml`
- Formato de IDs en handlers (`{network}-{agentId}`, etc.)

**Flujo obligatorio** tras cambiar `schema.graphql`, `subgraph.yaml` o `src/mapping.ts`:

```bash
npm run codegen
npm run build
```

**Modelo de deploy:** un subgraph **por chain** en Ormi. Cambiar `network` y `startBlock` en `subgraph.yaml`; no intentar multichain en un solo manifest.

**Start block:** usar bloque ~enero 2026 (cuando ERC-8004 se desplegó en esa red), no genesis. Ver [docs/operaciones.md](docs/operaciones.md).

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `subgraph.yaml` | Manifest: red, contratos, eventos, startBlock |
| `schema.graphql` | Entidades GraphQL expuestas |
| `src/mapping.ts` | Handlers AssemblyScript |
| `networks.json` | Referencia de startBlock, nombres Ormi, estado live/pending |
| `abis/agentregistry.json` | ABI compartida Identity + Reputation |

## Orden de prioridad (chains pendientes)

1. X Layer (`erc-8004-agent-xlayer`)
2. Celo (`erc-8004-agent-celo`)
3. Gnosis (`erc-8004-agent-gnosis`)
4. Optimism (`erc-8004-agent-optimism`)

Seguir este orden salvo indicación contraria del usuario.

## Procedimientos

- Deploy y checklist: [docs/operaciones.md](docs/operaciones.md)
- Contexto de negocio: [docs/negocio.md](docs/negocio.md)
- Arquitectura: [docs/arquitectura.md](docs/arquitectura.md)

## Errores comunes

- Olvidar `receipt: true` en el handler `NewFeedback` (necesario para `gasUsed`).
- IDs inconsistentes entre `Agent`, `Feedback` y `FeedbackResponse`.
- Desplegar sin cambiar `network` en `subgraph.yaml` (deployaría sobre la chain incorrecta).
- Usar startBlock posterior al primer evento (pérdida de datos).
