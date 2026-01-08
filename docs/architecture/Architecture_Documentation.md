# Architecture Documentation

## Vision: 10/10 and Beyond

### Current Vision (10/10)
The Zenith platform is evolving from a single-point auditing tool into a **Command-and-Control Workspace** for financial forensics. This vision merges advanced fraud detection with Anti-Money Laundering (AML) pillars, anchored by a legal jurisprudence framework.

#### Global Orchestration: The Project Switcher
To scale enterprises, we implement the **Project Core Sync** system.
- **The Switcher**: A global UI element allowing investigators to jump between discrete cases (e.g., "Operation Alpha", "Project Delta").
- **The Workspace**: Each project maintains its own isolated database, vault, and Forensic Ledger, ensuring Zero-Contamination of evidence.
- **Implementation Status**: COMPLETED. All frontend components (Analytics, Ingestion, Dashboard) are now dynamically linked to the global project context, removing all legacy hardcoded references.

#### The Trinity Match: Reconciliation 10/10
Reconciliation moves beyond simple 1-to-1 matching to a **Trinity Linkage**:
- **The Link**: `Bank Statement` <-> `Internal Ledger` <-> `Forensic Evidence`.
- **The Proof**: Every transaction in the ledger is automatically linked to its corresponding receipt or digital chat log within the UI.

#### Anti-Money Laundering (AML): The Velocity Pillar
AML is the "Twin Pillar" to Fraud, detecting illicit value flow through three stages:
- **Placement**: Real-time detection of **Structuring (Smurfing)** and **Co-mingling** patterns.
- **Layering**: Using the **Unified Knowledge Graph** to expose opaque ownership and UBOs (Ultimate Beneficial Owners).
- **Integration**: Linking digital fund flows to **Asset Acquisitions** (Property, Luxury Goods) discovered via forensics.

#### Provenance & Jurisprudence (The Legal Anchor)
Technical evidence is useless without legal defensibility. My architecture anchors every finding in:
- **Admissibility Framework**: Automated verification that files were handled via a certified Chain of Custody.
- **Theory of Intent (Mens Rea)**: AI classifiers that map evidence to Knowledge, Intent, or Willful Blindness.

#### The Forensic Reality: Handling "Messy" Data
- **Redaction Reconstructor**: Probabilistic unmasking of redacted transaction names using multi-source triangulation.
- **Mirror Detection**: Automatically "Collapsing" transfers between accounts to prevent artificial volume skew.
- **LIBR Algorithm**: Tracking mixed personal/business accounts to detect illicit float using the Lowest Intermediate Balance Rule.

### Future Vision (Zenith)
This document outlines the **Zenith Horizon**—the final frontier of "Self-Driving" financial forensics.

#### Federated Forensic Intelligence
**Bridge the Privacy Gap**: Cross-organization intelligence without data exposure.
- **Federated Learning (FL)**: Exchanges model weights (risk signals) across projects/banks to identify global laundering typologies without violating GDPR/PII.
- **Global Pulse**: A dashboard indicator showing real-time risk trends from the federated network.

#### Adversarial Forensic Shield
**Bridge the Deepfake Gap**: Shielding the system from poisoned data.
- **Synthetic Marker Detection**: CNN-based guardians in the ingestion layer that flag AI-generated transaction logs or manipulated forensic images.
- **Chain of Integrity**: Every finding is verified against adversarial markers before entering the legal record.

#### Autonomous Forensic Hunting
**Bridge the Latency Gap**: High-speed, self-healing investigations.
- **Hunter Agents**: Proactive AI agents that generate crime hypotheses and **self-heal** data pipelines when new patterns are discovered.
- **The Operator Interface**: Conversational reporting where agents discuss *completed* autonomous hunts with the analyst.

#### Quantum-Resistant Juridical Anchor
**Bridge the Time Gap**: Long-term evidence admissibility (10-20 years).
- **Post-Quantum Cryptography**: Implementing **ML-DSA** (Module-Lattice) and **SLH-DSA** (Stateless Hash) signatures for all forensic exports.
- **Undeniable Proof**: Ensuring evidence remains unassailable even in a post-quantum world.

| Goal | Human-Centric (10/10) | Autonomous (Zenith) |
|------|----------------------|---------------------|
| **Detection** | Pattern-based alerts | Generative Hypothesis Hunting |
| **Privacy** | Jurisdictional Adapters | Zero-Knowledge Federated Learning |
| **Trust** | SHA-256 Hashing | Lattice-Based Quantum Security |
| **Integrity** | Chain of Custody (Logs) | Adversarial-Resistant Shield |

