import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// haanriver 스키마 사용자 테이블 타입 정의
export interface SupabaseUser {
  id: string;
  name: string;
  organization: string;
  high_score: number;
  created_at: string;
  updated_at: string;
}

// haanriver 스키마 게임 세션 테이블 타입 정의
export interface SupabaseGameSession {
  id: string;
  user_id: string;
  score: number;
  round: number;
  viruses_reached_bottom: number;
  played_at: string;
}
