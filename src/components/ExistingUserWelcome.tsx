'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from '@/types/game';

interface ExistingUserWelcomeProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExistingUserWelcome({ user, onConfirm, onCancel }: ExistingUserWelcomeProps) {
  const militaryGreetings = [
    "🎖️ 어라? 이 이름은 이미 등록되어 있네요!",
    "🎖️ 아, 이 분이시군요! 다시 돌아오셨네요!",
    "🎖️ 어? 이 이름은 이미 우리 부대에 계신 분이네요!",
    "🎖️ 아, 이 분이시군요! 다시 한번 임무를 수행하시는군요!"
  ];

  const randomGreeting = militaryGreetings[Math.floor(Math.random() * militaryGreetings.length)];

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 border-2 border-virus-green"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* 헤더 */}
        <div className="bg-virus-green text-black px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-center">🎖️ 기존 부대원 확인</h2>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <motion.div
            className="text-center mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-virus-green text-lg font-bold mb-4">
              {randomGreeting}
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="text-white text-lg font-bold mb-2">
                👤 {user.name}님
              </div>
              <div className="text-gray-300 text-sm mb-2">
                소속: {user.organization}
              </div>
              <div className="text-virus-green font-bold">
                최고 점수: {user.highScore.toLocaleString()}점
              </div>
            </div>

            <div className="text-gray-300 text-sm mb-6">
              이 계정으로 다시 임무를 수행하시겠습니까?
            </div>
          </motion.div>

          {/* 버튼들 */}
          <div className="flex gap-3">
            <motion.button
              onClick={onCancel}
              className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🚪 다른 이름으로 등록
            </motion.button>
            
            <motion.button
              onClick={onConfirm}
              className="flex-1 bg-virus-green text-black font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🎖️ 네, 다시 임무 수행!
            </motion.button>
          </div>

          {/* 군대식 멘트 */}
          <motion.div
            className="mt-4 text-center text-gray-400 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-gray-800 rounded p-2">
              <div className="text-virus-green font-bold mb-1">🎖️ 부대장의 말씀</div>
              <div className="text-xs">
                "다시 돌아와주셔서 감사합니다!<br/>
                이번엔 더 높은 점수로 승리하시길 바랍니다!<br/>
                한강을 지키는 임무를 성공적으로 완수하세요!"
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
