-- Supabase에서 haanriver 스키마 확인용 SQL
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. haanriver 스키마 존재 확인
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'haanriver';

-- 2. haanriver 스키마의 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'haanriver';

-- 3. 모든 스키마 목록 확인
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;
