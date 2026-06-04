# Marketing CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a marketing CRM inside the Kapster admin dashboard for managing barbershop lead outreach, with 28 pre-loaded leads.

**Architecture:** New Supabase migration (2 tables) + server actions + client component following existing dashboard patterns. Single-user admin tool (no barbershop_id scoping).

**Tech Stack:** Next.js 15, Supabase (PostgreSQL), Tailwind CSS v4, inline SVGs

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260604000001_marketing_leads.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- Marketing CRM for Kapster admin lead outreach

CREATE TABLE marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  branches text,
  city text,
  instagram text,
  priority text NOT NULL DEFAULT 'LOW' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'demo', 'customer', 'closed')),
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketing_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('note', 'wa_sent', 'status_change')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX marketing_leads_status_idx ON marketing_leads(status);
CREATE INDEX marketing_leads_priority_idx ON marketing_leads(priority);
CREATE INDEX marketing_lead_activities_lead_id_idx ON marketing_lead_activities(lead_id);

ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_marketing_leads" ON marketing_leads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_all_marketing_lead_activities" ON marketing_lead_activities
  FOR ALL USING (auth.role() = 'authenticated');
```

- [ ] **Step 2: Run migration**

Run: `supabase migration up`
Expected: Tables created successfully.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260604000001_marketing_leads.sql
git commit -m "feat: add marketing_leads and marketing_lead_activities tables"
```

---

### Task 2: Seed Migration (Import 28 Leads)

**Files:**
- Create: `supabase/seed-marketing-leads.sql`

- [ ] **Step 1: Write seed SQL**

```sql
-- Seed script: Import 28 barbershop leads from OSINT research
-- Run: psql $DATABASE_URL -f supabase/seed-marketing-leads.sql

INSERT INTO marketing_leads (name, priority, status, contact, branches, city, instagram, notes) VALUES
('Captain Barbershop', 'HIGH', 'new', '0812-8077-7736', '130+', 'Jabodetabek/Bandung/Surabaya/Medan/Karawang', '@captainbarbershopid', 'Chain terbesar'),
('Barberpedia', 'HIGH', 'new', '+62-857-1814-1125', '45+', 'Jakarta/Tangerang/Karawaci', '@barberpedia.official', NULL),
('Di Bawah Pohon', 'HIGH', 'new', '0811-153-7327', '10+', 'BSD/Menteng/Tangsel/Jakpus', '@dibawahpohon_', NULL),
('BarberKing Indonesia', 'HIGH', 'new', '0821-7733-2015', '21+', 'JOGLOSEMAR', '@barberking', NULL),
('Lanang Barbershop', 'HIGH', 'new', '0831-3723-0858', '100+', 'Jabodetabek/Semarang', '@lanangbarbershop01', NULL),
('Raja Cukur Barbershop', 'HIGH', 'new', '081-2283-0798', '370+', 'Semarang (HQ)', '@rajacukur_pusat', 'WA admin'),
('Moxie Barbershop', 'HIGH', 'new', '0812-9832-2009', '17+', 'Jawa/Lampung', '@moxie_barbers', NULL),
('Serious Cut Barbershop', 'HIGH', 'new', '+62-821-1111-8692', '120+', 'Pulau Jawa', '@seriouscut_barbershop', 'WA kemitraan'),
('Deft Barber', 'HIGH', 'new', '+62-857-7777-5749', '60+', 'Bogor/Jabodetabek/Sumsel', '@deftbarber', NULL),
('Studio Potong', 'HIGH', 'new', '0815-1996-7292', '10+', 'Jakarta/Tangerang/Karawang/Denpasar', '@studiopotong', 'WA admin 1'),
('Vegas Barbershop', 'HIGH', 'new', '+62-857-3968-7214', '10+', 'Bali', '@vegas_barbershop', NULL),
('Barberia', 'MEDIUM', 'new', '+62-21-23580339', '5+', 'Jakarta', '@barberia_id', NULL),
('Giovani Barbershop', 'MEDIUM', 'new', '0811-6518-018', '—', 'Medan', '@giovani_barbershop', NULL),
('Barbertopia', 'MEDIUM', 'new', '0812-1050-4068', '—', 'Indonesia', NULL, NULL),
('Paxi Barbershop', 'MEDIUM', 'new', '(021) 29528493', '4', 'Jakarta', '@paxi_barbershop', NULL),
('Tohang''s Barber', 'MEDIUM', 'new', '0812-8888-4782', '9+', 'Jakarta/Tangerang/Bogor', '@tohangsbarber', 'WA kemitraan'),
('Barberbox', 'MEDIUM', 'new', '0812-9439-5909', '4', 'Jakarta Selatan', '@barberbox_senayan', NULL),
('Broadway Barbershop', 'MEDIUM', 'new', '0812-3454-9090', '3+', 'Surabaya', '@broadwaybarber.id', NULL),
('The Original Barbershop', 'MEDIUM', 'new', '0813-3669-9902', '4', 'Surabaya', '@theoriginalbarbers', NULL),
('Spartan Barbershop', 'MEDIUM', 'new', '082-111-880-882', '3', 'Medan', '@spartan_ringroad', NULL),
('NKRI Barbershop', 'MEDIUM', 'new', '0878-6788-8880', '5', 'Bangil/Pandaan/Surabaya', '@nkri_barbershop', NULL),
('Pax Wijaya', 'LOW', 'new', '(021) 7207138', '1', 'Jakarta Selatan', NULL, 'Legendaris since 1965'),
('Rogue & Beyond', 'LOW', 'new', '+62-811-866-651', '1', 'Jakarta Selatan', '@rogueandbeyond', NULL),
('ELDER Barberhouse', 'LOW', 'new', '+62-812-3667-8589', '1', 'Jakarta Selatan', '@elderbarberhouse', NULL),
('Good Willie Barber Shop', 'LOW', 'new', '+62-21-22322938', '1', 'Jakarta Timur', '@goodwilliebarbershop', NULL),
('Cukur Hade Barbershop', 'LOW', 'new', '+62-822-1665-5665', '1', 'Bandung', '@cukurhade3.barbershop', NULL),
('Dutchman Barbershop', 'LOW', 'new', '0821-1000-9744', '1', 'Surabaya', '@dutchmanbarbershop', NULL),
('Sobat Barbershop', 'LOW', 'new', '0859-1065-07808', '1', 'Surabaya', NULL, NULL);
```

