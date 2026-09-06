# ManufactureIQ — Industrial Deal Intelligence Platform

> **AI-Powered B2B Market Intelligence & Sales Prospecting Grounded in Real Manufacturing Data**

ManufactureIQ is a modern, enterprise-grade B2B intelligence platform designed specifically for industrial and manufacturing sales teams. By combining **Google Gemini 2.5 Flash** with real-time **Google Search Grounding**, ManufactureIQ identifies, scores, and delivers verified manufacturing accounts, active buying signals, plant locations, and executive outreach angles—eliminating cold-call guesswork and phantom leads.

---

## 🚀 Key Features

- **Grounded Account Discovery**: Discovers real, currently operating manufacturers across global jurisdictions (North America, Europe, Asia-Pacific, Latin America) using live Google Search grounding.
- **Multi-Factor Synergy Scoring**:
  - **Product Fit Score (0–100%)**: Assesses alignment between your product/solution capabilities and the prospect's operational profile.
  - **Opportunity Score (0–100%)**: Measures expansion momentum, facility investments, regulatory pressure, and modernization requirements.
  - **Overall Deal Score & Tiers**: Classifies accounts into **Excellent**, **Strong**, **Potential**, and **Low** fit.
- **Verified Buying Signals**: Identifies facility expansions, automation upgrades, ESG mandates, and capacity announcements with confidence ratings and original citation links.
- **Plant-Level Industrial Use Cases**: Breaks down tangible, plant-floor applications of your solution with predicted relevance scores.
- **Recommended Executive Contacts**: Identifies exact target job titles, key departments, and business reasons to contact (without scraping unverified personal emails).
- **Executive Outreach Pitch Generator**: Ready-to-use executive introductory talking points and emails tailored to each plant's operational signals.
- **Interactive Account Matrix & Dossier**:
  - Split-view account dossier for rapid qualification.
  - Full-width interactive table with real-time search, multi-tier filtering, and sorting.
  - One-click **CSV Export** for CRM integration (Salesforce, HubSpot, Apollo).
- **Executive Dark UI**: Responsive, high-contrast dark theme engineered with Tailwind CSS v4 and fluid motion transitions.

---

## 🏢 Who Can Use ManufactureIQ?

ManufactureIQ is purpose-built for commercial teams selling into industrial, supply chain, and physical-world production environments:

| Industry / Company Type | Example Solutions Sold | Target Prospect Accounts |
| :--- | :--- | :--- |
| **Industrial Automation & Robotics** | Cobots, robotic arms, AGVs/AMRs, PLCs, machine vision inspection | Automotive OEMs, electronics assembly, food packaging facilities |
| **Manufacturing Software (SaaS)** | MES, CMMS (predictive maintenance), ERP, QMS, SCADA | Precision machining, chemical processing, pharmaceutical manufacturing |
| **Industrial Machinery & Tooling** | CNC milling machines, injection molding, laser cutting, 3D printers | Aerospace component makers, medical device plants, defense contractors |
| **Supply Chain & Logistics Providers** | Automated warehousing, cold-chain logistics, freight forwarding | FMCG distributors, beverage bottlers, agricultural processors |
| **Industrial IoT & Clean Energy** | Sensor telemetry, energy efficiency auditing, emissions tracking | Heavy industrial plants, steel mills, cement & mining facilities |
| **Raw Materials & Component Suppliers** | Specialty chemicals, polymers, electronic components, fasteners | Tier-1 & Tier-2 industrial suppliers, consumer electronics manufacturers |
| **Commercial Sales Agencies & BDRs** | Outbound B2B demand generation, SDR industrial prospecting | Enterprise accounts seeking qualified manufacturing pipeline |

---

## 🛠️ Tech Stack

### **Frontend**
- **React 19** (`react`, `react-dom`): Latest functional component paradigm with hooks and concurrent features.
- **TypeScript 5.8**: Strict end-to-end type safety across data contracts and UI props.
- **Tailwind CSS v4** (`@tailwindcss/vite`, `tailwindcss`): Next-generation utility-first styling engine with zero-runtime CSS configuration.
- **Motion** (`motion/react`): Fluid animations and layout transitions for dashboards and detail views.
- **Lucide React** (`lucide-react`): Consistent, lightweight SVG iconography.
- **Vite 6** (`vite`, `@vitejs/plugin-react`): Ultra-fast bundling, development server, and optimized production builds.

### **Backend & AI Architecture**
- **Node.js & Express 4** (`express`): RESTful API backend handling discovery pipelines, scoring, and data persistence.
- **Google Gen AI TypeScript SDK** (`@google/genai` v2.4.0):
  - Primary Model: **Gemini 2.5 Flash** (`gemini-3.8-flash`)
  - Real-time Grounding: **Google Search Grounding Tool** (`tools: [{ googleSearch: {} }]`)
  - Resilience: Automatic model fallback to `gemini-3.1-flash-lite` and `gemini-flash-latest`, transient retry backoff, and circuit-breaker handling.
- **tsx**: Direct TypeScript execution for development server workflows.
- **esbuild**: Server bundling into a standalone CommonJS distribution (`dist/server.cjs`).

---

## 📁 Project Architecture

```text
├── index.html                  # HTML entry point with metadata and typography
├── metadata.json               # Platform metadata and capability declaration
├── package.json                # Dependencies, build, and execution scripts
├── server.ts                   # Express server, Gemini AI integration, Google Search grounding
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration with Tailwind CSS v4 plugin
├── public/                     # Static assets
└── src/
    ├── App.tsx                 # Main application controller and view router
    ├── main.tsx                # React DOM entry point
    ├── index.css               # Global styling and dark theme tokens
    ├── types.ts                # TypeScript interfaces (Company, SearchQuery, ScoreTier)
    ├── components/
    │   ├── IntroPage.tsx       # Platform overview, value proposition & ROI calculator
    │   ├── LandingPage.tsx     # Discovery launchpad & market parameter configuration
    │   ├── ProgressPage.tsx    # Live pipeline progress, grounded logs & streaming cards
    │   ├── DashboardPage.tsx   # Account matrix table, split dossier, and filters
    │   ├── CompanyDetailPage.tsx # Deep-dive company intelligence dossier
    │   └── Navbar.tsx          # Top navigation, scan history archive & quick actions
    └── lib/
        ├── firestore.ts        # Client-side state persistence & search subscription engine
        └── scoring.ts          # Deterministic synergy, opportunity, and deduplication logic
```

---

## ⚙️ Quick Start & Local Development

### 1. Prerequisites
- **Node.js** 18+ or 20+
- **npm** or **bun**
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 2. Installation
```bash
# Clone or download the repository
git clone https://github.com/your-username/manufactureiq.git
cd manufactureiq

# Install project dependencies
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📊 How the Intelligence Pipeline Works

1. **Target Definition**: Sales teams specify target countries (e.g., *Germany, United States, Japan*), industry verticals (e.g., *Automotive, Industrial Machinery*), and their core product value proposition.
2. **Grounded Deep Search**: The server invokes Google Gemini with live Google Search grounding to retrieve real, operating production plants, verifying corporate entities, domain names, and physical plant locations.
3. **Synergy & Signal Extraction**: The model scans recent press releases, plant permits, capital expenditure announcements, and technological mandates to extract verified buying signals and use cases.
4. **Algorithmic Scoring**: Each company is scored along product fit, market opportunity, and overall viability using deterministic scoring routines.
5. **Actionable Delivery**: Results are rendered in the Account Matrix for immediate SDR review, custom pitch generation, or bulk CSV export to enterprise CRMs.

---

## 📄 License
This project is proprietary and open for commercial deployment under the MIT License.
