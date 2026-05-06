import type { LevelConfig, ThemeConfig } from './types';

export const LEVELS: LevelConfig[] = [
  { level: 1, name: 'Iniciante', minXp: 0 },
  { level: 2, name: 'Aprendiz', minXp: 200 },
  { level: 3, name: 'Estudante', minXp: 500 },
  { level: 4, name: 'Intermediário', minXp: 1000 },
  { level: 5, name: 'Habilidoso', minXp: 1800 },
  { level: 6, name: 'Avançado', minXp: 3000 },
  { level: 7, name: 'Mestre', minXp: 5000 },
  { level: 8, name: 'Gênio', minXp: 8000 },
];

export const THEMES: ThemeConfig[] = [
  { name: 'rosa', label: 'Rosa', color: '#8b5cf6', requiredLevel: 1 },
  { name: 'azul', label: 'Azul', color: '#3b82f6', requiredLevel: 1 },
  { name: 'espacial', label: '🌌 Espacial', color: '#6366f1', requiredLevel: 5 },
  { name: 'neon', label: '⚡ Neon', color: '#00ff88', requiredLevel: 7 },
];

export const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const TEST_QUESTION_COUNT = 10;
export const NOTEBOOK_MINUTES = 10;
export const STUDY_INACTIVITY_LIMIT = 30;
export const XP_PER_CORRECT = 10;
export const XP_PER_STUDY_CARD = 5;
export const XP_BONUS_SINGLE = 50;
export const XP_BONUS_MULTI = 80;
export const XP_MISSION = 100;
