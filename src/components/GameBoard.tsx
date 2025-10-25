'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Virus from './Virus';
import { GameState, Virus as VirusType } from '@/types/game';
import { playMatchSound, playDroppedSound, playDisturbSound } from '@/lib/soundUtils';
import { 
  createVirus, 
  updateVirusPositions, 
  removeOffscreenViruses, 
  checkGameOver,
  checkVirusReachedBottom,
  getVirusSpawnRate,
  getVirusSpeed,
  getRandomX,
  adjustVirusPosition,
  getVirusBatchSize,
  canMakeValidSum,
  getRiverColor,
  getRiverOpacity
} from '@/lib/gameLogic';

interface GameBoardProps {
  gameState: GameState;
  onGameAction: (action: any) => void;
  onGameOver: () => void;
  onResetGame: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  onGameAction, 
  onGameOver,
  onResetGame
}) => {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const virusIdCounterRef = useRef<number>(0);
  const gameStateRef = useRef(gameState);
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const previousVirusCountRef = useRef(0);
  const previousVirusesReachedBottomRef = useRef(0);

  // gameState ref 업데이트
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 바이러스 제거 시 매치 사운드 재생
  useEffect(() => {
    const currentVirusCount = gameState.viruses.length;
    const previousVirusCount = previousVirusCountRef.current;
    
    // 바이러스가 제거되었고 (개수가 줄어들었고), 게임이 진행 중일 때
    if (currentVirusCount < previousVirusCount && gameState.isGameStarted && !gameState.isPaused) {
      playMatchSound();
    }
    
    previousVirusCountRef.current = currentVirusCount;
  }, [gameState.viruses.length, gameState.isGameStarted, gameState.isPaused]);

  // 바이러스가 물에 닿을 때 드롭 사운드 재생
  useEffect(() => {
    const currentVirusesReachedBottom = gameState.virusesReachedBottom;
    const previousVirusesReachedBottom = previousVirusesReachedBottomRef.current;
    
    // 바이러스가 물에 닿았고 (개수가 증가했고), 게임이 진행 중일 때
    if (currentVirusesReachedBottom > previousVirusesReachedBottom && gameState.isGameStarted && !gameState.isPaused) {
      playDroppedSound();
    }
    
    previousVirusesReachedBottomRef.current = currentVirusesReachedBottom;
  }, [gameState.virusesReachedBottom, gameState.isGameStarted, gameState.isPaused]);

  // 모바일 브라우저 네비게이션바 대응 (터치 이벤트 방해하지 않음)
  useEffect(() => {
    // 기본 스크롤 방지만 적용 (터치 이벤트는 방해하지 않음)
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 화면 크기 설정 - 실제 사용 가능한 영역만 게임 영역으로 설정
  useEffect(() => {
    const updateScreenSize = () => {
      const gameBoardElement = gameBoardRef.current;
      
      // Visual Viewport API로 실제 사용 가능한 영역 계산
      let availableHeight = window.innerHeight;
      let availableWidth = window.innerWidth;
      let offsetTop = 0;
      let offsetBottom = 0;
      
      // Visual Viewport API 지원 확인 (가장 정확한 방법)
      if (window.visualViewport) {
        availableHeight = window.visualViewport.height;
        availableWidth = window.visualViewport.width;
        offsetTop = window.visualViewport.offsetTop || 0;
        offsetBottom = window.innerHeight - (window.visualViewport.offsetTop + window.visualViewport.height);
        
        console.log('Visual Viewport 정보:', {
          height: availableHeight,
          width: availableWidth,
          offsetTop: offsetTop,
          offsetBottom: offsetBottom,
          innerHeight: window.innerHeight,
          visualViewportHeight: window.visualViewport.height
        });
      }
      
      // 안전 영역 고려
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0');
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0');
      
      // 실제 사용 가능한 높이 계산 (상단 주소창과 하단 네비게이션바 제외)
      const actualAvailableHeight = availableHeight - safeAreaTop - safeAreaBottom;
      
      setScreenSize({
        width: availableWidth,
        height: Math.max(actualAvailableHeight, 400), // 최소 높이 보장
      });
      
      console.log(`실제 사용 가능한 영역: ${availableWidth}x${actualAvailableHeight}, offsetTop: ${offsetTop}, offsetBottom: ${offsetBottom}`);
    };

    // DOM이 렌더링된 후에 높이 측정
    const timer = setTimeout(updateScreenSize, 100);
    
    // 화면 크기 변경 이벤트 리스너
    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', updateScreenSize);
    
    // Visual Viewport API 이벤트 리스너 (모바일 브라우저 네비게이션바 감지)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateScreenSize);
      window.visualViewport.addEventListener('scroll', updateScreenSize);
    }
    
    // 모바일 브라우저의 네비게이션바 표시/숨김 감지
    window.addEventListener('resize', () => {
      setTimeout(updateScreenSize, 100); // 네비게이션바 애니메이션 완료 후
    });
    
    // 추가적인 모바일 브라우저 이벤트
    window.addEventListener('scroll', updateScreenSize);
    window.addEventListener('touchstart', updateScreenSize);
    window.addEventListener('touchend', updateScreenSize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
      window.removeEventListener('scroll', updateScreenSize);
      window.removeEventListener('touchstart', updateScreenSize);
      window.removeEventListener('touchend', updateScreenSize);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateScreenSize);
        window.visualViewport.removeEventListener('scroll', updateScreenSize);
      }
    };
  }, []);

  // 바이러스 터치 핸들러
  const handleVirusTouch = (virusId: string) => {
    if (gameState.isPaused || gameState.isGameOver) return;
    
    // 이미 선택된 바이러스인지 확인
    const virus = gameState.viruses.find(v => v.id === virusId);
    if (virus && virus.isSelected) {
      // 이미 선택된 바이러스면 선택 해제
      onGameActionRef.current({
        type: 'DESELECT_VIRUS',
        payload: { virusId }
      });
    } else {
      // 선택되지 않은 바이러스면 선택
      onGameActionRef.current({
        type: 'SELECT_VIRUS',
        payload: { virusId }
      });
    }
  };

  // 슈퍼바이러스 효과 처리
  useEffect(() => {
    if (gameState.pendingSuperVirusEffect) {
      console.log('🎯 슈퍼바이러스 효과 실행:', gameState.pendingSuperVirusEffect);
      
      // 슈퍼바이러스 효과 액션 실행
      onGameActionRef.current(gameState.pendingSuperVirusEffect);
      
      // pendingSuperVirusEffect 초기화
      onGameActionRef.current({
        type: 'CLEAR_PENDING_SUPER_VIRUS_EFFECT'
      });
    }
  }, [gameState.pendingSuperVirusEffect]);

  // 방해바이러스 효과 처리
  useEffect(() => {
    if (gameState.isDisturbed) {
      console.log('🚫 방해바이러스 효과 활성화');
      playDisturbSound();
    }
  }, [gameState.isDisturbed]);

  // 방해바이러스 효과 종료 체크
  useEffect(() => {
    if (gameState.isDisturbed) {
      const checkDisturbEnd = () => {
        const currentTime = Date.now();
        if (currentTime >= gameState.disturbEndTime) {
          console.log('🚫 방해바이러스 효과 종료');
          onGameActionRef.current({
            type: 'CLEAR_DISTURB_EFFECT'
          });
        }
      };

      const interval = setInterval(checkDisturbEnd, 100);
      return () => clearInterval(interval);
    }
  }, [gameState.isDisturbed, gameState.disturbEndTime]);

  // 속도 부스트 효과 종료 체크
  useEffect(() => {
    if (gameState.isSpeedBoosted) {
      const checkSpeedBoostEnd = () => {
        const currentTime = Date.now();
        if (currentTime >= gameState.speedBoostEndTime) {
          console.log('⚡ 속도 부스트 효과 종료');
          onGameActionRef.current({
            type: 'CLEAR_SPEED_BOOST'
          });
        }
      };

      const interval = setInterval(checkSpeedBoostEnd, 100);
      return () => clearInterval(interval);
    }
  }, [gameState.isSpeedBoosted, gameState.speedBoostEndTime]);

  // 자석 애니메이션 종료 체크
  useEffect(() => {
    if (gameState.isMagnetAnimating) {
      const checkMagnetAnimationEnd = () => {
        const currentTime = Date.now();
        if (currentTime >= gameState.magnetAnimationEndTime) {
          console.log('🧲 자석 애니메이션 종료');
          onGameActionRef.current({
            type: 'CLEAR_MAGNET_ANIMATION'
          });
        }
      };

      const interval = setInterval(checkMagnetAnimationEnd, 100);
      return () => clearInterval(interval);
    }
  }, [gameState.isMagnetAnimating, gameState.magnetAnimationEndTime]);

  // 유령 투명화 효과 종료 체크
  useEffect(() => {
    if (gameState.transparentViruses.length > 0) {
      const checkTransparencyEnd = () => {
        const currentTime = Date.now();
        if (currentTime >= gameState.transparencyEndTime) {
          console.log('👻 유령 투명화 효과 종료');
          onGameActionRef.current({
            type: 'CLEAR_GHOST_TRANSPARENCY'
          });
        }
      };

      const interval = setInterval(checkTransparencyEnd, 100);
      return () => clearInterval(interval);
    }
  }, [gameState.transparentViruses.length, gameState.transparencyEndTime]);

  // 게임 루프
  useEffect(() => {
    if (gameState.isPaused || gameState.isGameOver || gameState.isRoundComplete || screenSize.height === 0) {
      return;
    }

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const currentViruses = gameStateRef.current.viruses;

      // 바이러스 위치 업데이트 (슬로우/프리즈 효과 포함)
      const updatedViruses = updateVirusPositions(currentViruses, deltaTime, screenSize.width, gameStateRef.current);
      
      
      // 바닥에 도달한 바이러스 확인
      const reachedBottomViruses = updatedViruses.filter(virus => 
        checkVirusReachedBottom(virus, screenSize.height)
      );
      
      // 바닥에 도달한 바이러스가 있으면 카운트 증가하고 제거
      if (reachedBottomViruses.length > 0) {
        reachedBottomViruses.forEach(() => {
          onGameActionRef.current({ type: 'VIRUS_REACHED_BOTTOM' });
        });
      }
      
      // 바닥에 도달한 바이러스 제거
      const filteredViruses = updatedViruses.filter(virus => 
        !checkVirusReachedBottom(virus, screenSize.height)
      );

      // 바이러스 상태 업데이트 (변화가 있을 때만)
      if (filteredViruses.length !== currentViruses.length || 
          filteredViruses.some((v, i) => v.y !== currentViruses[i]?.y)) {
        onGameActionRef.current({
          type: 'UPDATE_VIRUSES',
          payload: { viruses: filteredViruses }
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPaused, gameState.isGameOver, screenSize.height]);

  // 바이러스 생성 - useRef로 interval 관리
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onGameActionRef = useRef(onGameAction);
  const onGameOverRef = useRef(onGameOver);
  
  // ref 업데이트
  useEffect(() => {
    onGameActionRef.current = onGameAction;
    onGameOverRef.current = onGameOver;
  }, [onGameAction, onGameOver]);

  useEffect(() => {
    // 기존 interval 정리
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    if (gameState.isPaused || gameState.isGameOver || gameState.isRoundComplete || screenSize.height === 0) {
      return;
    }

    // 바이러스 생성 시작
    const startSpawning = () => {
      spawnIntervalRef.current = setInterval(() => {
        // 현재 상태를 다시 확인
        const currentState = gameStateRef.current;
        const currentVirusesSpawned = currentState.virusesSpawned;
        const currentVirusesToSpawn = currentState.virusesToSpawn;
        
        console.log(`바이러스 생성 체크: ${currentVirusesSpawned}/${currentVirusesToSpawn}개 생성됨`);

        // 50개 생성 완료 시 다음 라운드로 진행
        if (currentVirusesSpawned >= currentVirusesToSpawn) {
          console.log('라운드 완료: 50개 바이러스 생성 완료, 다음 라운드로 진행');
          return;
        }

        // 바이러스 1개씩 연속적으로 생성 (화면 위에서 시작)
        const newVirus = createVirus( 
          `virus-${virusIdCounterRef.current++}`,
          getRandomX(screenSize.width),
          currentState.currentVirusSpeed // 미리 계산된 속도 사용
        );

        let adjustedVirus = adjustVirusPosition(
          newVirus, 
          currentState.viruses, 
          screenSize.width
        );

        console.log(`바이러스 생성: ${adjustedVirus.id}, 숫자: ${adjustedVirus.number}, x: ${adjustedVirus.x.toFixed(1)}, y: ${adjustedVirus.y.toFixed(1)}`);

        onGameActionRef.current({
          type: 'ADD_VIRUS',
          payload: { virus: adjustedVirus }
        });

      }, 1500); // 1.5초마다 고정 (겹침 방지)
    };

    startSpawning();

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [gameState.isPaused, gameState.isGameOver, screenSize.width, screenSize.height]);

  // 라운드 완료 체크 (동적 바이러스 개수 생성 완료 시 라운드 완료 상태로 변경)
  useEffect(() => {
    if (gameState.virusesSpawned >= gameState.virusesToSpawn && 
        !gameState.isGameOver && 
        !gameState.isPaused &&
        !gameState.isRoundComplete) {
      console.log(`라운드 완료: ${gameState.virusesToSpawn}개 바이러스 생성 완료, 라운드 완료 상태로 변경`);
      onGameActionRef.current({ type: 'ROUND_COMPLETE' });
    }
  }, [gameState.virusesSpawned, gameState.virusesToSpawn, gameState.isGameOver, gameState.isPaused, gameState.isRoundComplete]);

  // 게임 오버 체크
  useEffect(() => {
    if (gameState.isGameOver) {
      onGameOverRef.current();
    }
  }, [gameState.isGameOver]);

  // 게임 리셋 시 바이러스 ID 카운터도 리셋
  useEffect(() => {
    if (gameState.round === 1 && gameState.virusesSpawned === 0 && gameState.viruses.length === 0) {
      virusIdCounterRef.current = 0;
    }
  }, [gameState.round, gameState.virusesSpawned, gameState.viruses.length]);


  if (screenSize.height === 0) {
    return <div className="w-full h-screen bg-gradient-to-b from-space-dark to-han-river" />;
  }

  return (
    <div 
      ref={gameBoardRef}
      className="game-container relative w-full overflow-hidden"
      style={{ 
        height: `${screenSize.height}px`, // 실제 사용 가능한 높이만 사용
        backgroundImage: 'url(/images/background.PNG)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >

      {/* 한강 배경 - 오염도에 따라 색상 변화 */}
      <div 
        className="absolute bottom-0 w-full bg-gradient-to-t to-transparent"
        style={{
          height: `${Math.min(192, screenSize.height * 0.25)}px`, // 실제 사용 가능한 높이의 25% 또는 최대 192px
          background: `linear-gradient(to top, ${getRiverColor(gameState.virusesReachedBottom, gameState.maxVirusesAllowed)} ${getRiverOpacity(gameState.virusesReachedBottom, gameState.maxVirusesAllowed) * 100}%, transparent 0%)`
        }}
      >
        {/* 한강 물결 효과 - 오염도에 따라 색상 변화 */}
        <motion.div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, 
                transparent 0%, 
                rgba(255,255,255,${0.1 + (gameState.virusesReachedBottom / gameState.maxVirusesAllowed) * 0.1}) 25%, 
                rgba(255,255,255,${0.2 + (gameState.virusesReachedBottom / gameState.maxVirusesAllowed) * 0.2}) 50%, 
                rgba(255,255,255,${0.1 + (gameState.virusesReachedBottom / gameState.maxVirusesAllowed) * 0.1}) 75%, 
                transparent 100%
              )
            `,
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* 한강 반사 효과 - 오염도에 따라 색상 변화 */}
        <motion.div
          className="absolute top-0 w-full h-full"
          style={{
            backgroundColor: getRiverColor(gameState.virusesReachedBottom, gameState.maxVirusesAllowed),
            opacity: 0.2 + (gameState.virusesReachedBottom / gameState.maxVirusesAllowed) * 0.3,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* 국회의사당 배경 (한강 위에 배치) - 숨김 처리 */}
      <div className="absolute w-full flex items-end justify-center hidden" style={{ 
        bottom: `${Math.min(224, screenSize.height * 0.3)}px`, 
        height: `${Math.min(160, screenSize.height * 0.2)}px` 
      }}>
        {/* 국회의사당 건물 (실제 모습 형상화) */}
        <motion.div
          className="relative"
          style={{
            filter: `brightness(${Math.max(0.5, 1 - gameState.virusesReachedBottom * 0.1)})`,
            transform: `translateY(${gameState.virusesReachedBottom * 2}px) rotate(${gameState.virusesReachedBottom * 0.5}deg)`,
            opacity: 0.9, // 더 선명하게 보이도록 조정
          }}
        >
          {/* 국회의사당 이미지 - 다시 시도 */}
          <img 
            src="/images/pillar1.png" 
            alt="국회의사당" 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            style={{ 
              width: 'auto',
              height: 'auto',
              maxWidth: '384px',
              maxHeight: '208px',
              minWidth: '200px',
              minHeight: '100px',
              objectFit: 'contain',
              border: '2px solid #654321',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              backgroundColor: '#8B4513'
            }}
            onLoad={() => console.log('국회의사당 이미지 로드 성공')}
            onError={(e) => {
              console.error('국회의사당 이미지 로드 실패:', e);
              // 이미지 로드 실패 시 대체 텍스트 표시
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.innerHTML = '🏛️ 국회의사당';
              fallback.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 384px;
                height: 208px;
                background: linear-gradient(45deg, #8B4513, #A0522D, #CD853F);
                border: 3px solid #654321;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
                z-index: 50;
              `;
              target.parentNode?.appendChild(fallback);
            }}
          />
          
        </motion.div>
      </div>

      {/* 바이러스들 (최상위 레이어) */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {gameState.viruses.map((virus) => (
          <Virus
            key={virus.id}
            virus={virus}
            onTouch={handleVirusTouch}
            screenHeight={screenSize.height}
            isMagnetAnimating={gameState.isMagnetAnimating}
            isTransparent={gameState.transparentViruses.includes(virus.id)}
          />
        ))}
      </div>

      {/* 게임 오버 오버레이 */}
      {gameState.isGameOver && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-[100]"
          style={{
            backgroundImage: 'url(/images/background2.PNG)',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-black bg-opacity-75 rounded-lg p-8 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">게임 오버!</h2>
            <p className="text-xl mb-2">최종 점수: {gameState.score.toLocaleString()}</p>
            <p className="text-lg mb-2">도달한 라운드: {gameState.round}</p>
            <p className="text-lg mb-2">바이러스 도달: {gameState.virusesReachedBottom}/5</p>
            <p className="text-sm mb-4 text-gray-300">국회의사당이 무너졌습니다...</p>
            <button
              className="px-6 py-3 bg-virus-green text-black font-bold rounded-lg hover:bg-opacity-80 transition-colors"
              onClick={onResetGame}
            >
              다시 시작
            </button>
          </div>
        </motion.div>
      )}

      {/* 라운드 완료 오버레이 */}
      {gameState.isRoundComplete && !gameState.isGameOver && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center text-white">
            <motion.h2 
              className="text-4xl font-bold mb-4 text-virus-green"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              라운드 {gameState.round} 완료! 🎉
            </motion.h2>
            
            <motion.div
              className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-6 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xl mb-2">{gameState.virusesToSpawn}개 바이러스 생성 완료!</p>
              <p className="text-lg mb-2">현재 점수: <span className="text-virus-green font-bold">{gameState.score.toLocaleString()}</span></p>
              <p className="text-lg mb-2">최대 콤보: <span className="text-virus-blue font-bold">{gameState.combo}</span></p>
              <p className="text-sm text-gray-300">다음 라운드에서는 바이러스가 더 빨라집니다!</p>
            </motion.div>

            <motion.button
              className="bg-virus-green text-black font-bold text-xl px-8 py-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105"
              onClick={() => onGameAction({ type: 'START_NEXT_ROUND' })}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              라운드 {gameState.round + 1} 시작 🚀
            </motion.button>

            <motion.p
              className="text-sm text-gray-400 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              준비되면 버튼을 눌러주세요!
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* 일시정지 오버레이 */}
      {gameState.isPaused && !gameState.isGameOver && !gameState.isRoundComplete && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">일시정지</h2>
            <button
              className="px-6 py-3 bg-virus-blue text-white font-bold rounded-lg hover:bg-opacity-80 transition-colors"
              onClick={() => onGameAction({ type: 'RESUME_GAME' })}
            >
              계속하기
            </button>
          </div>
        </motion.div>
      )}

      {/* 선택된 바이러스 합계 표시 - 화면 아래 */}
      {gameState.selectedViruses.length > 0 && (
        <motion.div
          className="absolute left-0 right-0 z-40 bg-black bg-opacity-70 backdrop-blur-sm p-2"
          style={{ 
            bottom: '0px', // 실제 사용 가능한 영역의 하단에 고정
            paddingBottom: '8px'
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
        >
          <div className="text-white text-sm mb-2 text-center">선택된 바이러스</div>
          <div className="flex items-center justify-center gap-2 mb-2">
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
          <div className="text-xs text-gray-300 text-center">
            합계가 10 또는 20이 되면 바이러스가 제거됩니다!
          </div>
        </motion.div>
      )}

      {/* 방해바이러스 화면 가리기 오버레이 */}
      {gameState.isDisturbed && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            width: '100vw',
            height: '100vh',
            left: 0,
            top: 0,
            backgroundColor: 'black', // 배경을 검은색으로 설정
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="relative w-full h-full"
            style={{
              width: '100vw',
              height: '100vh',
            }}
          >
            <Image
              src="/images/penalty1.PNG"
              alt="방해바이러스 효과"
              fill
              className="object-cover"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              priority
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GameBoard;
