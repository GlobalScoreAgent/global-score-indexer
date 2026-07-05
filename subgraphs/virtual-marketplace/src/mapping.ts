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
} from "../generated/ACPCore/AgenticCommerceV3";
import { Graduated, Launched } from "../generated/Bonding/Bonding";
import { NewApplication, NewPersona } from "../generated/AgentFactory/AgentFactoryV3";
import {
  VirtualAcpBudget,
  VirtualAcpDelivery,
  VirtualAcpJob,
  VirtualAcpJobStatus,
  VirtualAcpPayment,
  VirtualAgentApplication,
  VirtualAgentGraduation,
  VirtualAgentPersona,
  VirtualBondLaunch,
} from "../generated/schema";

function network(): string {
  return dataSource.network();
}

function eventId(n: string, event: ethereum.Event): string {
  return n + "-" + event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
}

function jobEntityId(n: string, jobId: BigInt): string {
  return n + "-" + jobId.toString();
}

function jobStatusId(n: string, jobId: BigInt, statusType: string, event: ethereum.Event): string {
  return (
    n +
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
  let entity = new VirtualAcpJob(jobEntityId(network(), event.params.jobId));
  entity.jobId = event.params.jobId;
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
  let entity = new VirtualAcpPayment(eventId(network(), event));
  entity.eventType = "funded";
  entity.jobId = event.params.jobId;
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
  let entity = new VirtualAcpBudget(eventId(network(), event));
  entity.jobId = event.params.jobId;
  entity.budget = event.params.amount;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleJobSubmitted(event: JobSubmitted): void {
  let entity = new VirtualAcpDelivery(eventId(network(), event));
  entity.jobId = event.params.jobId;
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
  let entity = new VirtualAcpJobStatus(
    jobStatusId(network(), event.params.jobId, "completed", event)
  );
  entity.jobId = event.params.jobId;
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
  let entity = new VirtualAcpJobStatus(
    jobStatusId(network(), event.params.jobId, "rejected", event)
  );
  entity.jobId = event.params.jobId;
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
  let entity = new VirtualAcpJobStatus(
    jobStatusId(network(), event.params.jobId, "expired", event)
  );
  entity.jobId = event.params.jobId;
  entity.statusType = "expired";
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handlePaymentReleased(event: PaymentReleased): void {
  let entity = new VirtualAcpPayment(eventId(network(), event));
  entity.eventType = "payment_released";
  entity.jobId = event.params.jobId;
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
  let entity = new VirtualAcpPayment(eventId(network(), event));
  entity.eventType = "refunded";
  entity.jobId = event.params.jobId;
  entity.account = event.params.client;
  entity.amount = event.params.amount;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleLaunched(event: Launched): void {
  let entity = new VirtualBondLaunch(eventId(network(), event));
  entity.token = event.params.token;
  entity.pair = event.params.pair;
  entity.launchIndex = event.params.param2;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleGraduated(event: Graduated): void {
  let entity = new VirtualAgentGraduation(eventId(network(), event));
  entity.token = event.params.token;
  entity.agentToken = event.params.agentToken;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleNewApplication(event: NewApplication): void {
  let entity = new VirtualAgentApplication(eventId(network(), event));
  entity.applicationId = event.params.id;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}

export function handleNewPersona(event: NewPersona): void {
  let entity = new VirtualAgentPersona(eventId(network(), event));
  entity.virtualId = event.params.virtualId;
  entity.token = event.params.token;
  entity.dao = event.params.dao;
  entity.tba = event.params.tba;
  entity.veToken = event.params.veToken;
  entity.lp = event.params.lp;
  entity.chainId = network();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.save();
}
