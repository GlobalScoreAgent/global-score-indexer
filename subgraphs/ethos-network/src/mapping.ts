import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  AddressClaim,
  InvitesAdded,
  MockProfileCreated,
  ProfileArchived,
  ProfileCreated,
  ProfileRestored,
  UserInvited,
} from "../generated/EthosProfile/EthosProfile";
import {
  ReviewArchived,
  ReviewCreated,
  ReviewEdited,
  ReviewRestored,
} from "../generated/EthosReview/EthosReview";
import {
  MarkedUnhealthy,
  Slashed as VouchSlashed,
  Unvouched,
  VouchIncreased,
  Vouched,
} from "../generated/EthosVouch/EthosVouch";
import {
  AttestationArchived,
  AttestationClaimed,
  AttestationCreated,
  AttestationRestored,
} from "../generated/EthosAttestation/EthosAttestation";
import {
  SlashCancelled,
  SlashCreated,
} from "../generated/EthosSlash/EthosSlash";
import {
  MarketCreated,
  MarketGraduated,
  MarketUpdated,
  VotesBought,
  VotesSold,
} from "../generated/ReputationMarket/ReputationMarket";
import { PostCreated, PostUpdated } from "../generated/EthosBroker/EthosBroker";
import { BondArchived, BondCreated } from "../generated/EthosBond/EthosBond";
import {
  ProjectArchived,
  ProjectCreated,
  ProjectDetailsUpdated,
} from "../generated/EthosProject/EthosProject";
import {
  EthosAttestation,
  EthosBond,
  EthosBrokerPost,
  EthosMarketTrade,
  EthosProfile,
  EthosProfileAddress,
  EthosProject,
  EthosReputationMarket,
  EthosReview,
  EthosSlash,
  EthosVouch,
} from "../generated/schema";

const ZERO = Address.fromString("0x0000000000000000000000000000000000000000");

function profileEntityId(profileId: BigInt): string {
  return profileId.toString();
}

function addressEntityId(profileId: BigInt, address: Address): string {
  return profileId.toString() + "-" + address.toHexString();
}

