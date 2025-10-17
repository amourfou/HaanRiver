export interface Virus {
  id: string;
  number: number;
  x: number;
  y: number;
  speed: number;
  color: string;
  isSelected: boolean;
}

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
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
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
  | { type: 'NEXT_ROUND' }
  | { type: 'VIRUS_REACHED_BOTTOM' }
  | { type: 'GAME_OVER' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESET_GAME' };