Also create a lead activity for the import event:

```sql
INSERT INTO marketing_lead_activities (lead_id, activity_type, description)
SELECT id, 'note', 'Lead diimport dari hasil riset OSINT'
FROM marketing_leads;
```

- [ ] **Step 2: Run seed**

Run: `supabase db reset` (if starting fresh) or execute the SQL directly via `supabase sql`

- [ ] **Step 3: Commit**

```bash
git add supabase/seed-marketing-leads.sql
git commit -m "feat: seed 28 marketing leads from OSINT research"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `lib/marketing-types.ts`

- [ ] **Step 1: Write type definitions**

```typescript
export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

export type LeadStatus = "new" | "contacted" | "interested" | "demo" | "customer" | "closed";

export type ActivityType = "note" | "wa_sent" | "status_change";

export interface MarketingLead {
  id: string;
  name: string;
  contact: string;
  branches: string | null;
  city: string | null;
  instagram: string | null;
  priority: LeadPriority;
  status: LeadStatus;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingLeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  demo: number;
  customer: number;
  closed: number;
  conversion_rate: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/marketing-types.ts
git commit -m "feat: add marketing lead TypeScript types"
```

---

### Task 4: Server Actions

**Files:**
- Create: `app/dashboard/marketing/actions.ts`

- [ ] **Step 1: Write server actions**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_leads")
    .update({
      status,
      last_contacted_at: status === "contacted" ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  if (error) throw new Error(error.message);

  const statusLabels: Record<string, string> = {
    new: "Baru",
    contacted: "Sudah Dihubungi",
    interested: "Tertarik",
    demo: "Demo",
    customer: "Customer",
    closed: "Tutup",
  };

  await supabase.from("marketing_lead_activities").insert({
    lead_id: leadId,
    activity_type: "status_change",
    description: `Status berubah: ${statusLabels[status] || status}`,
  });

  revalidatePath("/dashboard/marketing");
}

export async function addLeadNote(leadId: string, note: string) {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("marketing_leads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (updateError) throw new Error(updateError.message);

  const { error } = await supabase.from("marketing_lead_activities").insert({
    lead_id: leadId,
    activity_type: "note",
    description: note,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/marketing");
}

export async function createLead(data: {
  name: string;
  contact: string;
  branches?: string;
  city?: string;
  instagram?: string;
  priority: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("marketing_leads").insert({
    name: data.name,
    contact: data.contact,
    branches: data.branches || null,
    city: data.city || null,
    instagram: data.instagram || null,
    priority: data.priority,
    notes: data.notes || null,
    status: "new",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/marketing");
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_leads")
    .delete()
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/marketing");
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/marketing/actions.ts
git commit -m "feat: add marketing lead server actions"
```

---

### Task 5: Sidebar Navigation

**Files:**
- Modify: `components/dashboard/Sidebar.tsx` (add item between Analitik and Referral)

- [ ] **Step 1: Add Marketing nav item**

Insert after the Analytics item (line 42):

```typescript
  {
    href: "/dashboard/marketing",
    label: "Marketing",
    icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
  },
```

The icon is a megaphone/speaker from Heroicons.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add Marketing nav item to sidebar"
```

---

### Task 6: Marketing Server Page

**Files:**
- Create: `app/dashboard/marketing/page.tsx`

- [ ] **Step 1: Write server page**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MarketingManager from "@/components/dashboard/MarketingManager";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: leads } = await supabase
    .from("marketing_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: activities } = await supabase
    .from("marketing_lead_activities")
    .select("*")
    .order("created_at", { ascending: false });

  const activitiesByLead: Record<string, typeof activities> = {};
  if (activities) {
    for (const a of activities) {
      if (!activitiesByLead[a.lead_id]) activitiesByLead[a.lead_id] = [];
      activitiesByLead[a.lead_id].push(a);
    }
  }

  const total = leads?.length ?? 0;
  const newCount = leads?.filter((l) => l.status === "new").length ?? 0;
  const contacted = leads?.filter((l) => l.status === "contacted").length ?? 0;
  const interested = leads?.filter((l) => l.status === "interested").length ?? 0;
  const demo = leads?.filter((l) => l.status === "demo").length ?? 0;
  const customer = leads?.filter((l) => l.status === "customer").length ?? 0;
  const closed = leads?.filter((l) => l.status === "closed").length ?? 0;

  const stats = {
    total,
    new: newCount,
    contacted,
    interested,
    demo,
    customer,
    closed,
    conversion_rate: total > 0 ? Math.round((customer / total) * 100) : 0,
  };

  return (
    <MarketingManager
      initialLeads={leads ?? []}
      initialActivitiesByLead={activitiesByLead}
      stats={stats}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/marketing/page.tsx
git commit -m "feat: add marketing dashboard server page"
```

---

### Task 7: Marketing Manager Client Component

**Files:**
- Create: `components/dashboard/MarketingManager.tsx`

This is the main component. It has:
- Stats bar at top (cards per status)
- Filter tabs (All, New, Contacted, Interested, Demo, Customer, Closed)
- Table with expandable rows
- Inline note adding
- Status change dropdown
- WA click-to-chat
- Add lead modal

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useTransition } from "react";
import type { MarketingLead, MarketingLeadActivity, LeadStats } from "@/lib/marketing-types";
import { updateLeadStatus, addLeadNote, createLead, deleteLead } from "@/app/dashboard/marketing/actions";

