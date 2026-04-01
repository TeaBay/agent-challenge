# 📊 SolFolio — Solana Portfolio Intelligence Agent

**Your personal AI-powered Solana portfolio analyst — running 100% on decentralized infrastructure.**

![SolFolio](assets/banner.png)

> 🏆 Submission for the [Nosana x ElizaOS Agent Challenge](https://superteam.fun/earn/listing/nosana-builders-elizaos-challenge/) on Superteam Earn

---

## Overview

SolFolio is a personal AI agent that gives you instant, conversational intelligence about any Solana wallet. Paste a wallet address and get a full portfolio breakdown — token holdings, USD valuations, allocation charts, transaction history, and AI-powered risk analysis — all through natural language chat.

Built on [ElizaOS v2](https://elizaos.com) with a custom `plugin-solfolio` that connects to real-time on-chain data via Solana RPC and the Jupiter aggregator, SolFolio transforms raw blockchain data into actionable insights. The entire stack — from the Qwen3.5 LLM to the agent runtime — runs on the [Nosana](https://nosana.com) decentralized GPU network. No centralized cloud. No API keys to third-party AI providers. Your data, your infrastructure, your agent.

---

## ✨ Features

- 📊 **Instant portfolio analysis** — Enter any Solana wallet address and get a complete breakdown of SOL balance, SPL token holdings, and total USD value
- 💬 **Natural language chat** — Ask questions in plain English, powered by Qwen3.5 running on Nosana's decentralized inference
- 📈 **Real-time token prices** — Live price data from the Jupiter aggregator with 24h change tracking
- 🔄 **Transaction history** — Recent transactions with automatic type detection (transfers, swaps, staking)
- 🎯 **Portfolio allocation visualization** — Interactive pie charts showing how your holdings are distributed
- 🧠 **AI-powered risk analysis** — Concentration metrics (HHI, effective positions), risk scoring, and actionable diversification suggestions
- 🌐 **100% decentralized** — The full stack runs on Nosana's GPU network — no AWS, no GCP, no centralized cloud
- 🔌 **Custom ElizaOS plugin** — Purpose-built `plugin-solfolio` with 4 actions and 2 providers for deep Solana integration

---

## 📸 Screenshots

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Portfolio Dashboard" width="80%" />
  <br />
  <em>Portfolio dashboard with allocation chart, token table, and live chat</em>
</p>

<p align="center">
  <img src="assets/screenshot-chat.png" alt="Chat Analysis" width="80%" />
  <br />
  <em>Natural language portfolio analysis and risk insights</em>
</p>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Nosana GPU Network                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Docker Container                        │  │
│  │                                                           │  │
│  │  ┌─────────────┐    ┌──────────────────────────────────┐  │  │
│  │  │   Frontend   │    │       ElizaOS v2 Runtime         │  │  │
│  │  │  React+Vite  │◄──►  ┌────────────────────────────┐  │  │  │
│  │  │  Tailwind    │    │  │    plugin-solfolio          │  │  │  │
│  │  │  Recharts    │    │  │                            │  │  │  │
│  │  │             │    │  │  Actions:                   │  │  │  │
│  │  │  :5173 ──────┼────┤  │   • GET_PORTFOLIO          │  │  │  │
│  │  │  (proxies    │    │  │   • GET_TOKEN_PRICE        │  │  │  │
│  │  │   to :3000)  │    │  │   • GET_TRANSACTIONS       │  │  │  │
│  │  │             │    │  │   • ANALYZE_HOLDINGS        │  │  │  │
│  │  └─────────────┘    │  │                            │  │  │  │
│  │                      │  │  Providers:                │  │  │  │
│  │                      │  │   • walletProvider         │  │  │  │
│  │                      │  │   • priceProvider          │  │  │  │
│  │                      │  └──────────┬──────┬──────────┘  │  │  │
│  │                      │             │      │              │  │  │
│  │                      └─────────────┼──────┼──────────────┘  │  │
│  └────────────────────────────────────┼──────┼─────────────────┘  │
│                                       │      │                    │
└───────────────────────────────────────┼──────┼────────────────────┘
                                        │      │
                          ┌─────────────┘      └──────────────┐
                          ▼                                   ▼
                ┌──────────────────┐                ┌──────────────────┐
                │   Solana RPC     │                │   Jupiter API    │
                │                  │                │                  │
                │ • getBalance     │                │ • Price API v2   │
                │ • getTokenAccts  │                │ • Token list     │
                │ • getSignatures  │                │ • Token search   │
                │ • getParsedTxs   │                │                  │
                └──────────────────┘                └──────────────────┘
```

**Data flow:** The frontend communicates with the ElizaOS REST API (`/api`). When a user sends a message or wallet address, ElizaOS routes it to the appropriate `plugin-solfolio` action. The action queries Solana RPC for on-chain data and Jupiter for real-time prices, composes a natural-language response via Qwen3.5, and returns it to the frontend.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Framework** | [ElizaOS v2](https://elizaos.com) | Agent runtime, plugin system, memory, REST API |
| **LLM** | [Qwen3.5](https://huggingface.co/Qwen/Qwen3.5-27B) on Nosana | Natural language understanding and generation |
| **Language** | TypeScript | Full-stack type safety |
| **Frontend** | [React 19](https://react.dev/) | UI framework |
| **Build Tool** | [Vite 6](https://vite.dev/) | Frontend dev server and bundler |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| **Charts** | [Recharts](https://recharts.org/) | Portfolio allocation visualization |
| **Blockchain** | [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) | Solana RPC, transaction parsing |
| **Token Data** | [@solana/spl-token](https://spl.solana.com/) | SPL token account parsing |
| **Prices** | [Jupiter Price API v2](https://station.jup.ag/docs/apis/price-api) | Real-time token prices and search |
| **Container** | [Docker](https://docker.com/) | Multi-stage build for production |
| **Compute** | [Nosana](https://nosana.com) | Decentralized GPU deployment |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 23+ | Required by ElizaOS v2 |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **Docker** | Latest | For containerized deployment |
| **Git** | Latest | — |

### 1. Clone and Install

```bash
git clone https://github.com/YOUR-USERNAME/solfolio-agent.git
cd solfolio-agent

# Install backend dependencies
pnpm install

# Install frontend dependencies
cd frontend && pnpm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Nosana endpoint (or use the defaults provided):

```env
# Nosana-hosted LLM inference
OPENAI_API_KEY=nosana
OPENAI_API_URL=https://4ksj3tve5bazqwkuyqdhwdpcar4yutcuxphwhckrdxmu.node.k8s.prd.nos.ci/v1
MODEL_NAME=Qwen/Qwen3.5-4B

# Nosana-hosted embeddings
OPENAI_EMBEDDING_URL=https://4yiccatpyxx773jtewo5ccwhw1s2hezq5pehndb6fcfq.node.k8s.prd.nos.ci/v1
OPENAI_EMBEDDING_API_KEY=nosana
OPENAI_EMBEDDING_MODEL=Qwen3-Embedding-0.6B
OPENAI_EMBEDDING_DIMENSIONS=1024

# Server
SERVER_PORT=3000
```

<details>
<summary>🔧 Alternative: Local development with Ollama</summary>

```bash
ollama pull qwen3.5:27b
ollama serve
```

```env
OPENAI_API_KEY=ollama
OPENAI_API_URL=http://127.0.0.1:11434/v1
MODEL_NAME=qwen3.5:27b
```

</details>

### 3. Run in Development Mode

**Terminal 1 — ElizaOS backend:**

```bash
pnpm dev
# Starts ElizaOS agent server on http://localhost:3000
```

**Terminal 2 — Frontend dev server:**

```bash
cd frontend
pnpm dev
# Starts Vite dev server on http://localhost:5173
# API calls are proxied to :3000 automatically
```

Open [http://localhost:5173](http://localhost:5173) and paste a Solana wallet address to get started.

### 4. Docker Build and Run

```bash
# Build the multi-stage Docker image
docker build -t solfolio-agent:latest .

# Run locally
docker run -p 3000:3000 --env-file .env solfolio-agent:latest
```

The Docker image uses a two-stage build:
1. **Stage 1** — Builds the React frontend with Vite
2. **Stage 2** — Installs ElizaOS dependencies, copies the built frontend into the serving directory, and starts the agent

---

## 📁 Project Structure

```
solfolio-agent/
├── characters/
│   └── solfolio.character.json        # Agent personality, system prompt, examples
├── src/
│   ├── index.ts                       # Plugin entry point (exports solfolioPlugin)
│   └── plugin-solfolio/
│       ├── index.ts                   # Plugin definition — registers all actions & providers
│       ├── types.ts                   # Shared TypeScript interfaces
│       ├── utils.ts                   # Formatting helpers (USD, addresses, timestamps)
│       ├── actions/
│       │   ├── getPortfolio.ts        # GET_PORTFOLIO — fetch wallet holdings
│       │   ├── getTokenPrice.ts       # GET_TOKEN_PRICE — look up live token prices
│       │   ├── getTransactions.ts     # GET_TRANSACTIONS — recent transaction history
│       │   └── analyzeHoldings.ts     # ANALYZE_HOLDINGS — risk & diversification analysis
│       ├── providers/
│       │   ├── walletProvider.ts      # Injects current portfolio into agent context
│       │   └── priceProvider.ts       # Injects live price data into agent context
│       └── services/
│           ├── solanaService.ts       # Solana RPC wrapper (balance, tokens, transactions)
│           └── jupiterService.ts      # Jupiter API wrapper (prices, token list, search)
├── frontend/
│   ├── package.json                   # React 19, Recharts, Tailwind, Vite
│   ├── vite.config.ts                 # Dev server with API proxy to :3000
│   ├── index.html
│   └── src/
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Root layout — dashboard + chat panels
│       ├── api.ts                     # ElizaOS REST API client
│       ├── types.ts                   # Frontend type definitions
│       ├── index.css                  # Tailwind base styles
│       └── components/
│           ├── WalletInput.tsx        # Address input with validation
│           ├── PortfolioSummary.tsx   # Total value, SOL balance, change cards
│           ├── TokenTable.tsx         # Sortable table of all token holdings
│           ├── AllocationChart.tsx    # Recharts pie chart of portfolio allocation
│           ├── TransactionFeed.tsx    # Recent transactions with type badges
│           └── ChatPanel.tsx          # Full chat interface with message history
├── nos_job_def/
│   └── nosana_eliza_job_definition.json  # Nosana deployment job definition
├── Dockerfile                         # Multi-stage build (frontend + ElizaOS)
├── .env.example                       # Environment variable template
├── package.json                       # ElizaOS deps, @solana/web3.js, scripts
├── tsconfig.json
└── LICENSE                            # MIT
```

---

## 🔌 ElizaOS Plugin — `plugin-solfolio`

SolFolio's core intelligence lives in a custom ElizaOS plugin that provides 4 **actions** (tools the agent can invoke) and 2 **providers** (context injected into every conversation turn).

### Actions

| Action | Trigger | What It Does |
|--------|---------|-------------|
| `GET_PORTFOLIO` | User provides a wallet address or asks about "portfolio", "balance", "holdings" | Fetches SOL balance + all SPL token accounts, resolves USD values via Jupiter, caches result, and returns a formatted summary |
| `GET_TOKEN_PRICE` | User asks about "price", "cost", "worth", or "how much is X" | Looks up any Solana token by symbol/name using Jupiter's verified token list and returns live price with 24h change |
| `GET_TRANSACTIONS` | User asks about "transactions", "history", "activity", or "recent" | Fetches parsed transactions from Solana RPC, detects types (transfer, swap, stake), and formats with Solscan links |
| `ANALYZE_HOLDINGS` | User asks about "risk", "diversification", "analysis", or "allocation" | Computes HHI (Herfindahl Index), effective positions, concentration risk, detects dust/scam tokens, and generates suggestions |

### Providers

| Provider | Description |
|----------|-------------|
| `walletProvider` | Automatically injects the currently loaded wallet's portfolio data into the agent's context so it can reference holdings in any response |
| `priceProvider` | Injects live price data for SOL + all tracked portfolio tokens so the agent always has current pricing context |

### Services

| Service | API | Features |
|---------|-----|----------|
| `SolanaService` | Solana RPC (mainnet-beta, Ankr fallback) | Balance, token accounts, parsed transactions, automatic RPC rotation with retry/backoff |
| `JupiterService` | Jupiter Price API v2 + Token List | Batch price fetching (100/request), token search, 30s price cache, 6h token list cache |

---

## ☁️ Deployment to Nosana

### Step 1 — Build and Push Docker Image

```bash
# Build
docker build -t yourusername/solfolio-agent:latest .

# Test locally
docker run -p 3000:3000 --env-file .env yourusername/solfolio-agent:latest

# Push to Docker Hub (must be public)
docker login
docker push yourusername/solfolio-agent:latest
```

### Step 2 — Configure Job Definition

The Nosana job definition is in [`nos_job_def/nosana_eliza_job_definition.json`](./nos_job_def/nosana_eliza_job_definition.json). Update the `image` field with your Docker Hub username:

```json
{
  "ops": [
    {
      "id": "solfolio-agent",
      "type": "container/run",
      "args": {
        "image": "yourusername/solfolio-agent:latest",
        "expose": 3000,
        "env": {
          "OPENAI_API_KEY": "nosana",
          "OPENAI_API_URL": "https://...",
          "MODEL_NAME": "Qwen/Qwen3.5-4B",
          "SERVER_PORT": "3000",
          "NODE_ENV": "production"
        }
      }
    }
  ],
  "version": "0.1"
}
```

### Step 3 — Deploy via Nosana Dashboard

1. Go to [dashboard.nosana.com/deploy](https://dashboard.nosana.com/deploy)
2. Connect your Solana wallet
3. Paste the contents of `nosana_eliza_job_definition.json`
4. Select a compute market (e.g., `nvidia-3090`)
5. Click **Deploy**
6. Once running, you'll receive a public URL

### Step 4 — Deploy via Nosana CLI (Alternative)

```bash
npm install -g @nosana/cli

nosana job post \
  --file ./nos_job_def/nosana_eliza_job_definition.json \
  --market nvidia-3090 \
  --timeout 300 \
  --api <YOUR_API_KEY>

# Monitor
nosana job status <job-id>
nosana job logs <job-id>
```

> 💡 Get your API key at [deploy.nosana.com/account](https://deploy.nosana.com/account/) and claim free builder credits at [nosana.com/builders-credits](https://nosana.com/builders-credits).

---

## 🔗 API

SolFolio's frontend communicates with the ElizaOS REST API. In development, Vite proxies `/api` requests to `http://localhost:3000`.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List all running agents (returns agent IDs) |
| `POST` | `/api/:agentId/message` | Send a message to the agent and get a response |

### Example: Send a Message

```bash
# Get the agent ID
AGENT_ID=$(curl -s http://localhost:3000/api/agents | jq -r '.agents[0].id')

# Send a portfolio request
curl -X POST "http://localhost:3000/api/${AGENT_ID}/message" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Analyze wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "userId": "user1",
    "roomId": "default"
  }'
```

The response is an array of message objects:

```json
[
  { "text": "Fetching portfolio for `7xKX...AsU`... This may take a moment." },
  { "text": "📊 **Portfolio Summary for `7xKX...AsU`**\n\n💰 **Total Value**: $1,234.56\n..." }
]
```

---

## 🏅 Judging Criteria Alignment

| Criterion (Weight) | How SolFolio Addresses It |
|-------------------|--------------------------|
| **Technical Implementation (25%)** | Custom ElizaOS plugin with 4 actions, 2 providers, 2 services. Multi-RPC fallback with retry/backoff. Jupiter batch pricing. Herfindahl Index risk scoring. Full TypeScript. |
| **Nosana Integration Depth (25%)** | LLM inference via Nosana-hosted Qwen3.5 endpoint. Embeddings via Nosana-hosted Qwen3-Embedding. Deployed as containerized job on Nosana GPU network. No centralized cloud dependency. |
| **Usefulness & UX (25%)** | Real-world portfolio analytics. Split-panel UI (dashboard + chat). Interactive charts. Works with any public Solana wallet — no wallet connection needed. |
| **Creativity & Originality (15%)** | Combines conversational AI with on-chain analytics. Risk analysis with financial metrics (HHI, effective diversification). Dust/scam token detection. Transaction type classification. |
| **Documentation (10%)** | Comprehensive README with architecture diagram, full project structure, API docs, deployment guide, and setup instructions. |

---

## 🙏 Built With

- [ElizaOS](https://elizaos.com) — The AI agent framework that makes this possible
- [Nosana](https://nosana.com) — Decentralized GPU compute for truly permissionless AI
- [Jupiter](https://jup.ag) — Solana's leading DEX aggregator and price oracle
- [Solana](https://solana.com) — The blockchain powering the entire data layer
- [Qwen3.5](https://huggingface.co/Qwen) — The LLM brain behind the conversational interface

---

## 📄 License

This project is open source and available under the [MIT License](./LICENSE).

---

<p align="center">
  <strong>Built with ElizaOS · Deployed on Nosana · Powered by Qwen3.5</strong>
  <br />
  <em>Your portfolio. Your agent. Your infrastructure.</em>
</p>
