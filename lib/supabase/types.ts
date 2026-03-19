/**
 * lib/supabase/types.ts
 * ─────────────────────────────────────────────────────────────────
 * TypeScript types matching the Supabase database schema exactly.
 * Keep in sync with supabase/migrations/001_initial_schema.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      articles:          { Row: Article;           Insert: Omit<Article, 'id' | 'created_at' | 'fetched_at'>;       Update: Partial<Article> };
      story_sources:     { Row: StorySource;       Insert: Omit<StorySource, 'id' | 'added_at'>;                    Update: Partial<StorySource> };
      user_interactions: { Row: UserInteraction;   Insert: Omit<UserInteraction, 'id' | 'created_at'>;              Update: Partial<UserInteraction> };
      user_profile:      { Row: UserProfile;       Insert: UserProfile;                                             Update: Partial<UserProfile> };
      user_watchlist:    { Row: WatchlistItem;     Insert: Omit<WatchlistItem, 'id' | 'created_at' | 'last_checked_at' | 'unread_count'>; Update: Partial<WatchlistItem> };
      stock_watchlist:   { Row: StockWatchlistItem;Insert: Omit<StockWatchlistItem, 'id' | 'added_at'>;             Update: Partial<StockWatchlistItem> };
      system_logs:       { Row: SystemLog;         Insert: Omit<SystemLog, 'id' | 'created_at' | 'timestamp'>;     Update: Partial<SystemLog> };
      user_preferences:  { Row: UserPreferences;   Insert: UserPreferences;                                         Update: Partial<UserPreferences> };
    };
  };
};

export type Article = {
  id: string;
  title: string;
  original_title: string | null;
  summary: string | null;
  full_content: string | null;
  full_url: string;
  source_name: string;
  source_priority: number;
  source_logo_url: string | null;
  category: string;
  topic_tags: string[] | null;
  published_at: string;
  fetched_at: string;
  last_activity_at: string;
  story_fingerprint: string | null;
  source_count: number;
  is_cluster_primary: boolean;
  cluster_primary_id: string | null;
  has_update: boolean;
  embedding: number[] | null;
  content_fetched: boolean;
  clickbait_score: number;
  is_null_article: boolean;
  watchlist_matches: string[] | null;
  stock_tickers: string[] | null;
  why_this: string | null;
  created_at: string;
};

export type StorySource = {
  id: string;
  story_id: string;
  source_name: string;
  source_url: string;
  added_at: string;
};

export type UserInteraction = {
  id: string;
  article_id: string;
  action: 'like' | 'dislike' | 'read' | 'dismiss' | 'track';
  read_time_seconds: number | null;
  has_seen_update: boolean;
  created_at: string;
};

export type UserProfile = {
  id: number;
  preference_vector: number[] | null;
  total_interactions: number;
  last_updated: string;
};

export type WatchlistItem = {
  id: string;
  label: string;
  canonical_name: string;
  search_keywords: string[];
  related_terms: string[] | null;
  type: 'topic' | 'person' | 'company';
  pinned_story_id: string | null;
  unread_count: number;
  created_at: string;
  last_checked_at: string;
};

export type StockWatchlistItem = {
  id: string;
  ticker: string;
  display_name: string;
  market: 'IN' | 'US';
  added_at: string;
};

export type SystemLog = {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  context: Json | null;
  resolved: boolean;
  auto_resolved: boolean;
  created_at: string;
};

export type UserPreferences = {
  id: number;
  show_thumbnails: boolean;
  disabled_sources: string[];
  source_url_overrides: Record<string, string>;
  section_order: string[];
  custom_summary_prompt: string | null;
  custom_watchlist_prompt: string | null;
  custom_whythis_prompt: string | null;
  updated_at: string;
};
