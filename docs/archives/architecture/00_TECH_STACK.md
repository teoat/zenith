# 🛠 Centralized Technology Stack

**Scope:** Global (Applies to all Pagex components)
**Status:** ✅ Approved Standard

---

## 1. Core Architecture
| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | Vite, TanStack Query, Zustand |
| **Backend** | Python 3.11 + FastAPI | Pydantic, SQLAlchemy, Pandas |
| **Database** | PostgreSQL 16 | `pgvector` (for future AI embeddings) |
| **Caching** | Redis 7 | `redis-py` |
| **Container** | Docker | Docker Compose |

---

## 2. Frontend Libraries (React)

### User Interface & Design
- **Component System:** `shadcn/ui` (Radix UI primitives + Tailwind CSS)
- **Styling:** Tailwind CSS (Utility-first)
- **Icons:** `lucide-react`
- **Animations:** `framer-motion`
- **Dashboards:** `recharts` (Charts), `react-flow` (Node Graphs)

### State & Logic
- **Server State:** `@tanstack/react-query` (v5)
- **Global Store:** `zustand` (Lightweight state management)
- **Forms:** `react-hook-form` + `zod` (Validation)
- **Routing:** `react-router-dom` (v6)

### Data Handling
- **Date Math:** `date-fns`
- **Data Grids:** `@tanstack/react-table`
- **Drag & Drop:** `@dnd-kit`

### Specialized Visualization
- **Mapping**: `react-map-gl` (Mapbox GL JS wrapper) for high-performance geospatial visualizations.
- **PDF Generation:** `@react-pdf/renderer` or `jspdf`

---

## 3. Backend Libraries (Python)

### API & Core
- **Framework:** `FastAPI` (Async, Type-safe)
- **Server:** `Uvicorn` (ASGI)
- **Validation:** `Pydantic` (v2)

### Data Processing & Forensics
- **Dataframes:** `pandas` (Heavy lifting, aggregation)
- **Fuzzy Matching:** `thefuzz` (Levenshtein distance)
- **Math/Stats:** `numpy`

### Database & Storage
- **ORM:** `SQLAlchemy` (Async mode)
- **Migrations:** `Alembic`
- **File Storage:** Local File System (MVP) / S3 Compatible (Production)

### AI & Logic (Frenly)
- **LLM Interface:** Internal shim to LLM Provider (No OpenAI SDK directly in code logic)
- **Vector Search:** `pgvector` (Postgres extension)

---

## 4. Development & Ops
- **Linting:** `eslint`, `prettier` (Frontend) / `ruff` (Backend)
- **Testing:** `vitest` (Frontend) / `pytest` (Backend)
- **Package Manager:** `npm` (Frontend) / `pip` (Backend)

---

> [!NOTE]
> This stack is authoritative. Individual page documentation should reference this file rather than repeating the list.
