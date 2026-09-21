# BidVerify AI

AI-Powered Integrated Bid Compliance Verification Platform for GeM (Government e-Marketplace) procurement in India. The platform automatically checks bidder information and submitted documents (GSTN, Udyam, BIS/IS certificates, PAN, etc.) for consistency, completeness, and compliance with GeM tender requirements.

## Features

- **AI Document Verification** — OCR-powered extraction of key fields from GST certificates, PAN cards, Udyam registrations, and BIS certificates
- **Automated Compliance Scoring** — 0–100% compliance score calculated for each bid based on document completeness, data consistency, and verification results
- **Risk Assessment** — Each bid is flagged as Low, Medium, or High risk based on compliance findings
- **Role-Based Dashboards** — Separate dashboards for Buyers (post tenders, review bids) and Sellers (browse tenders, submit bids)
- **Compliance Verification Page** — Two-column layout with document list and AI results panel including circular progress indicator, verification checklist, extracted data cards, and flags/warnings
- **Reports & Analytics** — Interactive charts (compliance trend, risk distribution, top issues) with CSV export
- **Secure Authentication** — Supabase Auth with email/password, Row Level Security on all database tables

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui components |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Database | PostgreSQL with Row Level Security |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier works)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bidverify-ai.git
cd bidverify-ai
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment template and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Apply the database migrations to your Supabase project. The SQL files are in `supabase/migrations/`. Run them in order using the Supabase SQL Editor or the MCP tools:

   - `20260919192259_create_bidverify_schema.sql` — Creates all tables, RLS policies, indexes, and the auto-profile trigger
   - `20260919195107_fix_profiles_rls_recursion.sql` — Fixes RLS recursion on profiles table
   - `20260919195116_fix_audit_logs_rls_recursion.sql` — Fixes RLS recursion on audit_logs table

5. (Optional) Seed the database with demo data. See the **Demo Data** section below.

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Data

The platform comes pre-seeded with realistic sample data:

- **9 users**: 3 buyers, 5 sellers, 1 admin
- **10 tenders** across categories (IT Equipment, Office Supplies, Services, Medical Equipment)
- **20 bids** with varying compliance scores (5 low-risk, 8 medium-risk, 5 high-risk)
- **75 documents** with OCR data and verification statuses
- **8 compliance reports** with detailed findings

**Demo account credentials** (password for all: `Demo@1234`):

| Role | Email |
|------|-------|
| Buyer | `buyer1@bidverify.ai` |
| Seller | `seller1@bidverify.ai` |
| Admin | `admin@bidverify.ai` |

## Database Schema

```
profiles
├── id (uuid, PK, references auth.users)
├── email (text, unique)
├── name, organization, phone
├── role (BUYER | SELLER | ADMIN)
└── is_verified (boolean)

tenders
├── id (uuid, PK)
├── tender_id (text, unique, human-readable)
├── title, description, category
├── budget (numeric)
├── deadline (timestamptz)
├── required_documents (text[])
├── status (ACTIVE | CLOSED | EVALUATION | AWARDED)
└── buyer_id → profiles.id

bids
├── id (uuid, PK)
├── tender_id → tenders.id
├── seller_id → profiles.id
├── compliance_score (0–100, nullable)
├── risk_level (LOW | MEDIUM | HIGH, nullable)
├── status (SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED)
└── submitted_at

documents
├── id (uuid, PK)
├── bid_id → bids.id
├── type (GST_CERTIFICATE | PAN_CARD | UDYAM_REGISTRATION | BIS_CERTIFICATE | TECHNICAL_SPECS | OTHER)
├── file_url, file_name
├── ocr_data (jsonb)
├── verification_status (PENDING | VERIFIED | WARNING | FAILED)
└── verified_at

compliance_reports
├── id (uuid, PK)
├── bid_id → bids.id (unique)
├── overall_score (0–100)
├── risk_level (LOW | MEDIUM | HIGH)
├── findings (jsonb array)
└── generated_at

audit_logs
├── id (uuid, PK)
├── user_id → profiles.id (nullable)
├── action (text)
├── metadata (jsonb)
└── timestamp
```

All tables have Row Level Security enabled with ownership-based policies.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, and CTA |
| `/login` | Email/password login |
| `/signup` | Registration with role selection (Buyer/Seller) |
| `/dashboard` | Redirects to buyer or seller dashboard based on role |
| `/dashboard/buyer` | Buyer dashboard with metrics and tenders table |
| `/dashboard/seller` | Seller dashboard with metrics and bids table |
| `/tenders` | Browse all tenders with search and filters |
| `/tenders/new` | Post a new tender (buyers only) |
| `/tenders/[id]` | Tender details with list of received bids |
| `/bids/[id]/verify` | Compliance verification page (core feature) |
| `/reports` | Reports & analytics with charts and export |
| `/profile` | Profile settings, change password, notification preferences |

## Build

```bash
npm run build
```

## Deployment

### Netlify

The project includes a `netlify.toml` configuration. Connect your GitHub repository to Netlify and it will auto-deploy.

### Vercel

```bash
npm i -g vercel
vercel
```

Make sure to add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in your deployment platform.

## License

This project is built for demonstration purposes.
