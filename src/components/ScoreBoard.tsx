'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/game';

interface ScoreData {
  rank: number;
  name: string;
  organization: string;
  score: number;
  date: string;
  userId?: string;
}

interface ScoreBoardProps {
  onClose: () => void;
  currentUser: User | null;
}

export default function ScoreBoard({ onClose, currentUser }: ScoreBoardProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'personal' | 'overall'>('weekly');
  const [weeklyScores, setWeeklyScores] = useState<ScoreData[]>([]);
  const [personalScores, setPersonalScores] = useState<ScoreData[]>([]);
  const [overallScores, setOverallScores] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주간 시작일 계산 (매주 월요일)
  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // 주간 점수 조회
  const fetchWeeklyScores = async () => {
    try {
      setLoading(true);
      const weekStart = getWeekStart();
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          score,
          played_at,
          users!inner(name, organization)
        `)
        .gte('played_at', weekStart.toISOString())
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;

      const scores: ScoreData[] = data?.map((item: any, index) => ({
        rank: index + 1,
        name: item.users.name,
        organization: item.users.organization,
        score: item.score,
        date: new Date(item.played_at).toLocaleDateString('ko-KR')
      })) || [];

      setWeeklyScores(scores);
    } catch (err) {
      setError('주간 점수를 불러오는데 실패했습니다.');
      console.error('Weekly scores fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 개인 점수 조회
  const fetchPersonalScores = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select('score, played_at')
        .eq('user_id', currentUser.id)
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;

      const scores: ScoreData[] = data?.map((item, index) => ({
        rank: index + 1,
        name: currentUser.name,
        organization: currentUser.organization,
        score: item.score,
        date: new Date(item.played_at).toLocaleDateString('ko-KR'),
        userId: currentUser.id
      })) || [];

      setPersonalScores(scores);
    } catch (err) {
      setError('개인 점수를 불러오는데 실패했습니다.');
      console.error('Personal scores fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 전체 점수 조회
  const fetchOverallScores = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          score,
          played_at,
          users!inner(name, organization)
        `)
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;

      const scores: ScoreData[] = data?.map((item: any, index) => ({
        rank: index + 1,
        name: item.users.name,
        organization: item.users.organization,
        score: item.score,
        date: new Date(item.played_at).toLocaleDateString('ko-KR')
      })) || [];

      setOverallScores(scores);
    } catch (err) {
      setError('전체 점수를 불러오는데 실패했습니다.');
      console.error('Overall scores fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    setError(null);
    switch (activeTab) {
      case 'weekly':
        fetchWeeklyScores();
        break;
      case 'personal':
        fetchPersonalScores();
        break;
      case 'overall':
        fetchOverallScores();
        break;
    }
  }, [activeTab, currentUser]);

  const renderScoreTable = (scores: ScoreData[], showOrganization: boolean = true) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left py-2 px-3 text-gray-300">순위</th>
            {showOrganization && <th className="text-left py-2 px-3 text-gray-300">이름</th>}
            {showOrganization && <th className="text-left py-2 px-3 text-gray-300">소속</th>}
            <th className="text-left py-2 px-3 text-gray-300">점수</th>
            <th className="text-left py-2 px-3 text-gray-300">날짜</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <motion.tr
              key={`${score.rank}-${index}`}
              className={`border-b border-gray-700 hover:bg-gray-800 transition-colors ${
                score.userId === currentUser?.id ? 'bg-virus-green bg-opacity-20' : ''
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="py-3 px-3 text-virus-green font-bold">
                {score.rank <= 3 ? (
                  <span className="text-yellow-400">
                    {score.rank === 1 ? '🥇' : score.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  score.rank
                )}
              </td>
              {showOrganization && (
                <td className="py-3 px-3 text-white">
                  {score.name}
                  {score.userId === currentUser?.id && (
                    <span className="ml-2 text-virus-green">(나)</span>
                  )}
                </td>
              )}
              {showOrganization && (
                <td className="py-3 px-3 text-gray-300">{score.organization}</td>
              )}
              <td className="py-3 px-3 text-virus-green font-bold">
                {score.score.toLocaleString()}
              </td>
              <td className="py-3 px-3 text-gray-400">{score.date}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const tabs = [
    { id: 'weekly', label: '주간점수', icon: '📅' },
    { id: 'personal', label: '내 점수', icon: '👤' },
    { id: 'overall', label: '전체점수', icon: '🏆' }
  ] as const;

  return (
    <motion.div
      className="fixed inset-0 bg-gray-900 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="h-full w-full flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* 헤더 */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">🏆 점수보기</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-700 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-6 text-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-virus-green text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-lg mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-virus-green text-lg">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-lg mb-2">❌</div>
              <div className="text-gray-300">{error}</div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'weekly' && (
                <motion.div
                  key="weekly"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4 text-center">
                    <div className="text-virus-green font-bold text-lg mb-2">
                      📅 이번 주 순위 (월요일 리셋)
                    </div>
                    <div className="text-gray-400 text-sm">
                      {getWeekStart().toLocaleDateString('ko-KR')} ~ {new Date().toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  {weeklyScores.length > 0 ? (
                    renderScoreTable(weeklyScores)
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      이번 주 아직 기록이 없습니다
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'personal' && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4 text-center">
                    <div className="text-virus-green font-bold text-lg mb-2">
                      👤 내 최고 기록
                    </div>
                    <div className="text-gray-400 text-sm">
                      {currentUser?.name}님의 개인 기록
                    </div>
                  </div>
                  {personalScores.length > 0 ? (
                    renderScoreTable(personalScores, false)
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      아직 기록이 없습니다
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'overall' && (
                <motion.div
                  key="overall"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4 text-center">
                    <div className="text-virus-green font-bold text-lg mb-2">
                      🏆 전체 순위
                    </div>
                    <div className="text-gray-400 text-sm">
                      모든 플레이어의 최고 기록
                    </div>
                  </div>
                  {overallScores.length > 0 ? (
                    renderScoreTable(overallScores)
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      아직 기록이 없습니다
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
