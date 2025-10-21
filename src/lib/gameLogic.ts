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

// 바이러스 위치 업데이트 (낙하 + 겹침 방지)
export const updateVirusPositions = (viruses: Virus[], deltaTime: number, screenWidth: number = 0): Virus[] => {
  let updatedViruses = viruses.map(virus => ({
    ...virus,
    y: virus.y + virus.speed * deltaTime,
  }));

  // 바이러스들이 서로 겹치지 않도록 위치 조정
  if (screenWidth > 0) {
    updatedViruses = preventVirusOverlap(updatedViruses, screenWidth);
  }

  return updatedViruses;
};

// 바이러스 겹침 방지 함수
export const preventVirusOverlap = (viruses: Virus[], screenWidth: number): Virus[] => {
  const minDistance = 50; // 최소 거리
  const adjustedViruses = [...viruses];

  for (let i = 0; i < adjustedViruses.length; i++) {
    for (let j = i + 1; j < adjustedViruses.length; j++) {
      const virus1 = adjustedViruses[i];
      const virus2 = adjustedViruses[j];
      
      // 같은 높이대에 있는 바이러스들만 체크 (y 차이가 100px 이내)
      if (Math.abs(virus1.y - virus2.y) < 100) {
        const distanceX = Math.abs(virus1.x - virus2.x);
        
        if (distanceX < minDistance) {
          // 겹치는 경우 더 오래된 바이러스(더 위에 있는)를 옆으로 이동
          if (virus1.y < virus2.y) {
            // virus1이 더 위에 있으면 virus1을 이동
            const direction = virus1.x < virus2.x ? -1 : 1;
            adjustedViruses[i] = {
              ...virus1,
              x: Math.max(30, Math.min(screenWidth - 78, virus1.x + direction * (minDistance - distanceX + 10)))
            };
          } else {
            // virus2가 더 위에 있으면 virus2를 이동
            const direction = virus2.x < virus1.x ? -1 : 1;
            adjustedViruses[j] = {
              ...virus2,
              x: Math.max(30, Math.min(screenWidth - 78, virus2.x + direction * (minDistance - distanceX + 10)))
            };
          }
        }
      }
    }
  }

  return adjustedViruses;
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

// 라운드에 따른 바이러스 생성 속도 계산 (1.5초마다 1개씩)
export const getVirusSpawnRate = (round: number): number => {
  return 1500; // 1.5초마다 1개씩 생성으로 겹침 방지
};

// 라운드에 따른 바이러스 낙하 속도 계산 (이전 속도에서 10% 증가)
export const getVirusSpeed = (round: number): number => {
  const baseSpeed = 12 / 1000; // 1초에 12px = 0.012px/ms
  let currentSpeed = baseSpeed;
  
  // 라운드 1부터 시작해서 이전 속도에서 10%씩 증가
  for (let i = 1; i < round; i++) {
    currentSpeed *= 1.15; // 이전 속도에서 10% 증가
  }
  
  return currentSpeed;
};

// 라운드당 생성할 바이러스 수 (라운드당 10% 증가)
export const getVirusesPerRound = (round: number): number => {
  const baseViruses = 50; // 기본 50개
  const virusMultiplier = Math.pow(1.1, round - 1); // 라운드당 10% 증가
  return Math.round(baseViruses * virusMultiplier);
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

// 바이러스가 서로 겹치지 않도록 위치 조정 (랜덤 우선)
export const adjustVirusPosition = (
  newVirus: Virus, 
  existingViruses: Virus[], 
  screenWidth: number
): Virus => {
  const minDistance = 60; // 최소 거리 (바이러스 크기 48px + 여유공간 12px)
  const virusSize = 48; // 바이러스 크기
  const margin = 30; // 화면 가장자리 여백
  
  console.log(`바이러스 위치 조정 시작: 새 바이러스 x=${newVirus.x}, 기존 바이러스 수=${existingViruses.length}, 화면 너비=${screenWidth}`);
  
  // 기존 바이러스가 없으면 원래 위치 사용
  if (existingViruses.length === 0) {
    return newVirus;
  }

  // 현재 화면 상단 근처의 바이러스들만 고려 (y < 150인 바이러스들)
  const nearbyViruses = existingViruses.filter(virus => virus.y < 150);
  
  // 랜덤 위치 시도 (더 자연스러운 배치)
  let attempts = 0;
  const maxAttempts = 50; // 시도 횟수 줄임 (더 빠른 처리)
  
  while (attempts < maxAttempts) {
    let testX = getRandomX(screenWidth);
    
    const overlappingViruses = nearbyViruses.filter(virus => {
      const distanceX = Math.abs(virus.x - testX);
      return distanceX < minDistance;
    });
    
    if (overlappingViruses.length === 0) {
      console.log(`랜덤 위치 조정 성공: ${attempts + 1}번째 시도, x: ${testX.toFixed(1)}`);
      return { ...newVirus, x: testX };
    }
    
    attempts++;
  }
  
  // 랜덤 시도 실패 시 약간의 겹침을 허용하여 랜덤 위치 사용
  console.log(`랜덤 시도 실패, 약간의 겹침 허용하여 랜덤 위치 사용`);
  const relaxedMinDistance = 40; // 최소 거리 완화
  
  for (let i = 0; i < 20; i++) {
    let testX = getRandomX(screenWidth);
    
    const overlappingViruses = nearbyViruses.filter(virus => {
      const distanceX = Math.abs(virus.x - testX);
      return distanceX < relaxedMinDistance;
    });
    
    if (overlappingViruses.length === 0) {
      console.log(`완화된 조건으로 위치 조정 성공: x=${testX.toFixed(1)}`);
      return { ...newVirus, x: testX };
    }
  }
  
  // 모든 시도가 실패하면 원래 랜덤 위치 사용 (겹침 허용)
  console.log(`모든 시도 실패, 원래 랜덤 위치 사용 (겹침 허용)`);
  return { ...newVirus, x: getRandomX(screenWidth) };
};

// 한강 오염도에 따른 색상 계산
export const getRiverColor = (virusesReachedBottom: number, maxAllowed: number): string => {
  const pollutionLevel = Math.min(virusesReachedBottom / maxAllowed, 1); // 0~1 사이의 오염도
  
  // 기본 한강 색상 (파란색)
  const baseColor = { r: 74, g: 144, b: 226 }; // #4a90e2
  
  // 오염된 색상 (녹색)
  const pollutedColor = { r: 34, g: 139, b: 34 }; // #228b22
  
  // 오염도에 따라 색상 보간
  const r = Math.round(baseColor.r + (pollutedColor.r - baseColor.r) * pollutionLevel);
  const g = Math.round(baseColor.g + (pollutedColor.g - baseColor.g) * pollutionLevel);
  const b = Math.round(baseColor.b + (pollutedColor.b - baseColor.b) * pollutionLevel);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// 한강 오염도에 따른 투명도 계산
export const getRiverOpacity = (virusesReachedBottom: number, maxAllowed: number): number => {
  const pollutionLevel = Math.min(virusesReachedBottom / maxAllowed, 1);
  return 0.4 + (pollutionLevel * 0.4); // 0.4 ~ 0.8 사이의 투명도
};
