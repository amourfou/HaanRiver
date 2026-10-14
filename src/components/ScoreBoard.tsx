'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRankings } from '@/lib/supabaseUserUtils';
import { User } from '@/types/game';
import { playClickSound } from '@/lib/soundUtils';

interface ScoreData {
  rank: number;
  name: string;
  organization: string;
  score: number;
  date: string;
  userId?: string;
}

interface OrganizationRanking {
  rank: number;
  organization: string;
  name: string;
  score: number;
  date: string;
}

interface ScoreBoardProps {
  onClose: () => void;
  currentUser: User | null;
}

export default function ScoreBoard({ onClose, currentUser }: ScoreBoardProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'personal' | 'organization' | 'overall'>('weekly');
  const [weeklyScores, setWeeklyScores] = useState<ScoreData[]>([]);
  const [personalScores, setPersonalScores] = useState<ScoreData[]>([]);
  const [organizationScores, setOrganizationScores] = useState<OrganizationRanking[]>([]);
  const [overallScores, setOverallScores] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 날짜 형식을 YY.MM.DD로 변환하는 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // 마지막 2자리
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

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
      const rows = await fetchRankings('weekly');
      setWeeklyScores(rows.map((r, index) => ({ rank: index + 1, name: r.name, organization: r.organization, score: r.score, date: formatDate(r.playedAt) })));
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
      const rows = await fetchRankings('personal');
      setPersonalScores(rows.map((r, index) => ({ rank: index + 1, name: r.name, organization: r.organization, score: r.score, date: formatDate(r.playedAt) })));
    } catch (err) {
      setError('개인 점수를 불러오는데 실패했습니다.');
      console.error('Personal scores fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 소속별 최고점수 순위 조회
  const fetchOrganizationScores = async () => {
    try {
      setLoading(true);
      const rows = await fetchRankings('organization');
      setOrganizationScores(rows.map((r, index) => ({ rank: index + 1, organization: r.organization, name: r.name, score: r.score, date: formatDate(r.playedAt) })));
    } catch (err) {
      setError('소속 점수를 불러오는데 실패했습니다.');
      console.error('Organization scores fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 전체 점수 조회
  const fetchOverallScores = async () => {
    try {
      setLoading(true);
      const rows = await fetchRankings('overall');
      setOverallScores(rows.map((r, index) => ({ rank: index + 1, name: r.name, organization: r.organization, score: r.score, date: formatDate(r.playedAt) })));
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
      case 'organization':
        fetchOrganizationScores();
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
            <th className="text-center py-2 px-3 text-gray-300">순위</th>
            {showOrganization && <th className="text-left py-2 px-3 text-gray-300">이름</th>}
            {showOrganization && <th className="text-left py-2 px-3 text-gray-300">소속</th>}
            <th className="text-right py-2 px-3 text-gray-300">점수</th>
            <th className="text-center py-2 px-3 text-gray-300">날짜</th>
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
              <td className="py-3 px-3 text-center text-virus-green font-bold">
                {score.rank <= 3 ? (
                  <span className="text-yellow-400">
                    {score.rank === 1 ? '🥇' : score.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  score.rank
                )}
              </td>
              {showOrganization && (
                <td className="py-3 px-3 text-left text-white">
                  {score.name}
                  {score.userId === currentUser?.id && (
                    <span className="ml-2 text-virus-green">(나)</span>
                  )}
                </td>
              )}
              {showOrganization && (
                <td className="py-3 px-3 text-left text-gray-300">{score.organization}</td>
              )}
              <td className="py-3 px-3 text-right text-virus-green font-bold">
                {score.score.toLocaleString()}
              </td>
              <td className="py-3 px-3 text-center text-gray-400">{score.date}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 소속 순위 테이블 렌더링
  const renderOrganizationTable = (scores: OrganizationRanking[]) => (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-center py-2 px-2 text-gray-300 whitespace-nowrap" style={{width: '15%'}}>순위</th>
            <th className="text-left py-2 px-2 text-gray-300" style={{width: '25%'}}>소속</th>
            <th className="text-left py-2 px-2 text-gray-300" style={{width: '20%'}}>이름</th>
            <th className="text-right py-2 px-2 text-gray-300" style={{width: '20%'}}>점수</th>
            <th className="text-center py-2 px-2 text-gray-300" style={{width: '20%'}}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <motion.tr
              key={`${score.rank}-${index}`}
              className={`border-b border-gray-700 hover:bg-gray-800 transition-colors ${
                score.organization === currentUser?.organization ? 'bg-virus-green bg-opacity-20' : ''
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="py-2 px-2 text-center text-virus-green font-bold">
                {score.rank <= 3 ? (
                  <span className="text-yellow-400">
                    {score.rank === 1 ? '🥇' : score.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  score.rank
                )}
              </td>
              <td className={`py-2 px-2 text-left truncate ${
                score.organization === currentUser?.organization 
                  ? 'text-virus-green font-bold' 
                  : 'text-gray-300'
              }`} title={score.organization}>
                {score.organization}
              </td>
              <td className={`py-2 px-2 text-left truncate ${
                score.organization === currentUser?.organization 
                  ? 'text-virus-green font-bold' 
                  : 'text-white'
              }`} title={score.name}>
                {score.name}
              </td>
              <td className="py-2 px-2 text-right text-virus-green font-bold">
                {score.score.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center text-gray-400">{score.date}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const tabs = [
    { id: 'weekly', label: '주간', icon: '📅' },
    { id: 'personal', label: '나', icon: '👤' },
    { id: 'organization', label: '소속', icon: '🏢' },
    { id: 'overall', label: '전체', icon: '🏆' }
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
            <h2 className="text-2xl font-bold text-white">🏆 순위</h2>
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
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
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id);
              }}
              className={`flex-1 py-3 px-2 text-center transition-colors text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-virus-green text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-sm mr-1">{tab.icon}</span>
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
                      📅 이번 주 순위
                    </div>
                    <div className="text-gray-400 text-sm">
                      {formatDate(getWeekStart().toISOString())} ~ {formatDate(new Date().toISOString())}
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

              {activeTab === 'organization' && (
                <motion.div
                  key="organization"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4 text-center">
                    <div className="text-virus-green font-bold text-lg mb-2">
                      🏢 소속 순위
                    </div>
                    <div className="text-gray-400 text-sm">
                      각 소속의 최고점수로 순위 결정
                    </div>
                  </div>
                  {organizationScores.length > 0 ? (
                    renderOrganizationTable(organizationScores)
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
