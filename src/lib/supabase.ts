// The browser no longer creates a Supabase client. Server code uses src/lib/server/db.ts.

export interface SupabaseUser {
  id: string;
  name: string;
  organization: string;
  high_score: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseGameSession {
  id: string;
  user_id: string;
  score: number;
  round: number;
  viruses_reached_bottom: number;
  played_at: string;
}
