'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Virus as VirusType } from '@/types/game';

interface VirusProps {
  virus: VirusType;
  onTouch: (virusId: string) => void;
  screenHeight: number;
  isMagnetAnimating?: boolean;
  isTransparent?: boolean;
}

const Virus: React.FC<VirusProps> = ({ virus, onTouch, screenHeight, isMagnetAnimating = false, isTransparent = false }) => {
  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 투명화된 바이러스는 터치 불가
    if (isTransparent) {
      console.log('👻 투명화된 바이러스는 터치할 수 없습니다');
      return;
    }
    
    onTouch(virus.id);
  };

  // 슈퍼바이러스 설정 가져오기
  const getSuperVirusConfig = (type: string) => {
    const configs: Record<string, any> = {
      turbo: { icon: '🚀', name: '터보' },
      bomb: { icon: '💣', name: '폭탄' },
      freeze: { icon: '❄️', name: '얼음' },
      magnet: { icon: '🧲', name: '자석' },
      ghost: { icon: '👻', name: '유령' },
      split: { icon: '🔀', name: '분열' },
      time: { icon: '⏰', name: '시간' },
      heal: { icon: '💚', name: '치료' },
      clear: { icon: '✨', name: '클리어' },
      disturb: { icon: '🚫', name: '방해' }
    };
    return configs[type] || { icon: '?', name: '알 수 없음' };
  };

  const superVirusConfig = virus.isSuperVirus ? getSuperVirusConfig(virus.superVirusType || '') : null;

  return (
    <motion.div
      className="absolute flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg cursor-pointer select-none pointer-events-auto"
      style={{
        left: virus.x,
        top: virus.y,
        backgroundColor: virus.color,
        boxShadow: virus.isSelected 
          ? `0 0 20px ${virus.color}, 0 0 40px ${virus.color}` 
          : virus.isSuperVirus
          ? `0 0 15px ${virus.color}, 0 0 30px ${virus.color}`
          : `0 4px 8px rgba(0,0,0,0.3)`,
        border: virus.isSelected 
          ? '3px solid white' 
          : virus.isSuperVirus 
          ? '3px solid #ffd700' 
          : '2px solid rgba(255,255,255,0.3)',
        transform: virus.isSelected ? 'scale(1.1)' : virus.isSuperVirus ? 'scale(1.05)' : 'scale(1)',
        zIndex: virus.isSelected ? 10 : virus.isSuperVirus ? 5 : 1,
        opacity: isTransparent ? 0.1 : (virus.superVirusType === 'ghost' ? 0.3 : 1),
      }}
      onClick={handleTouch}
      onTouchEnd={handleTouch}
      whileHover={{
        scale: virus.isSuperVirus ? 1.1 : 1.05,
      }}
      whileTap={{
        scale: 0.95,
      }}
      animate={{
        // 자석 애니메이션 효과 (시각적 효과만)
        ...(isMagnetAnimating && {
          scale: [1, 1.1, 1],     // 크기 변화
          rotate: [0, 5, -5, 0],  // 회전 효과
        }),
      }}
      transition={{
        duration: isMagnetAnimating ? 1.0 : 0,
        ease: isMagnetAnimating ? "easeInOut" : "easeInOut",
      }}
    >
      {/* 슈퍼바이러스 아이콘 */}
      {virus.isSuperVirus && superVirusConfig && (
        <div className="absolute -top-2 -right-2 text-xs bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold">
          {superVirusConfig.icon}
        </div>
      )}
      
      <span 
        className="drop-shadow-lg font-black"
        style={{
          color: virus.number <= 3 ? '#000000' : '#ffffff',
          textShadow: virus.number <= 3 
            ? '1px 1px 2px rgba(255,255,255,0.8)' 
            : '1px 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        {virus.number}
      </span>
      
      {/* 일반 바이러스 효과 */}
      {!virus.isSuperVirus && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${virus.color}40 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
       {/* 투명화된 바이러스 유령 효과 */}
       {isTransparent && (
         <motion.div
           className="absolute inset-0 rounded-full"
           style={{
             background: `radial-gradient(circle, #dda0dd30 0%, transparent 70%)`,
             width: '150%',
             height: '150%',
             left: '-25%',
             top: '-25%',
           }}
           animate={{
             scale: [1, 1.2, 1],
             opacity: [0.2, 0.5, 0.2],
           }}
           transition={{
             duration: 1,
             repeat: Infinity,
             ease: "easeInOut",
           }}
         />
       )}

       {/* 슈퍼바이러스 특별 효과 */}
       {virus.isSuperVirus && (
        <>
          {/* 터보 효과 */}
          {virus.superVirusType === 'turbo' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, #ffd700 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.8, 0.4, 0.8],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          
           {/* 유령 효과 */}
           {virus.superVirusType === 'ghost' && (
             <motion.div
               className="absolute inset-0 rounded-full"
               style={{
                 background: `radial-gradient(circle, #dda0dd20 0%, transparent 70%)`,
               }}
               animate={{
                 scale: [1, 1.3, 1],
                 opacity: [0.1, 0.4, 0.1],
               }}
               transition={{
                 duration: 1.5,
                 repeat: Infinity,
                 ease: "easeInOut",
               }}
             />
           )}
          
          {/* 자석 효과 */}
          {virus.superVirusType === 'magnet' && (
            <>
              {/* 자석 자기장 효과 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, #8b451340 0%, transparent 70%)`,
                  width: '200%',
                  height: '200%',
                  left: '-50%',
                  top: '-50%',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* 자석 자기장 라인 */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-yellow-400"
                style={{
                  width: '150%',
                  height: '150%',
                  left: '-25%',
                  top: '-25%',
                }}
                animate={{
                  rotate: [0, 360],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </>
          )}
          
          {/* 클리어 효과 */}
          {virus.superVirusType === 'clear' && (
            <>
              {/* 클리어 빛 효과 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, #ffffff 0%, transparent 70%)`,
                  width: '250%',
                  height: '250%',
                  left: '-75%',
                  top: '-75%',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* 클리어 별빛 효과 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, #ffffff, #ffff00, #ffffff, #ffff00, #ffffff)`,
                  width: '200%',
                  height: '200%',
                  left: '-50%',
                  top: '-50%',
                  opacity: 0.6,
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </>
          )}
          
          {/* 폭탄 효과 */}
          {virus.superVirusType === 'bomb' && (
            <>
              {/* 폭탄 내부 효과 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, #ff4500 0%, transparent 70%)`,
                  width: '150%',
                  height: '150%',
                  left: '-25%',
                  top: '-25%',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* 폭탄 외부 폭발 효과 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, #ff0000 0%, #ff4500 30%, transparent 70%)`,
                  width: '200%',
                  height: '200%',
                  left: '-50%',
                  top: '-50%',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          )}
          
          {/* 얼음 효과 */}
          {virus.superVirusType === 'freeze' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, #00bfff 0%, transparent 70%)`,
                width: '180%',
                height: '180%',
                left: '-40%',
                top: '-40%',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          {/* 치료 효과 */}
          {virus.superVirusType === 'heal' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, #32cd32 0%, transparent 70%)`,
                width: '160%',
                height: '160%',
                left: '-30%',
                top: '-30%',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          {/* 시간 효과 */}
          {virus.superVirusType === 'time' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, #9370db, #ffffff, #9370db, #ffffff)`,
                width: '200%',
                height: '200%',
                left: '-50%',
                top: '-50%',
                opacity: 0.4,
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
          
          {/* 분열 효과 */}
          {virus.superVirusType === 'split' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, #ff69b4 0%, transparent 70%)`,
                width: '140%',
                height: '140%',
                left: '-20%',
                top: '-20%',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          {/* 방해바이러스 효과 */}
          {virus.superVirusType === 'disturb' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, #ff0000 0%, transparent 70%)`,
                width: '130%',
                height: '130%',
                left: '-15%',
                top: '-15%',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          {/* 터보 바이러스 효과 */}
          {virus.superVirusType === 'turbo' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, #ffd700 0%, transparent 70%)`,
                width: '120%',
                height: '120%',
                left: '-10%',
                top: '-10%',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </>
      )}
      
      {/* 선택된 바이러스 강조 효과 */}
      {virus.isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
};

export default Virus;
