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
