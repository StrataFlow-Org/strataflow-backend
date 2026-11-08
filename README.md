# StrataFlow Backend ⚙️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Fastify](https://img.shields.io/badge/Fastify-v4.26-black.svg)](https://fastify.io/)
[![Stellar SDK](https://img.shields.io/badge/Stellar%20SDK-v12+-blueviolet.svg)](https://stellar.org)

> **Part of the [StrataFlow Protocol](https://github.com/winningtalker-commits) suite.**  
> Off-chain event ingestion engine, SEP-10 wallet authentication, and metadata API.

---

## 🌟 Overview

`strataflow-backend` powers the off-chain infrastructure for the StrataFlow protocol on Stellar:
- **Soroban Event Indexer**: Ingests and normalizes smart contract events (`create`, `fund`, `submit`, `release`, `dispute`, `resolve`) via the Soroban RPC endpoint.
- **SEP-10 Authentication**: Implements Stellar Web Authentication challenges to issue JWTs to verified Stellar wallets.
- **Off-chain Metadata Storage**: Manages milestone descriptions, deliverable attachments, and IPFS hash associations.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check and network configuration status. |
| `GET` | `/api/events` | Retrieves indexed Soroban events (optionally filtered by `agreementId`). |
| `POST`| `/api/metadata` | Submits off-chain milestone scope descriptions and returns IPFS hash. |

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).
