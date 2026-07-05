# Olas Mech Marketplace subgraph

> **Import prod:** subgraph **oficial Autonolas** — GSA no despliega este código en producción.
> - Base: `https://api.subgraph.autonolas.tech/api/proxy/marketplace-base`
> - Gnosis: `https://api.subgraph.autonolas.tech/api/proxy/marketplace-gnosis`

Este directorio es **referencia** (schema, ABIs, manifests, `query_data` para Supabase). Un deploy histórico en Ormi (`olas-mech-*`) fue retirado.

Direcciones y `startBlock`: [`networks-olas.json`](../../networks-olas.json). Spec: [`docs/olas-marketplace-indexer.md`](../../docs/olas-marketplace-indexer.md).

## Build local (opcional)

```powershell
npm run build:olas-base      # o build:olas-gnosis
npm run codegen:olas-base
```

No ejecutar `deploy:olas-*` salvo prueba local en graph-node.
