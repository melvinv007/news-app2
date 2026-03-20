/**
 * config/sources.ts
 * ─────────────────────────────────────────────────────────────────
 * All RSS news sources. This is the ONLY place to add/edit sources.
 *
 * TO ADD A SOURCE: Add entry to the array. Fetcher picks it up automatically.
 * TO DISABLE:      Set enabled: false (keeps existing articles).
 * TO FIX BROKEN URL: Update url field here OR use Settings → Sources in app.
 *
 * PRIORITY (1-10): Higher = shown first when stories tie on score.
 *   9-10 = flagship (BBC, Reuters, The Hindu)
 *   7-8  = quality secondary
 *   5-6  = supplementary
 *
 * CATEGORIES:
 *   'world' | 'india' | 'mumbai'
 *   'sports-cricket' | 'sports-football' | 'sports-f1' | 'sports-other'
 *   'ai-tech' | 'business' | 'stocks-india' | 'stocks-us'
 */

export type NewsSource = {
  name: string;
  url: string;
  priority: number;
  category: string;
  enabled: boolean;
};

export const SOURCES: NewsSource[] = [

  // ── WORLD ────────────────────────────────────────────────────────────────
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', priority: 9, category: 'world', enabled: true },
  { name: 'Reuters', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&ceid=US:en&hl=en-US&gl=US', priority: 9, category: 'world', enabled: true },
  { name: 'AP News', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:apnews.com&ceid=US:en&hl=en-US&gl=US', priority: 8, category: 'world', enabled: true },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', priority: 8, category: 'world', enabled: true },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', priority: 7, category: 'world', enabled: true },
  { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml', priority: 7, category: 'world', enabled: true },
  { name: 'DW News', url: 'https://rss.dw.com/rdf/rss-en-all', priority: 7, category: 'world', enabled: true },
  { name: 'France 24', url: 'https://www.france24.com/en/rss', priority: 6, category: 'world', enabled: true },
  { name: 'ABC News World', url: 'https://abcnews.go.com/abcnews/internationalheadlines', priority: 6, category: 'world', enabled: true },

  // ── INDIA ────────────────────────────────────────────────────────────────
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', priority: 9, category: 'india', enabled: true },
  { name: 'The Hindu', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:thehindu.com&ceid=IN:en&hl=en-IN&gl=IN', priority: 9, category: 'india', enabled: true },
  { name: 'NDTV India', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:ndtv.com+india&ceid=IN:en&hl=en-IN&gl=IN', priority: 8, category: 'india', enabled: true },
  { name: 'Indian Express', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:indianexpress.com&ceid=IN:en&hl=en-IN&gl=IN', priority: 8, category: 'india', enabled: true },
  { name: 'The Wire', url: 'https://thewire.in/rss', priority: 7, category: 'india', enabled: true },
  { name: 'BBC India', url: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', priority: 7, category: 'india', enabled: true },
  { name: 'India Today', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:indiatoday.in&ceid=IN:en&hl=en-IN&gl=IN', priority: 7, category: 'india', enabled: true },
  { name: 'Tribune India', url: 'https://www.tribuneindia.com/rss/feed.aspx?cat=1', priority: 6, category: 'india', enabled: true },

  // ── MUMBAI ────────────────────────────────────────────────────────────────
  { name: 'TOI Mumbai', url: 'https://timesofindia.indiatimes.com/rssfeeds/3908999.cms', priority: 8, category: 'mumbai', enabled: true },
  { name: 'Mumbai Live', url: 'https://news.google.com/rss/search?q=when:24h+mumbai&ceid=IN:en&hl=en-IN&gl=IN', priority: 7, category: 'mumbai', enabled: true },
  { name: 'Mid-Day', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:mid-day.com&ceid=IN:en&hl=en-IN&gl=IN', priority: 6, category: 'mumbai', enabled: true },
  { name: 'Free Press India', url: 'https://news.google.com/rss/search?q=when:24h+mumbai+city&ceid=IN:en&hl=en-IN&gl=IN', priority: 6, category: 'mumbai', enabled: true },
  { name: 'Mumbai News', url: 'https://news.google.com/rss/search?q=when:24h+mumbai+news&ceid=IN:en&hl=en-IN&gl=IN', priority: 7, category: 'mumbai', enabled: true },

  // ── SPORTS — CRICKET ──────────────────────────────────────────────────────
  { name: 'ESPN Cricinfo', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', priority: 9, category: 'sports-cricket', enabled: true },
  { name: 'BBC Cricket', url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml', priority: 8, category: 'sports-cricket', enabled: true },
  { name: 'Sky Sports Cricket', url: 'https://www.skysports.com/rss/12364', priority: 7, category: 'sports-cricket', enabled: true },
  { name: 'Cricbuzz', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:cricbuzz.com&ceid=IN:en&hl=en-IN&gl=IN', priority: 7, category: 'sports-cricket', enabled: true },
  { name: 'TOI Cricket', url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', priority: 6, category: 'sports-cricket', enabled: true },

  // ── SPORTS — FOOTBALL ─────────────────────────────────────────────────────
  { name: 'BBC Football', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', priority: 9, category: 'sports-football', enabled: true },
  { name: 'Sky Sports Football', url: 'https://www.skysports.com/rss/12040', priority: 8, category: 'sports-football', enabled: true },
  { name: 'The Guardian Football', url: 'https://www.theguardian.com/football/rss', priority: 7, category: 'sports-football', enabled: true },
  { name: 'GiveMeSport', url: 'https://www.givemesport.com/feed', priority: 7, category: 'sports-football', enabled: true },
  { name: 'The Independent Sport', url: 'https://www.independent.co.uk/sport/rss', priority: 6, category: 'sports-football', enabled: true },
  { name: 'Goal.com', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:goal.com+football&ceid=US:en&hl=en-US&gl=US', priority: 6, category: 'sports-football', enabled: true },

  // ── SPORTS — F1 ───────────────────────────────────────────────────────────
  { name: 'BBC F1', url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml', priority: 9, category: 'sports-f1', enabled: true },
  { name: 'Autosport F1', url: 'https://www.autosport.com/rss/f1/news/', priority: 8, category: 'sports-f1', enabled: true },
  { name: 'Sky Sports F1', url: 'https://www.skysports.com/rss/12174', priority: 8, category: 'sports-f1', enabled: true },
  { name: 'Motorsport.com', url: 'https://www.motorsport.com/rss/f1/news/', priority: 7, category: 'sports-f1', enabled: true },
  { name: 'RaceFans', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:racefans.net&ceid=US:en&hl=en-US&gl=US', priority: 7, category: 'sports-f1', enabled: true },

  // ── SPORTS — OTHERS ───────────────────────────────────────────────────────
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', priority: 7, category: 'sports-other', enabled: true },
  { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', priority: 7, category: 'sports-other', enabled: true },
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', priority: 6, category: 'sports-other', enabled: true },

  // ── AI & TECH ─────────────────────────────────────────────────────────────
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', priority: 9, category: 'ai-tech', enabled: true },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', priority: 9, category: 'ai-tech', enabled: true },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', priority: 8, category: 'ai-tech', enabled: true },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', priority: 8, category: 'ai-tech', enabled: true },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', priority: 8, category: 'ai-tech', enabled: true },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', priority: 8, category: 'ai-tech', enabled: true },
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', priority: 9, category: 'ai-tech', enabled: true },
  { name: 'Anthropic Blog', url: 'https://www.anthropic.com/blog/rss.xml', priority: 9, category: 'ai-tech', enabled: true },
  { name: 'Google AI Blog', url: 'https://research.google/blog/rss', priority: 9, category: 'ai-tech', enabled: true },
  { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml', priority: 9, category: 'ai-tech', enabled: true },
  { name: 'Ars Technica AI', url: 'https://arstechnica.com/ai/feed', priority: 8, category: 'ai-tech', enabled: true },
  { name: 'IEEE Spectrum AI', url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss', priority: 7, category: 'ai-tech', enabled: true },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage?points=100', priority: 7, category: 'ai-tech', enabled: true },
  { name: 'Guardian Tech', url: 'https://www.theguardian.com/technology/artificialintelligenceai/rss', priority: 7, category: 'ai-tech', enabled: true },
  { name: 'HuggingFace', url: 'https://huggingface.co/blog/feed.xml', priority: 8, category: 'ai-tech', enabled: true },

  // ── BUSINESS ──────────────────────────────────────────────────────────────
  { name: 'Mint', url: 'https://www.livemint.com/rss/news', priority: 9, category: 'business', enabled: true },
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', priority: 8, category: 'business', enabled: true },
  { name: 'CNBC Business', url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', priority: 8, category: 'business', enabled: true },
  { name: 'Forbes', url: 'https://www.forbes.com/innovation/feed2', priority: 7, category: 'business', enabled: true },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', priority: 7, category: 'business', enabled: true },
  { name: 'Guardian Business', url: 'https://www.theguardian.com/business/rss', priority: 7, category: 'business', enabled: true },
  { name: 'NPR Business', url: 'https://feeds.npr.org/1006/rss.xml', priority: 6, category: 'business', enabled: true },
  { name: 'Quartz', url: 'https://qz.com/feed', priority: 6, category: 'business', enabled: true },

  // ── STOCKS — INDIA ────────────────────────────────────────────────────────
  { name: 'ET Markets', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', priority: 9, category: 'stocks-india', enabled: true },
  { name: 'Moneycontrol', url: 'https://www.moneycontrol.com/rss/latestnews.xml', priority: 8, category: 'stocks-india', enabled: true },
  { name: 'LiveMint Markets', url: 'https://www.livemint.com/rss/markets', priority: 8, category: 'stocks-india', enabled: true },
  { name: 'BSE India', url: 'https://news.google.com/rss/search?q=when:24h+NSE+BSE+sensex+nifty&ceid=IN:en&hl=en-IN&gl=IN', priority: 7, category: 'stocks-india', enabled: true },

  // ── STOCKS — US ───────────────────────────────────────────────────────────
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories', priority: 9, category: 'stocks-us', enabled: true },
  { name: 'CNBC Markets', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', priority: 8, category: 'stocks-us', enabled: true },
  { name: 'Reuters Finance', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com+markets&ceid=US:en&hl=en-US&gl=US', priority: 8, category: 'stocks-us', enabled: true },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', priority: 7, category: 'stocks-us', enabled: true },
  { name: 'Investopedia', url: 'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline', priority: 6, category: 'stocks-us', enabled: true },
];


export function getSourcesByCategory(category: string): NewsSource[] {
  return SOURCES.filter(s => s.category === category && s.enabled);
}

export function getSourcesByCategories(categories: string[]): NewsSource[] {
  return SOURCES.filter(s => categories.includes(s.category) && s.enabled);
}
