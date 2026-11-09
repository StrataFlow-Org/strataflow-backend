# StrataFlow Backend ⚙️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Fastify](https://img.shields.io/badge/Fastify-v4.26-black.svg)](https://fastify.io/)
[![Stellar SDK](https://img.shields.io/badge/Stellar%20SDK-v12+-blueviolet.svg)](https://stellar.org)
[![Prisma](https://img.shields.io/badge/Prisma-v5.22-2D3748.svg)](https://prisma.io)

> **Part of the [StrataFlow Protocol](https://github.com/StrataFlow-Org) suite.**  
> Off-chain event ingestion engine, SEP-10 WebAuth, HMAC webhook dispatcher, and telemetry API. Built for Stellar Drips Wave.

---

## 🌟 Overview

`strataflow-backend` powers the off-chain infrastructure for the StrataFlow protocol on Stellar:
- **Soroban Event Indexer**: Continuously polls Soroban RPC for protocol contract events, parses ScVal topics, and persists state transitions with exponential backoff and cursor pagination.
- **Cryptographic SEP-10 WebAuth**: Issues cryptographically signed Stellar challenge transactions, verifies Ed25519 wallet signatures, and issues tamper-proof JWT sessions.
- **HMAC-SHA256 Webhook Dispatcher**: Delivers real-time webhook notifications to external integrations with exponential retries and dead-letter queue resilience.
- **Resilient Dual Storage Architecture**: Operates against PostgreSQL via Prisma ORM 5.22 with seamless in-memory fallback when database is offline.
- **Hardened Security Layer**: Fastify Helmet (CSP, HSTS, X-Frame-Options), granular rate limiting (100/min general, 10/min auth), recursive secret redaction in audit logs, and XSS sanitization.

---

## 🔌 API Endpoints

### Protocol & Health Telemetry
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check, RPC connectivity, database latency & indexer status. |
| `GET` | `/api/stats` | Protocol analytics: total volume, active escrows, completed milestones. |
| `GET` | `/api/stats/extended` | Deep protocol analytics, escrow velocity, and distribution metrics. |
| `GET` | `/api/contract/info` | On-chain contract version, network passphrase, and token contracts. |
| `GET` | `/api/contract/fees` | Protocol fee basis points and recipient address. |
| `GET` | `/api/contract/ttl/:id`| Soroban persistent storage TTL threshold and renewal evaluation. |

### Cryptographic SEP-10 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/challenge` | Generates a time-bounded cryptographically signed SEP-10 challenge XDR. |
| `POST` | `/api/auth/token` | Validates client Ed25519 signature and returns authenticated JWT. |
| `GET` | `/api/auth/me` | Returns current authenticated wallet address. |

### Agreement Directory & Console
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/agreements` | Paginated directory of agreements with role and status filtering. |
| `GET` | `/api/agreements/party/:address` | Queries agreements by participant address and role. |
| `GET` | `/api/agreements/:id` | Full agreement details, milestone proofs, and on-chain event history. |
| `POST` | `/api/metadata` | Submits off-chain milestone descriptions and stores metadata. |
| `GET` | `/api/metadata/:cid` | Resolves stored off-chain agreement metadata by CID. |

### Real-time Webhooks (SSRF Hardened)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/webhooks/subscribe`| Subscribes webhook endpoint with HMAC secret key and SSRF validation. |
| `GET` | `/api/webhooks` | Lists active webhook subscriptions for caller. |
| `DELETE`| `/api/webhooks/:id` | Unregisters webhook subscription with role verification. |
| `POST` | `/api/webhooks/test` | Dispatches test payload to verify HMAC signature receipt. |

---

## 🚀 Connected Stellar Testnet Deployment

| Parameter | Value |
|---|---|
| **Contract ID** | `CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J` |
| **Network** | Stellar Testnet (`https://soroban-testnet.stellar.org`) |
| **Passphrase** | `Test SDF Network ; September 2015` |
| **Protocol Admin** | `GBWFZHBYEKF5MR2MHW7JAZX6ZRI2PKKBL6IALEMJSBMU4JMDSIB34KP5` |
| **StellarExpert** | [View Contract](https://stellar.expert/explorer/testnet/contract/CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J) |

---

## 🧪 Local Testing & Verification

Execute the comprehensive test suite (157 unit and integration tests, 100% pass):

```bash
npm test
```

Execute TypeScript typecheck & lint verification:

```bash
npm run lint
```

Execute production build:

```bash
npm run build
```

---

## 🐳 Docker Deployment

Run PostgreSQL 16 and backend API in orchestrated containers:

```bash
docker-compose up -d
```

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).
