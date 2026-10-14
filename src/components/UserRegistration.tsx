'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { playClickSound } from '@/lib/soundUtils';
import { PinPad } from '@/components/PinPad';
import { getLastName, type LoginOutcome } from '@/lib/supabaseUserUtils';

interface UserRegistrationProps {
  /** Name + 6-digit PIN login. New accounts are created by a parent/admin. */
  onLogin: (name: string, pin: string) => Promise<LoginOutcome>;
  onCancel?: () => void;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({ onLogin, onCancel }) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'name' | 'pin'>('name');
  const [message, setMessage] = useState('');
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const last = getLastName();
    if (last) {
      setName(last);
      setStep('pin');
    }
  }, []);

  const onPin = useCallback(
    async (pin: string) => {
      setBusy(true);
      setMessage('');
      const r = await onLogin(name, pin);
      setBusy(false);
      if (r.ok) return;
      setResetKey((k) => k + 1);
      setShake(true);
      setTimeout(() => setShake(false), 450);
      if (r.code === 'locked' || r.code === 'rate_limited') {
        setLocked(true);
        setMessage('조금 쉬었다가 다시 해요. 잘 모르겠으면 엄마·아빠에게 물어봐요 🙂');
      } else if (r.code === 'no_pin') {
        setLocked(true);
        setMessage('아직 비밀 숫자가 없어요. 엄마·아빠에게 받아 와요 🙂');
      } else if (r.code === 'wrong') {
        setMessage('앗, 다시 해 볼까? 🙂');
      } else if (r.code === 'network') {
        setMessage('인터넷이 잠깐 안 돼요. 다시 눌러 볼까?');
      } else {
        setMessage('잠깐 문제가 생겼어요. 조금 뒤에 다시 해 봐요.');
      }
    },
    [name, onLogin]
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        backgroundImage: 'url(/images/background3.PNG)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm mx-4 text-white">
        <h1 className="text-center text-3xl font-bold mb-2 text-virus-green">🚨 긴급 소집 🚨</h1>

        {step === 'name' && (
          <form
            className="space-y-5 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              playClickSound();
              setMessage('');
              setLocked(false);
              setStep('pin');
            }}
          >
            <p className="text-center text-xl">이름이 뭐예요?</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
              autoComplete="username"
              className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-2xl text-2xl text-white placeholder-gray-400 focus:outline-none focus:border-virus-green"
              placeholder="이름"
              autoFocus
            />
            <div className="flex gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onCancel();
                  }}
                  className="flex-1 bg-gray-600 text-white font-bold text-xl py-4 rounded-2xl"
                >
                  취소
                </button>
              )}
              <button type="submit" disabled={!name.trim()} className="flex-1 bg-virus-green text-black font-bold text-xl py-4 rounded-2xl disabled:opacity-40">
                다음 ➜
              </button>
            </div>
          </form>
        )}

        {step === 'pin' && (
          <div className="mt-2">
            <p className="text-center text-2xl font-bold">{name} 대원 👋</p>
            <p className="text-center text-lg text-gray-200 mb-5 mt-1">비밀 숫자 6개를 눌러요</p>
            <PinPad length={6} onComplete={onPin} disabled={busy || locked} resetKey={resetKey} shake={shake} />
            {message && (
              <p className={`mt-4 rounded-2xl px-4 py-3 text-center text-lg ${locked ? 'bg-amber-500/20 text-amber-100' : 'bg-rose-500/20 text-rose-100'}`}>{message}</p>
            )}
            {locked && (
              <button type="button" className="mt-2 w-full py-3 text-base text-sky-300 underline" onClick={() => setLocked(false)}>
                다시 해 보기
              </button>
            )}
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                className="flex-1 py-3 text-base text-gray-300 underline"
                onClick={() => {
                  setStep('name');
                  setMessage('');
                  setLocked(false);
                }}
              >
                내 이름이 아니에요
              </button>
              {onCancel && (
                <button type="button" className="flex-1 py-3 text-base text-gray-300 underline" onClick={onCancel}>
                  취소
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserRegistration;
