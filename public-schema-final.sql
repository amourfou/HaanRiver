-- Supabase public 스키마용 SQL (최종)
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 사용자 테이블 생성 (public 스키마)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  organization VARCHAR(15) NOT NULL,
  high_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 게임 세션 테이블 생성 (public 스키마)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  round INTEGER NOT NULL,
  viruses_reached_bottom INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_high_score ON users(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON game_sessions(played_at DESC);

-- 4. RLS 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 5. 정책 설정
CREATE POLICY IF NOT EXISTS "Enable all operations for users" ON users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for game_sessions" ON game_sessions FOR ALL USING (true);

-- 6. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. updated_at 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
