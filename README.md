# StrataFlow Backend ⚙️

[![Stellar Network](https://img.shields.io/badge/Stellar-Network%20Verified-blueviolet?style=for-the-badge&logo=stellar)](https://stellar.org)
[![Fastify](https://img.shields.io/badge/Fastify-v4.26-black?style=for-the-badge&logo=fastify)](https://fastify.io/)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0%20Swagger-6BA539?style=for-the-badge&logo=swagger)](https://swagger.io/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Stellar SDK](https://img.shields.io/badge/Stellar%20SDK-v12.3-blueviolet?style=for-the-badge)](https://stellar.org)
[![Tests Passing](https://img.shields.io/badge/Tests-163%2F163%20Passed-brightgreen?style=for-the-badge)](https://github.com/StrataFlow-Org/strataflow-backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![CI Status](https://img.shields.io/github/actions/workflow/status/StrataFlow-Org/strataflow-backend/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/StrataFlow-Org/strataflow-backend/actions)
[![Live Frontend DApp](https://img.shields.io/badge/Frontend-strataflow--web.vercel.app-black?style=for-the-badge&logo=vercel)](https://strataflow-web.vercel.app)

> **High-Throughput Soroban Event Indexer, Cryptographic SEP-10 WebAuth Engine, SSRF-Hardened Webhook Dispatcher, and Escrow Telemetry API.**  
> 🌐 **Live Web Application:** [https://strataflow-web.vercel.app](https://strataflow-web.vercel.app)  
> Bridges on-chain Soroban smart contract state transitions to off-chain dApps, external contractor integrations, and enterprise accounting systems.

---

## 🌟 Architecture Overview

```
                           +-------------------------------------+
                           |      Stellar Soroban Testnet        |
                           |  CDXVD3AA43SE2D52...HTLY6J Contract |
                           +------------------+------------------+
                                              |
                     RPC Polling (getEvents)  |  Checkpoint Resumption
                                              v
+---------------------------------------------------------------------------------------+
|                                 STRATAFLOW BACKEND                                    |
|                                                                                       |
|   +--------------------------+    +--------------------------+    +-----------------+ |
|   |   SOROBAN EVENT INDEXER  |    |   SEP-10 WEBAUTH ENGINE  |    |  WEBHOOK ENGINE | |
|   |                          |    |                          |    |                 | |
|   | - Cursor & LastLedger    |    | - Challenge XDR Builder  |    | - HMAC-SHA256   | |
|   | - Exponential Backoff    |    | - Ed25519 Signature      |    | - SSRF Filter   | |
|   | - Deduplication Buffer   |    |   Verification           |    | - Retry Backoff | |
|   | - Bounded Cache Eviction |    | - Tamper-Proof JWT Token |    | - Dead-Letter Q | |
|   +------------+-------------+    +------------+-------------+    +--------+--------+ |
|                |                               |                           |          |
|                v                               v                           v          |
|   +---------------------------------------------------------------------------------+ |
|   |                      RESILIENT DUAL-STORAGE ARCHITECTURE                        | |
|   |   Primary: PostgreSQL via Prisma 5.22  |  Fallback: Concurrent In-Memory Map   | |
|   +------------------------------------+--------------------------------------------+ |
|                                        |                                              |
|                                        v                                              |
|   +---------------------------------------------------------------------------------+ |
|   |                       HARDENED FASTIFY REST API GATEWAY                         | |
|   |   - Helmet Security Headers (CSP, HSTS)  - Sliding-Window Rate Limiting (100/m) | |
|   |   - Zod Schema Request Validation        - Recursive Credential Masking in Logs | |
|   +---------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
             +-------------------+               +-------------------+
             |  StrataFlow Web   |               | External Webhooks |
             |  (Next.js dApp)   |               | (Slack, ERP, CRM) |
             +-------------------+               +-------------------+
```

---

## 🚀 Connected Stellar Testnet Infrastructure

| Parameter | Configuration | Verifiable Link |
|---|---|---|
| **Contract ID** | `CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J` | [StellarExpert Contract](https://stellar.expert/explorer/testnet/contract/CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J) |
| **Network Passphrase** | `Test SDF Network ; September 2015` | [Stellar Network Status](https://soroban-testnet.stellar.org) |
| **RPC Endpoint** | `https://soroban-testnet.stellar.org` | [Stellar Lab Explorer](https://lab.stellar.org/r/testnet/contract/CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J) |
| **Protocol Admin** | `GBWFZHBYEKF5MR2MHW7JAZX6ZRI2PKKBL6IALEMJSBMU4JMDSIB34KP5` | [StellarExpert Admin](https://stellar.expert/explorer/testnet/account/GBWFZHBYEKF5MR2MHW7JAZX6ZRI2PKKBL6IALEMJSBMU4JMDSIB34KP5) |

---

## 🔌 API Reference & Endpoints

### 1. Protocol & Health Telemetry
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/.well-known/stellar.toml` | SEP-0001 discoverability document declaring protocol configuration, contract IDs, and principals. |
| `GET` | `/documentation` | Interactive OpenAPI 3.0 Swagger UI documentation portal. |
| `GET` | `/documentation/json` | Machine-readable OpenAPI 3.0 JSON specification schema. |
| `GET` | `/health` | Live telemetry probe reporting RPC connectivity, indexer status, and database health. |
| `GET` | `/api/stats` | High-level platform statistics: total volume, active escrows, completed milestones. |
| `GET` | `/api/stats/extended` | Deep protocol velocity metrics, dispute frequency, and escrow distribution. |
| `GET` | `/api/contract/info` | Live on-chain contract version, network passphrase, and token configurations. |
| `GET` | `/api/contract/fees` | Protocol fee configuration in basis points (capped at 500 bps / 5%) and fee recipient. |
| `GET` | `/api/contract/ttl/:id`| Evaluates Soroban persistent storage TTL threshold and remaining days. |
| `GET` | `/api/stellar/account/:publicKey` | Horizon account telemetry, subentry counts, and native XLM balance. |
| `POST` | `/api/stellar/simulate` | Preflight transaction XDR dry-run simulation and resource fee estimator. |
| `POST` | `/api/ipfs/verify` | Multi-gateway IPFS CID syntax validation and redundant gateway fallback list. |

### 2. Cryptographic SEP-10 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/challenge` | Generates a time-bounded cryptographically signed SEP-10 challenge transaction XDR. |
| `POST` | `/api/auth/token` | Validates client Ed25519 signature on challenge and issues signed JWT bearer token. |
| `GET` | `/api/auth/me` | Returns current authenticated wallet address and session validity. |

### 3. Agreement Directory & IPFS Metadata
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/agreements` | Paginated directory of agreements with role (`client`, `provider`, `arbiter`) and status filtering. |
| `GET` | `/api/agreements/party/:address` | Queries agreements filtered by participant address and optional role constraint. |
| `GET` | `/api/agreements/:id` | Full agreement details, milestone proofs, remaining balance, and event timeline. |
| `POST` | `/api/metadata` | Submits off-chain milestone descriptions and generates IPFS metadata record. |
| `GET` | `/api/metadata/:cid` | Resolves off-chain agreement metadata by IPFS content identifier (CID). |

### 4. Real-time Webhook Engine (SSRF Hardened)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/webhooks/subscribe`| Subscribes webhook URL with HMAC secret key and rigorous SSRF validation. |
| `GET` | `/api/webhooks` | Lists active webhook subscriptions belonging to the authenticated caller. |
| `DELETE`| `/api/webhooks/:id` | Unregisters webhook subscription with Bearer token or secret verification. |
| `POST` | `/api/webhooks/test` | Enqueues and dispatches test event payload to verify HMAC signature receipt. |

---

## 🛡️ Security Engineering Highlights

1. **SSRF Egress Defense (`isSafeWebhookUrl`)**:
   - Webhook registration proactively validates destinations to prevent Server-Side Request Forgery.
   - Prohibits loopback (`127.0.0.0/8`, `::1`), link-local / cloud instance metadata (`169.254.169.254`), private RFC1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Carrier-Grade NAT (`100.64.0.0/10`), and internal TLDs (`.local`, `.internal`, `.lan`, `.corp`).

2. **Persistent Indexer Checkpoint Resumption**:
   - The Soroban indexer persists the highest indexed ledger sequence in the database.
   - Upon node restart, the indexer queries `getHighestIndexedLedger()` and resumes polling from `highestIndexed + 1`, eliminating missed events or event replay gaps across redeployments.

3. **Bounded Memory Eviction**:
   - Event deduplication cache maintains an automated LRU eviction threshold at 10,000 entries, preventing unconstrained memory growth during high-throughput indexing spikes.

4. **Cryptographic Webhook Signatures**:
   - Every outgoing webhook delivery includes an `X-StrataFlow-Signature: sha256=<hex>` header computed via HMAC-SHA256, allowing subscribers to mathematically verify payload authenticity and reject forged dispatches.

5. **Fastify Hardening & Sanitization**:
   - Granular rate limiting (100 req/min general, 10 req/min for auth challenge endpoints).
   - Fastify Helmet with strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and `X-Frame-Options: DENY`.
   - Recursive credential masking redacts Stellar secret keys (`S...`), seed phrases, and passwords from all log sinks.

---

## 🧪 Comprehensive Automated Test Suite (163 Tests Passing)

The backend features 163 unit, integration, and security tests:

```bash
npm test
```

### Test Suite Highlights:
- **SEP-10 WebAuth**: Tests challenge XDR generation, signature verification with authentic keypairs, rejection of invalid keys, and JWT tamper-proofing.
- **SSRF Prevention**: Rigorously tests loopback, private IPv4, and AWS/GCP cloud metadata IP blocking.
- **Webhook HMAC Pipeline**: Verifies cryptographic hash calculation, replay window expiration, and payload tamper rejection.
- **Dual Storage Resilience**: Validates seamless data persistence and event aggregation in both PostgreSQL and fallback in-memory states.
- **Soroban ABI Validation**: Checks ScVal schema parsing, fee basis point limits, and integer arithmetic precision.

---

## 🛠️ Getting Started Locally

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **PostgreSQL**: v16 (optional, seamless in-memory fallback enabled if offline)
- **Docker & Docker Compose**: (optional)

### 1. Clone & Install
```bash
git clone https://github.com/StrataFlow-Org/strataflow-backend.git
cd strataflow-backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Example `.env`:
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
STELLAR_NETWORK=TESTNET
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
CONTRACT_ID=CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J
SERVER_SECRET_KEY=SB... # Ed25519 server key for SEP-10 signing
JWT_SECRET=super_secret_jwt_entropy_key_change_in_production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/strataflow
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Lint & Type Check
```bash
npm run lint
```

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 🐳 Docker Orchestration

Run PostgreSQL 16 and the StrataFlow backend in orchestrated containers:
```bash
docker-compose up -d
```

---

## 📄 License & Governance

- **License**: Licensed under the [MIT License](LICENSE).
- **Security Policy**: See [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.
- **Contributing**: Read [CONTRIBUTING.md](CONTRIBUTING.md) to get involved.
- **Code of Conduct**: Governed by the [Contributor Covenant](CODE_OF_CONDUCT.md).
- **Changelog**: Release details in [CHANGELOG.md](CHANGELOG.md).
