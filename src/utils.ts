import type { DailyMission, GameState, TestQuestion, Question } from './types';
import { LEVELS } from './constants';

export const getToday = () => new Date().toISOString().split('T')[0];

export const getLevel = (xp: number) => {
  const current = [...LEVELS].reverse().find(l => xp >= l.minXp);
  return current || LEVELS[0];
};

export const getNextLevel = (xp: number) => {
  const idx = LEVELS.findIndex(l => xp < l.minXp);
  return idx >= 0 ? LEVELS[idx] : null;
};

export const getLevelProgress = (xp: number) => {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const xpInLevel = xp - current.minXp;
  const xpNeeded = next.minXp - current.minXp;
  return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
};

export const generateDailyMission = (dateStr: string): DailyMission => {
  const seed = dateStr.split('-').reduce((acc, v) => acc + parseInt(v), 0);
  const types: DailyMission['type'][] = ['acertar_tabuada', 'sessao_estudo', 'teste_perfeito', 'estudar_tempo'];
  const type = types[seed % types.length];
  const tableNum = (seed % 10) + 1;

  switch (type) {
    case 'acertar_tabuada':
      return { date: dateStr, type, description: `Acerte 5 questões da tabuada do ${tableNum}`, target: 5, progress: 0, completed: false, param: tableNum };
    case 'sessao_estudo':
      return { date: dateStr, type, description: 'Complete 1 sessão de estudo com 3+ tabuadas', target: 1, progress: 0, completed: false };
    case 'teste_perfeito':
      return { date: dateStr, type, description: 'Faça um teste perfeito (10/10)', target: 1, progress: 0, completed: false };
    case 'estudar_tempo':
      return { date: dateStr, type, description: 'Estude por pelo menos 5 minutos', target: 300, progress: 0, completed: false };
  }
};

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const generateTestQuestions = (tables: number[], count: number): TestQuestion[] => {
  const allPossible: Question[] = [];
  tables.forEach(t => {
    for (let m = 1; m <= 10; m++) {
      allPossible.push({ table: t, multiplier: m, answer: t * m });
    }
  });
  const selected = allPossible.sort(() => Math.random() - 0.5).slice(0, count);
  return selected.map(q => {
    const options = new Set<number>([q.answer]);
    while (options.size < 4) {
      const wrongT = tables[Math.floor(Math.random() * tables.length)];
      const wrongM = Math.floor(Math.random() * 10) + 1;
      options.add(wrongT * wrongM);
    }
    return { ...q, options: Array.from(options).sort(() => Math.random() - 0.5) };
  });
};

export const generateStudyQuestions = (tables: number[], random: boolean): Question[] => {
  let q: Question[] = [];
  tables.forEach(t => {
    for (let i = 1; i <= 10; i++) {
      q.push({ table: t, multiplier: i, answer: t * i });
    }
  });
  if (random) q = q.sort(() => Math.random() - 0.5);
  return q;
};

export const getStreakAfterActivity = (prev: GameState): { streak: number; todayActive: boolean; lastActiveDate: string } => {
  const today = getToday();
  let newStreak = prev.streak;
  let todayActive = prev.todayActive;

  if (!prev.todayActive) {
    if (prev.lastActiveDate !== today) {
      const lastDate = new Date(prev.lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = prev.lastActiveDate ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      newStreak = diffDays === 1 ? prev.streak + 1 : 1;
    } else {
      newStreak = Math.max(1, prev.streak);
    }
    todayActive = true;
  }

  return { streak: newStreak, todayActive, lastActiveDate: today };
};
