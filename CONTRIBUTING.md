# Contributing to StrataFlow Backend

We welcome contributions to the **StrataFlow Backend**! This repository powers the off-chain indexing engine, SEP-10 authentication service, and webhook dispatcher for the StrataFlow protocol on Stellar.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x+
- **PostgreSQL**: v16 (optional; the repository automatically operates with in-memory persistence if no database is connected)

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/StrataFlow-Org/strataflow-backend.git
cd strataflow-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server with file watching
npm run dev
```

---

## 🧪 Testing & Verification

All contributions must satisfy automated verification before merge:

```bash
# Run unit and integration tests (157 tests)
npm test

# Run TypeScript type check
npm run lint

# Compile production build
npm run build
```

---

## 🌿 Contribution Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feat/your-improvement
   ```
2. Adhere to Conventional Commits:
   - `feat(scope): ...`
   - `fix(scope): ...`
   - `test(scope): ...`
   - `docs(scope): ...`
3. Verify that zero secret keys or private seeds are exposed in test assertions or fixtures.
4. Submit your pull request with complete reproduction steps.

---

## 📜 Code of Conduct

All contributors must abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
