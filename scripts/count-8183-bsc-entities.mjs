/**
 * Count erc-8183-commerce-bsc entities on Ormi vs Goldsky via GraphQL pagination.
 * Usage: node scripts/count-8183-bsc-entities.mjs
 */

const ENDPOINTS = {
  ormi:
    "https://subgraph.api.ormilabs.com/api/public/f46db6cd-eefe-4019-b10d-f48b2f2a9ee6/subgraphs/erc-8183-commerce-bsc/v1.0.0/gn",
  goldsky:
    "https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/erc-8183-commerce-bsc/prod/gn",
};

const ENTITIES = [
  "erc8183Jobs",
  "erc8183JobStatuses",
  "erc8183Deliveries",
  "erc8183Payments",
  "erc8183Budgets",
];

async function gql(url, query, variables = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

async function countEntity(url, entity) {
  let total = 0;
  let lastId = null;
  const pageSize = 1000;

  while (true) {
    const whereClause = lastId ? `, where: { id_gt: $lastId }` : "";
    const query = `
      query CountPage($lastId: ID) {
        ${entity}(first: ${pageSize}, orderBy: id, orderDirection: asc${whereClause}) {
          id
        }
      }
    `;
    const data = await gql(url, query, lastId ? { lastId } : {});
    const items = data[entity];
    if (!items?.length) break;
    total += items.length;
    lastId = items[items.length - 1].id;
    if (items.length < pageSize) break;
    process.stdout.write(`  ${entity}: ${total}\r`);
  }
  return total;
}

async function getMeta(url) {
  const data = await gql(
    url,
    `{ _meta { block { number } deployment hasIndexingErrors } }`
  );
  return data._meta;
}

async function main() {
  const results = {};

  for (const [label, url] of Object.entries(ENDPOINTS)) {
    console.log(`\n=== ${label.toUpperCase()} ===`);
    const meta = await getMeta(url);
    console.log(
      `block=${meta.block.number} deployment=${meta.deployment} errors=${meta.hasIndexingErrors}`
    );

    results[label] = { meta, counts: {}, total: 0 };
    for (const entity of ENTITIES) {
      const count = await countEntity(url, entity);
      results[label].counts[entity] = count;
      results[label].total += count;
      console.log(`  ${entity}: ${count.toLocaleString()}`);
    }
    console.log(`  TOTAL: ${results[label].total.toLocaleString()}`);
  }

  console.log("\n=== COMPARISON ===");
  for (const entity of ENTITIES) {
    const o = results.ormi.counts[entity];
    const g = results.goldsky.counts[entity];
    const diff = o - g;
    const ok = diff === 0 ? "OK" : "DIFF";
    console.log(`  ${entity}: Ormi=${o} Goldsky=${g} delta=${diff} [${ok}]`);
  }
  const totalDiff = results.ormi.total - results.goldsky.total;
  console.log(
    `  TOTAL: Ormi=${results.ormi.total} Goldsky=${results.goldsky.total} delta=${totalDiff} [${totalDiff === 0 ? "OK" : "DIFF"}]`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
