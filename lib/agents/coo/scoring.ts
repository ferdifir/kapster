export interface ScoreInput {
  title: string;
  description: string | null;
  agentId: string;
}

export interface ScoreResult {
  score: number;
  urgency: number;
  impact: number;
  risk: number;
  cost: number;
  reasoning: string;
}

const THRESHOLD_AUTO = 85;
const THRESHOLD_APPROVAL = 50;

const URGENCY_KEYWORDS: Record<string, number> = {
  bug: 35,
  error: 35,
  crash: 40,
  down: 40,
  outage: 40,
  critical: 38,
  urgent: 35,
  churn: 30,
  revenue: 30,
  "customer complaint": 28,
  security: 38,
};

const HIGH_IMPACT_KEYWORDS = [
  "pricing", "revenue", "churn", "deploy", "release",
  "migration", "security", "performance", "onboarding",
];

export function calculateScore(input: ScoreInput): ScoreResult {
  const text = `${input.title} ${input.description ?? ""}`.toLowerCase();

  // Urgensi (0-40)
  let urgency = 10;
  for (const [keyword, points] of Object.entries(URGENCY_KEYWORDS)) {
    if (text.includes(keyword)) {
      urgency = Math.max(urgency, points);
    }
  }

  // Impact ke visi misi (0-30)
  let impact = 10;
  for (const keyword of HIGH_IMPACT_KEYWORDS) {
    if (text.includes(keyword)) {
      impact = Math.max(impact, 25);
    }
  }
  if (text.includes("feature") || text.includes("fitur")) impact = Math.max(impact, 20);

  // Risk (0-20) - higher = riskier
  let risk = 10;
  if (text.includes("delete") || text.includes("hapus")) risk = 18;
  if (text.includes("migration")) risk = 18;
  if (text.includes("change") || text.includes("ubah") || text.includes("ganti")) risk = 15;
  if (text.includes("pricing") || text.includes("harga")) risk = 18;
  if (text.includes("ui") || text.includes("redesign") || text.includes("desain")) risk = 12;
  if (text.includes("bug") || text.includes("fix")) risk = 5;

  // Cost (0-10) - estimate based on description
  let cost = 5;
  const descLen = (input.description ?? "").length;
  if (descLen > 500) cost = 8;
  if (descLen > 2000) cost = 10;
  if (descLen < 100) cost = 3;

  const total = Math.min(100, urgency + impact + risk + cost);

  const reasoning = `urgency=${urgency}, impact=${impact}, risk=${risk}, cost=${cost}`;

  return { score: total, urgency, impact, risk, cost, reasoning };
}

export function evaluateThreshold(score: number): "auto" | "approval" | "rejected" {
  if (score >= THRESHOLD_AUTO) return "auto";
  if (score >= THRESHOLD_APPROVAL) return "approval";
  return "rejected";
}
