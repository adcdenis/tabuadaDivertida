export type Screen = 'onboarding' | 'welcome' | 'home' | 'study-config' | 'study' | 'test-config' | 'test' | 'test-result' | 'stats';
export type ThemeName = 'rosa' | 'azul' | 'espacial' | 'neon';

export interface Question {
  table: number;
  multiplier: number;
  answer: number;
}

export interface TestQuestion extends Question {
  options: number[];
}

export interface TestResult {
  date: string;
  score: number;
  total: number;
  tables: number[];
  errors: { question: string; expected: number; selected: number }[];
  timeSeconds?: number;
}

export interface StudyResult {
  date: string;
  tables: number[];
  timeSeconds: number;
  totalCards: number;
  type: 'Sequencial' | 'Aleatória';
}

export interface DailyMission {
  date: string;
  type: 'acertar_tabuada' | 'sessao_estudo' | 'teste_perfeito' | 'estudar_tempo';
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  param?: number;
}

export interface GameState {
  xp: number;
  streak: number;
  lastActiveDate: string;
  dailyMission: DailyMission | null;
  todayActive: boolean;
}

export interface Achievements {
  trophies: number[];
  stars: number;
  notebooks: number;
  totalStudyTime: number;
}

export type CelebrationType = 'trophy' | 'star' | 'study' | 'rank' | 'study-complete' | 'levelup' | 'mission';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  color: string;
  requiredLevel: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  minXp: number;
}
