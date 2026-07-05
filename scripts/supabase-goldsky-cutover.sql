-- Cutover Ormi → Goldsky (jun 2026)
-- Ejecutar SOLO cuando cada subgraph Goldsky esté al 100% de sync.
-- Uso: supabase db query --linked -f scripts/supabase-goldsky-cutover.sql
-- Proyecto: mezqyworblseixaypftg

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Pre-flight: revisar estado actual (no modifica datos)
-- ---------------------------------------------------------------------------
SELECT 'erc_8004.chains' AS scope, chain_id, name, graphql_endpoint
FROM erc_8004.chains
WHERE chain_id IN (196, 42220)
ORDER BY chain_id;

SELECT 'graphs.subgraph' AS scope, s.id, s.name, s.url, g.name AS graph_name
FROM graphs.subgraph s
JOIN graphs.graph g ON g.id = s.graph_id
WHERE s.url ILIKE '%ormilabs%'
   OR s.url ILIKE '%goldsky%'
   OR s.name ILIKE '%virtual%'
   OR s.name ILIKE '%8183%'
   OR s.name ILIKE '%xlayer%'
ORDER BY s.id;

-- ---------------------------------------------------------------------------
-- 1. Celo — subgraph eliminado de Goldsky (Fase 0)
-- ---------------------------------------------------------------------------
UPDATE erc_8004.chains
SET graphql_endpoint = NULL
WHERE chain_id = 42220;

-- ---------------------------------------------------------------------------
-- 2. X Layer (chainId 196) — ERC-8004 en Goldsky
-- ---------------------------------------------------------------------------
-- Si la fila no existe, descomentar INSERT tras validar sync:
-- INSERT INTO erc_8004.chains (chain_id, name, graphql_endpoint, is_active)
-- VALUES (
--   196,
--   'X Layer',
--   'https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8004-agent-xlayer/prod/gn',
--   true
-- )
-- ON CONFLICT (chain_id) DO NOTHING;

UPDATE erc_8004.chains
SET graphql_endpoint = 'https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8004-agent-xlayer/prod/gn'
WHERE chain_id = 196;

-- ---------------------------------------------------------------------------
-- 3. Virtual ACP Base — graphs.subgraph (cuando exista fila seed)
-- ---------------------------------------------------------------------------
UPDATE graphs.subgraph
SET url = 'https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/virtual-acp-base/prod/gn'
WHERE name ILIKE '%virtual%acp%'
   OR name ILIKE '%virtual-acp%'
   OR url ILIKE '%virtual-acp-base%';

-- ---------------------------------------------------------------------------
-- 4. ERC-8183 BSC — graphs.subgraph (cuando exista fila seed)
-- ---------------------------------------------------------------------------
UPDATE graphs.subgraph
SET url = 'https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8183-commerce-bsc/prod/gn'
WHERE name ILIKE '%8183%bsc%'
   OR name ILIKE '%erc-8183-commerce-bsc%'
   OR url ILIKE '%erc-8183-commerce-bsc%';

-- ---------------------------------------------------------------------------
-- 5. Post-cutover: verificar
-- ---------------------------------------------------------------------------
SELECT 'post-cutover erc_8004' AS scope, chain_id, name, graphql_endpoint
FROM erc_8004.chains
WHERE chain_id IN (196, 42220)
ORDER BY chain_id;

SELECT 'post-cutover graphs' AS scope, s.id, s.name, s.url
FROM graphs.subgraph s
WHERE s.url ILIKE '%goldsky%'
   OR s.name ILIKE '%virtual%'
   OR s.name ILIKE '%8183%'
ORDER BY s.id;

COMMIT;
