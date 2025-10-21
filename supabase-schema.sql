-- Supabase 데이터베이스 스키마 (haanriver 스키마 사용)
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. haanriver 스키마 생성
CREATE SCHEMA IF NOT EXISTS haanriver;

-- 2. 사용자 테이블 (haanriver 스키마)
CREATE TABLE haanriver.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  organization VARCHAR(100) NOT NULL,
  high_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 게임 세션 테이블 (haanriver 스키마)
CREATE TABLE haanriver.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES haanriver.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  round INTEGER NOT NULL,
  viruses_reached_bottom INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_haanriver_users_high_score ON haanriver.users(high_score DESC);
CREATE INDEX idx_haanriver_game_sessions_user_id ON haanriver.game_sessions(user_id);
CREATE INDEX idx_haanriver_game_sessions_played_at ON haanriver.game_sessions(played_at DESC);

-- 5. RLS (Row Level Security) 설정
ALTER TABLE haanriver.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE haanriver.game_sessions ENABLE ROW LEVEL SECURITY;

-- 6. 모든 사용자가 읽기/쓰기 가능하도록 설정 (게임용이므로)
CREATE POLICY "Enable all operations for haanriver users" ON haanriver.users FOR ALL USING (true);
CREATE POLICY "Enable all operations for haanriver game_sessions" ON haanriver.game_sessions FOR ALL USING (true);

-- 7. updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION haanriver.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. updated_at 트리거
CREATE TRIGGER update_haanriver_users_updated_at 
    BEFORE UPDATE ON haanriver.users 
    FOR EACH ROW 
    EXECUTE FUNCTION haanriver.update_updated_at_column();
