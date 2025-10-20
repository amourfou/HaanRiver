'use client';

import React, { useReducer, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from '@/components/GameBoard';
import GameUI from '@/components/GameUI';
import { gameReducer, initialGameState } from '@/lib/gameReducer';
import { GameAction } from '@/types/game';

export default function Home() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const handleGameAction = (action: GameAction) => {
    dispatch(action);
  };

  const handleGameOver = () => {
    dispatch({ type: 'GAME_OVER' });
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_GAME' });
  };

  const handleResume = () => {
    dispatch({ type: 'RESUME_GAME' });
  };

  const startGame = () => {
    setShowStartScreen(false);
    dispatch({ type: 'START_GAME' });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
    setShowStartScreen(true);
  };

  const handleExit = () => {
    dispatch({ type: 'RESET_GAME' });
    setShowStartScreen(true);
  };

  return (
    <div className="game-container">
      <AnimatePresence>
        {showStartScreen && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50"
            style={{
              backgroundImage: 'url(/images/backgroundmenu.PNG)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >

            {/* 메인 타이틀 */}
            <div className="text-center text-white z-10" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              <motion.h1
                className="text-6xl md:text-8xl font-bold mb-4 gradient-text"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                HaanRiver
              </motion.h1>
              
              {showStartScreen && (
                <>
                  <motion.h2
                    className="text-2xl md:text-3xl font-semibold mb-8"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    🚀 한강을 지켜라!
                  </motion.h2>

                  <motion.div
                    className="max-w-md mx-auto mb-8 text-lg"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    <p className="mb-4">
                      우주에서 외계인이 바이러스를 뿌리고 있어요!
                    </p>
                    <p className="mb-4">
                      바이러스를 터치해서 숫자 합이 <span className="text-virus-green font-bold">10</span> 또는 <span className="text-virus-green font-bold">20</span>이 되면 제거됩니다.
                    </p>
                    <p className="text-sm text-gray-300">
                      한강이 오염되기 전에 모든 바이러스를 제거하세요!
                    </p>
                  </motion.div>
                </>
              )}

              <motion.button
                className="bg-virus-green text-black font-bold text-xl px-8 py-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105"
                onClick={startGame}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                게임 시작
              </motion.button>

              {/* 게임 설명 */}
              <motion.div
                className="mt-12 text-sm text-gray-300 max-w-sm mx-auto"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">게임 방법</h3>
                  <ul className="text-left space-y-1">
                    <li>• 바이러스를 터치하여 선택</li>
                    <li>• 선택된 숫자들의 합이 10 또는 20</li>
                    <li>• 바이러스가 한강에 닿으면 게임 오버</li>
                    <li>• 레벨이 올라갈수록 속도 증가</li>
                  </ul>
                </div>
              </motion.div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {!showStartScreen && (
        <>
          <GameBoard
            gameState={gameState}
            onGameAction={handleGameAction}
            onGameOver={handleGameOver}
            onResetGame={resetGame}
          />
          <GameUI
            gameState={gameState}
            onPause={handlePause}
            onResume={handleResume}
            onExit={handleExit}
          />
        </>
      )}
    </div>
  );
}
