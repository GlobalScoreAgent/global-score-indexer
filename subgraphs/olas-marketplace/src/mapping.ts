import { Address, BigInt, Bytes, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  CreateMech,
  Deliver,
  MarketplaceDelivery,
  MarketplaceDeliveryWithSignatures,
  MarketplaceRequest,
} from "../generated/MechMarketplace/MechMarketplace";
import {
  Deposit as DepositNative,
  Drained as DrainedNative,
  MechBalanceAdjusted as MechBalanceAdjustedNative,
  RequesterBalanceAdjusted as RequesterBalanceAdjustedNative,
  Withdraw as WithdrawNative,
} from "../generated/BalanceTrackerNative/BalanceTracker";
import {
  Deposit as DepositOlas,
  Drained as DrainedOlas,
  MechBalanceAdjusted as MechBalanceAdjustedOlas,
  RequesterBalanceAdjusted as RequesterBalanceAdjustedOlas,
  Withdraw as WithdrawOlas,
} from "../generated/BalanceTrackerOlas/BalanceTracker";
import {
  Deposit as DepositUsdc,
  Drained as DrainedUsdc,
  MechBalanceAdjusted as MechBalanceAdjustedUsdc,
  RequesterBalanceAdjusted as RequesterBalanceAdjustedUsdc,
  Withdraw as WithdrawUsdc,
} from "../generated/BalanceTrackerUsdc/BalanceTracker";
import {
  Deposit as DepositNvm,
  Drained as DrainedNvm,
  MechBalanceAdjusted as MechBalanceAdjustedNvm,
  RequesterBalanceAdjusted as RequesterBalanceAdjustedNvm,
  RequesterCreditsRedeemed as RequesterCreditsRedeemedNvm,
  Withdraw as WithdrawNvm,
} from "../generated/BalanceTrackerNvm/BalanceTrackerNvm";
import {
  Deposit as DepositNvmUsdc,
  Drained as DrainedNvmUsdc,
  MechBalanceAdjusted as MechBalanceAdjustedNvmUsdc,
  RequesterBalanceAdjusted as RequesterBalanceAdjustedNvmUsdc,
  Withdraw as WithdrawNvmUsdc,
} from "../generated/BalanceTrackerNvmUsdc/BalanceTrackerNvm";
import {
  MechKarmaChanged,
  RequesterMechKarmaChanged,
} from "../generated/Karma/Karma";
import {
  OlasBalanceEvent,
  OlasDeliver,
  OlasKarmaChange,
  OlasMarketplaceDelivery,
  OlasMarketplaceRequest,
  OlasMech,
} from "../generated/schema";

function network(): string {
  return dataSource.network();
}

function eventId(n: string, event: ethereum.Event): string {
  return n + "-" + event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
}

function requestEntityId(n: string, requestId: Bytes): string {
  return n + "-" + requestId.toHexString();
}

function mechEntityId(n: string, mech: Address): string {
  return n + "-" + mech.toHexString();
}

function touchMech(mech: Address, timestamp: BigInt): void {
  let id = mechEntityId(network(), mech);
  let entity = OlasMech.load(id);
  if (entity != null) {
    entity.lastActivityAt = timestamp;
    entity.save();
  }
}

function upsertMechFromCreate(
  mech: Address,
  serviceId: BigInt,
  mechFactory: Address,
  timestamp: BigInt
): void {
  let n = network();
  let id = mechEntityId(n, mech);
  let entity = OlasMech.load(id);
  if (entity == null) {
    entity = new OlasMech(id);
    entity.mech = mech;
    entity.serviceId = serviceId;
    entity.mechFactory = mechFactory;
    entity.chainId = n;
    entity.firstSeenAt = timestamp;
    entity.lastActivityAt = timestamp;
  } else {
    entity.serviceId = serviceId;
    entity.mechFactory = mechFactory;
    entity.lastActivityAt = timestamp;
  }
  entity.save();
}

