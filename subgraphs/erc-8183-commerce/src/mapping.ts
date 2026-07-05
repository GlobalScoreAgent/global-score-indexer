import { BigInt, Bytes, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  BudgetSet,
  JobCompleted,
  JobCreated,
  JobExpired,
  JobFunded,
  JobRejected,
  JobSubmitted,
  PaymentReleased,
  Refunded,
} from "../generated/AgenticCommerce/AgenticCommerceV3";
import {
  Erc8183Budget,
  Erc8183Delivery,
  Erc8183Job,
  Erc8183JobStatus,
  Erc8183Payment,
} from "../generated/schema";

function network(): string {
  return dataSource.network();
}

function contractAddress(): Bytes {
  return dataSource.address();
}

function implementationLabel(): string {
  let addr = contractAddress().toHexString().toLowerCase();
  if (addr == "0x1b32b85c914ea30e81f08550c1ebfc5b9d32a855") {
    return "ufx_agentic_commerce_hooked";
  }
  if (addr == "0xea4daa3100a767e86fded867729ae7446476eba6") {
    return "bnb_agentic_commerce_apex";
  }
  return addr;
}

function eventId(n: string, contract: Bytes, event: ethereum.Event): string {
  return (
    n +
    "-" +
    contract.toHexString() +
    "-" +
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString()
  );
}

function jobEntityId(n: string, contract: Bytes, jobId: BigInt): string {
  return n + "-" + contract.toHexString() + "-" + jobId.toString();
}

function jobStatusId(
  n: string,
  contract: Bytes,
  jobId: BigInt,
  statusType: string,
  event: ethereum.Event
): string {
  return (
    n +
    "-" +
    contract.toHexString() +
    "-" +
    jobId.toString() +
    "-" +
    statusType +
    "-" +
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString()
  );
}

export function handleJobCreated(event: JobCreated): void {
  let contract = contractAddress();
  let entity = new Erc8183Job(jobEntityId(network(), contract, event.params.jobId));
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.implementation = implementationLabel();
  entity.client = event.params.client;
  entity.provider = event.params.provider;
  entity.evaluator = event.params.evaluator;
  entity.expiredAt = event.params.expiredAt;
  entity.hook = event.params.hook;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleJobFunded(event: JobFunded): void {
  let contract = contractAddress();
  let entity = new Erc8183Payment(eventId(network(), contract, event));
  entity.eventType = "funded";
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.account = event.params.client;
  entity.amount = event.params.amount;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleBudgetSet(event: BudgetSet): void {
  let contract = contractAddress();
  let entity = new Erc8183Budget(eventId(network(), contract, event));
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.budget = event.params.amount;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleJobSubmitted(event: JobSubmitted): void {
  let contract = contractAddress();
  let entity = new Erc8183Delivery(eventId(network(), contract, event));
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.provider = event.params.provider;
  entity.deliverable = event.params.deliverable;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleJobCompleted(event: JobCompleted): void {
  let contract = contractAddress();
  let entity = new Erc8183JobStatus(
    jobStatusId(network(), contract, event.params.jobId, "completed", event)
  );
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.statusType = "completed";
  entity.actor = event.params.evaluator;
  entity.reason = event.params.reason;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleJobRejected(event: JobRejected): void {
  let contract = contractAddress();
  let entity = new Erc8183JobStatus(
    jobStatusId(network(), contract, event.params.jobId, "rejected", event)
  );
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.statusType = "rejected";
  entity.actor = event.params.rejector;
  entity.reason = event.params.reason;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleJobExpired(event: JobExpired): void {
  let contract = contractAddress();
  let entity = new Erc8183JobStatus(
    jobStatusId(network(), contract, event.params.jobId, "expired", event)
  );
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.statusType = "expired";
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handlePaymentReleased(event: PaymentReleased): void {
  let contract = contractAddress();
  let entity = new Erc8183Payment(eventId(network(), contract, event));
  entity.eventType = "payment_released";
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.account = event.params.provider;
  entity.amount = event.params.amount;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleRefunded(event: Refunded): void {
  let contract = contractAddress();
  let entity = new Erc8183Payment(eventId(network(), contract, event));
  entity.eventType = "refunded";
  entity.jobId = event.params.jobId;
  entity.contractAddress = contract;
  entity.account = event.params.client;
  entity.amount = event.params.amount;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}
