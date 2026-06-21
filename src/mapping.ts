import { json, JSONValueKind, JSONValue, TypedMap, Bytes, BigInt, dataSource, log } from "@graphprotocol/graph-ts";
import { Registered, NewFeedback, ResponseAppended, FeedbackRevoked } from "../generated/AgentRegistry/AgentRegistry";
import { Agent, Feedback, FeedbackResponse } from "../generated/schema";

// --- FUNCIONES AUXILIARES ---

function extractStringArray(obj: TypedMap<string, JSONValue>, key: string): string[] {
  let val = obj.get(key);
  if (val && val.kind == JSONValueKind.ARRAY) {
    let arr = val.toArray();
    let result: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].kind == JSONValueKind.STRING) {
        result.push(arr[i].toString());
      }
    }
    return result;
  }
  return [];
}

function base64ToBytes(base64: string): Bytes {
  let lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let len = base64.length;
  let padding = 0;
  if (base64.endsWith("==")) padding = 2;
  else if (base64.endsWith("=")) padding = 1;
  let bufferSize = (len * 3) / 4 - padding;
  let buffer = new Uint8Array(bufferSize);
  let i = 0, j = 0;
  while (i < len) {
    let enc1 = lookup.indexOf(base64.charAt(i++));
    let enc2 = lookup.indexOf(base64.charAt(i++));
    let enc3 = lookup.indexOf(base64.charAt(i++));
    let enc4 = lookup.indexOf(base64.charAt(i++));
    if (j < bufferSize) buffer[j++] = ((enc1 << 2) | (enc2 >> 4)) as u8;
    if (j < bufferSize) buffer[j++] = (((enc2 & 15) << 4) | (enc3 >> 2)) as u8;
    if (j < bufferSize) buffer[j++] = (((enc3 & 3) << 6) | enc4) as u8;
  }
  return Bytes.fromUint8Array(buffer);
}

// --- HANDLERS ---

export function handleRegistered(event: Registered): void {
  let network = dataSource.network(); 
  let id = network + "-" + event.params.agentId.toString(); 

  let agent = new Agent(id);
  agent.agentId = event.params.agentId;
  agent.owner = event.params.owner;
  agent.agentURIRaw = event.params.agentURI;
  agent.chainId = network;
  agent.agentWallet = event.params.owner;
  agent.createdAt = event.block.timestamp;
  agent.updatedAt = event.block.timestamp;
  agent.lastActivityAt = event.block.timestamp;
  agent.active = true;
  
  agent.hasMCPServices = false;
  agent.hasOASFServices = false;
  agent.hasA2AServices = false;
  agent.hasX402ComputeServices = false;
  agent.hasWalletEndpoint = false;
  agent.hasExtraServices = false;
  agent.hasServiceIndexingError = false;

  agent.save();

  let uri = event.params.agentURI;
  let base64Index = uri.indexOf("base64,");

  if (base64Index != -1) {
    let base64Data = uri.substring(base64Index + 7);
    let decoded: Bytes = base64ToBytes(base64Data);
    
    agent.registrationJsonRaw = decoded.toHexString();
    agent.agentURIJson = decoded.toHexString();

    let jsonResult = json.try_fromBytes(decoded);
    
    if (!jsonResult.isError && jsonResult.value.kind == JSONValueKind.OBJECT) {
      let obj = jsonResult.value.toObject();
      
      let name = obj.get("name"); 
      if (name && name.kind == JSONValueKind.STRING) agent.name = name.toString();
      
      let desc = obj.get("description"); 
      if (desc && desc.kind == JSONValueKind.STRING) agent.description = desc.toString();
      
      let img = obj.get("image"); 
      if (img && img.kind == JSONValueKind.STRING) agent.imageUrl = img.toString();
      
      let active = obj.get("active"); 
      if (active && active.kind == JSONValueKind.BOOL) agent.active = active.toBool();

      agent.supportedTrust = extractStringArray(obj, "supportedTrust");
      agent.tags = extractStringArray(obj, "tags");
      agent.oasf_skills = extractStringArray(obj, "oasf_skills");
      agent.oasf_domains = extractStringArray(obj, "oasf_domains");

      agent.save();
    } else {
      agent.hasServiceIndexingError = true;
      agent.save();
      log.warning("JSON inválido para agente {}.", [id]);
    }
  }
}

export function handleNewFeedback(event: NewFeedback): void {
  let network = dataSource.network();
  let feedbackId = network + "-" + event.params.agentId.toString() + "-" + event.params.clientAddress.toHex() + "-" + event.params.feedbackIndex.toString();
  
  let feedback = new Feedback(feedbackId);
  feedback.agent = network + "-" + event.params.agentId.toString(); 
  feedback.chainId = network;
  feedback.clientAddress = event.params.clientAddress;
  feedback.value = event.params.value; 
  
  feedback.feedbackIndex = event.params.feedbackIndex; 
  
  feedback.txFrom = event.transaction.from;
  feedback.txNonce = event.transaction.nonce;
  feedback.gasPrice = event.transaction.gasPrice;
  
  let receipt = event.receipt;
  if (receipt !== null) {
    feedback.gasUsed = receipt.gasUsed;
  } else {
    feedback.gasUsed = BigInt.fromI32(135000); 
  }

  feedback.blockNumber = event.block.number;
  feedback.logIndex = event.logIndex;

  let uriBytes = Bytes.fromUTF8(event.params.feedbackURI);
  feedback.feedbackURI = uriBytes.toHexString();
  feedback.feedbackURIRaw = uriBytes.toHexString();
  feedback.feedbackHash = event.params.feedbackHash;
  feedback.endpoint = event.params.endpoint;
  feedback.tag1 = event.params.tag1;
  feedback.tag2 = event.params.tag2;
  feedback.createdAt = event.block.timestamp;
  feedback.isRevoked = false;
  
  feedback.save();
}

export function handleResponseAppended(event: ResponseAppended): void {
  let network = dataSource.network();
  let responseId = network + "-" + event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  
  let response = new FeedbackResponse(responseId);
  response.feedback = network + "-" + event.params.agentId.toString() + "-" + event.params.clientAddress.toHex() + "-" + event.params.feedbackIndex.toString();
  response.responder = event.params.responder; 
  
  let responseUriBytes = Bytes.fromUTF8(event.params.responseURI);
  response.responseUri = responseUriBytes.toHexString();
  response.responseURIRaw = responseUriBytes.toHexString();
  
  response.responseHash = event.params.responseHash;
  response.createdAt = event.block.timestamp;
  
  response.save();
}

export function handleFeedbackRevoked(event: FeedbackRevoked): void {
  let network = dataSource.network();
  let feedbackId = network + "-" + event.params.agentId.toString() + "-" + event.params.clientAddress.toHex() + "-" + event.params.feedbackIndex.toString();
  
  let feedback = Feedback.load(feedbackId);
  if (feedback) {
    feedback.isRevoked = true;
    feedback.revokedAt = event.block.timestamp;
    feedback.save();
    log.info("Feedback revocado detectado: {}", [feedbackId]);
  }
}
