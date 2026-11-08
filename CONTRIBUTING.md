# Contributing to StrataFlow Backend

We welcome contributions to the StrataFlow backend API and indexer! This project participates in the **Stellar Drips Wave**.

---

## 🛠️ Getting Started

1. Ensure you have **Node.js 20+** installed.
2. Fork and clone the repository:
   ```bash
   git clone https://github.com/StrataFlow-Org/strataflow-backend.git
   cd strataflow-backend
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🏷️ Issue & PR Guidelines for Drips Wave

- **Low / Trivial**: Adding request validation schemas, adding log formatters, documentation updates.
- **Medium**: Adding Redis queue persistence for RPC event processing, expanding SEP-10 test suites.
- **High**: Implementing full database migration with Prisma and PostgreSQL for historical event replay.

