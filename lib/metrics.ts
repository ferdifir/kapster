import { logError } from "@/lib/error-logger";

export async function recordMetric(
  supabase: any,
  metricName: string,
  metricValue: number,
  metadata?: Record<string, unknown>,
) {
  const today = new Date().toISOString().split("T")[0];
  try {
    await supabase.from("content_metrics").upsert(
      { metric_date: today, metric_name: metricName, metric_value: metricValue, metadata: metadata || {} },
      { onConflict: "metric_date,metric_name" }
    );
  } catch (err: any) {
    logError("recordMetric", err, { metricName, metricValue });
  }
}

export async function checkQualityAlerts(supabase: any) {
  const { data: recentTopics } = await supabase
    .from("social_posts")
    .select("topics")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

  const allTopics: string[] = recentTopics
    ?.flatMap((p: any) => (Array.isArray(p.topics) ? p.topics : []))
    .filter(Boolean) || [];

  const templateCount = allTopics.filter((t) =>
    t.toLowerCase().includes("optimalkan") || t.toLowerCase().includes("maksimalkan")
  ).length;

  const templateRatio = allTopics.length > 0 ? templateCount / allTopics.length : 0;
  await recordMetric(supabase, "template_ratio", Math.round(templateRatio * 100), {});

  const { data: scores } = await supabase
    .from("content_metrics")
    .select("metric_value, metric_date")
    .eq("metric_name", "qa_avg_score")
    .order("metric_date", { ascending: false })
    .limit(3);

  const lowScoreDays = scores?.filter((s: any) => s.metric_value < 4).length || 0;

  if (templateRatio > 0.2) {
    await sendTelegramAlert(
      `⚠️ *Content Quality Alert*\n\ntemplate_ratio: ${Math.round(templateRatio * 100)}% (target: <=20%)\n7 hari terakhir: ${templateCount}/${allTopics.length} topik mengandung 'optimalkan'/'maksimalkan'`,
    );
  }

  if (lowScoreDays >= 3) {
    await sendTelegramAlert(
      `⚠️ *Content Quality Alert*\n\nQA score < 4 selama ${lowScoreDays} hari berturut-turut.\nPeriksa prompt riset atau kualitas brief.`,
    );
  }
}

async function sendTelegramAlert(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}
