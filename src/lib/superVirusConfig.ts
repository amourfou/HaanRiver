import { SuperVirusType } from '@/types/game';

// 슈퍼바이러스 설정 인터페이스
export interface SuperVirusConfig {
  type: SuperVirusType;
  name: string;
  description: string;
  color: string;
  speedMultiplier: number;
  specialEffect: string;
  rarity: number; // 1-10 (높을수록 희귀)
  icon: string;
}

// 슈퍼바이러스 설정 데이터
export const SUPER_VIRUS_CONFIGS: Record<SuperVirusType, SuperVirusConfig> = {
  turbo: {
    type: 'turbo',
    name: '터보 바이러스',
    description: '3초간 모든 바이러스의 속도를 1.5배로 만듭니다',
    color: '#ffd700', // 금색
    speedMultiplier: 1,
    specialEffect: 'speed_boost',
    rarity: 3,
    icon: '🚀'
  },
  bomb: {
    type: 'bomb',
    name: '폭탄 바이러스',
    description: '제거 시 화면의 다른 바이러스 4개를 임의로 제거합니다',
    color: '#ff4500', // 오렌지 레드
    speedMultiplier: 1,
    specialEffect: 'explode',
    rarity: 5,
    icon: '💣'
  },
  freeze: {
    type: 'freeze',
    name: '얼음 바이러스',
    description: '3초간 게임 속도를 50%로 느리게 만듭니다',
    color: '#00bfff', // 딥 스카이 블루
    speedMultiplier: 0.5,
    specialEffect: 'slow',
    rarity: 6,
    icon: '❄️'
  },
  magnet: {
    type: 'magnet',
    name: '자석 바이러스',
    description: '모든 바이러스를 위로 96픽셀 이동시킵니다',
    color: '#8b4513', // 새들 브라운
    speedMultiplier: 1,
    specialEffect: 'lift',
    rarity: 4,
    icon: '🧲'
  },
  ghost: {
    type: 'ghost',
    name: '유령 바이러스',
    description: '투명해서 터치하기 어렵습니다',
    color: '#dda0dd', // 플럼
    speedMultiplier: 1,
    specialEffect: 'transparent',
    rarity: 7,
    icon: '👻'
  },
  split: {
    type: 'split',
    name: '분열 바이러스',
    description: '제거 시 임의의 두 숫자로 일반 바이러스 2개 생성',
    color: '#ff69b4', // 핫 핑크
    speedMultiplier: 1,
    specialEffect: 'split',
    rarity: 8,
    icon: '🔀'
  },
  time: {
    type: 'time',
    name: '시간 바이러스',
    description: '시간을 정지시킵니다',
    color: '#9370db', // 미디엄 퍼플
    speedMultiplier: 0,
    specialEffect: 'freeze',
    rarity: 9,
    icon: '⏰'
  },
  heal: {
    type: 'heal',
    name: '치료 바이러스',
    description: '한강 오염도를 감소시킵니다',
    color: '#32cd32', // 라임 그린
    speedMultiplier: 1,
    specialEffect: 'heal',
    rarity: 6,
    icon: '💚'
  },
  clear: {
    type: 'clear',
    name: '클리어 바이러스',
    description: '제거 시 모든 바이러스가 사라집니다',
    color: '#ffffff', // 흰색
    speedMultiplier: 1,
    specialEffect: 'clear_all',
    rarity: 10,
    icon: '✨'
  },
  disturb: {
    type: 'disturb',
    name: '방해 바이러스',
    description: '제거 시 화면을 가리고 사운드를 재생합니다',
    color: '#ff0000', // 빨간색
    speedMultiplier: 1,
    specialEffect: 'disturb',
    rarity: 8,
    icon: '🚫'
  }
};

// 슈퍼바이러스 생성 확률 (5% 총 확률)
export const SUPER_VIRUS_PROBABILITY = 0.05;

// 슈퍼바이러스 타입별 가중치 (희귀도 기반)
export const getSuperVirusWeights = (): Record<SuperVirusType, number> => {
  const weights: Record<SuperVirusType, number> = {} as Record<SuperVirusType, number>;
  
  Object.values(SUPER_VIRUS_CONFIGS).forEach(config => {
    // 희귀도가 높을수록 가중치 낮음 (희귀도 10 = 가중치 1, 희귀도 1 = 가중치 10)
    weights[config.type] = 11 - config.rarity;
  });
  
  return weights;
};

// 가중치 기반 랜덤 슈퍼바이러스 타입 선택
export const getRandomSuperVirusType = (): SuperVirusType => {
  const weights = getSuperVirusWeights();
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return type as SuperVirusType;
    }
  }
  
  // 기본값 (fallback)
  return 'lightning';
};

// 슈퍼바이러스 설정 가져오기
export const getSuperVirusConfig = (type: SuperVirusType): SuperVirusConfig => {
  return SUPER_VIRUS_CONFIGS[type];
};

// 슈퍼바이러스인지 확인
export const isSuperVirus = (virus: any): boolean => {
  return virus.isSuperVirus === true;
};

// 슈퍼바이러스 타입별 특별 효과 실행
export const executeSuperVirusEffect = (
  type: SuperVirusType, 
  virus: any, 
  gameState: any
): any => {
  const config = getSuperVirusConfig(type);
  
  switch (type) {
    case 'bomb':
      // 폭탄 효과: 화면의 다른 바이러스 4개 임의 제거
      return { type: 'EXPLODE_VIRUS', payload: { virusId: virus.id } };
      
    case 'freeze':
      // 얼음 효과: 게임 속도 느려짐
      return { type: 'SLOW_GAME', payload: { duration: 3000, factor: 0.5 } };
      
    case 'heal':
      // 치료 효과: 한강 오염도 감소
      return { type: 'HEAL_RIVER', payload: { amount: 1 } };
      
    case 'time':
      // 시간 정지 효과
      return { type: 'FREEZE_TIME', payload: { duration: 3000 } };
      
    case 'turbo':
      // 터보 효과: 모든 바이러스 속도 1.5배
      return { type: 'SPEED_BOOST', payload: { duration: 3000, factor: 1.5 } };
      
    case 'split':
      // 분열 효과: 2개로 분열
      return { type: 'SPLIT_VIRUS', payload: { virusId: virus.id } };
      
    case 'clear':
      // 클리어 효과: 모든 바이러스 제거
      return { type: 'CLEAR_ALL_VIRUSES', payload: { virusId: virus.id } };
      
    case 'disturb':
      // 방해 효과: 화면 가리기 + 사운드
      return { type: 'DISTURB_SCREEN', payload: { duration: 3000 } };
      
    default:
      return null;
  }
};