function tradeEntityId(event: ethereum.Event): string {
  return (
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
}

function scoreLabel(value: i32): string {
  if (value == 0) return "Negative";
  if (value == 1) return "Neutral";
  return "Positive";
}

function claimStatusLabel(value: i32): string {
  if (value == 0) return "Unclaimed";
  if (value == 1) return "Claimed";
  return "Compromised";
}

function loadOrCreateProfile(profileId: BigInt, timestamp: BigInt): EthosProfile {
  let id = profileEntityId(profileId);
  let profile = EthosProfile.load(id);
  if (profile == null) {
    profile = new EthosProfile(id);
    profile.profileId = profileId;
    profile.createdAt = timestamp;
    profile.archived = false;
    profile.isMock = false;
    profile.availableInvites = BigInt.fromI32(0);
    profile.addressCount = 0;
    profile.reviewCountGiven = 0;
    profile.reviewCountReceived = 0;
    profile.vouchCountGiven = 0;
    profile.vouchCountReceived = 0;
    profile.totalVouchedReceived = BigInt.fromI32(0);
    profile.attestationCount = 0;
  }
  return profile;
}

function saveProfileAddress(
  profileId: BigInt,
  address: Address,
  status: string,
  timestamp: BigInt
): void {
  let profile = loadOrCreateProfile(profileId, timestamp);
  let addrId = addressEntityId(profileId, address);
  let entity = EthosProfileAddress.load(addrId);
  let isNew = entity == null;
  if (entity == null) {
    entity = new EthosProfileAddress(addrId);
    entity.profile = profile.id;
    entity.address = address;
    entity.claimedAt = timestamp;
    entity.status = status;
    profile.addressCount = profile.addressCount + 1;
  } else {
    entity.status = status;
    entity.claimedAt = timestamp;
  }
  entity.save();
  profile.save();
  if (isNew) {
    // addressCount already incremented
  }
}

function resolveSubjectProfile(subject: Address): EthosProfile | null {
  if (subject.equals(ZERO)) return null;
  // Best-effort: subject profile id unknown without contract call; link later via import
  return null;
}

function loadOrCreateMarket(profileId: BigInt, timestamp: BigInt): EthosReputationMarket {
  let id = profileEntityId(profileId);
  let market = EthosReputationMarket.load(id);
  if (market == null) {
    market = new EthosReputationMarket(id);
    market.profileId = profileId;
    market.graduated = false;
    market.voteTrust = BigInt.fromI32(0);
    market.voteDistrust = BigInt.fromI32(0);
    market.trustPrice = BigInt.fromI32(0);
    market.distrustPrice = BigInt.fromI32(0);
    market.liquidity = BigInt.fromI32(0);
    market.basePrice = BigInt.fromI32(0);
    market.createdAt = timestamp;
    market.updatedAt = timestamp;
    market.profile = profileEntityId(profileId);
    loadOrCreateProfile(profileId, timestamp).save();
  }
  return market;
}

// --- EthosProfile ---

export function handleProfileCreated(event: ProfileCreated): void {
  let profileId = event.params.profileId;
  let profile = loadOrCreateProfile(profileId, event.block.timestamp);
  profile.archived = false;
  profile.isMock = false;
  profile.save();
  saveProfileAddress(
    profileId,
    event.params.addr,
    "Claimed",
    event.block.timestamp
  );
}

export function handleMockProfileCreated(event: MockProfileCreated): void {
  let profileId = event.params.mockId;
  let profile = loadOrCreateProfile(profileId, event.block.timestamp);
  profile.isMock = true;
  profile.save();
}

export function handleProfileArchived(event: ProfileArchived): void {
  let profile = loadOrCreateProfile(event.params.profileId, event.block.timestamp);
  profile.archived = true;
  profile.save();
}

export function handleProfileRestored(event: ProfileRestored): void {
  let profile = loadOrCreateProfile(event.params.profileId, event.block.timestamp);
  profile.archived = false;
  profile.save();
}

export function handleAddressClaim(event: AddressClaim): void {
  saveProfileAddress(
    event.params.profileId,
    event.params.addr,
    claimStatusLabel(event.params.claim),
    event.block.timestamp
  );
}

export function handleUserInvited(event: UserInvited): void {
  // Invitee profile may not exist yet; store inviter available invites via InvitesAdded
}

export function handleInvitesAdded(event: InvitesAdded): void {
  let profile = loadOrCreateProfile(event.params.profileId, event.block.timestamp);
  profile.availableInvites = profile.availableInvites.plus(event.params.amount);
  profile.save();
}

// --- EthosReview ---

export function handleReviewCreated(event: ReviewCreated): void {
  let reviewId = event.params.reviewId;
  let id = reviewId.toString();
  let review = new EthosReview(id);
  review.reviewId = reviewId;
  review.score = scoreLabel(event.params.score);
  review.author = event.params.author;
  review.subject = event.params.subject;
  review.attestationHash = event.params.attestationHash;
  review.comment = "";
  review.metadata = "";
  review.createdAt = event.block.timestamp;
  review.archived = false;

  let authorProfile = loadOrCreateProfile(
    event.params.profileId,
    event.block.timestamp
  );
  authorProfile.reviewCountGiven = authorProfile.reviewCountGiven + 1;
  authorProfile.save();
  review.authorProfile = authorProfile.id;

  let subjectProfile = resolveSubjectProfile(event.params.subject);
  if (subjectProfile != null) {
    review.subjectProfile = subjectProfile.id;
    subjectProfile.reviewCountReceived = subjectProfile.reviewCountReceived + 1;
    subjectProfile.save();
  }

  review.save();
}

export function handleReviewEdited(event: ReviewEdited): void {
  let review = EthosReview.load(event.params.reviewId.toString());
  if (review != null) {
    review.save();
  }
}

export function handleReviewArchived(event: ReviewArchived): void {
  let review = EthosReview.load(event.params.reviewId.toString());
  if (review != null) {
    review.archived = true;
    review.save();
  }
}

export function handleReviewRestored(event: ReviewRestored): void {
  let review = EthosReview.load(event.params.reviewId.toString());
  if (review != null) {
    review.archived = false;
    review.save();
  }
}

// --- EthosVouch ---

export function handleVouched(event: Vouched): void {
  let vouchId = event.params.vouchId;
  let id = vouchId.toString();
  let vouch = EthosVouch.load(id);
  if (vouch == null) {
    vouch = new EthosVouch(id);
    vouch.vouchId = vouchId;
    vouch.archived = false;
    vouch.unhealthy = false;
    vouch.vouchedAt = event.block.timestamp;
    vouch.comment = "";
    vouch.metadata = "";

    let author = loadOrCreateProfile(
      event.params.authorProfileId,
      event.block.timestamp
    );
    author.vouchCountGiven = author.vouchCountGiven + 1;
    author.save();
    vouch.authorProfile = author.id;

    let subject = loadOrCreateProfile(
      event.params.subjectProfileId,
      event.block.timestamp
    );
    subject.vouchCountReceived = subject.vouchCountReceived + 1;
    subject.totalVouchedReceived = subject.totalVouchedReceived.plus(
      event.params.amountStaked
    );
    subject.save();
    vouch.subjectProfile = subject.id;
  }
  vouch.balance = event.params.amountStaked;
  vouch.save();
}

export function handleVouchIncreased(event: VouchIncreased): void {
  let vouch = EthosVouch.load(event.params.vouchId.toString());
  if (vouch == null) {
    vouch = new EthosVouch(event.params.vouchId.toString());
    vouch.vouchId = event.params.vouchId;
    vouch.archived = false;
    vouch.unhealthy = false;
    vouch.vouchedAt = event.block.timestamp;
    vouch.comment = "";
    vouch.metadata = "";
    let author = loadOrCreateProfile(
      event.params.authorProfileId,
      event.block.timestamp
    );
    author.vouchCountGiven = author.vouchCountGiven + 1;
    author.save();
    vouch.authorProfile = author.id;
    let subject = loadOrCreateProfile(
      event.params.subjectProfileId,
      event.block.timestamp
    );
    subject.vouchCountReceived = subject.vouchCountReceived + 1;
    subject.totalVouchedReceived = subject.totalVouchedReceived.plus(
      event.params.amountStaked
    );
    subject.save();
    vouch.subjectProfile = subject.id;
    vouch.balance = event.params.amountStaked;
  } else {
    vouch.balance = vouch.balance.plus(event.params.amountStaked);
    let subject = EthosProfile.load(vouch.subjectProfile);
    if (subject != null) {
      subject.totalVouchedReceived = subject.totalVouchedReceived.plus(
        event.params.amountStaked
      );
      subject.save();
    }
  }
  vouch.save();
}

export function handleUnvouched(event: Unvouched): void {
  let vouch = EthosVouch.load(event.params.vouchId.toString());
  if (vouch == null) return;
  vouch.archived = true;
  vouch.unvouchedAt = event.block.timestamp;
  vouch.balance = BigInt.fromI32(0);

  let subject = EthosProfile.load(vouch.subjectProfile);
  if (subject != null) {
    subject.totalVouchedReceived = BigInt.fromI32(0);
    subject.save();
  }
  vouch.save();
}

export function handleMarkedUnhealthy(event: MarkedUnhealthy): void {
  let vouch = EthosVouch.load(event.params.vouchId.toString());
  if (vouch == null) return;
  vouch.unhealthy = true;
  vouch.save();
}

export function handleVouchSlashed(event: VouchSlashed): void {
  let profile = loadOrCreateProfile(
    event.params.authorProfileId,
    event.block.timestamp
  );
  profile.save();
}

// --- EthosAttestation ---

export function handleAttestationCreated(event: AttestationCreated): void {
  let attestationId = event.params.attestationId;
  let id = attestationId.toString();
  let attestation = new EthosAttestation(id);
  attestation.attestationId = attestationId;
  attestation.service = event.params.service;
  attestation.account = event.params.account;
  attestation.evidence = event.params.evidence;
  attestation.createdAt = event.block.timestamp;
  attestation.archived = false;

  let profile = loadOrCreateProfile(event.params.profileId, event.block.timestamp);
  profile.attestationCount = profile.attestationCount + 1;
  profile.save();
  attestation.profile = profile.id;
  attestation.save();
}

export function handleAttestationArchived(event: AttestationArchived): void {
  let attestation = EthosAttestation.load(event.params.attestationId.toString());
  if (attestation != null) {
    attestation.archived = true;
    attestation.save();
  }
}

export function handleAttestationClaimed(event: AttestationClaimed): void {
  let id = event.params.attestationId.toString();
  let attestation = EthosAttestation.load(id);
  if (attestation == null) {
    attestation = new EthosAttestation(id);
    attestation.attestationId = event.params.attestationId;
    attestation.createdAt = event.block.timestamp;
    attestation.archived = false;
  }
  attestation.service = event.params.service;
  attestation.account = event.params.account;
  attestation.evidence = event.params.evidence;
  let profile = loadOrCreateProfile(event.params.profileId, event.block.timestamp);
  profile.attestationCount = profile.attestationCount + 1;
  profile.save();
  attestation.profile = profile.id;
  attestation.save();
}

export function handleAttestationRestored(event: AttestationRestored): void {
  let attestation = EthosAttestation.load(event.params.attestationId.toString());
  if (attestation != null) {
    attestation.archived = false;
    attestation.save();
  }
}

// --- EthosSlash ---

export function handleSlashCreated(event: SlashCreated): void {
  let slashId = event.params.id;
  let slash = new EthosSlash(slashId.toString());
  slash.slashId = slashId;
  slash.amount = event.params.amount;
  slash.createdAt = event.params.createdAt;
  slash.archived = false;
  slash.slashType = event.params.slashType;
  slash.comment = event.params.comment;
  slash.metadata = event.params.metadata;
  slash.subject = event.params.subject;
  slash.attestationHash = event.params.attestationHash;

  let author = loadOrCreateProfile(
    event.params.authorProfileId,
    event.block.timestamp
  );
  author.save();
  slash.authorProfile = author.id;

  let subjectProfile = resolveSubjectProfile(event.params.subject);
  if (subjectProfile != null) {
    slash.subjectProfile = subjectProfile.id;
  }

  slash.save();
}

export function handleSlashCancelled(event: SlashCancelled): void {
  let slash = EthosSlash.load(event.params.id.toString());
  if (slash != null) {
    slash.archived = true;
    slash.save();
  }
}

// --- Reputation Market ---

export function handleMarketCreated(event: MarketCreated): void {
  let profileId = event.params.profileId;
  let market = loadOrCreateMarket(profileId, event.block.timestamp);
  market.liquidity = event.params.config.liquidity;
  market.basePrice = event.params.config.basePrice;
  market.createdAt = event.block.timestamp;
  market.updatedAt = event.block.timestamp;
  market.save();
}

export function handleMarketUpdated(event: MarketUpdated): void {
  let market = loadOrCreateMarket(event.params.profileId, event.block.timestamp);
  market.voteTrust = event.params.voteTrust;
  market.voteDistrust = event.params.voteDistrust;
  market.trustPrice = event.params.trustPrice;
  market.distrustPrice = event.params.distrustPrice;
  market.updatedAt = event.params.updatedAt;
  market.save();
}

export function handleMarketGraduated(event: MarketGraduated): void {
  let market = loadOrCreateMarket(event.params.profileId, event.block.timestamp);
  market.graduated = true;
  market.updatedAt = event.block.timestamp;
  market.save();
}

export function handleVotesBought(event: VotesBought): void {
  let trade = new EthosMarketTrade(tradeEntityId(event));
  trade.profileId = event.params.profileId;
  trade.trader = event.params.buyer;
  trade.isPositive = event.params.isPositive;
  trade.isBuy = true;
  trade.amount = event.params.amount;
  trade.funds = event.params.funds;
  trade.timestamp = event.params.boughtAt;
  trade.txHash = event.transaction.hash;
  trade.market = profileEntityId(event.params.profileId);
  trade.save();
}

export function handleVotesSold(event: VotesSold): void {
  let trade = new EthosMarketTrade(tradeEntityId(event));
  trade.profileId = event.params.profileId;
  trade.trader = event.params.seller;
  trade.isPositive = event.params.isPositive;
  trade.isBuy = false;
  trade.amount = event.params.amount;
  trade.funds = event.params.funds;
  trade.timestamp = event.params.soldAt;
  trade.txHash = event.transaction.hash;
  trade.market = profileEntityId(event.params.profileId);
  trade.save();
}

// --- EthosBroker ---

export function handlePostCreated(event: PostCreated): void {
  let postId = event.params.id;
  let post = new EthosBrokerPost(postId.toString());
  post.postId = postId;
  post.authorProfileId = event.params.authorProfileId;
  post.type = "";
  post.title = event.params.title;
  post.description = event.params.description;
  post.cost = event.params.price;
  post.tags = event.params.metadata;
  post.level = event.params.level;
  post.createdAt = event.params.createdAt;
  post.updatedAt = event.params.createdAt;
  post.txHash = event.transaction.hash;

  let author = loadOrCreateProfile(
    event.params.authorProfileId,
    event.block.timestamp
  );
  author.save();
  post.authorProfile = author.id;
  post.save();
}

export function handlePostUpdated(event: PostUpdated): void {
  let post = EthosBrokerPost.load(event.params.id.toString());
  if (post == null) {
    post = new EthosBrokerPost(event.params.id.toString());
    post.postId = event.params.id;
    post.authorProfileId = event.params.authorProfileId;
    post.type = "";
    post.tags = event.params.metadata;
    post.level = 0;
    post.createdAt = event.params.updatedAt;
    post.txHash = event.transaction.hash;
    let author = loadOrCreateProfile(
      event.params.authorProfileId,
      event.block.timestamp
    );
    author.save();
    post.authorProfile = author.id;
  }
  post.title = event.params.title;
  post.description = event.params.description;
  post.cost = event.params.price;
  post.tags = event.params.metadata;
  post.updatedAt = event.params.updatedAt;
  post.save();
}

// --- EthosBond ---

export function handleBondCreated(event: BondCreated): void {
  let bondId = event.params.bondId;
  let bond = new EthosBond(bondId.toString());
  bond.bondId = bondId;
  bond.amount = event.params.amount;
  bond.bondType = event.params.bondType;
  bond.amountType = event.params.amountType;
  bond.status = "active";
  bond.createdAt = event.block.timestamp;
  bond.releasedAt = null;

  let author = loadOrCreateProfile(
    event.params.authorProfileId,
    event.block.timestamp
  );
  author.save();
  bond.authorProfile = author.id;
  bond.save();
}

export function handleBondArchived(event: BondArchived): void {
  let bond = EthosBond.load(event.params.bondId.toString());
  if (bond == null) return;
  bond.status = "archived";
  bond.releasedAt = event.block.timestamp;
  bond.save();
}

// --- EthosProject ---

function userkeyFromAttestation(account: string, service: string): string {
  if (service.length > 0 && account.length > 0) {
    return service + ":" + account;
  }
  return account;
}

export function handleProjectCreated(event: ProjectCreated): void {
  let projectId = event.params.id;
  let project = new EthosProject(projectId.toString());
  project.projectId = projectId;
  project.createdAt = event.params.createdAt;
  project.updatedAt = event.params.createdAt;
  project.description = event.params.metadata;
  project.name = "";
  project.userkey = userkeyFromAttestation(
    event.params.attestationDetails.account,
    event.params.attestationDetails.service
  );
  project.status = event.params.archived ? "archived" : "active";

  let ownerProfileId =
    event.params.managerProfileIds.length > 0
      ? event.params.managerProfileIds[0]
      : BigInt.fromI32(0);
  let owner = loadOrCreateProfile(ownerProfileId, event.block.timestamp);
  owner.save();
  project.ownerProfile = owner.id;
  project.save();
}

export function handleProjectArchived(event: ProjectArchived): void {
  let project = EthosProject.load(event.params.id.toString());
  if (project == null) return;
  project.status = event.params.archived ? "archived" : "active";
  project.updatedAt = event.block.timestamp;
  project.save();
}

export function handleProjectDetailsUpdated(event: ProjectDetailsUpdated): void {
  let project = EthosProject.load(event.params.id.toString());
  if (project == null) {
    project = new EthosProject(event.params.id.toString());
    project.projectId = event.params.id;
    project.createdAt = event.block.timestamp;
    project.status = "active";
    let owner = loadOrCreateProfile(BigInt.fromI32(0), event.block.timestamp);
    owner.save();
    project.ownerProfile = owner.id;
  }
  project.name = event.params.name;
  project.description = event.params.metadata;
  project.userkey = userkeyFromAttestation(
    event.params.attestationDetails.account,
    event.params.attestationDetails.service
  );
  project.updatedAt = event.block.timestamp;
  project.save();
}
