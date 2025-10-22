'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypingDialogProps {
  text: string;
  onComplete: () => void;
}

export default function TypingDialog({ text, onComplete }: TypingDialogProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50); // 50ms마다 한 글자씩

    return () => clearInterval(typingInterval);
  }, [text]);

  const handleClick = () => {
    console.log('🎖️ TypingDialog 클릭됨, isTyping:', isTyping);
    if (isTyping) {
      // 타이핑 중이면 즉시 완료
      setDisplayedText(text);
      setIsTyping(false);
    } else {
      // 타이핑 완료 후 클릭하면 다음으로
      console.log('🎖️ onComplete 호출됨');
      onComplete();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg mx-4 border-2 border-yellow-500"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", duration: 0.6 }}
        onClick={handleClick}
      >
        {/* 상관 캐릭터 */}
        <div className="bg-yellow-500 text-black px-6 py-4 rounded-t-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🎖️</div>
            <div className="font-bold text-lg">상관</div>
          </div>
        </div>

        {/* 대화 내용 */}
        <div className="p-6">
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="text-white text-lg leading-relaxed">
              "{displayedText}"
              {isTyping && <span className="animate-pulse">|</span>}
            </div>
          </div>

          {/* 클릭 안내 */}
          <div className="mt-4 text-center text-gray-400 text-sm">
            {isTyping ? '클릭하여 건너뛰기' : '클릭하여 계속'}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
