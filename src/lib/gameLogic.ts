import { Virus, GameState } from '@/types/game';

// 바이러스 색상 배열 (더 진한 색상으로 대비 향상)
export const VIRUS_COLORS = [
  '#dc2626', // 진한 빨강
  '#16a34a', // 진한 초록
  '#2563eb', // 진한 파랑
  '#ea580c', // 진한 주황
  '#7c3aed', // 진한 보라
  '#ca8a04', // 진한 노랑
  '#db2777', // 진한 분홍
  '#0891b2', // 진한 청록
  '#6b7280', // 진한 회색
];

// 바이러스 생성 함수
export const createVirus = (id: string, x: number, speed: number): Virus => {
  const number = Math.floor(Math.random() * 9) + 1; // 1-9 랜덤 숫자
  const colorIndex = (number - 1) % VIRUS_COLORS.length;
  
  return {
    id,
    number,
    x,
    y: -50, // 화면 위에서 시작
    speed,
    color: VIRUS_COLORS[colorIndex],
    isSelected: false,
  };
};

// 선택된 바이러스들의 합계 계산
export const calculateSelectedSum = (viruses: Virus[]): number => {
  return viruses.reduce((sum, virus) => sum + virus.number, 0);
};

// 합계가 10 또는 20인지 확인
export const isValidSum = (sum: number): boolean => {
  return sum === 10 || sum === 20;
};

// 현재 바이러스들로 10이나 20을 만들 수 있는지 확인
export const canMakeValidSum = (viruses: Virus[]): boolean => {
  if (viruses.length === 0) return false;
  
  // 모든 가능한 조합을 확인
  for (let i = 0; i < viruses.length; i++) {
    for (let j = i + 1; j < viruses.length; j++) {
      const sum = viruses[i].number + viruses[j].number;
      if (isValidSum(sum)) {
        return true;
      }
      
      // 3개 조합도 확인
      for (let k = j + 1; k < viruses.length; k++) {
        const sum3 = viruses[i].number + viruses[j].number + viruses[k].number;
        if (isValidSum(sum3)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// 바이러스 위치 업데이트 (낙하)
export const updateVirusPositions = (viruses: Virus[], deltaTime: number): Virus[] => {
  return viruses.map(virus => ({
    ...virus,
    y: virus.y + virus.speed * deltaTime,
  }));
};

// 화면 밖으로 나간 바이러스 제거
export const removeOffscreenViruses = (viruses: Virus[], screenHeight: number): Virus[] => {
  return viruses.filter(virus => virus.y < screenHeight + 100);
};

// 게임 오버 조건 확인 (바이러스가 바닥에 닿았는지)
export const checkGameOver = (virusesReachedBottom: number, maxAllowed: number): boolean => {
  return virusesReachedBottom >= maxAllowed;
};

// 바이러스가 화면 제일 아래에 도달했는지 확인
export const checkVirusReachedBottom = (virus: Virus, screenHeight: number): boolean => {
  const virusBottom = virus.y + 48; // 바이러스 하단 위치 (바이러스 높이 48px)
  return virusBottom >= screenHeight; // 바이러스 하단이 화면 끝에 닿았을 때
};

// 라운드에 따른 바이러스 생성 속도 계산 (1초마다 1개씩)
export const getVirusSpawnRate = (round: number): number => {
  return 1000; // 항상 1초마다 1개씩 생성
};

// 라운드에 따른 바이러스 낙하 속도 계산 (1초에 12px)
export const getVirusSpeed = (round: number): number => {
  const baseSpeed = 12 / 1000; // 1초에 12px = 0.012px/ms
  return baseSpeed + (round * 0.001); // 라운드당 0.001 증가 (매우 천천히)
};

// 라운드당 생성할 바이러스 수 (테스트용 1개만)
export const getVirusesPerRound = (): number => {
  return 1; // 테스트용으로 딱 1개만
};

// 한 번에 생성할 바이러스 수 (테스트용 1개만)
export const getVirusBatchSize = (round: number): number => {
  return 1; // 테스트용으로 바이러스 1개만 생성
};

// 점수 계산 (합계에 따른)
export const calculateScore = (sum: number, combo: number): number => {
  const baseScore = sum === 20 ? 50 : 20; // 20은 더 높은 점수
  return baseScore * (1 + combo * 0.5); // 콤보 보너스
};

// 랜덤 X 위치 생성 (화면 너비 내)
export const getRandomX = (screenWidth: number): number => {
  const virusSize = 48;
  const margin = 24; // 화면 가장자리 여백
  return Math.random() * (screenWidth - virusSize - margin * 2) + margin;
};

// 바이러스가 서로 겹치지 않도록 위치 조정
export const adjustVirusPosition = (
  newVirus: Virus, 
  existingViruses: Virus[], 
  screenWidth: number
): Virus => {
  const minDistance = 60; // 최소 거리 (바이러스 크기 48px + 여유공간 12px)
  const virusSize = 48; // 바이러스 크기
  const margin = 24; // 화면 가장자리 여백
  
  console.log(`바이러스 위치 조정 시작: 새 바이러스 x=${newVirus.x}, 기존 바이러스 수=${existingViruses.length}, 화면 너비=${screenWidth}`);
  
  // 기존 바이러스가 없으면 원래 위치 사용
  if (existingViruses.length === 0) {
    return newVirus;
  }

  // 체계적으로 위치 배치: 화면을 60px 간격으로 나누어 배치
  const availablePositions = [];
  for (let x = margin; x <= screenWidth - margin - virusSize; x += minDistance) {
    availablePositions.push(x);
  }
  
  console.log(`사용 가능한 위치들: ${availablePositions.length}개`);
  
  // 사용 가능한 위치 중에서 겹치지 않는 위치 찾기
  for (const testX of availablePositions) {
    const overlappingViruses = existingViruses.filter(virus => {
      const distanceX = Math.abs(virus.x - testX);
      return distanceX < minDistance;
    });
    
    if (overlappingViruses.length === 0) {
      console.log(`바이러스 위치 조정 성공: x=${testX.toFixed(1)}`);
      return { ...newVirus, x: testX };
    }
  }
  
  // 모든 체계적 위치가 실패하면 랜덤 시도
  console.log(`체계적 배치 실패, 랜덤 시도 시작`);
  let attempts = 0;
  const maxAttempts = 100; // 시도 횟수 대폭 증가
  
  while (attempts < maxAttempts) {
    let testX = getRandomX(screenWidth);
    
    const overlappingViruses = existingViruses.filter(virus => {
      const distanceX = Math.abs(virus.x - testX);
      return distanceX < minDistance;
    });
    
    if (overlappingViruses.length === 0) {
      console.log(`랜덤 위치 조정 성공: ${attempts + 1}번째 시도, x: ${testX.toFixed(1)}`);
      return { ...newVirus, x: testX };
    }
    
    attempts++;
  }
  
  // 모든 시도가 실패하면 원래 위치 사용 (기존 바이러스들이 떨어져서 공간이 생길 때까지 기다림)
  console.log(`바이러스 위치 조정 실패: 최대 시도 횟수 초과, 원래 위치 사용`);
  return { ...newVirus, x: newVirus.x };
};
