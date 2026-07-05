/**
 * Valida que las queries de docs/ethos-subgraph-entities-query-data.md
 * coinciden con el schema desplegado en Goldsky prod.
 */
const url =
  process.env.ETHOS_GRAPHQL_URL ??
  "https://api.goldsky.com/api/public/project_cmma0eekxnc4e01vt9klkbya9/subgraphs/ethos-network-base/prod/gn";

const VALID_ROOT_QUERIES = [
  `{ ethosProfiles(first: 1, orderBy: createdAt, orderDirection: asc) { id profileId createdAt archived isMock invitedByProfileId availableInvites addressCount reviewCountGiven reviewCountReceived vouchCountGiven vouchCountReceived totalVouchedReceived attestationCount } }`,
  `{ ethosProfileAddresses(first: 1, orderBy: claimedAt, orderDirection: asc) { id address claimedAt status profile { id profileId } } }`,
  `{ ethosAttestations(first: 1, orderBy: createdAt, orderDirection: asc) { id attestationId service account evidence createdAt archived profile { id profileId } } }`,
  `{ ethosReviews(first: 1, orderBy: createdAt, orderDirection: asc) { id reviewId score author subject attestationHash comment metadata createdAt archived authorProfile { id profileId } subjectProfile { id profileId } } }`,
  `{ ethosVouches(first: 1, orderBy: vouchedAt, orderDirection: asc) { id vouchId balance archived unhealthy vouchedAt unvouchedAt comment metadata authorProfile { id profileId } subjectProfile { id profileId } } }`,
  `{ ethosSlashes(first: 1, orderBy: createdAt, orderDirection: asc) { id slashId amount createdAt archived slashType comment metadata subject attestationHash authorProfile { id profileId } subjectProfile { id profileId } } }`,
  `{ ethosReputationMarkets(first: 1, orderBy: updatedAt, orderDirection: asc) { id profileId graduated voteTrust voteDistrust trustPrice distrustPrice liquidity basePrice createdAt updatedAt profile { id profileId } } }`,
  `{ ethosMarketTrades(first: 1, orderBy: timestamp, orderDirection: asc) { id profileId trader isPositive isBuy amount funds timestamp txHash market { id profileId } } }`,
  `{ ethosBrokerPosts(first: 1, orderBy: createdAt, orderDirection: asc) { id postId authorProfileId type title description cost tags level createdAt updatedAt txHash authorProfile { id profileId } } }`,
  `{ ethosProjects(first: 1, orderBy: createdAt, orderDirection: asc) { id projectId userkey status name description createdAt updatedAt ownerProfile { id profileId } } }`,
  `{ ethosBonds(first: 1, orderBy: createdAt, orderDirection: asc) { id bondId amount bondType amountType status createdAt releasedAt authorProfile { id profileId } } }`,
];

const INVALID_QUERIES = [
  {
    name: "ethosProjectVotes (plan v1.1 — no existe en subgraph)",
    query: "{ ethosProjectVotes(first: 1) { id } }",
  },
  {
    name: "EthosBond.subjectProfile (plan — no existe en contrato)",
    query: "{ ethosBonds(first: 1) { id subjectProfile { id profileId } } }",
  },
];

async function runQuery(query) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

let failed = 0;

console.log("=== Queries válidas (docs/ethos-subgraph-entities-query-data.md) ===\n");
for (let i = 0; i < VALID_ROOT_QUERIES.length; i++) {
  const res = await runQuery(VALID_ROOT_QUERIES[i]);
  const ok = !res.errors;
  console.log(`${ok ? "OK" : "FAIL"} #${i + 1}`, res.errors?.[0]?.message ?? "sin errores GraphQL");
  if (!ok) failed++;
}

console.log("\n=== Queries inválidas (esperado: error) ===\n");
for (const { name, query } of INVALID_QUERIES) {
  const res = await runQuery(query);
  const hasError = Boolean(res.errors?.length);
  console.log(`${hasError ? "OK (rechazada)" : "UNEXPECTED PASS"} — ${name}`);
  if (res.errors?.[0]) console.log("  ", res.errors[0].message);
  if (!hasError) failed++;
}

process.exit(failed > 0 ? 1 : 0);
