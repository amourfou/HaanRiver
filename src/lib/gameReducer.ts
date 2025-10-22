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
        const score = calculateScore(virusCount, state.combo);
        const newViruses = state.viruses.filter(v => 
          !newSelectedViruses.some(selected => selected.id === v.id)
        ).map(v => ({ ...v, isSelected: false })); // 남은 바이러스들의 선택 상태 초기화

        return {
          ...state,
          viruses: newViruses,
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

    default:
      return state;
  }
};
