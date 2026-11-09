# Changelog

All notable changes to the `strataflow-backend` repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-11-09

### Added & Hardened
- **IPFS Multi-Gateway Redundancy Pipeline**: Integrated redundant gateway resolution across Cloudflare IPFS, Pinata, DWeb.link, and IPFS.io in `IpfsVerifierService.getAllGatewayUrls` and `/api/ipfs/verify`.
- **Actionable Storage TTL Monitoring**: Enhanced `/api/contract/ttl/:agreementId` with explicit `healthStatus` classifications (`STORAGE_HEALTHY`, `EXTENSION_RECOMMENDED`, `CRITICAL_EXTENSION_REQUIRED`) and actionable on-chain remediation guidance.
- **On-Chain Dispute & Milestone Queries**: Added simulation queries in `ContractClientService` for `getDisputeWindowRemaining` and `getMilestoneRejectionCount`.
- **Contribution Standards**: Streamlined issue and PR templates with dedicated protocol task specifications.

## [1.1.0] - 2026-11-09

### Security Hardening
- **SSRF Egress Defense**: Implemented `WebhookDispatcherService.isSafeWebhookUrl` to prevent Server-Side Request Forgery. Blocks loopback (`127.0.0.0/8`), cloud metadata (`169.254.169.254`), RFC1918 private IPv4 subnets, carrier-grade NAT, and internal domains.
- **Webhook Route Access Control**: Added cryptographic authentication checking on `DELETE /api/webhooks/:subscriptionId` to ensure only authorized owners can delete webhook subscriptions.
- **Credential Masking in Logging**: Enhanced recursive log sanitizer to redact Stellar secret seeds (`S...`), HMAC keys, and JWT secrets across all error outputs.
- **Timing Attack Resistance**: Applied constant-time comparison for all HMAC signature checks and token authentication verifications.

### Added
- **Checkpoint Persistence**: Implemented `getHighestIndexedLedger()` in `agreement-repo.ts` so the Soroban event indexer resumes polling from `highestIndexed + 1` across process restarts.
- **Bounded Deduplication Cache**: Added automated cache eviction on `processedEventIds` to prevent unbounded heap memory consumption.
- **Off-Chain Metadata API**: Added `saveMetadata` and `getMetadata` repository methods and exposed `GET /api/metadata/:cid` for IPFS content resolution.
- **Participant Query Endpoint**: Added `GET /api/agreements/party/:address` to query agreements by participant public key and role.
- **Extended Protocol Analytics**: Added `GET /api/stats/extended` to compute velocity metrics, dispute frequencies, and volume distributions.
- **Test Suite Expansion**: Added comprehensive automated tests across SSRF defense, checkpoint recovery, rate limiting, and event decoding, reaching **157 passing tests (100% pass rate)**.
- **Governance Documentation**: Added `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, and updated `README.md`.

### Changed
- **Tooling**: Standardized `npm run lint` script to execute `tsc --noEmit`, guaranteeing non-interactive, strict type verification in automated CI systems.

---

## [1.0.0] - 2026-11-08

### Added
- **Initial Backend Engine**: Event indexer, SEP-10 authentication service, and API gateway for the StrataFlow protocol on Stellar.
- **Fastify Infrastructure**: High-performance HTTP server with Helmet security headers, CORS policies, and rate limiters.
- **SEP-10 Cryptographic WebAuth**: Challenge XDR generation, Ed25519 signature verification, and signed JWT issuance.
- **Dual Storage Persistence**: Dual-layer architecture supporting PostgreSQL via Prisma 5.22 with concurrent in-memory fallback.
- **HMAC Webhook Dispatcher**: Asynchronous event dispatching with SHA-256 signatures, exponential backoff retries, and dead-letter queue.
- **Connected Testnet Contract**: Integration with deployed Soroban contract `CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J`.
