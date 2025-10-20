'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Virus as VirusType } from '@/types/game';

interface VirusProps {
  virus: VirusType;
  onTouch: (virusId: string) => void;
  screenHeight: number;
}

const Virus: React.FC<VirusProps> = ({ virus, onTouch, screenHeight }) => {
  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTouch(virus.id);
  };

  return (
    <motion.div
      className="absolute flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg cursor-pointer select-none pointer-events-auto"
      style={{
        left: virus.x,
        top: virus.y, // 원래 위치 그대로 사용
        backgroundColor: virus.color,
        boxShadow: virus.isSelected 
          ? `0 0 20px ${virus.color}, 0 0 40px ${virus.color}` 
          : `0 4px 8px rgba(0,0,0,0.3)`,
        border: virus.isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
        transform: virus.isSelected ? 'scale(1.1)' : 'scale(1)',
        zIndex: virus.isSelected ? 10 : 1,
      }}
      onClick={handleTouch}
      onTouchEnd={handleTouch}
      whileHover={{
        scale: 1.05,
      }}
      whileTap={{
        scale: 0.95,
      }}
    >
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
      
      {/* 바이러스 효과 */}
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
