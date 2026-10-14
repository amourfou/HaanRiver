'use client';

import React, { useReducer, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from '@/components/GameBoard';
import GameUI from '@/components/GameUI';
import UserRegistration from '@/components/UserRegistration';
import MilitaryWarning from '@/components/MilitaryWarning';
import ScoreBoard from '@/components/ScoreBoard';
import TypingDialog from '@/components/TypingDialog';
import { gameReducer, initialGameState } from '@/lib/gameReducer';
import { GameAction, User } from '@/types/game';
import {
  fetchMe,
  loginWithPin,
  logoutSession,
  startGameOnServer,
  submitGameResult,
} from '@/lib/supabaseUserUtils';
import { playClickSound } from '@/lib/soundUtils';

export default function Home() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [showMilitaryWarning, setShowMilitaryWarning] = useState(false);
  const [showScoreBoard, setShowScoreBoard] = useState(false);
  const [showTypingDialog, setShowTypingDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [existingUser, setExistingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [offsetTop, setOffsetTop] = useState(0);

  const handleGameAction = (action: GameAction) => {
    dispatch(action);
  };

  // DevTools 환경 감지 (더 정확한 방법)
  const isDevTools = typeof window !== 'undefined' && (
    window.outerHeight - window.innerHeight > 100 || 
    window.outerWidth - window.innerWidth > 100 ||
    (navigator.userAgent.includes('Chrome') && (window as any).chrome && !navigator.userAgent.includes('Mobile'))
  );

  // 화면 비율 계산 (375x667 기준)
  const getResponsiveSize = (baseSize: number) => {
    if (typeof window === 'undefined') return baseSize;
    const baseWidth = 375;
    const baseHeight = 667;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    // 가로와 세로 비율 중 작은 것을 사용 (화면에 맞게 조절)
    const widthRatio = currentWidth / baseWidth;
    const heightRatio = currentHeight / baseHeight;
    const scale = Math.min(widthRatio, heightRatio);
    
    return Math.round(baseSize * scale);
  };

  // 컴포넌트 마운트 시 세션(HttpOnly 쿠키)으로 사용자 정보 확인
  useEffect(() => {
    void fetchMe().then((user) => {
      if (user) {
        setCurrentUser(user);
        dispatch({ type: 'SET_HIGH_SCORE', payload: { highScore: user.highScore } });
      }
    });
  }, []);

  // 게임이 시작되면 서버에서 서명된 시작 토큰을 받아 둬요 (점수 검증용)
  const gameTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameState.isGameStarted && currentUser) {
      gameTokenRef.current = null;
      void startGameOnServer().then((t) => {
        gameTokenRef.current = t;
      });
    }
  }, [gameState.isGameStarted, currentUser]);

  const handleGameOver = async () => {
    dispatch({ type: 'GAME_OVER' });
    // 게임 오버 시 사용자 점수 업데이트 및 게임 세션 저장
    if (currentUser && gameState.score > 0 && gameTokenRef.current) {
      const r = await submitGameResult(gameTokenRef.current, gameState.score, gameState.round, gameState.virusesReachedBottom);
      gameTokenRef.current = null;
      if (r.ok && typeof r.highScore === 'number') {
        const highScore = r.highScore;
        setCurrentUser((u) => (u ? { ...u, highScore } : u));
      } else if (!r.ok) {
        console.error('점수 저장 실패:', r.error);
      }
    }
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_GAME' });
  };

  const handleResume = () => {
    dispatch({ type: 'RESUME_GAME' });
  };

  const handleLogin = async (name: string, pin: string) => {
    const r = await loginWithPin(name, pin);
    if (r.ok) {
      setCurrentUser(r.user);
      dispatch({ type: 'SET_HIGH_SCORE', payload: { highScore: r.user.highScore } });
      setShowUserRegistration(false);
      setShowStartScreen(false);
      dispatch({ type: 'START_GAME' });
    }
    return r;
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
    playClickSound();
    setShowScoreBoard(true);
    setShowStartScreen(false); // 점수보기 화면이 보이도록 시작 화면 숨김
    // 게임은 시작하지 않음 - 점수보기만 표시
  };

  const handleCloseScoreBoard = () => {
    playClickSound();
    setShowScoreBoard(false);
    setShowStartScreen(true);
  };

  const handleLogout = () => {
    playClickSound();
    void logoutSession();
    // 사용자 정보 초기화
    setCurrentUser(null);
    // 게임 상태 초기화
    dispatch({ type: 'RESET_GAME' });
    // 메인 화면으로 돌아가기
    setShowScoreBoard(false);
    setShowStartScreen(true);
  };


  const handleTypingDialogComplete = () => {
    // 예전 "중복 이름" 흐름은 PIN 로그인으로 대체되었어요.
    setShowTypingDialog(false);
    if (existingUser) setShowUserRegistration(true);
  };

  const startGame = () => {
    playClickSound();
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
    <div 
      className="game-container"
      style={{
        height: isDevTools ? '100vh' : (availableHeight > 0 ? `${availableHeight}px` : '100vh'),
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}
    >
      <AnimatePresence>
        {showUserRegistration && (
          <UserRegistration 
            onLogin={handleLogin} 
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
        {showTypingDialog && existingUser && (
          <TypingDialog 
            text={`오, ${existingUser.name} 자네였군. 기다리고 있었네. 지금 상황이 좋질 않아. 어서 전장으로 가게!`}
            onComplete={handleTypingDialogComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStartScreen && !showUserRegistration && (
          <motion.div
            className="absolute flex flex-col justify-center z-50"
            style={{
              top: isDevTools ? 0 : offsetTop,
              left: 0,
              height: isDevTools ? '100vh' : (availableHeight > 0 ? `${availableHeight}px` : '100vh'),
              width: '100vw',
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
            <div className="text-center text-white z-10 px-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              <motion.h1
                className="font-bold mb-2 gradient-text"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                style={{ fontSize: `${getResponsiveSize(36)}px` }}
              >
                HaanRiver
              </motion.h1>
              
              {/* 사용자 정보 표시 */}
              {currentUser ? (
                <motion.div
                  className="mb-6 p-4 bg-black bg-opacity-50 rounded-lg backdrop-blur-sm border border-virus-green max-w-md mx-auto relative"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  {/* 로그아웃 버튼 - 박스 내 우측 상단 */}
                  <motion.button
                    onClick={handleLogout}
                    className="absolute top-2 right-2 rounded-full p-1.5 text-white hover:bg-red-500 hover:bg-opacity-20 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="로그아웃"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                  </motion.button>
                  
                  <div className="text-virus-green text-lg font-bold mb-3 text-center">
                    🎖️ 환영합니다!
                  </div>
                  <div className="text-center text-sm">
                    <span className="text-white font-semibold break-words">
                      {currentUser.name}님
                    </span>
                    <span className="text-gray-300 mx-2">•</span>
                    <span className="text-white break-words">
                      {currentUser.organization}
                    </span>
                    <span className="text-gray-300 mx-2">•</span>
                    <span className="text-virus-green font-semibold">
                      최고: {currentUser.highScore.toLocaleString()}점
                    </span>
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
                    className="font-semibold mb-4"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{ fontSize: `${getResponsiveSize(18)}px` }}
                  >
                    🚀 한강을 지켜라!
                  </motion.h2>

                  <motion.div
                    className="max-w-md mx-auto mb-4 px-4"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    style={{ fontSize: `${getResponsiveSize(14)}px` }}
                  >
                    <p className="mb-2">
                      우주에서 외계인이 바이러스를 뿌리고 있어요!
                    </p>
                    <p className="mb-2">
                      바이러스를 터치해서 숫자 합이 <span className="text-virus-green font-bold">10</span> 또는 <span className="text-virus-green font-bold">20</span>이 되면 제거됩니다.
                    </p>
                    <p className="text-gray-300" style={{ fontSize: `${getResponsiveSize(12)}px` }}>
                      한강이 오염되기 전에 모든 바이러스를 제거하세요!
                    </p>
                  </motion.div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-sm mx-auto">
                <motion.button
                  className="bg-virus-green bg-opacity-80 backdrop-blur-sm text-black font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 flex-shrink-0"
                  onClick={startGame}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    fontSize: `${getResponsiveSize(20)}px`, 
                    padding: `${getResponsiveSize(12)}px ${getResponsiveSize(24)}px` 
                  }}
                >
                  {currentUser ? '🎮 게임 시작' : '🎮 게임 시작'}
                </motion.button>

                <motion.button
                  className="bg-gray-700 bg-opacity-80 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 flex-shrink-0"
                  onClick={handleShowScoreBoard}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    fontSize: `${getResponsiveSize(20)}px`, 
                    padding: `${getResponsiveSize(12)}px ${getResponsiveSize(24)}px` 
                  }}
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
                style={{ fontSize: `${getResponsiveSize(14)}px` }}
              >
                <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2" style={{ fontSize: `${getResponsiveSize(16)}px` }}>게임 방법</h3>
                  <ul className="text-left space-y-1" style={{ fontSize: `${getResponsiveSize(14)}px` }}>
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

      {!showStartScreen && !showUserRegistration && !showMilitaryWarning && !showScoreBoard && (
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
