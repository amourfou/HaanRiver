'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from '@/types/game';

interface SuperiorWelcomeProps {
  user: User;
  onConfirm: () => void;
}

export default function SuperiorWelcome({ user, onConfirm }: SuperiorWelcomeProps) {
  const superiorGreetings = [
    "자네였군! 어서 오게. 기다리고 있었네.",
    "아, 이 분이시군요! 다시 돌아오셨네요!",
    "어? 이 이름은 이미 우리 부대에 계신 분이네요!",
    "아, 이 분이시군요! 다시 한번 임무를 수행하시는군요!"
  ];

  const randomGreeting = superiorGreetings[Math.floor(Math.random() * superiorGreetings.length)];

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
      >
        {/* 헤더 */}
        <div className="bg-yellow-500 text-black px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-center">🎖️ 상관의 환영</h2>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <motion.div
            className="text-center mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* 상관 캐릭터 */}
            <div className="mb-4">
              <div className="text-6xl mb-2">🎖️</div>
              <div className="text-yellow-400 font-bold text-lg">상관</div>
            </div>
            
            {/* 상관의 말 */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4 border-l-4 border-yellow-500">
              <div className="text-white text-lg font-bold mb-2">
                "{randomGreeting}"
              </div>
              <div className="text-gray-300 text-sm mb-2">
                "지금 상황이 좋질 않네. 어서 전장으로 가게!"
              </div>
            </div>

            {/* 사용자 정보 */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="text-yellow-400 text-lg font-bold mb-2">
                👤 {user.name}님
              </div>
              <div className="text-gray-300 text-sm mb-2">
                소속: {user.organization}
              </div>
              <div className="text-yellow-400 font-bold">
                최고 점수: {user.highScore.toLocaleString()}점
              </div>
            </div>

            <div className="text-gray-300 text-sm mb-6">
              다시 한번 임무를 수행하시겠습니까?
            </div>
          </motion.div>

          {/* 확인 버튼 */}
          <motion.button
            onClick={onConfirm}
            className="w-full bg-yellow-500 text-black font-bold py-4 px-6 rounded-lg hover:bg-yellow-400 transition-colors text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🎖️ 네, 상관님! 바로 출동하겠습니다!
          </motion.button>

          {/* 추가 멘트 */}
          <motion.div
            className="mt-4 text-center text-gray-400 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-gray-800 rounded p-2">
              <div className="text-yellow-400 font-bold mb-1">🎖️ 상관의 마지막 당부</div>
              <div className="text-xs">
                "이번엔 더 높은 점수로 승리하시길 바랍니다!<br/>
                한강을 지키는 임무를 성공적으로 완수하세요!"
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
