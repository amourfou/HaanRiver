import { User } from '@/types/game';

// 쿠키에서 사용자 정보 가져오기
export const getUserFromCookie = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('haanriver-user='));
    
    if (userCookie) {
      const userData = userCookie.split('=')[1];
      return JSON.parse(decodeURIComponent(userData));
    }
  } catch (error) {
    console.error('사용자 정보 파싱 오류:', error);
  }
  
  return null;
};

// 쿠키에 사용자 정보 저장
export const saveUserToCookie = (user: User): void => {
  if (typeof window === 'undefined') return;
  
  const userData = encodeURIComponent(JSON.stringify(user));
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // 1년 후 만료
  
  document.cookie = `haanriver-user=${userData}; expires=${expires.toUTCString()}; path=/`;
};

// 사용자 정보를 DB에 저장 (로컬 스토리지 사용)
export const saveUserToDB = (user: User): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const users = getUsersFromDB();
    const existingUserIndex = users.findIndex(u => u.id === user.id);
    
    if (existingUserIndex >= 0) {
      // 기존 사용자 업데이트
      users[existingUserIndex] = user;
    } else {
      // 새 사용자 추가
      users.push(user);
    }
    
    localStorage.setItem('haanriver-users', JSON.stringify(users));
  } catch (error) {
    console.error('사용자 정보 저장 오류:', error);
  }
};

// DB에서 사용자 목록 가져오기
export const getUsersFromDB = (): User[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const users = localStorage.getItem('haanriver-users');
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('사용자 목록 로드 오류:', error);
    return [];
  }
};

// 사용자 ID로 DB에서 사용자 찾기
export const getUserFromDB = (userId: string): User | null => {
  const users = getUsersFromDB();
  return users.find(user => user.id === userId) || null;
};

// 사용자 점수 업데이트
export const updateUserScore = (userId: string, score: number): void => {
  const user = getUserFromDB(userId);
  if (user && score > user.highScore) {
    user.highScore = score;
    saveUserToDB(user);
    saveUserToCookie(user);
  }
};

// 새 사용자 생성
export const createUser = (name: string, organization: string): User => {
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    organization,
    highScore: 0,
    createdAt: new Date().toISOString()
  };
  
  saveUserToDB(newUser);
  saveUserToCookie(newUser);
  
  return newUser;
};
