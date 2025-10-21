-- Supabase에서 사용자 데이터 확인용 SQL
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. 모든 사용자 데이터 확인
SELECT * FROM users ORDER BY created_at DESC;

-- 2. 특정 사용자의 데이터 확인 (사용자 ID로 변경)
-- SELECT * FROM users WHERE id = 'your-user-id-here';

-- 3. 최고 점수가 0이 아닌 사용자들 확인
SELECT id, name, organization, high_score, created_at 
FROM users 
WHERE high_score > 0 
ORDER BY high_score DESC;

-- 4. 테이블 구조 확인
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';
