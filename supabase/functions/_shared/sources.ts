/**
 * supabase/functions/_shared/sources.ts
 * All RSS news sources — copied from config/sources.ts.
 */

export type NewsSource = {
  name: string;
  url: string;
  priority: number;
  category: string;
  enabled: boolean;
};

export const SOURCES: NewsSource[] = [
  // WORLD
  { name: 'BBC World',       url: 'https://feeds.bbci.co.uk/news/rss.xml',                              priority: 9, category: 'world',          enabled: true },
  { name: 'Reuters',         url: 'https://feeds.reuters.com/reuters/topNews',                          priority: 9, category: 'world',          enabled: true },
  { name: 'AP News',         url: 'https://apnews.com/rss',                                             priority: 8, category: 'world',          enabled: true },
  { name: 'Al Jazeera',      url: 'https://www.aljazeera.com/xml/rss/all.xml',                           priority: 7, category: 'world',          enabled: true },
  { name: 'The Guardian',    url: 'https://www.theguardian.com/world/rss',                               priority: 7, category: 'world',          enabled: true },
  { name: 'DW News',         url: 'https://rss.dw.com/xml/rss-en-all',                                  priority: 6, category: 'world',          enabled: true },
  // INDIA
  { name: 'The Hindu',       url: 'https://www.thehindu.com/feeder/default.rss',                        priority: 9, category: 'india',          enabled: true },
  { name: 'NDTV',            url: 'https://feeds.feedburner.com/ndtvnews-top-stories',                   priority: 8, category: 'india',          enabled: true },
  { name: 'Indian Express',  url: 'https://indianexpress.com/feed/',                                    priority: 8, category: 'india',          enabled: true },
  { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',     priority: 7, category: 'india',          enabled: true },
  { name: 'The Wire',        url: 'https://thewire.in/rss/',                                             priority: 7, category: 'india',          enabled: true },
  { name: 'Scroll.in',       url: 'https://scroll.in/rss',                                              priority: 6, category: 'india',          enabled: true },
  { name: 'India News',      url: 'https://news.google.com/rss/search?q=india+news&ceid=IN:en&hl=en-IN&gl=IN', priority: 7, category: 'india', enabled: true },
  { name: 'India Today News',url: 'https://news.google.com/rss/search?q=india+today+news&ceid=IN:en&hl=en-IN&gl=IN', priority: 6, category: 'india', enabled: true },
  // MUMBAI
  { name: 'HT Mumbai',       url: 'https://www.hindustantimes.com/feeds/rss/mumbai-news/rssfeed.xml',    priority: 8, category: 'mumbai',         enabled: false },
  { name: 'TOI Mumbai',      url: 'https://timesofindia.indiatimes.com/rssfeeds/3908999.cms',            priority: 7, category: 'mumbai',         enabled: false },
  { name: 'Mid-Day',         url: 'https://www.mid-day.com/rss/mumbai-news.xml',                        priority: 6, category: 'mumbai',         enabled: false },
  { name: 'Mumbai News',     url: 'https://news.google.com/rss/search?q=mumbai+news&ceid=IN:en&hl=en-IN&gl=IN', priority: 7, category: 'mumbai', enabled: true },
  { name: 'Mumbai Times',    url: 'https://news.google.com/rss/search?q=mumbai&ceid=IN:en&hl=en-IN&gl=IN', priority: 6, category: 'mumbai', enabled: true },
  // SPORTS — CRICKET
  { name: 'ESPN Cricinfo',   url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',          priority: 9, category: 'sports-cricket', enabled: true },
  { name: 'Cricbuzz',        url: 'https://news.google.com/rss/search?q=when:24h+allinurl:cricbuzz.com&ceid=IN:en&hl=en-IN&gl=IN', priority: 8, category: 'sports-cricket', enabled: true },
  { name: 'BBC Cricket',     url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml',                     priority: 7, category: 'sports-cricket', enabled: true },
  // SPORTS — FOOTBALL
  { name: 'Goal.com',        url: 'https://news.google.com/rss/search?q=when:24h+allinurl:goal.com+football&ceid=US:en&hl=en-US&gl=US', priority: 8, category: 'sports-football', enabled: true },
  { name: 'BBC Football',    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',                    priority: 8, category: 'sports-football',enabled: true },
  { name: 'Sky Sports Football', url: 'https://www.skysports.com/rss/12040',                            priority: 7, category: 'sports-football',enabled: true },
  { name: 'Bleacher Report', url: 'https://news.google.com/rss/search?q=when:24h+sports&ceid=US:en&hl=en-US&gl=US', priority: 6, category: 'sports-football', enabled: true },
  // SPORTS — F1
  { name: 'Formula1.com',    url: 'https://www.formula1.com/content/fom-website/en/latest/all.rss',     priority: 9, category: 'sports-f1',      enabled: true },
  { name: 'Autosport F1',    url: 'https://www.autosport.com/rss/f1/news/',                             priority: 8, category: 'sports-f1',      enabled: true },
  { name: 'RaceFans',        url: 'https://www.racefans.net/feed/',                                     priority: 7, category: 'sports-f1',      enabled: true },
  { name: 'BBC F1',          url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml',                    priority: 7, category: 'sports-f1',      enabled: true },
  // SPORTS — OTHERS
  { name: 'BBC Sport',       url: 'https://feeds.bbci.co.uk/sport/rss.xml',                             priority: 7, category: 'sports-other',   enabled: true },
  { name: 'ESPN',            url: 'https://www.espn.com/espn/rss/news',                                 priority: 7, category: 'sports-other',   enabled: true },
  // AI & TECH
  { name: 'TechCrunch',      url: 'https://techcrunch.com/feed/',                                       priority: 8, category: 'ai-tech',        enabled: true },
  { name: 'The Verge',       url: 'https://www.theverge.com/rss/index.xml',                             priority: 8, category: 'ai-tech',        enabled: true },
  { name: 'Wired',           url: 'https://www.wired.com/feed/rss',                                     priority: 8, category: 'ai-tech',        enabled: true },
  { name: 'Ars Technica',    url: 'https://feeds.arstechnica.com/arstechnica/index',                    priority: 8, category: 'ai-tech',        enabled: true },
  { name: 'VentureBeat',     url: 'https://venturebeat.com/feed/',                                      priority: 7, category: 'ai-tech',        enabled: true },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/',                             priority: 8, category: 'ai-tech',        enabled: true },
  { name: 'DeepMind Blog',   url: 'https://deepmind.google/blog/rss.xml',                               priority: 9, category: 'ai-tech',        enabled: true },
  { name: 'OpenAI Blog',     url: 'https://openai.com/blog/rss.xml',                                    priority: 9, category: 'ai-tech',        enabled: true },
  { name: 'HuggingFace',     url: 'https://huggingface.co/blog/feed.xml',                               priority: 8, category: 'ai-tech',        enabled: true },
  { name: 'Google AI Blog',  url: 'https://blog.google/technology/ai/rss/',                             priority: 9, category: 'ai-tech',        enabled: true },
  { name: 'Anthropic Blog',  url: 'https://www.anthropic.com/blog/rss.xml',                             priority: 9, category: 'ai-tech',        enabled: true },
  // BUSINESS
  { name: 'Mint',            url: 'https://www.livemint.com/rss/news',                                  priority: 8, category: 'business',       enabled: true },
  { name: 'Economic Times',  url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',        priority: 8, category: 'business',       enabled: true },
  { name: 'Forbes',          url: 'https://www.forbes.com/business/feed/',                              priority: 7, category: 'business',       enabled: true },
  { name: 'Quartz',          url: 'https://qz.com/feed',                                               priority: 7, category: 'business',       enabled: true },
  { name: 'CNBC Business',   url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',              priority: 7, category: 'business',       enabled: true },
  // STOCKS — INDIA
  { name: 'ET Markets',      url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', priority: 8, category: 'stocks-india',  enabled: true },
  { name: 'Moneycontrol',    url: 'https://www.moneycontrol.com/rss/latestnews.xml',                   priority: 8, category: 'stocks-india',  enabled: true },
  { name: 'LiveMint Markets',url: 'https://www.livemint.com/rss/markets',                              priority: 7, category: 'stocks-india',  enabled: true },
  // STOCKS — US
  { name: 'MarketWatch',     url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/',             priority: 8, category: 'stocks-us',     enabled: true },
  { name: 'CNBC Markets',    url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',               priority: 8, category: 'stocks-us',     enabled: true },
  { name: 'Seeking Alpha',   url: 'https://seekingalpha.com/feed.xml',                                 priority: 7, category: 'stocks-us',     enabled: true },
];

export function getSourcesByCategory(category: string): NewsSource[] {
  return SOURCES.filter(s => s.category === category && s.enabled);
}

export function getSourcesByCategories(categories: string[]): NewsSource[] {
  return SOURCES.filter(s => categories.includes(s.category) && s.enabled);
}
