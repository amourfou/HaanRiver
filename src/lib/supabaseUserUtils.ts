import { supabase, SupabaseUser, SupabaseGameSession } from './supabase';
import { User } from '@/types/game';

// 쿠키에서 사용자 ID 가져오기
export const getUserIdFromCookie = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('haanriver-user-id='));
    
    if (userCookie) {
      return userCookie.split('=')[1];
    }
  } catch (error) {
    console.error('사용자 ID 파싱 오류:', error);
  }
  
  return null;
};

// 쿠키에 사용자 ID 저장
export const saveUserIdToCookie = (userId: string): void => {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // 1년 후 만료
  
  document.cookie = `haanriver-user-id=${userId}; expires=${expires.toUTCString()}; path=/`;
};

// 쿠키에서 사용자 ID 삭제 (로그아웃)
export const clearUserIdFromCookie = (): void => {
  if (typeof window === 'undefined') return;
  
  // 과거 날짜로 설정하여 쿠키 삭제
  const expires = new Date(0).toUTCString();
  document.cookie = `haanriver-user-id=; expires=${expires}; path=/`;
};

// Supabase에서 사용자 정보 가져오기
export const getUserFromSupabase = async (userId: string): Promise<User | null> => {
  try {
    console.log('사용자 ID로 조회 시작:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('사용자 정보 조회 오류:', error);
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);
      return null;
    }

    if (data) {
      console.log('✅ 사용자 데이터 조회 성공:', data);
      console.log('✅ high_score 원본 값:', data.high_score);
      console.log('✅ high_score 타입:', typeof data.high_score);
      
      const user = {
        id: data.id,
        name: data.name,
        organization: data.organization,
        highScore: data.high_score || 0,
        createdAt: data.created_at
      };
      
      console.log('✅ 최종 사용자 객체:', user);
      return user;
    }

    console.log('❌ 사용자 데이터가 없습니다');
    return null;
  } catch (error) {
    console.error('사용자 정보 조회 예외:', error);
    return null;
  }
};

// 사용자 이름 중복 확인
export const checkUserNameExists = async (name: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows found" 오류
      console.error('사용자 이름 확인 오류:', error);
      return false;
    }

    return !!data; // 데이터가 있으면 true (중복), 없으면 false
  } catch (error) {
    console.error('사용자 이름 확인 오류:', error);
    return false;
  }
};

// 이름으로 사용자 정보 가져오기
export const getUserByNameFromSupabase = async (name: string): Promise<User | null> => {
  try {
    console.log('이름으로 사용자 조회 시작:', name);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      console.error('이름으로 사용자 조회 오류:', error);
      return null;
    }

    if (data) {
      console.log('✅ 이름으로 사용자 데이터 조회 성공:', data);
      
      const user = {
        id: data.id,
        name: data.name,
        organization: data.organization,
        highScore: data.high_score || 0,
        createdAt: data.created_at
      };
      
      console.log('✅ 최종 사용자 객체:', user);
      return user;
    }

    console.log('❌ 해당 이름의 사용자가 없습니다');
    return null;
  } catch (error) {
    console.error('이름으로 사용자 조회 예외:', error);
    return null;
  }
};

// Supabase에 새 사용자 생성
export const createUserInSupabase = async (name: string, organization: string): Promise<User | null> => {
  try {
    // 먼저 이름 중복 확인
    const nameExists = await checkUserNameExists(name);
    if (nameExists) {
      throw new Error('DUPLICATE_NAME');
    }

    const newUser: Omit<SupabaseUser, 'id' | 'created_at' | 'updated_at'> = {
      name,
      organization,
      high_score: 0
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      console.error('사용자 생성 오류:', error);
      return null;
    }

    if (data) {
      console.log('생성된 사용자 데이터:', data);
      console.log('생성된 사용자 high_score:', data.high_score);
      const user: User = {
        id: data.id,
        name: data.name,
        organization: data.organization,
        highScore: data.high_score || 0,
        createdAt: data.created_at
      };

      console.log('최종 사용자 객체:', user);
      // 쿠키에 사용자 ID 저장
      saveUserIdToCookie(user.id);
      
      return user;
    }

    return null;
  } catch (error: any) {
    if (error.message === 'DUPLICATE_NAME') {
      throw error; // DUPLICATE_NAME 오류는 다시 throw하여 상위에서 처리
    }
    console.error('사용자 생성 오류:', error);
    return null;
  }
};

// 사용자 최고 점수 업데이트
export const updateUserScoreInSupabase = async (userId: string, score: number): Promise<boolean> => {
  try {
    // 먼저 현재 사용자 정보 가져오기
    const currentUser = await getUserFromSupabase(userId);
    
    if (!currentUser) {
      console.error('사용자를 찾을 수 없습니다.');
      return false;
    }

    // 새 점수가 더 높은 경우에만 업데이트
    if (score > currentUser.highScore) {
      const { error } = await supabase
        .from('users')
        .update({ 
          high_score: score,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('점수 업데이트 오류:', error);
        return false;
      }

      return true;
    }

    return true; // 이미 최고 점수인 경우
  } catch (error) {
    console.error('점수 업데이트 오류:', error);
    return false;
  }
};

// 게임 세션 저장
export const saveGameSession = async (
  userId: string, 
  score: number, 
  round: number, 
  virusesReachedBottom: number
): Promise<boolean> => {
  try {
    const gameSession: Omit<SupabaseGameSession, 'id'> = {
      user_id: userId,
      score,
      round,
      viruses_reached_bottom: virusesReachedBottom,
      played_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('game_sessions')
      .insert([gameSession]);

    if (error) {
      console.error('게임 세션 저장 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('게임 세션 저장 오류:', error);
    return false;
  }
};

// 사용자별 게임 기록 가져오기
export const getUserGameHistory = async (userId: string, limit: number = 10): Promise<SupabaseGameSession[]> => {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('게임 기록 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('게임 기록 조회 오류:', error);
    return [];
  }
};