function saveBalanceEvent(
  event: ethereum.Event,
  eventType: string,
  paymentType: string,
  account: Bytes | null,
  mech: Bytes | null,
  requester: Bytes | null,
  token: Bytes | null,
  amount: BigInt | null,
  deliveryRate: BigInt | null,
  balance: BigInt | null,
  rateDiff: BigInt | null,
  collectedFees: BigInt | null
): void {
  let n = network();
  let entity = new OlasBalanceEvent(eventId(n, event));
  entity.eventType = eventType;
  entity.paymentType = paymentType;
  entity.balanceTracker = dataSource.address();
  entity.account = account;
  entity.mech = mech;
  entity.requester = requester;
  entity.token = token;
  entity.amount = amount;
  entity.deliveryRate = deliveryRate;
  entity.balance = balance;
  entity.rateDiff = rateDiff;
  entity.collectedFees = collectedFees;
  entity.chainId = n;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

// --- MechMarketplace ---

export function handleCreateMech(event: CreateMech): void {
  upsertMechFromCreate(
    event.params.mech,
    event.params.serviceId,
    event.params.mechFactory,
    event.block.timestamp
  );
}

export function handleMarketplaceRequest(event: MarketplaceRequest): void {
  let n = network();
  let requestIds = event.params.requestIds;
  for (let i = 0; i < requestIds.length; i++) {
    let requestId = requestIds[i];
    let id = requestEntityId(n, requestId);
    let entity = new OlasMarketplaceRequest(id);
    entity.requestId = requestId;
    entity.priorityMech = event.params.priorityMech;
    entity.requester = event.params.requester;
    entity.chainId = n;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.logIndex = event.logIndex;
    entity.save();
  }
  touchMech(event.params.priorityMech, event.block.timestamp);
}

export function handleMarketplaceDelivery(event: MarketplaceDelivery): void {
  let n = network();
  let requestIds = event.params.requestIds;
  let requesters = event.params.requesters;
  let deliveredRequests = event.params.deliveredRequests;
  for (let i = 0; i < requestIds.length; i++) {
    let requester = i < requesters.length ? requesters[i] : requesters[0];
    let delivered = i < deliveredRequests.length ? deliveredRequests[i] : false;
    let id =
      requestEntityId(n, requestIds[i]) +
      "-" +
      event.params.deliveryMech.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      i.toString();
    let entity = new OlasMarketplaceDelivery(id);
    entity.requestId = requestIds[i];
    entity.deliveryMech = event.params.deliveryMech;
    entity.requester = requester;
    entity.delivered = delivered;
    entity.numDeliveries = event.params.numDeliveries;
    entity.deliverySource = "MarketplaceDelivery";
    entity.chainId = n;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.logIndex = event.logIndex;
    entity.save();
  }
  touchMech(event.params.deliveryMech, event.block.timestamp);
}

export function handleMarketplaceDeliveryWithSignatures(
  event: MarketplaceDeliveryWithSignatures
): void {
  let n = network();
  let requestIds = event.params.requestIds;
  for (let i = 0; i < requestIds.length; i++) {
    let id =
      requestEntityId(n, requestIds[i]) +
      "-" +
      event.params.deliveryMech.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      i.toString();
    let entity = new OlasMarketplaceDelivery(id);
    entity.requestId = requestIds[i];
    entity.deliveryMech = event.params.deliveryMech;
    entity.requester = event.params.requester;
    entity.delivered = true;
    entity.numDeliveries = event.params.numDeliveries;
    entity.deliverySource = "MarketplaceDeliveryWithSignatures";
    entity.chainId = n;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.logIndex = event.logIndex;
    entity.save();
  }
  touchMech(event.params.deliveryMech, event.block.timestamp);
}

export function handleDeliver(event: Deliver): void {
  let n = network();
  let entity = new OlasDeliver(eventId(n, event));
  entity.requestId = event.params.requestId;
  entity.mech = event.params.mech;
  entity.mechServiceMultisig = event.params.mechServiceMultisig;
  entity.deliveryRate = event.params.deliveryRate;
  entity.data = event.params.data;
  entity.chainId = n;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
  touchMech(event.params.mech, event.block.timestamp);
}

// --- Karma ---

export function handleMechKarmaChanged(event: MechKarmaChanged): void {
  let n = network();
  let entity = new OlasKarmaChange(eventId(n, event));
  entity.changeType = "mech";
  entity.mech = event.params.mech;
  entity.requester = null;
  entity.karmaChange = event.params.karmaChange;
  entity.chainId = n;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
  touchMech(event.params.mech, event.block.timestamp);
}

export function handleRequesterMechKarmaChanged(event: RequesterMechKarmaChanged): void {
  let n = network();
  let entity = new OlasKarmaChange(eventId(n, event));
  entity.changeType = "requesterMech";
  entity.mech = event.params.mech;
  entity.requester = event.params.requester;
  entity.karmaChange = event.params.karmaChange;
  entity.chainId = n;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
  touchMech(event.params.mech, event.block.timestamp);
}

// --- BalanceTracker native ---

export function handleDeposit(event: DepositNative): void {
  saveBalanceEvent(
    event,
    "Deposit",
    "native",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleRequesterBalanceAdjusted(event: RequesterBalanceAdjustedNative): void {
  saveBalanceEvent(
    event,
    "RequesterBalanceAdjusted",
    "native",
    null,
    null,
    event.params.requester,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    null,
    null
  );
}

export function handleMechBalanceAdjusted(event: MechBalanceAdjustedNative): void {
  saveBalanceEvent(
    event,
    "MechBalanceAdjusted",
    "native",
    null,
    event.params.mech,
    null,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    event.params.rateDiff,
    null
  );
  touchMech(event.params.mech, event.block.timestamp);
}

export function handleWithdraw(event: WithdrawNative): void {
  saveBalanceEvent(
    event,
    "Withdraw",
    "native",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleDrained(event: DrainedNative): void {
  saveBalanceEvent(
    event,
    "Drained",
    "native",
    null,
    null,
    null,
    event.params.token,
    null,
    null,
    null,
    null,
    event.params.collectedFees
  );
}

// --- BalanceTracker OLAS ---

export function handleDepositOlas(event: DepositOlas): void {
  saveBalanceEvent(
    event,
    "Deposit",
    "olas",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleRequesterBalanceAdjustedOlas(event: RequesterBalanceAdjustedOlas): void {
  saveBalanceEvent(
    event,
    "RequesterBalanceAdjusted",
    "olas",
    null,
    null,
    event.params.requester,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    null,
    null
  );
}

export function handleMechBalanceAdjustedOlas(event: MechBalanceAdjustedOlas): void {
  saveBalanceEvent(
    event,
    "MechBalanceAdjusted",
    "olas",
    null,
    event.params.mech,
    null,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    event.params.rateDiff,
    null
  );
  touchMech(event.params.mech, event.block.timestamp);
}

export function handleWithdrawOlas(event: WithdrawOlas): void {
  saveBalanceEvent(
    event,
    "Withdraw",
    "olas",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleDrainedOlas(event: DrainedOlas): void {
  saveBalanceEvent(
    event,
    "Drained",
    "olas",
    null,
    null,
    null,
    event.params.token,
    null,
    null,
    null,
    null,
    event.params.collectedFees
  );
}

// --- BalanceTracker USDC ---

export function handleDepositUsdc(event: DepositUsdc): void {
  saveBalanceEvent(
    event,
    "Deposit",
    "usdc",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleRequesterBalanceAdjustedUsdc(event: RequesterBalanceAdjustedUsdc): void {
  saveBalanceEvent(
    event,
    "RequesterBalanceAdjusted",
    "usdc",
    null,
    null,
    event.params.requester,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    null,
    null
  );
}

export function handleMechBalanceAdjustedUsdc(event: MechBalanceAdjustedUsdc): void {
  saveBalanceEvent(
    event,
    "MechBalanceAdjusted",
    "usdc",
    null,
    event.params.mech,
    null,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    event.params.rateDiff,
    null
  );
  touchMech(event.params.mech, event.block.timestamp);
}

export function handleWithdrawUsdc(event: WithdrawUsdc): void {
  saveBalanceEvent(
    event,
    "Withdraw",
    "usdc",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleDrainedUsdc(event: DrainedUsdc): void {
  saveBalanceEvent(
    event,
    "Drained",
    "usdc",
    null,
    null,
    null,
    event.params.token,
    null,
    null,
    null,
    null,
    event.params.collectedFees
  );
}

// --- BalanceTracker NVM ---

export function handleDepositNvm(event: DepositNvm): void {
  saveBalanceEvent(
    event,
    "Deposit",
    "nvm",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleRequesterBalanceAdjustedNvm(event: RequesterBalanceAdjustedNvm): void {
  saveBalanceEvent(
    event,
    "RequesterBalanceAdjusted",
    "nvm",
    null,
    null,
    event.params.requester,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    null,
    null
  );
}

export function handleMechBalanceAdjustedNvm(event: MechBalanceAdjustedNvm): void {
  saveBalanceEvent(
    event,
    "MechBalanceAdjusted",
    "nvm",
    null,
    event.params.mech,
    null,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    event.params.rateDiff,
    null
  );
  touchMech(event.params.mech, event.block.timestamp);
}

export function handleWithdrawNvm(event: WithdrawNvm): void {
  saveBalanceEvent(
    event,
    "Withdraw",
    "nvm",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleDrainedNvm(event: DrainedNvm): void {
  saveBalanceEvent(
    event,
    "Drained",
    "nvm",
    null,
    null,
    null,
    event.params.token,
    null,
    null,
    null,
    null,
    event.params.collectedFees
  );
}

export function handleRequesterCreditsRedeemedNvm(event: RequesterCreditsRedeemedNvm): void {
  saveBalanceEvent(
    event,
    "RequesterCreditsRedeemed",
    "nvm",
    event.params.account,
    null,
    null,
    null,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

// --- BalanceTracker NVM USDC ---

export function handleDepositNvmUsdc(event: DepositNvmUsdc): void {
  saveBalanceEvent(
    event,
    "Deposit",
    "nvm_usdc",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleRequesterBalanceAdjustedNvmUsdc(
  event: RequesterBalanceAdjustedNvmUsdc
): void {
  saveBalanceEvent(
    event,
    "RequesterBalanceAdjusted",
    "nvm_usdc",
    null,
    null,
    event.params.requester,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    null,
    null
  );
}

export function handleMechBalanceAdjustedNvmUsdc(event: MechBalanceAdjustedNvmUsdc): void {
  saveBalanceEvent(
    event,
    "MechBalanceAdjusted",
    "nvm_usdc",
    null,
    event.params.mech,
    null,
    null,
    null,
    event.params.deliveryRate,
    event.params.balance,
    event.params.rateDiff,
    null
  );
  touchMech(event.params.mech, event.block.timestamp);
}

export function handleWithdrawNvmUsdc(event: WithdrawNvmUsdc): void {
  saveBalanceEvent(
    event,
    "Withdraw",
    "nvm_usdc",
    event.params.account,
    null,
    null,
    event.params.token,
    event.params.amount,
    null,
    null,
    null,
    null
  );
}

export function handleDrainedNvmUsdc(event: DrainedNvmUsdc): void {
  saveBalanceEvent(
    event,
    "Drained",
    "nvm_usdc",
    null,
    null,
    null,
    event.params.token,
    null,
    null,
    null,
    null,
    event.params.collectedFees
  );
}
