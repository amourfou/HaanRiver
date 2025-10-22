'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { playClickSound } from '@/lib/soundUtils';

interface UserRegistrationProps {
  onRegister: (name: string, organization: string) => void;
  onCancel?: () => void;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({ onRegister, onCancel }) => {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && organization.trim()) {
      playClickSound();
      onRegister(name.trim(), organization.trim());
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        backgroundImage: 'url(/images/background3.PNG)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-8 max-w-md mx-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div
          className="text-center text-white mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-4 text-virus-green">
            🚨 긴급 소집 🚨
          </h1>
          <p className="text-lg mb-2">
            자네는 바이러스 제거를 위해 특별히 임명되었네, 제군.
          </p>
          <p className="text-sm text-gray-300">
            소속과 이름을 밝히게.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <label className="block text-white text-sm font-bold mb-2">
              소속
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              maxLength={15}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-virus-green focus:ring-1 focus:ring-virus-green"
              placeholder="예: 국방부, NASA, 특수부대... (최대 15글자)"
              required
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {organization.length}/15 글자
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <label className="block text-white text-sm font-bold mb-2">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-virus-green focus:ring-1 focus:ring-virus-green"
              placeholder="예: 김한강, 이방어... (최대 10글자)"
              required
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {name.length}/10 글자
            </div>
          </motion.div>

          <div className="flex gap-3">
            {onCancel && (
              <motion.button
                type="button"
                onClick={() => {
                  playClickSound();
                  onCancel();
                }}
                className="flex-1 bg-gray-600 text-white font-bold text-lg py-4 rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                취소
              </motion.button>
            )}
            <motion.button
              type="submit"
              className="flex-1 bg-virus-green text-black font-bold text-lg py-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              임무 수락 🚀
            </motion.button>
          </div>
        </form>

        <motion.div
          className="mt-6 text-center text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p>한강을 지키는 것은 당신의 사명입니다.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default UserRegistration;
