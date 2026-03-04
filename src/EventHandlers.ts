import { AgentRegistry } from "../generated/src/Handlers.gen";
import { Agent, Registration } from "../generated/src/Types.gen";

AgentRegistry.Registered.handler(async ({ event, context }) => {
  const agentIdStr = event.params.agentId.toString();
  const network = event.chainId.toString();
  const id = `${network}:${agentIdStr}`;

  let uri = event.params.agentURI;
  let decodedJson: any = {};
  let indexingError = false;

  // 1. Decodificación
  try {
    if (uri.includes("base64,")) {
      const base64Data = uri.split("base64,")[1];
      decodedJson = JSON.parse(Buffer.from(base64Data, "base64").toString("utf-8"));
    } else if (uri.startsWith("{")) {
      decodedJson = JSON.parse(uri);
    }
  } catch (e) {
    indexingError = true;
  }

  // 2. Pre-procesar Servicios (Variables temporales para evitar el error de Read-Only)
  const services = decodedJson.services || decodedJson.endpoints;
  let hasWalletEndpoint = false;
  let walletEndpoint: string | undefined = undefined;
  let hasMCPServices = false;
  let mcp: string | undefined = undefined;
  let hasOASFServices = false;
  let oasf: string | undefined = undefined;
  let hasA2AServices = false;
  let a2a: string | undefined = undefined;
  let hasX402ComputeServices = false;
  let x402Compute: string | undefined = undefined;
  let hasExtraServices = false;
  let rawServicesJson: string | undefined = undefined;

  if (Array.isArray(services)) {
    rawServicesJson = JSON.stringify(services);
    services.forEach((s: any) => {
      const sName = (s.name || "").toLowerCase();
      const endpoint = s.endpoint || "";

      if (sName === "wallet") { hasWalletEndpoint = true; walletEndpoint = endpoint; }
      else if (sName === "mcp") { hasMCPServices = true; mcp = endpoint; }
      else if (sName === "oasf") { hasOASFServices = true; oasf = endpoint; }
      else if (sName === "a2a") { hasA2AServices = true; a2a = endpoint; }
      else if (sName === "x402-compute") { hasX402ComputeServices = true; x402Compute = endpoint; }
      else if (sName !== "web" && sName !== "email") { hasExtraServices = true; }
    });
  }

  // 3. Crear Entidad Registration (Con todos los campos ya calculados)
  const registrationEntity: Registration = {
    id: id,
    chainId: network,
    active: decodedJson.active !== undefined ? Boolean(decodedJson.active) : true,
    createdAt: BigInt(event.block.timestamp),
    updatedAt: BigInt(event.block.timestamp),
    lastActivityAt: BigInt(event.block.timestamp),
    agentWallet: event.params.owner.toLowerCase(),
    x402Support: !!(decodedJson.x402support || decodedJson.x402Support),
    supportedTrust: Array.isArray(decodedJson.supportedTrust) ? decodedJson.supportedTrust : [],
    tags: Array.isArray(decodedJson.tags) ? decodedJson.tags : [],
    oasf_skills: Array.isArray(decodedJson.oasf_skills) ? decodedJson.oasf_skills : [],
    oasf_domains: Array.isArray(decodedJson.oasf_domains) ? decodedJson.oasf_domains : [],
    hasMCPServices,
    hasOASFServices,
    hasA2AServices,
    hasX402ComputeServices,
    hasWalletEndpoint,
    hasExtraServices,
    hasServiceIndexingError: indexingError,
    registrationJsonRaw: JSON.stringify(decodedJson),
    mcp,
    oasf,
    a2a,
    x402Compute,
    walletEndpoint,
    rawServicesJson
  };

  // 4. Crear Entidad Agent
  const agentEntity: Agent = {
    id: id,
    agentId: event.params.agentId,
    owner: event.params.owner.toLowerCase(),
    agentURIRaw: uri,
    agentURIJson: JSON.stringify(decodedJson),
    registration_id: id,
    name: decodedJson.name || undefined,
    description: decodedJson.description || undefined,
    imageUrl: decodedJson.image || decodedJson.imageUrl || undefined,
    web: Array.isArray(services) ? services.find((s: any) => s.name?.toLowerCase() === "web")?.endpoint : undefined,
    email: Array.isArray(services) ? services.find((s: any) => s.name?.toLowerCase() === "email")?.endpoint : undefined,
  };

  context.Registration.set(registrationEntity);
  context.Agent.set(agentEntity);
});