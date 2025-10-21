# 🚀 Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입
2. "New Project" 클릭
3. 프로젝트 이름: `haanriver-game`
4. 데이터베이스 비밀번호 설정
5. 리전 선택 (Asia Pacific - Seoul 추천)

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드 → SQL Editor
2. `supabase-schema.sql` 파일의 내용을 복사해서 실행
3. 실행 완료 후 Tables에서 `users`, `game_sessions` 테이블 확인

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 환경 변수 찾는 방법:
1. Supabase 대시보드 → Settings → API
2. Project URL → `NEXT_PUBLIC_SUPABASE_URL`
3. Project API keys → anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. 개발 서버 실행

```bash
npm run dev
```

## 5. 기능 확인

- ✅ 사용자 등록
- ✅ 자동 로그인
- ✅ 점수 저장
- ✅ 게임 기록 저장
- ✅ 최고 점수 업데이트

## 📊 데이터베이스 구조

### users 테이블
- `id`: 사용자 고유 ID
- `name`: 사용자 이름
- `organization`: 소속
- `high_score`: 최고 점수
- `created_at`: 생성일
- `updated_at`: 수정일

### game_sessions 테이블
- `id`: 게임 세션 ID
- `user_id`: 사용자 ID (외래키)
- `score`: 게임 점수
- `round`: 도달한 라운드
- `viruses_reached_bottom`: 바이러스 도달 수
- `played_at`: 게임 플레이 시간

## 🔧 문제 해결

### 연결 오류
- 환경 변수가 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 권한 오류
- RLS 정책이 올바르게 설정되었는지 확인
- API 키 권한 확인

## 💡 추가 기능

### 리더보드 조회
```sql
SELECT name, organization, high_score 
FROM users 
ORDER BY high_score DESC 
LIMIT 10;
```

### 사용자별 게임 기록
```sql
SELECT score, round, played_at 
FROM game_sessions 
WHERE user_id = 'user-id' 
ORDER BY played_at DESC;
```