function formatPhone(contact: string): string {
  const digits = contact.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Baru",
  contacted: "Sudah Dihubungi",
  interested: "Tertarik",
  demo: "Demo",
  customer: "Customer",
  closed: "Tutup",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  interested: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  demo: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  customer: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-dark-600/50 text-dark-400 border-dark-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  LOW: "bg-dark-600/50 text-dark-400 border-dark-500/30",
};

export default function MarketingManager({
  initialLeads,
  initialActivitiesByLead,
  stats,
}: {
  initialLeads: MarketingLead[];
  initialActivitiesByLead: Record<string, MarketingLeadActivity[]>;
  stats: LeadStats;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [activitiesByLead, setActivitiesByLead] = useState(initialActivitiesByLead);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    contact: "",
    branches: "",
    city: "",
    instagram: "",
    priority: "MEDIUM" as string,
    notes: "",
  });

  const filteredLeads =
    activeTab === "all"
      ? leads
      : leads.filter((l) => l.status === activeTab);

  const tabs = [
    { key: "all", label: "Semua", count: stats.total },
    { key: "new", label: "Baru", count: stats.new },
    { key: "contacted", label: "Dihubungi", count: stats.contacted },
    { key: "interested", label: "Tertarik", count: stats.interested },
    { key: "demo", label: "Demo", count: stats.demo },
    { key: "customer", label: "Customer", count: stats.customer },
    { key: "closed", label: "Tutup", count: stats.closed },
  ];

  function handleStatusChange(leadId: string, status: string) {
    startTransition(async () => {
      await updateLeadStatus(leadId, status);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                status: status as MarketingLead["status"],
                last_contacted_at:
                  status === "contacted" ? new Date().toISOString() : l.last_contacted_at,
                updated_at: new Date().toISOString(),
              }
            : l
        )
      );
      setActivitiesByLead((prev) => ({
        ...prev,
        [leadId]: [
          {
            id: crypto.randomUUID(),
            lead_id: leadId,
            activity_type: "status_change",
            description: `Status berubah: ${STATUS_LABELS[status] || status}`,
            created_at: new Date().toISOString(),
          },
          ...(prev[leadId] || []),
        ],
      }));
    });
  }

  function handleAddNote(leadId: string) {
    const note = noteInputs[leadId]?.trim();
    if (!note) return;
    startTransition(async () => {
      await addLeadNote(leadId, note);
      setNoteInputs((prev) => ({ ...prev, [leadId]: "" }));
      setActivitiesByLead((prev) => ({
        ...prev,
        [leadId]: [
          {
            id: crypto.randomUUID(),
            lead_id: leadId,
            activity_type: "note",
            description: note,
            created_at: new Date().toISOString(),
          },
          ...(prev[leadId] || []),
        ],
      }));
    });
  }

  function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createLead(addForm);
      setShowAddModal(false);
      setAddForm({ name: "", contact: "", branches: "", city: "", instagram: "", priority: "MEDIUM", notes: "" });
    });
  }

  function handleDelete(leadId: string) {
    if (!confirm("Hapus lead ini?")) return;
    startTransition(async () => {
      await deleteLead(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Marketing</h1>
          <p className="text-dark-400 text-sm">Kelola leads & outreach barbershop</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-barber-400 text-dark-900 font-medium text-sm hover:bg-barber-500 transition-colors"
        >
          + Tambah Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total, accent: false },
          { label: "Baru", value: stats.new, accent: stats.new > 0 },
          { label: "Dihubungi", value: stats.contacted, accent: stats.contacted > 0 },
          { label: "Tertarik", value: stats.interested, accent: stats.interested > 0 },
          { label: "Demo", value: stats.demo, accent: stats.demo > 0 },
          { label: "Customer", value: stats.customer, accent: stats.customer > 0 },
          { label: "Konversi", value: `${stats.conversion_rate}%`, accent: stats.conversion_rate > 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border ${
              stat.accent
                ? "bg-barber-400/10 border-barber-400/30"
                : "bg-dark-800/50 border-dark-700/30"
            }`}
          >
            <p className="text-dark-400 text-xs mb-1">{stat.label}</p>
            <p
              className={`font-display text-xl font-bold ${
                stat.accent ? "text-barber-400" : "text-white"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              activeTab === tab.key
                ? "bg-barber-400/20 text-barber-400 border-barber-400/30"
                : "bg-dark-800/50 text-dark-400 border-dark-700/30 hover:text-white"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
          <p className="text-dark-400">Belum ada lead di kategori ini</p>
        </div>
      ) : (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700/30">
                <th className="text-left text-dark-400 font-medium px-4 py-3 w-8"></th>
                <th className="text-left text-dark-400 font-medium px-4 py-3">Nama</th>
                <th className="text-left text-dark-400 font-medium px-4 py-3 hidden md:table-cell">Prioritas</th>
                <th className="text-left text-dark-400 font-medium px-4 py-3 hidden lg:table-cell">Cabang</th>
                <th className="text-left text-dark-400 font-medium px-4 py-3 hidden xl:table-cell">Kota</th>
                <th className="text-left text-dark-400 font-medium px-4 py-3">WA</th>
                <th className="text-left text-dark-400 font-medium px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left text-dark-400 font-medium px-4 py-3 hidden md:table-cell">Kontak Terakhir</th>
                <th className="text-left text-dark-400 font-medium px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <>
                  <tr
                    key={lead.id}
                    className="border-b border-dark-700/20 hover:bg-dark-700/20 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <td className="px-4 py-3">
                      <svg
                        className={`w-4 h-4 text-dark-500 transition-transform ${
                          expandedId === lead.id ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{lead.name}</span>
                      {lead.instagram && (
                        <span className="text-dark-500 text-xs ml-2">{lead.instagram}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          PRIORITY_COLORS[lead.priority]
                        }`}
                      >
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-300 hidden lg:table-cell">{lead.branches || "—"}</td>
                    <td className="px-4 py-3 text-dark-300 hidden xl:table-cell">{lead.city || "—"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${formatPhone(lead.contact)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors text-xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Chat
                      </a>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <select
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        disabled={isPending}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border appearance-none cursor-pointer ${
                          STATUS_COLORS[lead.status]
                        } bg-transparent`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key} className="bg-dark-800 text-white">
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-dark-500 text-xs hidden md:table-cell">
                      {lead.last_contacted_at
                        ? new Date(lead.last_contacted_at).toLocaleDateString("id-ID")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(lead.id);
                        }}
                        disabled={isPending}
                        className="text-dark-500 hover:text-red-400 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {expandedId === lead.id && (
                    <tr key={`${lead.id}-expanded`}>
                      <td colSpan={9} className="bg-dark-900/50 px-4 pb-4">
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                          {/* Notes & Activity */}
                          <div>
                            <h4 className="text-dark-400 text-xs font-medium mb-2 uppercase tracking-wider">Aktivitas</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {(activitiesByLead[lead.id] || []).slice(0, 20).map((a) => (
                                <div key={a.id} className="flex items-start gap-2 text-xs">
                                  <span
                                    className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                      a.activity_type === "status_change"
                                        ? "bg-barber-400"
                                        : a.activity_type === "wa_sent"
                                        ? "bg-green-400"
                                        : "bg-dark-500"
                                    }`}
                                  />
                                  <div>
                                    <p className="text-dark-300">{a.description}</p>
                                    <p className="text-dark-500">
                                      {new Date(a.created_at).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {(!activitiesByLead[lead.id] || activitiesByLead[lead.id].length === 0) && (
                                <p className="text-dark-500 text-xs">Belum ada aktivitas</p>
                              )}
                            </div>
                          </div>

                          {/* Add note */}
                          <div>
                            <h4 className="text-dark-400 text-xs font-medium mb-2 uppercase tracking-wider">Catatan</h4>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={noteInputs[lead.id] || ""}
                                onChange={(e) =>
                                  setNoteInputs((prev) => ({ ...prev, [lead.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddNote(lead.id);
                                }}
                                placeholder="Tambah catatan..."
                                className="flex-1 bg-dark-800 border border-dark-700/30 rounded-xl px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-barber-400/50"
                              />
                              <button
                                onClick={() => handleAddNote(lead.id)}
                                disabled={isPending || !noteInputs[lead.id]?.trim()}
                                className="px-3 py-2 rounded-xl bg-barber-400 text-dark-900 text-sm font-medium disabled:opacity-50 hover:bg-barber-500 transition-colors"
                              >
                                Kirim
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-700/30 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold text-white">Tambah Lead Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-dark-400 text-sm block mb-1">Nama Barbershop *</label>
                  <input
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-dark-900 border border-dark-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-barber-400/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-dark-400 text-sm block mb-1">Kontak WA/Phone *</label>
                  <input
                    required
                    value={addForm.contact}
                    onChange={(e) => setAddForm((f) => ({ ...f, contact: e.target.value }))}
                    className="w-full bg-dark-900 border border-dark-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-barber-400/50"
                  />
                </div>
                <div>
                  <label className="text-dark-400 text-sm block mb-1">Kota</label>
                  <input
                    value={addForm.city}
                    onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full bg-dark-900 border border-dark-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-barber-400/50"
                  />
                </div>
                <div>
                  <label className="text-dark-400 text-sm block mb-1">Cabang</label>
                  <input
                    value={addForm.branches}
                    onChange={(e) => setAddForm((f) => ({ ...f, branches: e.target.value }))}
                    className="w-full bg-dark-900 border border-dark-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-barber-400/50"
                  />
                </div>
                <div>
                  <label className="text-dark-400 text-sm block mb-1">Instagram</label>
                  <input
                    value={addForm.instagram}
                    onChange={(e) => setAddForm((f) => ({ ...f, instagram: e.target.value }))}
                    className="w-full bg-dark-900 border border-dark-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-barber-400/50"
                  />
                </div>
                <div>
                  <label className="text-dark-400 text-sm block mb-1">Prioritas</label>
                  <select
                    value={addForm.priority}
                    onChange={(e) => setAddForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-dark-900 border border-dark-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-barber-400/50"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-dark-400 text-sm block mb-1">Catatan</label>
                  <textarea
                    value={addForm.notes}
                    onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-dark-900 border border-dark-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-barber-400/50 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 text-dark-300 border border-dark-700/30 text-sm hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl bg-barber-400 text-dark-900 font-medium text-sm hover:bg-barber-500 transition-colors disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/MarketingManager.tsx
git commit -m "feat: add marketing manager client component"
```

---

### Task 8: Build and Verify

- [ ] **Step 1: Build the project**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Test the page loads**

Start dev server: `npm run dev`
Visit: `http://localhost:3000/dashboard/marketing`
Expected: Page renders with 28 leads, stats bar, filter tabs, expandable rows.

- [ ] **Step 3: Test interactions**
- Change lead status via dropdown → should update optimistically
- Add a note → should appear in activity log
- Click WA chat button → should open wa.me in new tab
- Add new lead via modal → should appear in table

- [ ] **Step 4: Final commit**

```bash
git commit -m "chore: verify marketing CRM builds and functions"
```
