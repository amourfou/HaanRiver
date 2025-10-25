import { GameState, GameAction, Virus } from '@/types/game';
import { 
  calculateSelectedSum, 
  isValidSum, 
  calculateScore,
  removeOffscreenViruses,
  checkGameOver,
  getVirusesPerRound,
  getVirusSpeed
} from './gameLogic';

// 최고 점수 가져오기 (기본값)
const getHighScore = (): number => {
  return 0; // Supabase에서 사용자별 최고 점수를 가져오므로 기본값은 0
};

// 숫자별 고정 색상 생성
const getColorByNumber = (number: number): string => {
  const colorMap: Record<number, string> = {
    1: '#ff6b6b', // 빨간색
    2: '#4ecdc4', // 청록색
    3: '#45b7d1', // 파란색
    4: '#96ceb4', // 연두색
    5: '#feca57', // 노란색
    6: '#ff9ff3', // 분홍색
    7: '#54a0ff', // 하늘색
    8: '#5f27cd', // 보라색
    9: '#00d2d3', // 청록색
  };
  return colorMap[number] || '#ff6b6b'; // 기본값은 빨간색
};

export const initialGameState: GameState = {
  viruses: [],
  score: 0,
  round: 1,
  gameSpeed: 1,
  isGameOver: false,
  isPaused: false,
  isGameStarted: false,
  selectedViruses: [],
  combo: 0,
  virusesSpawned: 0,
  virusesToSpawn: 50, // 라운드당 50개
  virusesReachedBottom: 0,
  maxVirusesAllowed: 5,
  isRoundComplete: false,
  highScore: getHighScore(),
  currentVirusSpeed: 12 / 1000, // 라운드 1의 기본 속도
  isSlowed: false,
  isFrozen: false,
  slowEndTime: 0,
  freezeEndTime: 0,
  pendingSuperVirusEffect: null,
  isDisturbed: false,
  disturbEndTime: 0,
  isSpeedBoosted: false,
  speedBoostEndTime: 0,
  isMagnetAnimating: false,
  magnetAnimationEndTime: 0,
  transparentViruses: [],
  transparencyEndTime: 0,
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        isGameStarted: true,
      };
    case 'SELECT_VIRUS': {
      const virus = state.viruses.find(v => v.id === action.payload.virusId);
      if (!virus) return state;

      const newSelectedViruses = [...state.selectedViruses, virus];
      const sum = calculateSelectedSum(newSelectedViruses);

      // 합계가 10 또는 20이면 바이러스 제거
      if (isValidSum(sum)) {
        const virusCount = newSelectedViruses.length; // 선택한 바이러스 개수
        let score = calculateScore(virusCount, state.combo);
        
        // 슈퍼바이러스 우선순위: 가장 먼저 선택된 슈퍼바이러스의 효과만 적용
        const superViruses = newSelectedViruses.filter(v => v.isSuperVirus);
        let finalViruses = state.viruses.filter(v => 
          !newSelectedViruses.some(selected => selected.id === v.id)
        ).map(v => ({ ...v, isSelected: false })); // 남은 바이러스들의 선택 상태 초기화
        
        if (superViruses.length > 0) {
          // 슈퍼바이러스 점수 보너스: 1.2배
          score = Math.floor(score * 1.2);
          console.log('🎯 슈퍼바이러스 점수 보너스 적용:', score);
          
          // 가장 먼저 선택된 슈퍼바이러스 찾기 (selectedViruses 배열에서 첫 번째 슈퍼바이러스)
          const firstSuperVirus = superViruses.find(sv => 
            state.selectedViruses.some(selected => selected.id === sv.id)
          ) || superViruses[0]; // 폴백: 첫 번째 슈퍼바이러스
          
          console.log('🎯 슈퍼바이러스 우선순위 적용:', firstSuperVirus.superVirusType);
          
          // 슈퍼바이러스 효과를 즉시 처리
          switch (firstSuperVirus.superVirusType) {
            case 'bomb': {
              console.log('💣 폭탄 바이러스 즉시 폭발');
              // 현재 화면에 있는 바이러스들 중에서 임의로 4개 선택
              const availableViruses = finalViruses;
              const randomVirusesToRemove = availableViruses
                .sort(() => Math.random() - 0.5) // 랜덤 섞기
                .slice(0, 4); // 최대 4개 선택
              
              console.log('💣 폭탄으로 제거될 바이러스들:', randomVirusesToRemove.map(v => v.id));
              
              // 랜덤으로 선택된 바이러스들도 제거
              finalViruses = finalViruses.filter(virus => 
                !randomVirusesToRemove.some(removed => removed.id === virus.id)
              );
              
              // 폭발로 제거된 바이러스 수만큼 점수 추가
              const explosionScore = randomVirusesToRemove.length * 20; // 바이러스당 20점
              score += explosionScore;
              console.log('💣 폭발 점수 추가:', explosionScore);
              break;
            }
            
            case 'clear': {
              console.log('✨ 클리어 바이러스 즉시 실행');
              // 모든 바이러스 제거
              finalViruses = [];
              break;
            }
            
            case 'split': {
              console.log('🔀 분열 바이러스 즉시 실행');
              // 임의의 두 숫자로 일반 바이러스 2개 생성
              const splitVirus = firstSuperVirus;
              const randomNumber1 = Math.floor(Math.random() * 9) + 1; // 1-9 랜덤
              const randomNumber2 = Math.floor(Math.random() * 9) + 1; // 1-9 랜덤
              
              const newVirus1 = {
                id: `${splitVirus.id}-split-1`,
                number: randomNumber1,
                x: splitVirus.x - 30,
                y: splitVirus.y,
                speed: splitVirus.speed * 0.8,
                color: getColorByNumber(randomNumber1), // 숫자별 고정 색상
                isSelected: false,
                isSuperVirus: false, // 일반 바이러스로 생성
                superVirusType: undefined,
              };
              
              const newVirus2 = {
                id: `${splitVirus.id}-split-2`,
                number: randomNumber2,
                x: splitVirus.x + 30,
                y: splitVirus.y,
                speed: splitVirus.speed * 0.8,
                color: getColorByNumber(randomNumber2), // 숫자별 고정 색상
                isSelected: false,
                isSuperVirus: false, // 일반 바이러스로 생성
                superVirusType: undefined,
              };
              
              console.log('🔀 분열된 바이러스들:', { number1: randomNumber1, number2: randomNumber2 });
              finalViruses = [...finalViruses, newVirus1, newVirus2];
              break;
            }
            
            case 'magnet': {
              console.log('🧲 자석 바이러스 즉시 실행');
              // 모든 바이러스를 위로 96픽셀 이동
              const updatedViruses = finalViruses.map(virus => ({
                ...virus,
                y: Math.max(-50, virus.y - 96) // 화면 위로 나가지 않도록 제한
              }));
              
              // 자석 애니메이션 시작 (1초간)
              const endTime = Date.now() + 1000;
              return {
                ...state,
                viruses: updatedViruses,
                selectedViruses: [],
                score: state.score + score,
                combo: state.combo + 1,
                isMagnetAnimating: true,
                magnetAnimationEndTime: endTime,
              };
            }
            
            case 'ghost': {
              console.log('👻 유령 바이러스 투명화 효과');
              // 화면의 다른 바이러스 3개를 랜덤하게 선택하여 투명화
              const availableViruses = finalViruses;
              const randomVirusesToTransparent = availableViruses
                .sort(() => Math.random() - 0.5) // 랜덤 섞기
                .slice(0, 3); // 최대 3개 선택
              
              const transparentVirusIds = randomVirusesToTransparent.map(v => v.id);
              const endTime = Date.now() + 3000; // 3초간 투명화
              
              console.log('👻 투명화될 바이러스들:', transparentVirusIds);
              
              return {
                ...state,
                viruses: finalViruses,
                selectedViruses: [],
                score: state.score + score,
                combo: state.combo + 1,
                transparentViruses: transparentVirusIds,
                transparencyEndTime: endTime,
              };
            }
            
            // 다른 슈퍼바이러스들은 기존 방식대로 pendingSuperVirusEffect 사용
            default: {
              const { executeSuperVirusEffect } = require('./superVirusConfig');
              const superVirusEffect = executeSuperVirusEffect(
                firstSuperVirus.superVirusType!, 
                firstSuperVirus, 
                state
              );
              
              if (superVirusEffect) {
                return {
                  ...state,
                  viruses: finalViruses,
                  selectedViruses: [],
                  score: state.score + score,
                  combo: state.combo + 1,
                  pendingSuperVirusEffect: superVirusEffect,
                };
              }
            }
          }
        }

        return {
          ...state,
          viruses: finalViruses,
          selectedViruses: [],
          score: state.score + score,
          combo: state.combo + 1,
        };
      }

      // 합계가 10 또는 20이 아니면 선택만 추가
      return {
        ...state,
        viruses: state.viruses.map(v => 
          v.id === action.payload.virusId ? { ...v, isSelected: true } : v
        ),
        selectedViruses: newSelectedViruses,
        combo: 0, // 잘못된 선택이면 콤보 리셋
      };
    }

    case 'DESELECT_VIRUS': {
      return {
        ...state,
        viruses: state.viruses.map(v => 
          v.id === action.payload.virusId ? { ...v, isSelected: false } : v
        ),
        selectedViruses: state.selectedViruses.filter(v => v.id !== action.payload.virusId),
        // 콤보는 유지 (바이러스 선택 해제는 콤보에 영향 없음)
      };
    }

    case 'CLEAR_SELECTED': {
      return {
        ...state,
        viruses: state.viruses.map(v => ({ ...v, isSelected: false })),
        selectedViruses: [],
        // 콤보는 유지 (선택 초기화는 콤보에 영향 없음)
      };
    }

    case 'ADD_VIRUS': {
      return {
        ...state,
        viruses: [...state.viruses, action.payload.virus],
        virusesSpawned: state.virusesSpawned + 1,
      };
    }

    case 'REMOVE_VIRUS': {
      return {
        ...state,
        viruses: state.viruses.filter(v => v.id !== action.payload.virusId),
      };
    }

    case 'UPDATE_VIRUSES': {
      return {
        ...state,
        viruses: action.payload.viruses,
      };
    }

    case 'UPDATE_SCORE': {
      return {
        ...state,
        score: state.score + action.payload.points,
      };
    }

    case 'ROUND_COMPLETE': {
      return {
        ...state,
        isRoundComplete: true,
        isPaused: true,
      };
    }

    case 'START_NEXT_ROUND': {
      const nextRound = state.round + 1;
      const newVirusSpeed = getVirusSpeed(nextRound); // 새 라운드의 속도 계산
      return {
        ...state,
        round: nextRound,
        virusesSpawned: 0,
        virusesToSpawn: getVirusesPerRound(nextRound), // 라운드당 동적 개수 (10% 증가)
        virusesReachedBottom: 0,
        gameSpeed: state.gameSpeed + 0.1,
        isRoundComplete: false,
        isPaused: false,
        selectedViruses: [], // 선택된 바이러스 초기화
        combo: 0, // 콤보 초기화
        currentVirusSpeed: newVirusSpeed, // 새 라운드의 속도 저장
      };
    }

    case 'VIRUS_REACHED_BOTTOM': {
      const newReachedBottom = state.virusesReachedBottom + 1;
      return {
        ...state,
        virusesReachedBottom: newReachedBottom,
        isGameOver: checkGameOver(newReachedBottom, state.maxVirusesAllowed),
      };
    }

    case 'GAME_OVER': {
      // 최고 점수 업데이트
      const newHighScore = Math.max(state.score, state.highScore);
      if (typeof window !== 'undefined' && newHighScore > state.highScore) {
        localStorage.setItem('haanriver-highscore', newHighScore.toString());
      }
      
      return {
        ...state,
        isGameOver: true,
        isPaused: true,
        highScore: newHighScore,
      };
    }

    case 'PAUSE_GAME': {
      return {
        ...state,
        isPaused: true,
      };
    }

    case 'RESUME_GAME': {
      return {
        ...state,
        isPaused: false,
      };
    }

    case 'RESET_GAME': {
      return initialGameState;
    }

    case 'RESET_COMBO': {
      return {
        ...state,
        combo: 0,
      };
    }

    case 'SET_HIGH_SCORE': {
      console.log('🎯 SET_HIGH_SCORE 액션 실행:', action.payload.highScore);
      return {
        ...state,
        highScore: action.payload.highScore,
      };
    }

    case 'CLEAR_ALL_VIRUSES': {
      console.log('✨ 모든 바이러스 제거:', action.payload.virusId);
      // 클리어 바이러스 제거 시 모든 바이러스 제거
      const clearVirus = state.viruses.find(v => v.id === action.payload.virusId);
      if (clearVirus && clearVirus.isSuperVirus && clearVirus.superVirusType === 'clear') {
        // 클리어 바이러스 제거 시 모든 바이러스 제거
        const remainingViruses = state.viruses.filter(v => v.id !== action.payload.virusId);
        return {
          ...state,
          viruses: remainingViruses,
          selectedViruses: [], // 선택된 바이러스도 초기화
          combo: state.combo + 1, // 클리어 바이러스 제거 시 콤보 증가
        };
      }
      return state;
    }

    case 'EXPLODE_VIRUS': {
      console.log('💣 폭탄 바이러스 폭발:', action.payload.virusId);
      const bombVirus = state.viruses.find(v => v.id === action.payload.virusId);
      if (bombVirus && bombVirus.isSuperVirus && bombVirus.superVirusType === 'bomb') {
        // 현재 화면에 있는 바이러스들 중에서 임의로 4개 선택
        const availableViruses = state.viruses.filter(v => v.id !== action.payload.virusId);
        const randomVirusesToRemove = availableViruses
          .sort(() => Math.random() - 0.5) // 랜덤 섞기
          .slice(0, 4); // 최대 4개 선택
        
        console.log('💣 폭탄으로 제거될 바이러스들:', randomVirusesToRemove.map(v => v.id));
        
        // 폭탄 바이러스와 랜덤으로 선택된 바이러스들 제거
        const remainingViruses = state.viruses.filter(virus => 
          virus.id !== action.payload.virusId && 
          !randomVirusesToRemove.some(removed => removed.id === virus.id)
        );
        
        // 폭발로 제거된 바이러스 수만큼 점수 추가 (폭탄 바이러스 + 랜덤 4개)
        const explosionScore = (1 + randomVirusesToRemove.length) * 20; // 바이러스당 20점
        
        return {
          ...state,
          viruses: remainingViruses,
          selectedViruses: [], // 선택된 바이러스 초기화
          score: state.score + explosionScore,
          combo: state.combo + 1,
        };
      }
      return state;
    }

    case 'SLOW_GAME': {
      console.log('❄️ 게임 속도 느려짐:', action.payload.duration);
      const endTime = Date.now() + action.payload.duration;
      return {
        ...state,
        isSlowed: true,
        slowEndTime: endTime,
      };
    }

    case 'FREEZE_TIME': {
      console.log('⏰ 시간 정지:', action.payload.duration);
      const endTime = Date.now() + action.payload.duration;
      return {
        ...state,
        isFrozen: true,
        freezeEndTime: endTime,
      };
    }

    case 'HEAL_RIVER': {
      console.log('💚 한강 치료:', action.payload.amount);
      const newVirusesReachedBottom = Math.max(0, state.virusesReachedBottom - action.payload.amount);
      return {
        ...state,
        virusesReachedBottom: newVirusesReachedBottom,
      };
    }

    case 'SPLIT_VIRUS': {
      console.log('🔀 바이러스 분열:', action.payload.virusId);
      const splitVirus = state.viruses.find(v => v.id === action.payload.virusId);
      if (splitVirus && splitVirus.isSuperVirus && splitVirus.superVirusType === 'split') {
        // 원본 바이러스 제거
        const remainingViruses = state.viruses.filter(v => v.id !== action.payload.virusId);
        
        // 2개의 새로운 바이러스 생성 (원본 위치에서 약간 떨어진 곳에)
        const newVirus1 = {
          ...splitVirus,
          id: `${splitVirus.id}-split-1`,
          x: splitVirus.x - 30,
          y: splitVirus.y,
          speed: splitVirus.speed * 0.8, // 분열된 바이러스는 조금 느림
        };
        
        const newVirus2 = {
          ...splitVirus,
          id: `${splitVirus.id}-split-2`,
          x: splitVirus.x + 30,
          y: splitVirus.y,
          speed: splitVirus.speed * 0.8,
        };
        
        return {
          ...state,
          viruses: [...remainingViruses, newVirus1, newVirus2],
          selectedViruses: [],
          combo: state.combo + 1,
        };
      }
      return state;
    }

    case 'CLEAR_PENDING_SUPER_VIRUS_EFFECT': {
      return {
        ...state,
        pendingSuperVirusEffect: null,
      };
    }

    case 'DISTURB_SCREEN': {
      console.log('🚫 방해바이러스 효과:', action.payload.duration);
      const endTime = Date.now() + action.payload.duration;
      return {
        ...state,
        isDisturbed: true,
        disturbEndTime: endTime,
      };
    }

    case 'CLEAR_DISTURB_EFFECT': {
      console.log('🚫 방해바이러스 효과 종료');
      return {
        ...state,
        isDisturbed: false,
        disturbEndTime: 0,
      };
    }

    case 'SPEED_BOOST': {
      console.log('⚡ 속도 부스트:', action.payload.duration, action.payload.factor);
      const endTime = Date.now() + action.payload.duration;
      return {
        ...state,
        isSpeedBoosted: true,
        speedBoostEndTime: endTime,
      };
    }

    case 'CLEAR_SPEED_BOOST': {
      console.log('⚡ 속도 부스트 종료');
      return {
        ...state,
        isSpeedBoosted: false,
        speedBoostEndTime: 0,
      };
    }

    case 'MAGNET_ANIMATION': {
      console.log('🧲 자석 애니메이션 시작:', action.payload.duration);
      const endTime = Date.now() + action.payload.duration;
      return {
        ...state,
        isMagnetAnimating: true,
        magnetAnimationEndTime: endTime,
      };
    }

    case 'CLEAR_MAGNET_ANIMATION': {
      console.log('🧲 자석 애니메이션 종료');
      return {
        ...state,
        isMagnetAnimating: false,
        magnetAnimationEndTime: 0,
      };
    }

    case 'GHOST_TRANSPARENCY': {
      console.log('👻 유령 투명화 효과:', action.payload.virusIds, action.payload.duration);
      const endTime = Date.now() + action.payload.duration;
      return {
        ...state,
        transparentViruses: action.payload.virusIds,
        transparencyEndTime: endTime,
      };
    }

    case 'CLEAR_GHOST_TRANSPARENCY': {
      console.log('👻 유령 투명화 효과 종료');
      return {
        ...state,
        transparentViruses: [],
        transparencyEndTime: 0,
      };
    }

    default:
      return state;
  }
};
