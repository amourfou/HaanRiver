'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/types/game';
import { playClickSound } from '@/lib/soundUtils';

interface GameUIProps {
  gameState: GameState;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
  currentUser?: { name: string; organization: string } | null;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, onPause, onResume, onExit, currentUser }) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-[60]">
      {/* 전체 화면 너비의 상단 배경 */}
      <div className="w-full bg-black bg-opacity-70 backdrop-blur-sm p-2">
        {/* 상단 UI */}
        <div className="flex justify-between items-center">
          {/* 사용자 정보 */}
          {currentUser && (
            <motion.div
              className="px-2 py-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-virus-green text-lg font-bold">
                {currentUser.name}
              </div>
              <div className="text-white text-xs">
                {currentUser.organization}
              </div>
            </motion.div>
          )}

          {/* 점수 */}
          <motion.div
            className="px-2 py-1"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-white text-xs">점수</div>
            <div className="text-virus-green text-xl font-bold">
              {gameState.score.toLocaleString()}
            </div>
            <div className="text-white text-xs">
              최고: {gameState.highScore.toLocaleString()}
            </div>
            {/* 슈퍼바이러스 점수 보너스 표시 */}
            {gameState.selectedViruses.some(v => v.isSuperVirus) && (
              <motion.div
                className="text-yellow-400 text-xs font-bold"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                ✨ 슈퍼 보너스 1.2배!
              </motion.div>
            )}
            {/* 터보 부스트 표시 */}
            {gameState.isSpeedBoosted && (
              <motion.div
                className="text-yellow-300 text-xs font-bold"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                🚀 터보 부스트 1.5배!
              </motion.div>
            )}
          </motion.div>

          {/* 라운드 */}
          <motion.div
            className="px-2 py-1"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-white text-xs">라운드</div>
            <div className="text-virus-blue text-xl font-bold">
              {gameState.round}
            </div>
          </motion.div>

          {/* 바이러스 진행도 */}
          <motion.div
            className="px-2 py-1"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-white text-xs">진행도</div>
            <div className="text-virus-green text-base font-bold">
              {gameState.virusesSpawned}/{gameState.virusesToSpawn}
            </div>
          </motion.div>

          {/* 우측 상단 버튼들 */}
          <div className="flex gap-1">
            {/* 일시정지 버튼 */}
            <motion.button
              className="rounded-full p-1.5 text-white hover:bg-white hover:bg-opacity-20 transition-colors"
              onClick={() => {
                playClickSound();
                gameState.isPaused ? onResume() : onPause();
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={gameState.isPaused ? "재생" : "일시정지"}
            >
            {gameState.isPaused ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            </motion.button>

            {/* 로그아웃 버튼 */}
            <motion.button
              className="rounded-full p-1.5 text-white hover:bg-red-500 hover:bg-opacity-20 transition-colors"
              onClick={() => {
                playClickSound();
                onExit();
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="로그아웃"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>



      {/* 게임 안내 - 첫 번째 바이러스의 상단이 화면에 보이면 숨김 */}
      {gameState.viruses.length === 0 || (gameState.viruses.length > 0 && gameState.viruses[0].y < 0) && (
        <motion.div
          className="w-full bg-black bg-opacity-70 backdrop-blur-sm p-2"
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