## Current Architecture Overview

### Backend Structure (Actual Implementation)
```
backend/
├── app/
│   ├── routers/          # API endpoints
│   ├── services/         # Business logic services
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── api/              # API utilities
│   ├── domain/           # Domain logic
│   ├── plugins/          # Plugin system
│   ├── utils/            # Utilities
│   ├── middleware/       # Custom middleware
│   └── core/             # Core application logic
├── core/
│   ├── eav/              # Entity-Attribute-Value system
│   ├── feature_flags/    # Feature flag management
│   ├── cqrs/             # CQRS pattern implementation
│   ├── cache/            # Caching utilities
│   ├── security/         # Security utilities
│   ├── plugin_system/    # Plugin architecture
│   ├── repositories/     # Data repositories
│   ├── models/           # Core models
│   └── jobs/             # Background jobs
├── config/               # Configuration
├── plugins/              # Plugin implementations
├── tests/                # Test suites (unit, integration, e2e, performance)
├── scripts/              # Utility scripts
├── middleware/           # Global middleware
├── models/               # Additional models
├── alembic/              # Database migrations
├── uploads/              # File uploads
├── logs/                 # Application logs
├── reports/              # Generated reports
├── data/                 # Data files
├── monitoring/           # Monitoring tools
├── docs/                 # Backend documentation
└── venv/                 # Virtual environment
```

### Frontend Structure (Actual Implementation)
```
frontend/
├── src/
│   ├── components/       # UI components
│   │   ├── ui/           # Basic UI components
│   │   ├── advanced/     # Advanced components
│   │   ├── settings/     # Settings components
│   │   └── collaboration/ # Collaboration components
│   ├── features/         # Feature modules
│   │   ├── cases/        # Case management
│   │   └── dashboard/    # Dashboard features
│   ├── providers/        # Context providers
│   ├── context/          # React contexts
│   ├── config/           # Configuration
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── mocks/            # Mock data
│   └── documentation/    # Frontend docs
├── dist/                 # Build output
├── node_modules/         # Dependencies
├── test-data/            # Test data
└── .vercel/              # Vercel deployment
```

## Design Specifications
[Content from FULL_DESIGN_SPEC.md, COMPONENT_ARCHITECTURE.md - consolidated design specs]

## Security Architecture
[Content from security_architecture.md - security design and measures]

## Execution and Monitoring
[Content from execution.md, monitoring.md, orchestration.md, planning.md, post-deployment.md - execution procedures, monitoring setup, orchestration plans]

## Feature Interconnectivity
This matrix defines the high-speed data handoffs and feedback loops that unify the forensic ecosystem.

| Source Module | Target Module | Data Handoff | Strategic Goal |
|---------------|---------------|--------------|----------------|
| **Ingestion** | **Reconciliation** | Mapped Field Schema | Ensure zero data loss during extraction. |
| **Reconciliation**| **Mens Rea Engine** | "Discrepancy Severity" | Trigger deeper "Motive" analysis for large sum gaps. |
| **Forensics** | **Reconciliation** | OCR-Verified Truth | Override Ledger data with tamper-proof forensic findings. |
| **Project Sync** | **Dashboard** | Project Risk (Global) | Show cross-project alerts (Ghost Entities) in the switcher. |
| **Adversarial Shield**| **Ingestion Layer** | "Synthetic Marker" Flag | Block deepfake logs from entering the Chain of Custody. |
| **Hunter Agent** | **Sync Orchestrator**| Self-Healing Patch | Auto-correct data pipes and update all dashboards. |
| **Mens Rea Engine** | **Legal RAG** | Intent Classification | Query the RAG for matching legal precedents. |
| **Fraud Engine** | **AML Engine** | "Predicate Offense" | Trigger layering analysis on confirmed fraud networks. |

## Advanced Feedback Loops
1. **The Truth Loop**: When a Forensic Analyst overrides a transaction value via OCR, the **Reconciliation Engine** automatically re-runs its matching algorithm across the entire project to find new connections.
2. **The Intent Loop**: A change in **Mens Rea** status (e.g., from "Negligence" to "Intent") automatically updates the **Legal Reporting Hub** to re-cite specific prosecution laws.

## Architecture Reports
[Summary from ARCHITECTURE_10_10_REPORT.md and ARCHITECTURE_REPORT.md - upgrade reports and optimization achievements]</content>
<parameter name="filePath">/Users/Arief/Desktop/378x492/docs/architecture/Architecture_Documentation.md