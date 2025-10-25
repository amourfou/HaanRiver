export interface Virus {
  id: string;
  number: number;
  x: number;
  y: number;
  speed: number;
  color: string;
  isSelected: boolean;
  isSuperVirus?: boolean;
  superVirusType?: SuperVirusType;
}

export type SuperVirusType = 
  | 'turbo'          // 터보 - 2배 속도
  | 'bomb'           // 폭탄 - 제거 시 주변 바이러스도 제거
  | 'freeze'         // 얼음 - 게임 속도 느려짐
  | 'magnet'         // 자석 - 다른 바이러스 끌어당김
  | 'ghost'          // 유령 - 투명해서 터치하기 어려움
  | 'split'          // 분열 - 제거 시 2개로 분열
  | 'time'           // 시간 - 시간 정지 효과
  | 'heal'           // 치료 - 한강 오염도 감소
  | 'clear'          // 클리어 - 모든 바이러스 제거
  | 'disturb';       // 방해 - 화면 가리기 + 사운드

export interface GameState {
  viruses: Virus[];
  score: number;
  round: number;
  gameSpeed: number;
  isGameOver: boolean;
  isPaused: boolean;
  isGameStarted: boolean;
  selectedViruses: Virus[];
  combo: number;
  virusesSpawned: number;
  virusesToSpawn: number;
  virusesReachedBottom: number;
  maxVirusesAllowed: number;
  isRoundComplete: boolean;
  highScore: number;
  currentVirusSpeed: number;
  isSlowed: boolean;
  isFrozen: boolean;
  slowEndTime: number;
  freezeEndTime: number;
  pendingSuperVirusEffect?: any;
  isDisturbed: boolean;
  disturbEndTime: number;
  isSpeedBoosted: boolean;
  speedBoostEndTime: number;
  isMagnetAnimating: boolean;
  magnetAnimationEndTime: number;
  transparentViruses: string[]; // 투명화된 바이러스 ID 목록
  transparencyEndTime: number; // 투명화 효과 종료 시간
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
}

export interface User {
  id: string;
  name: string;
  organization: string;
  highScore: number;
  createdAt: string;
}

export interface GameSession {
  id: string;
  roomId: string;
  players: Player[];
  gameState: GameState;
  currentTurn: string;
  createdAt: Date;
}

export type GameAction = 
  | { type: 'START_GAME' }
  | { type: 'SELECT_VIRUS'; payload: { virusId: string } }
  | { type: 'DESELECT_VIRUS'; payload: { virusId: string } }
  | { type: 'CLEAR_SELECTED' }
  | { type: 'ADD_VIRUS'; payload: { virus: Virus } }
  | { type: 'REMOVE_VIRUS'; payload: { virusId: string } }
  | { type: 'UPDATE_VIRUSES'; payload: { viruses: Virus[] } }
  | { type: 'UPDATE_SCORE'; payload: { points: number } }
  | { type: 'ROUND_COMPLETE' }
  | { type: 'START_NEXT_ROUND' }
  | { type: 'VIRUS_REACHED_BOTTOM' }
  | { type: 'GAME_OVER' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESET_COMBO' }
  | { type: 'SET_HIGH_SCORE'; payload: { highScore: number } }
  | { type: 'CLEAR_ALL_VIRUSES'; payload: { virusId: string } }
  | { type: 'EXPLODE_VIRUS'; payload: { virusId: string; radius: number } }
  | { type: 'SLOW_GAME'; payload: { duration: number; factor: number } }
  | { type: 'FREEZE_TIME'; payload: { duration: number } }
  | { type: 'HEAL_RIVER'; payload: { amount: number } }
  | { type: 'SPLIT_VIRUS'; payload: { virusId: string } }
  | { type: 'DISTURB_SCREEN'; payload: { duration: number } }
  | { type: 'CLEAR_DISTURB_EFFECT' }
  | { type: 'SPEED_BOOST'; payload: { duration: number; factor: number } }
  | { type: 'CLEAR_SPEED_BOOST' }
  | { type: 'MAGNET_ANIMATION'; payload: { duration: number } }
  | { type: 'CLEAR_MAGNET_ANIMATION' }
  | { type: 'GHOST_TRANSPARENCY'; payload: { virusIds: string[]; duration: number } }
  | { type: 'CLEAR_GHOST_TRANSPARENCY' }
  | { type: 'CLEAR_PENDING_SUPER_VIRUS_EFFECT' }
  | { type: 'RESET_GAME' };
