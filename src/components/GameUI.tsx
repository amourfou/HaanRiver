'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/types/game';

interface GameUIProps {
  gameState: GameState;
  onPause: () => void;
  onResume: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, onPause, onResume }) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-40 p-4">
      {/* 상단 UI */}
      <div className="flex justify-between items-center mb-4">
        {/* 점수 */}
        <motion.div
          className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-4 py-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-white text-sm">점수</div>
          <div className="text-virus-green text-2xl font-bold">
            {gameState.score.toLocaleString()}
          </div>
        </motion.div>

        {/* 라운드 */}
        <motion.div
          className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-4 py-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-white text-sm">라운드</div>
          <div className="text-virus-blue text-2xl font-bold">
            {gameState.round}
          </div>
        </motion.div>

        {/* 바이러스 진행도 */}
        <motion.div
          className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-4 py-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-white text-sm">진행도</div>
          <div className="text-virus-green text-lg font-bold">
            {gameState.virusesSpawned}/{gameState.virusesToSpawn}
          </div>
        </motion.div>

        {/* 일시정지 버튼 */}
        <motion.button
          className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 text-white hover:bg-opacity-70 transition-colors"
          onClick={gameState.isPaused ? onResume : onPause}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {gameState.isPaused ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* 선택된 바이러스 합계 표시 */}
      {gameState.selectedViruses.length > 0 && (
        <motion.div
          className="bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-4 mb-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
        >
          <div className="text-white text-sm mb-2">선택된 바이러스</div>
          <div className="flex items-center gap-2 mb-2">
            {gameState.selectedViruses.map((virus, index) => (
              <React.Fragment key={virus.id}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: virus.color }}
                >
                  {virus.number}
                </div>
                {index < gameState.selectedViruses.length - 1 && (
                  <span className="text-white">+</span>
                )}
              </React.Fragment>
            ))}
            <span className="text-white">=</span>
            <div
              className={`px-3 py-1 rounded-full font-bold ${
                gameState.selectedViruses.reduce((sum, v) => sum + v.number, 0) === 10 ||
                gameState.selectedViruses.reduce((sum, v) => sum + v.number, 0) === 20
                  ? 'bg-virus-green text-black'
                  : 'bg-gray-600 text-white'
              }`}
            >
              {gameState.selectedViruses.reduce((sum, v) => sum + v.number, 0)}
            </div>
          </div>
          <div className="text-xs text-gray-300">
            합계가 10 또는 20이 되면 바이러스가 제거됩니다!
          </div>
        </motion.div>
      )}

      {/* 콤보 표시 */}
      {gameState.combo > 0 && (
        <motion.div
          className="absolute top-20 right-4 bg-virus-green bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
        >
          <div className="text-black font-bold text-lg">
            COMBO x{gameState.combo}!
          </div>
        </motion.div>
      )}

      {/* 게임 안내 - 첫 번째 바이러스의 상단이 화면에 보이면 숨김 */}
      {gameState.viruses.length === 0 || (gameState.viruses.length > 0 && gameState.viruses[0].y < 0) && (
        <motion.div
          className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 mt-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-white text-sm text-center">
            <div className="font-bold mb-1">🚀 한강을 지켜라!</div>
            <div className="text-xs text-gray-300">
              바이러스를 터치해서 숫자 합이 10 또는 20이 되면 제거됩니다
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GameUI;
