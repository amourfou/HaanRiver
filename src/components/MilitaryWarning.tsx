'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { playClickSound } from '@/lib/soundUtils';

interface MilitaryWarningProps {
  onClose: () => void;
  duplicateName: string;
}

const MilitaryWarning: React.FC<MilitaryWarningProps> = ({ onClose, duplicateName }) => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-[100]"
      style={{
        backgroundImage: 'url(/images/background3.PNG)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-red-900 bg-opacity-95 backdrop-blur-sm rounded-lg p-8 max-w-lg mx-4 border-4 border-red-600"
        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
      >
        {/* 경고 헤더 */}
        <motion.div
          className="text-center text-white mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-4xl font-bold mb-2 text-red-400">
            잠깐, 잠깐! 🛑
          </h1>
          <div className="text-2xl font-bold text-yellow-400">
            🎖️ 신분 확인 중... 🎖️
          </div>
        </motion.div>

        {/* 경고 메시지 */}
        <motion.div
          className="text-center text-white mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="bg-red-800 bg-opacity-80 rounded-lg p-4 mb-4">
            <p className="text-lg font-bold text-red-200 mb-2">
              어? "{duplicateName}"... 이미 있는 이름이지 않은가? 🤔
            </p>
            <p className="text-sm text-red-300">
              뭔가 이상한데... 🤨
            </p>
          </div>
          
          <div className="bg-yellow-900 bg-opacity-80 rounded-lg p-4 mb-4">
            <p className="text-base font-bold text-yellow-200 mb-2">
              🎖️ 신분위조는 엄청난 범죄로써 군법에 따라 처벌할 수 있네!
            </p>
            <p className="text-sm text-yellow-300">
              신중하게 입력해주게. 다른 이름을 쓰거나 기존 계정에 로그인하시게! 💪
            </p>
          </div>
        </motion.div>

        {/* 버튼 */}
        <motion.div
          className="flex justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <motion.button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="bg-red-600 text-white font-bold text-xl py-4 px-8 rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 border-2 border-red-400"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            🎖️ 다시 입력하겠습니다!
          </motion.button>
        </motion.div>

        {/* 하단 경고 */}
        <motion.div
          className="mt-6 text-center text-xs text-red-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p className="font-bold">🎖️ 이 시스템은 보안이 강화되어 있네! 🎖️</p>
          <p>모든 접근 시도가 기록되고 있으니 조심하시게! 👀</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MilitaryWarning;
