export interface ReferralCodeRow {
  id: string;
  profile_id: string | null;
  name: string | null;
  wa_number: string | null;
  code: string;
  access_token: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
}

export interface ReferralRow {
  id: string;
  referral_code_id: string;
  barbershop_id: string;
  status: "pending" | "earned" | "paid";
  commission: number;
  earned_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PayoutRequestRow {
  id: string;
  referral_code_id: string;
  amount: number;
  method: string | null;
  bank_info: Record<string, string> | null;
  status: "pending" | "paid" | "cancelled";
  notes: string | null;
  requested_at: string;
  paid_at: string | null;
}
