'use client';

import React, { useReducer, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from '@/components/GameBoard';
import GameUI from '@/components/GameUI';
import UserRegistration from '@/components/UserRegistration';
import MilitaryWarning from '@/components/MilitaryWarning';
import ScoreBoard from '@/components/ScoreBoard';
import { gameReducer, initialGameState } from '@/lib/gameReducer';
import { GameAction, User } from '@/types/game';
import { 
  getUserIdFromCookie, 
  getUserFromSupabase, 
  createUserInSupabase, 
  updateUserScoreInSupabase,
  saveGameSession 
} from '@/lib/supabaseUserUtils';

export default function Home() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [showMilitaryWarning, setShowMilitaryWarning] = useState(false);
  const [showScoreBoard, setShowScoreBoard] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleGameAction = (action: GameAction) => {
    dispatch(action);
  };

  // 컴포넌트 마운트 시 사용자 정보 확인
  useEffect(() => {
    const checkUser = async () => {
      console.log('🔍 사용자 정보 확인 시작');
      const userId = getUserIdFromCookie();
      console.log('🍪 쿠키에서 가져온 사용자 ID:', userId);
      
      if (userId) {
        console.log('📡 Supabase에서 사용자 정보 조회 중...');
        const user = await getUserFromSupabase(userId);
        if (user) {
          console.log('✅ 사용자 정보 로드 성공:', user);
          console.log('🎯 사용자 최고 점수:', user.highScore);
          setCurrentUser(user);
          // 사용자의 최고 점수를 게임 상태에 반영
          console.log('🎮 게임 상태에 최고 점수 설정:', user.highScore);
          dispatch({ type: 'SET_HIGH_SCORE', payload: { highScore: user.highScore } });
        } else {
          console.log('❌ 사용자 정보를 찾을 수 없습니다');
        }
        // 사용자 정보가 없어도 바로 등록 화면을 보여주지 않음
      } else {
        console.log('❌ 쿠키에 사용자 ID가 없습니다');
      }
      // 사용자 정보가 없어도 바로 등록 화면을 보여주지 않음
    };
    
    checkUser();
  }, []);

  const handleGameOver = async () => {
    dispatch({ type: 'GAME_OVER' });
    // 게임 오버 시 사용자 점수 업데이트 및 게임 세션 저장
    if (currentUser && gameState.score > 0) {
      await updateUserScoreInSupabase(currentUser.id, gameState.score);
      await saveGameSession(
        currentUser.id, 
        gameState.score, 
        gameState.round, 
        gameState.virusesReachedBottom
      );
    }
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_GAME' });
  };

  const handleResume = () => {
    dispatch({ type: 'RESUME_GAME' });
  };

  const handleUserRegistration = async (name: string, organization: string) => {
    try {
      const newUser = await createUserInSupabase(name, organization);
      if (newUser) {
        console.log('새로 생성된 사용자 정보:', newUser);
        console.log('새 사용자 최고 점수:', newUser.highScore);
        setCurrentUser(newUser);
        // 사용자의 최고 점수를 게임 상태에 반영
        dispatch({ type: 'SET_HIGH_SCORE', payload: { highScore: newUser.highScore } });
        setShowUserRegistration(false);
        // 등록 완료 후 바로 게임 시작
        setShowStartScreen(false);
        dispatch({ type: 'START_GAME' });
      } else {
        console.error('사용자 등록에 실패했습니다.');
      }
    } catch (error: any) {
      if (error.message === 'DUPLICATE_NAME') {
        // 중복 이름 경고 표시
        setDuplicateName(name);
        setShowMilitaryWarning(true);
        setShowUserRegistration(false);
      } else {
        console.error('사용자 등록에 실패했습니다.');
      }
    }
  };

  const handleCancelRegistration = () => {
    setShowUserRegistration(false);
    // 메인 화면으로 돌아가기
  };

  const handleCloseMilitaryWarning = () => {
    setShowMilitaryWarning(false);
    setShowUserRegistration(true); // 다시 등록 화면으로
  };

  const handleShowScoreBoard = () => {
    setShowScoreBoard(true);
  };

  const handleCloseScoreBoard = () => {
    setShowScoreBoard(false);
  };

  const startGame = () => {
    // 사용자 정보가 없으면 등록 화면 표시
    if (!currentUser) {
      setShowUserRegistration(true);
      return;
    }
    
    // 사용자 정보가 있으면 바로 게임 시작
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
        {showUserRegistration && (
          <UserRegistration 
            onRegister={handleUserRegistration} 
            onCancel={handleCancelRegistration}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMilitaryWarning && (
          <MilitaryWarning 
            onClose={handleCloseMilitaryWarning}
            duplicateName={duplicateName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScoreBoard && (
          <ScoreBoard 
            onClose={handleCloseScoreBoard}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStartScreen && !showUserRegistration && (
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
              
              {/* 사용자 정보 표시 */}
              {currentUser ? (
                <motion.div
                  className="mb-6 p-4 bg-black bg-opacity-50 rounded-lg backdrop-blur-sm border border-virus-green max-w-md mx-auto"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="text-virus-green text-lg font-bold mb-2 text-center">
                    🎖️ 환영합니다!
                  </div>
                  <div className="text-white text-base font-semibold mb-1 text-center break-words">
                    {currentUser.name}님
                  </div>
                  <div className="text-white text-sm text-center break-words">
                    소속: {currentUser.organization}
                  </div>
                  <div className="text-virus-green text-sm font-semibold text-center">
                    최고 점수: {currentUser.highScore.toLocaleString()}점
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="mb-6 p-4 bg-black bg-opacity-50 rounded-lg backdrop-blur-sm border border-gray-600 max-w-md mx-auto"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="text-white text-lg font-bold mb-2 text-center">
                    🚀 새로운 임무를 시작하세요!
                  </div>
                  <div className="text-gray-300 text-sm text-center">
                    게임 시작 시 신분 등록이 필요합니다
                  </div>
                </motion.div>
              )}
              
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

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  className="bg-virus-green text-black font-bold text-xl px-8 py-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105"
                  onClick={startGame}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentUser ? '🎮 게임 시작' : '🎮 게임 시작'}
                </motion.button>

                <motion.button
                  className="bg-gray-700 text-white font-bold text-xl px-8 py-4 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                  onClick={handleShowScoreBoard}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏆 점수보기
                </motion.button>
              </div>

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

      {!showStartScreen && !showUserRegistration && !showMilitaryWarning && (
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
            currentUser={currentUser}
          />
        </>
      )}
    </div>
  );
}
