const API_KEY = process.env.NEWS_API_KEY || "";
const BASE = "https://newsapi.org/v2";

async function fetchAPI<T>(path: string): Promise<T> {
  if (!API_KEY) throw new Error("NEWS_API_KEY environment variable is required");
  const response = await fetch(`${BASE}${path}&apiKey=${API_KEY}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NewsAPI error ${response.status}: ${text}`);
  }
  return response.json();
}

export interface Article {
  title: string; description: string; url: string;
  source: string; publishedAt: string; author?: string;
  content?: string; urlToImage?: string;
}

export interface ScoredArticle extends Article {
  relevanceScore: number; sentiment: "positive" | "negative" | "neutral";
  topics: string[];
}

export interface Source { id: string; name: string; description: string; category: string; }

function computeRelevanceScore(article: Article, queryKeywords: string[]): number {
  let score = 50;
  const titleLower = (article.title || "").toLowerCase();
  const descLower = (article.description || "").toLowerCase();
  const combined = `${titleLower} ${descLower}`;

  for (const kw of queryKeywords) {
    const kwLower = kw.toLowerCase();
    if (titleLower.includes(kwLower)) score += 15;
    else if (descLower.includes(kwLower)) score += 8;
  }

  const publishedDate = new Date(article.publishedAt);
  const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) score += 20;
  else if (hoursAgo < 6) score += 15;
  else if (hoursAgo < 24) score += 10;
  else if (hoursAgo < 72) score += 5;
  else score -= 5;

  const wordCount = combined.split(/\s+/).length;
  if (wordCount > 30) score += 5;

  if (article.source) {
    const authoritativeSources = ["reuters", "ap", "bbc", "cnn", "nytimes", "guardian", "bloomberg", "wsj"];
    if (authoritativeSources.some(s => article.source.toLowerCase().includes(s))) score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveWords = ["success", "win", "growth", "boost", "improve", "gain", "rise", "record", "breakthrough", "advance", "positive", "happy", "celebrate", "achieve", "progress", "innovation", "triumph", "prosperity"];
  const negativeWords = ["crisis", "fail", "loss", "decline", "drop", "fall", "death", "disaster", "attack", "conflict", "negative", "angry", "protest", "damage", "threat", "risk", "collapse", "emergency", "war"];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  }

  if (positiveCount > negativeCount + 1) return "positive";
  if (negativeCount > positiveCount + 1) return "negative";
  return "neutral";
}

function extractTopics(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const topicPatterns: Record<string, string[]> = {
    "technology": ["ai", "artificial intelligence", "tech", "software", "startup", "digital", "cyber", "robot", "blockchain", "crypto", "chip", "semiconductor"],
    "politics": ["election", "president", "government", "congress", "senate", "democrat", "republican", "vote", "policy", "legislation"],
    "economy": ["economy", "gdp", "inflation", "interest rate", "stock", "market", "trade", "recession", "unemployment", "finance"],
    "health": ["health", "medical", "vaccine", "disease", "hospital", "doctor", "drug", "fda", "who", "pandemic", "virus"],
    "climate": ["climate", "environment", "carbon", "emission", "renewable", "solar", "wind energy", "pollution", "sustainability"],
    "sports": ["football", "basketball", "soccer", "tennis", "olympic", "nba", "nfl", "fifa", "championship", "tournament"],
    "science": ["research", "study", "discovery", "experiment", "scientist", "physics", "biology", "chemistry", "space", "nasa"],
  };

  const detectedTopics: string[] = [];
  for (const [topic, keywords] of Object.entries(topicPatterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      detectedTopics.push(topic);
    }
  }

  return detectedTopics.length > 0 ? detectedTopics : ["general"];
}

function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Map<string, Article>();

  for (const article of articles) {
    const normalizedTitle = article.title?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60) || "";
    const key = normalizedTitle;

    if (!seen.has(key)) {
      seen.set(key, article);
    } else {
      const existing = seen.get(key)!;
      if (article.source !== existing.source) {
        const combinedTitle = `${existing.title} (also reported by ${article.source})`;
        seen.set(key, { ...existing, title: combinedTitle });
      }
    }
  }

  return Array.from(seen.values());
}

export async function topHeadlines(
  country = "us", category?: string, pageSize = 10
): Promise<ScoredArticle[]> {
  let query = `country=${country}&pageSize=${pageSize}`;
  if (category) query += `&category=${category}`;
  const data = await fetchAPI<any>(`/top-headlines?${query}`);

  const articles: Article[] = (data.articles || []).map((a: any) => ({
    title: a.title, description: a.description, url: a.url,
    source: a.source?.name, publishedAt: a.publishedAt, author: a.author,
    content: a.content, urlToImage: a.urlToImage,
  }));

  const deduped = deduplicateArticles(articles);
  const queryWords = category ? [category] : [];

  return deduped.map(article => ({
    ...article,
    relevanceScore: computeRelevanceScore(article, queryWords),
    sentiment: analyzeSentiment(`${article.title} ${article.description || ""}`),
    topics: extractTopics(article.title || "", article.description || ""),
  }));
}

export async function searchNews(
  query: string, from?: string, to?: string,
  pageSize = 10, sortBy = "publishedAt"
): Promise<ScoredArticle[]> {
  let q = `q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=${sortBy}`;
  if (from) q += `&from=${from}`;
  if (to) q += `&to=${to}`;
  const data = await fetchAPI<any>(`/everything?${q}`);

  const articles: Article[] = (data.articles || []).map((a: any) => ({
    title: a.title, description: a.description, url: a.url,
    source: a.source?.name, publishedAt: a.publishedAt, author: a.author,
    content: a.content, urlToImage: a.urlToImage,
  }));

  const deduped = deduplicateArticles(articles);
  const keywords = query.split(/\s+/).filter(w => w.length > 2);

  return deduped.map(article => ({
    ...article,
    relevanceScore: computeRelevanceScore(article, keywords),
    sentiment: analyzeSentiment(`${article.title} ${article.description || ""}`),
    topics: extractTopics(article.title || "", article.description || ""),
  }));
}

export async function listSources(
  category?: string, language = "en"
): Promise<Source[]> {
  let query = `language=${language}`;
  if (category) query += `&category=${category}`;
  const data = await fetchAPI<any>(`/sources?${query}`);
  return (data.sources || []).map((s: any) => ({
    id: s.id, name: s.name, description: s.description, category: s.category,
  }));
}

export async function generateSummary(articles: ScoredArticle[]): Promise<{
  topStories: string[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  topicDistribution: Record<string, number>;
  keyTakeaways: string[];
}> {
  const sorted = [...articles].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topStories = sorted.slice(0, 5).map(a => `[${a.source}] ${a.title}`);

  const sentimentBreakdown = { positive: 0, negative: 0, neutral: 0 };
  for (const a of articles) sentimentBreakdown[a.sentiment]++;

  const topicDistribution: Record<string, number> = {};
  for (const a of articles) {
    for (const t of a.topics) topicDistribution[t] = (topicDistribution[t] || 0) + 1;
  }

  const keyTakeaways = [
    `${articles.length} articles analyzed across ${Object.keys(topicDistribution).length} topics`,
    `Sentiment: ${sentimentBreakdown.positive} positive, ${sentimentBreakdown.negative} negative, ${sentimentBreakdown.neutral} neutral`,
    `Top topic: ${Object.entries(topicDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A"}`,
    `Most relevant: "${sorted[0]?.title || "N/A"}"`,
  ];

  return { topStories, sentimentBreakdown, topicDistribution, keyTakeaways };
}
