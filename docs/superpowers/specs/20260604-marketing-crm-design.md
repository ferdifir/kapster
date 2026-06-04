# Marketing CRM — Kapster Admin Lead Outreach

**Date:** 2026-06-04
**Status:** Approved Design

## Overview

Build a marketing CRM inside the Kapster admin dashboard for managing barbershop lead outreach. The system stores barbershop leads (from OSINT research), tracks their status through a pipeline, logs activities, and provides quick WhatsApp contact. All 28 collected leads are imported on deployment.

## Target User

Kapster admin (single user — the developer/owner). Not for barbershop customers.

## Pipeline Stages

```
New → Contacted → Interested → Demo → Customer → Closed
```

Each lead has exactly one status at any time. Status changes are logged in the activity table.

---

## 1. Database Schema

### Table: `marketing_leads`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `name` | `text` | — | Barbershop name |
| `contact` | `text` | — | Phone/WA number |
| `branches` | `text` | — | e.g. "130+", "45+", "1" |
| `city` | `text` | — | City or region |
| `instagram` | `text?` | `null` | @handle |
| `priority` | `text` | `'LOW'` | `'HIGH'`, `'MEDIUM'`, `'LOW'` |
| `status` | `text` | `'new'` | `'new'`, `'contacted'`, `'interested'`, `'demo'`, `'customer'`, `'closed'` |
| `notes` | `text?` | `null` | Internal notes |
| `last_contacted_at` | `timestamptz?` | `null` | Updated when WA is sent or status changes to contacted |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

### Table: `marketing_lead_activities`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `lead_id` | `uuid` | — | FK → `marketing_leads.id`, ON DELETE CASCADE |
| `activity_type` | `text` | — | `'note'`, `'wa_sent'`, `'status_change'` |
| `description` | `text` | — | Human-readable log entry |
| `created_at` | `timestamptz` | `now()` | |

### Indexes

- `marketing_leads_status_idx` on `marketing_leads(status)`
- `marketing_leads_priority_idx` on `marketing_leads(priority)`
- `marketing_lead_activities_lead_id_idx` on `marketing_lead_activities(lead_id)`

### RLS

Both tables: enable RLS with a single policy for authenticated users:
```sql
CREATE POLICY "admin_all" ON marketing_leads
  FOR ALL USING (auth.role() = 'authenticated');
```
No barbershop isolation needed — this is a Kapster-internal admin tool, accessed only by the signed-in owner.

### TypeScript Types

Auto-generated from Supabase. Manual interface in `lib/marketing-types.ts`.

---

## 2. Dashboard Navigation

**File:** `components/dashboard/Sidebar.tsx`

Add new nav item between "Analitik" and "Referral":

```ts
{
  href: "/dashboard/marketing",
  label: "Marketing",
  icon: `<svg>...megaphone icon...</svg>`,
}
```

---

## 3. Page Structure

Following existing dashboard pattern (server → client):

### Server Page: `app/dashboard/marketing/page.tsx`

```tsx
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  // 1. Check auth, redirect if not logged in
  // 2. Fetch all marketing_leads (no barbershop_id — admin global)
  // 3. Fetch lead counts per status for stats
  // 4. Render <MarketingManager initialLeads={...} stats={...} />
}
```

### Client Component: `components/dashboard/MarketingManager.tsx`

`"use client"` component with:

**State:**
- `leads` — full list from server, filtered client-side
- `activeTab` — which status filter is selected
- `expandedLeadId` — which row is expanded (null = none)

**Stats bar** (top):
- Total Leads
- New
- Contacted
- Interested
- Demo
- Customers
- Conversion rate (% leads that reached Customer)

**Filter tabs:**
- All | New | Contacted | Interested | Demo | Customer | Closed

**Table columns:**
- Name (with expand arrow)
- Priority (colored badge: HIGH=red, MEDIUM=yellow, LOW=gray)
- Branches
- City
- Contact (wa.me link button)
- Status (dropdown to change)
- Last Contacted
- Actions (WA button, Delete)

**Expanded row:**
- Notes section (read + add note inline)
- Activity log (recent entries, newest first)
- Status change dropdown with confirmation

**Header actions:**
- "Tambah Lead" button → modal form
- Import button (future: CSV upload)

### Server Actions: `app/dashboard/marketing/actions.ts`

- `updateLeadStatus(leadId: string, status: string)` — changes status, logs activity, updates last_contacted_at if moving to contacted
- `addLeadNote(leadId: string, note: string)` — adds note, logs activity
- `createLead(data: LeadFormData)` — inserts new lead
- `deleteLead(leadId: string)` — deletes lead + cascade activities

---

## 4. WhatsApp Integration

Initially: **wa.me links**. The contact column renders a clickable button that opens `https://wa.me/{phone}` in a new tab. Phone numbers are cleaned (strip non-digits, prefix +62 if starting with 0).

Future: WuzAPI integration for sending from dashboard directly.

---

## 5. Data Import

### Migration: Import 28 leads

A Supabase migration SQL file that INSERTs all 28 leads from `kapster-leads.csv` with status `'new'` and appropriate priority.

Also create a seed script at `scripts/import-marketing-leads.ts` that can be re-run to re-import from CSV.

---

## 6. Analytics Requirements

Stats bar shows:
- Count per status
- Conversion rate (Customer / Total × 100)

Future: funnel visualization, outreach activity over time.

---

## 7. Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/20260604000001_marketing_leads.sql` | Create — tables, indexes, RLS |
| `lib/marketing-types.ts` | Create — TypeScript interfaces |
| `app/dashboard/marketing/page.tsx` | Create — server page |
| `app/dashboard/marketing/actions.ts` | Create — server actions |
| `components/dashboard/MarketingManager.tsx` | Create — client component |
| `components/dashboard/Sidebar.tsx` | Modify — add nav item |

---

## 8. Tech Stack

- **Framework:** Next.js 15 App Router
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Style:** Tailwind CSS v4 (existing theme)
- **Icons:** Inline SVGs
