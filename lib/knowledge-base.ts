import { readFileSync } from "fs";
import { join } from "path";

interface Chunk {
  id: number;
  heading: string;
  content: string;
  keywords: string[];
  isInternal: boolean;
}

let chunksCache: Chunk[] | null = null;

function loadKB(): string {
  try {
    return readFileSync(join(process.cwd(), "docs/KNOWLEDGE-BASE.md"), "utf-8");
  } catch {
    return "";
  }
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const stopwords = new Set([
    "dan", "yang", "ini", "itu", "di", "ke", "dari", "dengan", "untuk",
    "pada", "adalah", "akan", "telah", "sudah", "bisa", "dapat", "tidak",
    "ada", "atau", "juga", "saat", "setiap", "via", "via", "the", "and",
    "are", "for", "not", "per", "dalam", "secara", "satu", "lain",
  ]);

  const counts = new Map<string, number>();
  for (const w of words) {
    if (!stopwords.has(w)) {
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);
}

function isInternalContent(lines: string[]): boolean {
  return lines.some((l) => l.includes("<!-- internal -->"));
}

function chunkKB(kb: string): Chunk[] {
  if (chunksCache) return chunksCache;

  const chunks: Chunk[] = [];
  let currentHeading = "Umum";
  let currentContent: string[] = [];
  let id = 0;

  const lines = kb.split("\n");
  for (const line of lines) {
    const headingMatch = line.match(/^## (.+)/);
    if (headingMatch) {
      if (currentContent.length > 0) {
        const content = currentContent.join("\n").trim();
        if (content) {
          chunks.push({
            id: id++,
            heading: currentHeading,
            content,
            keywords: extractKeywords(currentHeading + " " + content),
            isInternal: isInternalContent(currentContent),
          });
        }
      }
      currentHeading = headingMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    const content = currentContent.join("\n").trim();
    if (content) {
      chunks.push({
        id: id++,
        heading: currentHeading,
        content,
        keywords: extractKeywords(currentHeading + " " + content),
        isInternal: isInternalContent(currentContent),
      });
    }
  }

  chunksCache = chunks;
  return chunks;
}

function scoreRelevance(question: string, chunk: Chunk): number {
  const qLower = question.toLowerCase();
  const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);

  let score = 0;
  const matched = new Set<string>();

  for (const qWord of qWords) {
    for (const kw of chunk.keywords) {
      if (qWord === kw || kw.includes(qWord) || qWord.includes(kw)) {
        if (!matched.has(kw)) {
          matched.add(kw);
          score += 1;
        }
      }
    }
  }

  for (const kw of chunk.keywords) {
    if (qLower.includes(kw)) {
      if (!matched.has(kw)) {
        matched.add(kw);
        score += 2;
      }
    }
  }

  return score;
}

export interface RetrievalResult {
  chunks: Chunk[];
  context: string;
}

export function retrieve(question: string, topN = 3, includeInternal = false): RetrievalResult {
  const kb = loadKB();
  if (!kb) {
    return { chunks: [], context: "" };
  }

  const chunks = chunkKB(kb).filter((c) => includeInternal || !c.isInternal);
  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreRelevance(question, chunk) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  const context = scored
    .map((s) => `## ${s.chunk.heading}\n${s.chunk.content}`)
    .join("\n\n");

  return {
    chunks: scored.map((s) => s.chunk),
    context,
  };
}

export function getAllChunks(): Chunk[] {
  return chunkKB(loadKB());
}
