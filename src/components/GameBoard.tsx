'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Virus from './Virus';
import { GameState, Virus as VirusType } from '@/types/game';
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
  canMakeValidSum
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

  // gameState ref 업데이트
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 화면 크기 설정
  useEffect(() => {
    const updateScreenSize = () => {
      const gameBoardElement = gameBoardRef.current;
      const gameBoardHeight = gameBoardElement?.clientHeight || window.innerHeight;
      
      setScreenSize({
        width: window.innerWidth,
        height: gameBoardHeight, // 실제 게임 보드 높이 사용
      });
      console.log(`화면 크기 업데이트: window.innerHeight=${window.innerHeight}, gameBoardHeight=${gameBoardHeight}`);
    };

    // DOM이 렌더링된 후에 높이 측정
    const timer = setTimeout(updateScreenSize, 100);
    window.addEventListener('resize', updateScreenSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScreenSize);
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

  // 게임 루프
  useEffect(() => {
    if (gameState.isPaused || gameState.isGameOver || screenSize.height === 0) {
      return;
    }

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const currentViruses = gameStateRef.current.viruses;

      // 바이러스 위치 업데이트
      const updatedViruses = updateVirusPositions(currentViruses, deltaTime);
      
      
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

    if (gameState.isPaused || gameState.isGameOver || screenSize.height === 0) {
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

        // 50개에 도달했지만 10이나 20을 만들 수 없으면 추가 생성
        if (currentVirusesSpawned >= currentVirusesToSpawn) {
          if (!canMakeValidSum(currentState.viruses)) {
            console.log('50개 제한 초과하지만 10이나 20을 만들 수 없어서 추가 생성');
          } else {
            console.log('라운드 완료: 50개 바이러스 생성 완료');
            clearInterval(spawnIntervalRef.current!);
            return;
          }
        }

        // 바이러스 1개씩 연속적으로 생성
        const newVirus = createVirus(
          `virus-${virusIdCounterRef.current++}`,
          getRandomX(screenSize.width),
          getVirusSpeed(currentState.round)
        );

        let adjustedVirus = adjustVirusPosition(
          newVirus, 
          currentState.viruses, 
          screenSize.width
        );

        console.log(`바이러스 생성: ${adjustedVirus.id}, 숫자: ${adjustedVirus.number}, x: ${adjustedVirus.x.toFixed(1)}`);

        onGameActionRef.current({
          type: 'ADD_VIRUS',
          payload: { virus: adjustedVirus }
        });

        // 바이러스 추가 후 10이나 20을 만들 수 있는지 확인
        setTimeout(() => {
          const updatedViruses = [...currentState.viruses, adjustedVirus];
          if (!canMakeValidSum(updatedViruses) && updatedViruses.length >= 3) {
            console.log('추가 바이러스 생성: 10이나 20을 만들 수 없음');
            
            // 추가 바이러스 생성
            const additionalVirus = createVirus(
              `virus-${virusIdCounterRef.current++}`,
              getRandomX(screenSize.width),
              getVirusSpeed(currentState.round)
            );

            const adjustedAdditionalVirus = adjustVirusPosition(
              additionalVirus, 
              updatedViruses, 
              screenSize.width
            );

            console.log(`추가 바이러스 생성: ${adjustedAdditionalVirus.id}, 숫자: ${adjustedAdditionalVirus.number}, x: ${adjustedAdditionalVirus.x.toFixed(1)}`);

            onGameActionRef.current({
              type: 'ADD_VIRUS',
              payload: { virus: adjustedAdditionalVirus }
            });
          }
        }, 100); // 100ms 후에 확인
      }, 1000); // 1초마다 고정
    };

    startSpawning();

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [gameState.isPaused, gameState.isGameOver, screenSize.width, screenSize.height]);

  // 라운드 완료 체크 (모든 바이러스 제거 시 다음 라운드)
  useEffect(() => {
    if (gameState.virusesSpawned >= gameState.virusesToSpawn && 
        gameState.viruses.length === 0 && 
        !gameState.isGameOver && 
        !gameState.isPaused) {
      console.log('라운드 완료: 모든 바이러스 제거됨, 다음 라운드로 이동');
      onGameActionRef.current({ type: 'NEXT_ROUND' });
    }
  }, [gameState.virusesSpawned, gameState.virusesToSpawn, gameState.viruses.length, gameState.isGameOver, gameState.isPaused]);

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
      className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-space-dark to-han-river"
      style={{ 
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(0, 136, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
          linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #4a90e2 100%)
        `
      }}
    >

      {/* 한강 배경 */}
      <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-han-river to-transparent">
        {/* 한강 물결 효과 */}
        <motion.div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, 
                transparent 0%, 
                rgba(255,255,255,0.1) 25%, 
                rgba(255,255,255,0.2) 50%, 
                rgba(255,255,255,0.1) 75%, 
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
        
        {/* 한강 반사 효과 */}
        <motion.div
          className="absolute top-0 w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(180deg, 
                rgba(74, 144, 226, 0.3) 0%, 
                rgba(74, 144, 226, 0.1) 50%, 
                transparent 100%
              )
            `,
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

      {/* 국회의사당 배경 (한강 너머 멀리서 보이는 형태) */}
      <div className="absolute bottom-48 w-full h-40 flex items-end justify-center">
        {/* 국회의사당 건물 (실제 모습 형상화) */}
        <motion.div
          className="relative"
          style={{
            filter: `brightness(${Math.max(0.3, 1 - gameState.virusesReachedBottom * 0.15)})`,
            transform: `translateY(${gameState.virusesReachedBottom * 2}px) rotate(${gameState.virusesReachedBottom * 0.5}deg)`,
            opacity: 0.7, // 멀리서 보이는 효과
          }}
        >
          {/* 국회의사당 이미지 */}
          <img src="/images/pillar1.png" alt="국회의사당" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-52 z-50" />
          
          {/* 태극기 */}
          <motion.div
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-white border border-gray-300 shadow-lg"
            animate={{
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* 태극 문양 */}
            <div className="absolute top-0 left-0 w-3 h-2 bg-red-500 rounded-tl-full rounded-bl-full"></div>
            <div className="absolute bottom-0 right-0 w-3 h-2 bg-blue-500 rounded-tr-full rounded-br-full"></div>
            {/* 건곤 팔괘 */}
            <div className="absolute top-0 right-0 w-1 h-0.5 bg-black"></div>
            <div className="absolute top-0.5 right-0 w-1 h-0.5 bg-black"></div>
            <div className="absolute top-1 right-0 w-1 h-0.5 bg-black"></div>
            <div className="absolute bottom-0 left-0 w-1 h-0.5 bg-black"></div>
            <div className="absolute bottom-0.5 left-0 w-1 h-0.5 bg-black"></div>
            <div className="absolute bottom-1 left-0 w-1 h-0.5 bg-black"></div>
          </motion.div>
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
          />
        ))}
      </div>

      {/* 게임 오버 오버레이 */}
      {gameState.isGameOver && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center text-white">
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
      {gameState.virusesSpawned >= gameState.virusesToSpawn && gameState.viruses.length === 0 && !gameState.isGameOver && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4 text-virus-green">라운드 {gameState.round} 완료!</h2>
            <p className="text-xl mb-4">모든 바이러스를 제거했습니다!</p>
            <p className="text-lg mb-4">다음 라운드로 진행합니다...</p>
            <motion.div
              className="w-16 h-16 border-4 border-virus-green border-t-transparent rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}

      {/* 일시정지 오버레이 */}
      {gameState.isPaused && !gameState.isGameOver && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
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
    </div>
  );
};

export default GameBoard;
