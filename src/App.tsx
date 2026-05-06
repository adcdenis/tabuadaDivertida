import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BookOpen, BarChart3, ArrowLeft, Check, Trophy, Star, NotebookPen, HelpCircle, X, Notebook, User, ChevronRight, RefreshCw, AlertCircle, Lock, Target, Flame, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import packageJson from '../package.json';

type Screen = 'onboarding' | 'welcome' | 'home' | 'study-config' | 'study' | 'test-config' | 'test' | 'test-result' | 'stats';
type ThemeName = 'rosa' | 'azul' | 'espacial' | 'neon';

interface Question {
  table: number;
  multiplier: number;
  answer: number;
}

interface TestQuestion extends Question {
  options: number[];
}

interface TestResult {
  date: string;
  score: number;
  total: number;
  tables: number[];
  errors: { question: string; expected: number; selected: number }[];
  timeSeconds?: number;
}

interface StudyResult {
  date: string;
  tables: number[];
  timeSeconds: number;
  totalCards: number;
  type: 'Sequencial' | 'Aleatória';
}

interface DailyMission {
  date: string; // YYYY-MM-DD
  type: 'acertar_tabuada' | 'sessao_estudo' | 'teste_perfeito' | 'estudar_tempo';
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  param?: number; // tabuada específica, etc.
}

interface GameState {
  xp: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyMission: DailyMission | null;
  todayActive: boolean; // já fez atividade hoje
}

const LEVELS = [
  { level: 1, name: 'Iniciante', minXp: 0 },
  { level: 2, name: 'Aprendiz', minXp: 200 },
  { level: 3, name: 'Estudante', minXp: 500 },
  { level: 4, name: 'Intermediário', minXp: 1000 },
  { level: 5, name: 'Habilidoso', minXp: 1800 },
  { level: 6, name: 'Avançado', minXp: 3000 },
  { level: 7, name: 'Mestre', minXp: 5000 },
  { level: 8, name: 'Gênio', minXp: 8000 },
];

const THEMES: { name: ThemeName; label: string; color: string; requiredLevel: number }[] = [
  { name: 'rosa', label: 'Rosa', color: '#8b5cf6', requiredLevel: 1 },
  { name: 'azul', label: 'Azul', color: '#3b82f6', requiredLevel: 1 },
  { name: 'espacial', label: '🌌 Espacial', color: '#6366f1', requiredLevel: 5 },
  { name: 'neon', label: '⚡ Neon', color: '#00ff88', requiredLevel: 7 },
];

const getToday = () => new Date().toISOString().split('T')[0];

const getLevel = (xp: number) => {
  const current = [...LEVELS].reverse().find(l => xp >= l.minXp);
  return current || LEVELS[0];
};

const getNextLevel = (xp: number) => {
  const idx = LEVELS.findIndex(l => xp < l.minXp);
  return idx >= 0 ? LEVELS[idx] : null;
};

const getLevelProgress = (xp: number) => {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const xpInLevel = xp - current.minXp;
  const xpNeeded = next.minXp - current.minXp;
  return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
};

const generateDailyMission = (dateStr: string): DailyMission => {
  // Use date as seed for deterministic mission
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

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [studyTables, setStudyTables] = useState<number[]>([]);
  const [studyRandom, setStudyRandom] = useState(false);
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [testTables, setTestTables] = useState<number[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [testErrors, setTestErrors] = useState<TestResult['errors']>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [studyElapsedTime, setStudyElapsedTime] = useState(0);
  const [studyHistory, setStudyHistory] = useState<StudyResult[]>([]);
  const [statsTab, setStatsTab] = useState<'tests' | 'studies'>('tests');
  const studyInactivityRef = useRef(0);
  const [isStudyPaused, setIsStudyPaused] = useState(false);
  const [userName, setUserName] = useState('');
  const [tempName, setTempName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [theme, setTheme] = useState<ThemeName>('rosa');
  const [achievements, setAchievements] = useState({
    trophies: [] as number[],
    stars: 0,
    notebooks: 0,
    totalStudyTime: 0
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [achievementHint, setAchievementHint] = useState<'star' | 'notebook' | null>(null);
  type CelebrationType = 'trophy' | 'star' | 'study' | 'rank' | 'study-complete' | 'levelup' | 'mission';
  const [celebration, setCelebration] = useState<CelebrationType | null>(null);
  const [celebrationQueue, setCelebrationQueue] = useState<{ type: CelebrationType; confetti?: () => void }[]>([]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [xpPopup, setXpPopup] = useState<number | null>(null);
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    xp: 0,
    streak: 0,
    lastActiveDate: '',
    dailyMission: null,
    todayActive: false,
  });

  const triggerCelebration = (type: CelebrationType, confettiAction?: () => void) => {
    setCelebrationQueue(prev => [...prev, { type, confettiAction }]);
  };

  useEffect(() => {
    if (celebrationQueue.length > 0 && !celebration) {
      const next = celebrationQueue[0];
      setCelebration(next.type);
      if (next.confetti) next.confetti();
      
      setCelebrationQueue(prev => prev.slice(1));
      
      setTimeout(() => {
        setCelebration(null);
      }, 3500);
    }
  }, [celebrationQueue, celebration]);


  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentScreen === 'test' && selectedAnswer === null) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (currentScreen === 'study') {
      interval = setInterval(() => {
        if (studyInactivityRef.current < 30) {
          setStudyElapsedTime(prev => prev + 1);
          studyInactivityRef.current += 1;
        } else {
          setIsStudyPaused(true);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentScreen, selectedAnswer]);

  useEffect(() => {
    const savedName = localStorage.getItem('tabuada_user_name');
    const savedTheme = localStorage.getItem('tabuada_theme') as ThemeName | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.className = '';
      if (savedTheme !== 'rosa') document.body.classList.add(`theme-${savedTheme}`);
    }

    if (savedName) {
      setUserName(savedName);
    } else {
      setCurrentScreen('onboarding');
    }

    const saved = localStorage.getItem('tabuada_history');
    if (saved) setHistory(JSON.parse(saved));
    const savedStudies = localStorage.getItem('tabuada_study_history');
    if (savedStudies) setStudyHistory(JSON.parse(savedStudies));

    const savedAchievements = localStorage.getItem('tabuada_achievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }

    // Load game state
    const savedGameState = localStorage.getItem('tabuada_game_state');
    if (savedGameState) {
      const gs: GameState = JSON.parse(savedGameState);
      const today = getToday();
      
      // Streak logic
      if (gs.lastActiveDate === today) {
        // Same day, keep everything
        setGameState(gs);
      } else {
        const lastDate = new Date(gs.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const newStreak = diffDays === 1 && gs.todayActive ? gs.streak : (diffDays > 1 ? 0 : gs.streak);
        const newMission = generateDailyMission(today);
        
        const updatedGs: GameState = {
          ...gs,
          streak: newStreak,
          dailyMission: newMission,
          todayActive: false,
        };
        setGameState(updatedGs);
        localStorage.setItem('tabuada_game_state', JSON.stringify(updatedGs));
      }
    } else {
      // First time: create game state with today's mission
      const today = getToday();
      const initialGs: GameState = {
        xp: 0,
        streak: 0,
        lastActiveDate: today,
        dailyMission: generateDailyMission(today),
        todayActive: false,
      };
      setGameState(initialGs);
      localStorage.setItem('tabuada_game_state', JSON.stringify(initialGs));
    }
  }, []);

  const BackgroundSymbols = useMemo(() => {
    const symbols = ['+', '-', '×', '÷', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '=', '?', '%', 'π'];
    return (
      <div className="bg-symbols">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="symbol"
            style={{ 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              fontSize: `${1 + Math.random() * 2}rem`,
              opacity: 0.3 + Math.random() * 0.5
            }}
          >
            {symbols[Math.floor(Math.random() * symbols.length)]}
          </div>
        ))}
      </div>
    );
  }, []);

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1.02, y: -10 },
    transition: { duration: 0.3, ease: 'easeOut' }
  };

  // --- XP & Level Functions ---
  const addXP = (amount: number) => {
    // Show XP popup
    setXpPopup(amount);
    setTimeout(() => setXpPopup(null), 1200);

    setGameState(prev => {
      const oldXp = prev.xp;
      const newXp = oldXp + amount;
      const oldLevel = getLevel(oldXp);
      const newLevel = getLevel(newXp);

      // Mark today as active & update streak
      const today = getToday();
      let newStreak = prev.streak;
      if (!prev.todayActive) {
        if (prev.lastActiveDate !== today) {
          const lastDate = new Date(prev.lastActiveDate);
          const todayDate = new Date(today);
          const diffDays = prev.lastActiveDate ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          newStreak = diffDays === 1 ? prev.streak + 1 : 1;
        } else {
          newStreak = Math.max(1, prev.streak);
        }
      }

      const updatedGs: GameState = {
        ...prev,
        xp: newXp,
        streak: newStreak,
        lastActiveDate: today,
        todayActive: true,
      };

      // Level up celebration
      if (newLevel.level > oldLevel.level) {
        setTimeout(() => {
          triggerCelebration('levelup', () => {
            confetti({
              particleCount: 200,
              spread: 160,
              origin: { y: 0.5 },
              colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
            });
          });
        }, 300);
      }

      localStorage.setItem('tabuada_game_state', JSON.stringify(updatedGs));
      return updatedGs;
    });
  };

  const updateMissionProgress = (type: DailyMission['type'], amount: number, param?: number) => {
    setGameState(prev => {
      const mission = prev.dailyMission;
      if (!mission || mission.completed || mission.type !== type) return prev;
      if (type === 'acertar_tabuada' && param !== mission.param) return prev;

      const newProgress = Math.min(mission.target, mission.progress + amount);
      const completed = newProgress >= mission.target;

      const updatedMission: DailyMission = { ...mission, progress: newProgress, completed };
      const updatedGs: GameState = { ...prev, dailyMission: updatedMission };

      if (completed && !mission.completed) {
        setTimeout(() => {
          addXP(100);
          triggerCelebration('mission', () => {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'] });
          });
        }, 500);
      }

      localStorage.setItem('tabuada_game_state', JSON.stringify(updatedGs));
      return updatedGs;
    });
  };

  const handleResetConfirm = () => {
    if (resetInput === 'root') {
      localStorage.clear();
      setUserName('');
      setHistory([]);
      setStudyHistory([]);
      setAchievements({ trophies: [], stars: 0, notebooks: 0, totalStudyTime: 0 });
      setTheme('rosa');
      document.body.className = '';
      const today = getToday();
      setGameState({
        xp: 0, streak: 0, lastActiveDate: today,
        dailyMission: generateDailyMission(today), todayActive: false,
      });
      setCurrentScreen('onboarding');
      setShowResetPrompt(false);
      setResetInput('');
    } else {
      alert('Senha incorreta!');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTheme = (newTheme: ThemeName) => {
    const currentLevel = getLevel(gameState.xp).level;
    const themeConfig = THEMES.find(t => t.name === newTheme);
    if (!themeConfig || currentLevel < themeConfig.requiredLevel) return;

    setTheme(newTheme);
    localStorage.setItem('tabuada_theme', newTheme);
    document.body.className = '';
    if (newTheme !== 'rosa') document.body.classList.add(`theme-${newTheme}`);
    setShowThemeSelector(false);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('tabuada_user_name', tempName.trim());
      setIsEditingName(false);
      setCurrentScreen('home');
    }
  };

  const saveResult = (result: TestResult) => {
    const newHistory = [result, ...history];
    setHistory(newHistory);
    localStorage.setItem('tabuada_history', JSON.stringify(newHistory));
  };

  const saveStudyResult = (cardsStudied: number, timeSpent: number) => {
    const result: StudyResult = {
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      tables: studyTables,
      timeSeconds: timeSpent,
      totalCards: cardsStudied,
      type: studyRandom ? 'Aleatória' : 'Sequencial'
    };
    const newHistory = [result, ...studyHistory];
    setStudyHistory(newHistory);
    localStorage.setItem('tabuada_study_history', JSON.stringify(newHistory));

    const newTotalTime = achievements.totalStudyTime + timeSpent;
    const newNotebooks = Math.min(10, Math.floor(newTotalTime / (10 * 60)));
    const updatedAchievements = { 
      ...achievements, 
      totalStudyTime: newTotalTime,
      notebooks: newNotebooks
    };

    setAchievements(updatedAchievements);
    localStorage.setItem('tabuada_achievements', JSON.stringify(updatedAchievements));

    // XP for study
    addXP(cardsStudied * 5);

    // Mission checks
    if (studyTables.length >= 3) {
      updateMissionProgress('sessao_estudo', 1);
    }
    updateMissionProgress('estudar_tempo', timeSpent);

    if (newNotebooks > achievements.notebooks) {
      triggerCelebration('study');
    } else {
      triggerCelebration('study-complete', () => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#8b5cf6', '#ffffff']
        });
      });
    }
  };

  const toggleStudyTable = (table: number) => {
    setStudyTables(prev => 
      prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
    );
  };

  const startStudy = () => {
    if (studyTables.length === 0) return;
    let q: Question[] = [];
    studyTables.forEach(t => {
      for (let i = 1; i <= 10; i++) {
        q.push({ table: t, multiplier: i, answer: t * i });
      }
    });
    if (studyRandom) q = q.sort(() => Math.random() - 0.5);
    setStudyQuestions(q);
    setStudyIndex(0);
    setStudyElapsedTime(0);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setCurrentScreen('study');
  };

  const nextStudyCard = () => {
    if (!isFlipped) return;
    setIsFlipped(false);
    setTimeout(() => {
      if (studyIndex < studyQuestions.length - 1) {
        setStudyIndex(studyIndex + 1);
      } else {
        saveStudyResult(studyIndex + 1, studyElapsedTime);
        setCurrentScreen('study-config');
      }
    }, 300);
  };

  const startTest = () => {
    if (testTables.length === 0) return;
    const allPossible: Question[] = [];
    testTables.forEach(t => {
      for (let m = 1; m <= 10; m++) {
        allPossible.push({ table: t, multiplier: m, answer: t * m });
      }
    });
    const selected = allPossible.sort(() => Math.random() - 0.5).slice(0, 10);
    const questions: TestQuestion[] = selected.map(q => {
      const options = new Set<number>([q.answer]);
      while (options.size < 4) {
        const wrongT = testTables[Math.floor(Math.random() * testTables.length)];
        const wrongM = Math.floor(Math.random() * 10) + 1;
        options.add(wrongT * wrongM);
      }
      return { ...q, options: Array.from(options).sort(() => Math.random() - 0.5) };
    });
    setTestQuestions(questions);
    setTestIndex(0);
    setTestScore(0);
    setTestErrors([]);
    setElapsedTime(0);
    setSelectedAnswer(null);
    setCurrentScreen('test');
  };

  const answerTest = (selected: number) => {
    if (selectedAnswer !== null) return;
    const currentQ = testQuestions[testIndex];
    const correct = selected === currentQ.answer;
    setSelectedAnswer(selected);
    if (correct) {
      setTestScore(s => s + 1);
      addXP(10);
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#10b981', '#ffffff']
      });
      // Mission: acertar_tabuada
      updateMissionProgress('acertar_tabuada', 1, currentQ.table);
    } else {
      setTestErrors(prev => [...prev, { question: `${currentQ.table} x ${currentQ.multiplier}`, expected: currentQ.answer, selected }]);
    }
    setTimeout(() => {
      if (testIndex < 9) {
        setTestIndex(testIndex + 1);
        setSelectedAnswer(null);
      } else {
        finishTest(correct ? testScore + 1 : testScore);
        setSelectedAnswer(null);
      }
    }, 1200);
  };

  const finishTest = (finalScore: number) => {
    const result: TestResult = {
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      score: finalScore,
      total: 10,
      tables: testTables,
      errors: testErrors,
      timeSeconds: elapsedTime
    };
    saveResult(result);

    // Adiciona o tempo do teste ao tempo total de prática
    const newTotalTime = achievements.totalStudyTime + elapsedTime;
    const newNotebooks = Math.min(10, Math.floor(newTotalTime / (10 * 60)));
    let updatedAchievements = { 
      ...achievements, 
      totalStudyTime: newTotalTime,
      notebooks: newNotebooks
    };

    if (finalScore === 10) {
      // Bonus XP for perfect score
      const bonusXP = testTables.length === 1 ? 50 : 80;
      addXP(bonusXP);

      // Mission: teste_perfeito
      updateMissionProgress('teste_perfeito', 1);

      if (testTables.length === 1) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff']
        });

        const table = testTables[0];
        if (!achievements.trophies.includes(table)) {
          updatedAchievements.trophies = [...achievements.trophies, table];
          triggerCelebration('trophy', () => {
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.6 },
              colors: ['#f59e0b', '#fbbf24', '#ffffff']
            });
          });
        }
      } else if (testTables.length > 1) {
        if (achievements.stars < 10) {
          updatedAchievements.stars += 1;
          triggerCelebration('star', () => {
            const duration = 2 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function() {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) return clearInterval(interval);
              const particleCount = 50 * (timeLeft / duration);
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
          });
        }
      }
    }

    setAchievements(updatedAchievements);
    localStorage.setItem('tabuada_achievements', JSON.stringify(updatedAchievements));
    
    setCurrentScreen('test-result');
  };

  const toggleTestTable = (table: number) => {
    setTestTables(prev => 
      prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
    );
  };

  const handleBack = () => {
    if (currentScreen === 'study') {
      saveStudyResult(studyIndex, studyElapsedTime);
    }
    setCurrentScreen('home');
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {BackgroundSymbols}
      <button className="theme-toggle" onClick={() => setShowThemeSelector(!showThemeSelector)}>
        <Zap size={20} />
      </button>

      {/* Theme Selector Dropdown */}
      {showThemeSelector && (
        <div style={{ position: 'absolute', top: '4.5rem', left: '1.5rem', zIndex: 200 }}>
          <div className="glass-panel animate-scale-in" style={{ padding: '0.8rem' }}>
            <div className="theme-grid">
              {THEMES.map(t => {
                const currentLevel = getLevel(gameState.xp).level;
                const locked = currentLevel < t.requiredLevel;
                return (
                  <div
                    key={t.name}
                    className={`theme-option ${theme === t.name ? 'active' : ''} ${locked ? 'locked' : ''}`}
                    onClick={() => !locked && toggleTheme(t.name)}
                  >
                    {locked && <Lock size={12} className="lock-icon" />}
                    <div className="theme-color-preview" style={{ background: t.color }} />
                    <span>{t.label}</span>
                    {locked && <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>Nível {t.requiredLevel}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* XP Popup */}
      {xpPopup !== null && (
        <div className="xp-popup">+{xpPopup} XP</div>
      )}

      <AnimatePresence mode="wait">
        {currentScreen === 'onboarding' && (
          <motion.div 
            key="onboarding"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel">
              <div className="flex-col flex-center">
                <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--primary)' }}>
                  <User size={48} color="white" />
                </div>
                <h2>Como podemos te chamar?</h2>
                <p>Para personalizar sua jornada na matemática!</p>
                <input 
                  className="input-field"
                  placeholder="Seu nome"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  maxLength={20}
                  style={{ textAlign: 'center', fontSize: '1.2rem' }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1.5rem', width: '100%' }} 
                  onClick={handleSaveName}
                  disabled={!tempName.trim()}
                >
                  Vamos lá! <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {currentScreen === 'home' && (
          <motion.div 
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel flex-col flex-center" style={{ flex: 1 }}>
              <img 
                src="/math-fun.svg" 
                alt="Ilustração de matemática" 
                style={{ width: '100%', maxWidth: '120px', marginBottom: '0.5rem' }}
              />
              {isEditingName ? (
                <div className="flex-row" style={{ width: '100%', maxWidth: '300px' }}>
                  <input 
                    className="input-field"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    autoFocus
                    onBlur={handleSaveName}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    maxLength={20}
                  />
                  <button className="btn btn-primary btn-icon" onClick={handleSaveName}>
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h1 
                    className="gradient-text" 
                    onClick={() => { setIsEditingName(true); setTempName(userName); }}
                    style={{ cursor: 'pointer', fontSize: '2rem', margin: 0 }}
                  >
                    Olá, {userName}!
                  </h1>
                  {gameState.streak > 0 && (
                    <div className={`streak-badge ${gameState.streak >= 7 ? 'hot' : ''}`}>
                      🔥 {gameState.streak}
                    </div>
                  )}
                </div>
              )}

              {/* XP Bar */}
              <div className="xp-bar-container" style={{ maxWidth: '300px', cursor: 'pointer' }} onClick={() => setShowLevelInfo(true)}>
                <div className="xp-bar-header">
                  <div className="xp-level-badge">
                    <Zap size={12} /> Nv. {getLevel(gameState.xp).level} — {getLevel(gameState.xp).name}
                  </div>
                  <span className="xp-text">
                    {gameState.xp}{getNextLevel(gameState.xp) ? ` / ${getNextLevel(gameState.xp)!.minXp}` : ''} XP
                  </span>
                </div>
                <div className="xp-bar">
                  <div className="xp-fill" style={{ width: `${getLevelProgress(gameState.xp)}%` }} />
                </div>
              </div>

              {/* Daily Mission */}
              {gameState.dailyMission && (
                <div className={`mission-card ${gameState.dailyMission.completed ? 'complete' : ''}`} style={{ maxWidth: '300px' }}>
                  <div className="mission-header">
                    <Target size={16} color={gameState.dailyMission.completed ? 'var(--success)' : 'var(--accent)'} />
                    <span className="mission-title">{gameState.dailyMission.completed ? '✅ Missão Completa!' : '🎯 Missão do Dia'}</span>
                  </div>
                  <p className="mission-desc">{gameState.dailyMission.description}</p>
                  {!gameState.dailyMission.completed && (
                    <div className="mission-progress-bar">
                      <div className="mission-progress-fill" style={{ width: `${Math.min(100, (gameState.dailyMission.progress / gameState.dailyMission.target) * 100)}%` }} />
                    </div>
                  )}
                  {!gameState.dailyMission.completed && gameState.dailyMission.type !== 'estudar_tempo' && (
                    <span style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.3rem', display: 'block' }}>
                      {gameState.dailyMission.progress}/{gameState.dailyMission.target}
                    </span>
                  )}
                  {!gameState.dailyMission.completed && gameState.dailyMission.type === 'estudar_tempo' && (
                    <span style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.3rem', display: 'block' }}>
                      {formatTime(gameState.dailyMission.progress)}/{formatTime(gameState.dailyMission.target)}
                    </span>
                  )}
                </div>
              )}

              <div className="flex-col" style={{ width: '100%', maxWidth: '300px', marginTop: '1rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => setCurrentScreen('study-config')}>
                  <BookOpen size={24} /> Estudar
                </button>
                <button className="btn btn-primary" onClick={() => setCurrentScreen('test-config')}>
                  <Play size={24} /> Teste
                </button>
              </div>
              
              {/* Achievement Panel */}
              <div className="glass-panel" style={{ width: '100%', padding: '1rem' }}>
                <div className="flex-row" style={{ marginBottom: '0.8rem' }}>
                  <div className="flex-row" style={{ gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--accent)' }}>CONQUISTAS</span>
                    <button onClick={() => setShowHelpModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <HelpCircle size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-col" style={{ gap: '0.3rem', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>TROFÉUS CONQUISTADOS</span>
                  <div className="flex-row" style={{ gap: '0.25rem', width: '100%' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => (
                      <div key={t} className="flex-col flex-center" style={{ flex: 1, padding: '0.3rem 0', background: achievements.trophies.includes(t) ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)', borderRadius: '0.4rem', opacity: achievements.trophies.includes(t) ? 1 : 0.2 }}>
                        <Trophy size={14} color={achievements.trophies.includes(t) ? "#f59e0b" : "#cbd5e1"} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '0.8rem' }}>
                  <div className="flex-row flex-center" style={{ gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => setAchievementHint('star')}>
                    <Star size={24} color="var(--primary)" fill={achievements.stars === 10 ? "var(--primary)" : "transparent"} />
                    <div className="flex-col" style={{ alignItems: 'flex-start', gap: '0' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>ESTRELA</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{achievements.stars}/10</span>
                    </div>
                  </div>
                  <div className="flex-row flex-center" style={{ gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => setAchievementHint('notebook')}>
                    <NotebookPen size={24} color="#ec4899" fill={achievements.notebooks === 10 ? "#ec4899" : "transparent"} />
                    <div className="flex-col" style={{ alignItems: 'flex-start', gap: '0' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>ESTUDO</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{achievements.notebooks}/10</span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setCurrentScreen('stats')} style={{ width: '100%', maxWidth: '300px' }}>
                <BarChart3 size={24} /> Estatísticas
              </button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'study-config' && (
          <motion.div 
            key="study-config"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel">
              <h2>Modo Estudo</h2>
              <div className="flex-col">
                <p>Escolha quais tabuadas estudar:</p>
                <div className="grid-cols-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button 
                      key={n}
                      className={`btn table-selector-btn ${studyTables.includes(n) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleStudyTable(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                
                <p style={{ marginTop: '1rem' }}>Ordem das perguntas:</p>
                <div className="grid-cols-2">
                  <button 
                    className={`btn ${!studyRandom ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStudyRandom(false)}
                  >
                    Sequencial
                  </button>
                  <button 
                    className={`btn ${studyRandom ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStudyRandom(true)}
                  >
                    Aleatória
                  </button>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '2rem' }} 
                  onClick={startStudy}
                  disabled={studyTables.length === 0}
                >
                  <Play size={20} /> Iniciar Estudo
                </button>

                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleBack}>
                  <ArrowLeft size={20} /> Voltar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {currentScreen === 'study' && studyQuestions.length > 0 && (
          <motion.div 
            key="study"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel flex-col flex-center" style={{ flex: 1, position: 'relative' }}>
              <div className="timer-badge">
                {formatTime(studyElapsedTime)}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((studyIndex) / studyQuestions.length) * 100}%` }} />
              </div>
              <p>Cartão {studyIndex + 1} de {studyQuestions.length}</p>

              <div 
                className={`study-card ${isFlipped ? 'flipped' : ''} ${isStudyPaused ? 'study-paused' : ''}`} 
                onClick={() => {
                  studyInactivityRef.current = 0;
                  setIsStudyPaused(false);
                  if (isStudyPaused) return;
                  if (!isFlipped) setIsFlipped(true);
                  else nextStudyCard();
                }} 
                style={{ marginTop: '2rem', marginBottom: '2rem', position: 'relative' }}
              >
                <div className="study-card-inner">
                  <div className="study-card-front">
                    {studyQuestions[studyIndex].table} x {studyQuestions[studyIndex].multiplier}
                  </div>
                  <div className="study-card-back">
                    {studyQuestions[studyIndex].answer}
                  </div>
                </div>
                {isStudyPaused && (
                  <div className="pause-overlay flex-center flex-col">
                    <Play size={48} color="white" />
                    <span style={{ fontWeight: 900, marginTop: '1rem' }}>PAUSADO POR INATIVIDADE</span>
                    <span style={{ fontSize: '0.8rem' }}>Toque para continuar</span>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                {isFlipped ? 'Toque no cartão para a próxima' : 'Toque no cartão para ver a resposta'}
              </p>

              <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={handleBack}>
                <ArrowLeft size={20} /> Sair do Estudo
              </button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'test-config' && (
          <motion.div 
            key="test-config"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel">
              <h2>Modo Teste</h2>
              <div className="flex-col">
                <p>Selecione as tabuadas para o teste:</p>
                <div className="grid-cols-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button 
                      key={n}
                      className={`btn table-selector-btn ${testTables.includes(n) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleTestTable(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '2rem' }} 
                  onClick={startTest}
                  disabled={testTables.length === 0}
                >
                  <Play size={20} /> Iniciar Teste (10 questões)
                </button>

                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleBack}>
                  <ArrowLeft size={20} /> Voltar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {currentScreen === 'test' && testQuestions.length > 0 && (
          <motion.div 
            key="test"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel flex-col flex-center" style={{ flex: 1, position: 'relative' }}>
              <div className="timer-badge">
                {formatTime(elapsedTime)}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((testIndex) / testQuestions.length) * 100}%` }} />
              </div>
              <p>Questão {testIndex + 1} de {testQuestions.length}</p>

              <div className="question-display" style={{ margin: '2rem 0', fontSize: '3rem', fontWeight: 900 }}>
                {testQuestions[testIndex].table} x {testQuestions[testIndex].multiplier} = ?
              </div>

              <div className="grid-cols-2" style={{ width: '100%', gap: '1rem' }}>
                {testQuestions[testIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    className={`btn ${
                      selectedAnswer === null 
                        ? 'btn-secondary' 
                        : option === testQuestions[testIndex].answer 
                          ? 'animate-correct' 
                          : option === selectedAnswer 
                            ? 'animate-dissolve' 
                            : 'btn-secondary'
                    }`}
                    onClick={() => answerTest(option)}
                    disabled={selectedAnswer !== null}
                    style={{ 
                      fontSize: '1.5rem', 
                      padding: '1.5rem 0',
                      opacity: (selectedAnswer !== null && option !== selectedAnswer && option !== testQuestions[testIndex].answer) ? 0.3 : 1
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={handleBack}>
                <ArrowLeft size={20} /> Sair do Teste
              </button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'test-result' && (
          <motion.div 
            key="test-result"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel flex-col flex-center">
              <h2>Resultado</h2>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: testScore >= 7 ? 'var(--success)' : testScore >= 5 ? 'var(--accent)' : 'var(--error)' }}>
                {testScore}/10
              </div>
              <p>{testScore >= 7 ? 'Excelente!' : testScore >= 5 ? 'Muito bem!' : 'Continue tentando!'}</p>
              <button className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => setCurrentScreen('home')}>
                <Check size={20} /> Concluir
              </button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'stats' && (
          <motion.div 
            key="stats"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="page-transition-wrapper"
          >
            <div className="glass-panel flex-col" style={{ gap: '0.8rem' }}>
              {/* Header */}
              <div className="flex-row" style={{ marginBottom: '0' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>📊 Estatísticas</h2>
                <button className="btn btn-secondary btn-icon" onClick={() => setShowResetPrompt(true)} style={{ padding: '0.4rem' }}>
                  <RefreshCw size={16} color="var(--error)" />
                </button>
              </div>

              {/* XP Profile Summary */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))', 
                borderRadius: '1rem', 
                padding: '0.8rem 1rem',
                border: '1px solid rgba(139, 92, 246, 0.15)'
              }}>
                <div className="flex-row" style={{ marginBottom: '0.4rem' }}>
                  <div className="xp-level-badge" style={{ fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => setShowLevelInfo(true)}>
                    <Zap size={11} /> Nv. {getLevel(gameState.xp).level} — {getLevel(gameState.xp).name}
                  </div>
                  <div className="flex-row" style={{ gap: '0.5rem' }}>
                    {gameState.streak > 0 && (
                      <span className={`streak-badge ${gameState.streak >= 7 ? 'hot' : ''}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                        🔥 {gameState.streak}
                      </span>
                    )}
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.7 }}>
                      {gameState.xp} XP total
                    </span>
                  </div>
                </div>
                <div className="xp-bar" style={{ height: '8px' }}>
                  <div className="xp-fill" style={{ width: `${getLevelProgress(gameState.xp)}%` }} />
                </div>
              </div>

              {/* Stats Grid — 2x2 with icons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
                  <div className="flex-row" style={{ gap: '0.3rem', marginBottom: '0.2rem', justifyContent: 'flex-start' }}>
                    <BookOpen size={13} color="var(--primary)" />
                    <span className="stat-label" style={{ marginBottom: 0 }}>TEMPO PRÁTICA</span>
                  </div>
                  <span className="stat-value" style={{ fontSize: '1.3rem' }}>{formatTime(achievements.totalStudyTime)}</span>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--secondary)' }}>
                  <div className="flex-row" style={{ gap: '0.3rem', marginBottom: '0.2rem', justifyContent: 'flex-start' }}>
                    <Play size={13} color="var(--secondary)" />
                    <span className="stat-label" style={{ marginBottom: 0 }}>SESSÕES</span>
                  </div>
                  <span className="stat-value" style={{ fontSize: '1.3rem' }}>{history.length + studyHistory.length}</span>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                  <div className="flex-row" style={{ gap: '0.3rem', marginBottom: '0.2rem', justifyContent: 'flex-start' }}>
                    <Trophy size={13} color="#f59e0b" />
                    <span className="stat-label" style={{ marginBottom: 0 }}>TROFÉUS</span>
                  </div>
                  <span className="stat-value" style={{ fontSize: '1.3rem' }}>{achievements.trophies.length}<span style={{ fontSize: '0.7rem', opacity: 0.5 }}>/10</span></span>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
                  <div className="flex-row" style={{ gap: '0.3rem', marginBottom: '0.2rem', justifyContent: 'flex-start' }}>
                    <Target size={13} color="var(--success)" />
                    <span className="stat-label" style={{ marginBottom: 0 }}>ACERTO MÉDIO</span>
                  </div>
                  <span className="stat-value" style={{ fontSize: '1.3rem' }}>
                    {history.length > 0 
                      ? Math.round((history.reduce((acc, h) => acc + h.score, 0) / (history.length * 10)) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>

              {/* Best Score & Worst Table */}
              {history.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '0.8rem', padding: '0.6rem 0.8rem', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6 }}>🏆 MELHOR NOTA</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--success)', margin: '0.2rem 0 0' }}>
                      {Math.max(...history.map(h => h.score))}/10
                    </p>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: '0.8rem', padding: '0.6rem 0.8rem', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6 }}>📊 TESTES FEITOS</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)', margin: '0.2rem 0 0' }}>
                      {history.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Buttons */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '0.8rem', padding: '0.2rem', gap: 0 }}>
                <button 
                  onClick={() => setStatsTab('tests')}
                  style={{ 
                    flex: 1, padding: '0.5rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                    background: statsTab === 'tests' ? 'var(--primary)' : 'transparent',
                    color: statsTab === 'tests' ? 'white' : 'rgba(255,255,255,0.6)',
                    fontWeight: 800, fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                  }}
                >
                  <Play size={13} /> Testes
                  {history.length > 0 && (
                    <span style={{ 
                      background: statsTab === 'tests' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', 
                      padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.65rem' 
                    }}>
                      {history.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setStatsTab('studies')}
                  style={{ 
                    flex: 1, padding: '0.5rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                    background: statsTab === 'studies' ? 'var(--primary)' : 'transparent',
                    color: statsTab === 'studies' ? 'white' : 'rgba(255,255,255,0.6)',
                    fontWeight: 800, fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                  }}
                >
                  <BookOpen size={13} /> Estudos
                  {studyHistory.length > 0 && (
                    <span style={{ 
                      background: statsTab === 'studies' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', 
                      padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.65rem' 
                    }}>
                      {studyHistory.length}
                    </span>
                  )}
                </button>
              </div>

              {/* History List */}
              <div className="flex-col" style={{ gap: '0.4rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                {statsTab === 'tests' ? (
                  history.length === 0 ? (
                    <div className="flex-col flex-center" style={{ padding: '2rem 1rem', opacity: 0.5, gap: '0.5rem' }}>
                      <Play size={32} />
                      <p style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 700 }}>Nenhum teste realizado ainda.</p>
                      <p style={{ textAlign: 'center', fontSize: '0.75rem' }}>Faça um teste para ver seu histórico aqui!</p>
                    </div>
                  ) :
                  history.slice().reverse().map((h, i) => (
                    <div key={i} className="history-item flex-row" style={{ gap: '0.5rem' }}>
                      <div style={{ width: '4px', borderRadius: '2px', alignSelf: 'stretch', background: h.score >= 7 ? 'var(--success)' : h.score >= 5 ? 'var(--accent)' : 'var(--error)' }} />
                      <div className="flex-col" style={{ gap: 0, alignItems: 'flex-start', flex: 1 }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{h.date}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Tabuadas: {h.tables.join(', ')}</span>
                        {h.timeSeconds !== undefined && (
                          <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>⏱️ {formatTime(h.timeSeconds)}</span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={`score-badge ${h.score >= 7 ? 'score-high' : h.score >= 5 ? 'score-med' : 'score-low'}`} style={{ fontSize: '0.8rem' }}>
                          {h.score}/10
                        </div>
                        <span style={{ fontSize: '0.55rem', opacity: 0.4, display: 'block', marginTop: '0.15rem' }}>
                          +{h.score * 10}{h.score === 10 ? ` +${h.tables.length === 1 ? '50' : '80'}` : ''} XP
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  studyHistory.length === 0 ? (
                    <div className="flex-col flex-center" style={{ padding: '2rem 1rem', opacity: 0.5, gap: '0.5rem' }}>
                      <BookOpen size={32} />
                      <p style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 700 }}>Nenhum estudo realizado ainda.</p>
                      <p style={{ textAlign: 'center', fontSize: '0.75rem' }}>Comece a estudar para ver seu histórico!</p>
                    </div>
                  ) :
                  studyHistory.slice().reverse().map((h, i) => (
                    <div key={i} className="history-item flex-row" style={{ gap: '0.5rem' }}>
                      <div style={{ width: '4px', borderRadius: '2px', alignSelf: 'stretch', background: 'var(--secondary)' }} />
                      <div className="flex-col" style={{ gap: 0, alignItems: 'flex-start', flex: 1 }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{h.date}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{h.totalCards} cards • {h.type}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>⏱️ {formatTime(h.timeSeconds)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="score-badge" style={{ color: 'var(--secondary)', background: 'rgba(236, 72, 153, 0.1)', fontSize: '0.8rem' }}>
                          <BookOpen size={12} /> Estudo
                        </div>
                        <span style={{ fontSize: '0.55rem', opacity: 0.4, display: 'block', marginTop: '0.15rem' }}>
                          +{h.totalCards * 5} XP
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reset Prompt */}
              {showResetPrompt && (
                <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertCircle size={18} color="var(--error)" />
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Resetar todos os dados?</p>
                  </div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>Isso irá apagar todo o progresso, XP, conquistas e histórico.</p>
                  <input type="password" value={resetInput} onChange={e => setResetInput(e.target.value)} className="input-field" placeholder="Digite a senha" style={{ fontSize: '0.9rem', padding: '0.5rem 0.8rem' }} />
                  <div className="grid-cols-2" style={{ marginTop: '0.8rem' }}>
                    <button className="btn btn-secondary" onClick={() => { setShowResetPrompt(false); setResetInput(''); }}>Cancelar</button>
                    <button className="btn btn-primary" style={{ background: 'var(--error)' }} onClick={handleResetConfirm}>Reset</button>
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '0.8rem' }} onClick={handleBack}>
              <ArrowLeft size={20} /> Voltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Antonio Denilson Canuto</p>
        <p>Versão {packageJson.version}</p>
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-overlay flex-center" onClick={() => setShowHelpModal(false)}>
          <div className="glass-panel animate-scale-in" style={{ maxWidth: '350px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
              <h2 className="gradient-text" style={{ margin: 0 }}>Como Progredir?</h2>
              <button className="btn-icon" onClick={() => setShowHelpModal(false)} style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-col" style={{ gap: '1rem', textAlign: 'left' }}>
              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Zap size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Sistema de XP</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Ganhe XP em cada atividade: +10 por acerto, +50/+80 bônus por teste perfeito, +5 por card estudado. Suba de nível!</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Flame size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Ofensiva Diária 🔥</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Estude todos os dias para manter seu streak! Após 7 dias, o fogo fica mais forte.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Target size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Missão do Dia</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Complete a missão diária para ganhar +100 XP bônus! Nova missão a cada dia.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Trophy size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Troféus</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Acerte 10/10 em um teste de tabuada única. Cada número (1-10) vale 1 troféu.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Star size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Estrela Mestra</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Acerte 10/10 em teste randômico. Cada vitória = 1 das 10 partes.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <NotebookPen size={20} color="#ec4899" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Caderno de Estudo</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>A cada 10 min de estudo, ganhe 1 pt. O tempo pausa após 30s sem ação.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Lock size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Temas Secretos</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Nível 5 desbloqueia o tema 🌌 Espacial. Nível 7 desbloqueia o tema ⚡ Neon!</p>
                </div>
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setShowHelpModal(false)}>
              Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Achievement Hint Modal */}
      {achievementHint && (
        <div className="modal-overlay flex-center" onClick={() => setAchievementHint(null)}>
          <div className="glass-panel animate-scale-in" style={{ maxWidth: '300px', padding: '1.5rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="flex-col flex-center" style={{ gap: '1rem' }}>
              {achievementHint === 'star' ? (
                <>
                  <div className="star-glow">
                    <Star size={48} color="#3b82f6" fill="#3b82f6" />
                  </div>
                  <h3 style={{ margin: 0, color: '#3b82f6' }}>Estrela Mestra</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    Ganhe estrelas acertando <strong>10/10</strong> em testes com <strong>várias tabuadas</strong> selecionadas ao mesmo tempo!
                  </p>
                </>
              ) : (
                <>
                  <div className="study-glow">
                    <NotebookPen size={48} color="#ec4899" fill="#ec4899" />
                  </div>
                  <h3 style={{ margin: 0, color: '#ec4899' }}>Caderno de Estudo</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    Ganhe partes do caderno acumulando <strong>tempo de estudo</strong>. Cada <strong>10 minutos</strong> ativos valem 1 ponto!
                  </p>
                </>
              )}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setAchievementHint(null)}>
                Entendi!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Info Modal */}
      {showLevelInfo && (
        <div className="modal-overlay flex-center" onClick={() => setShowLevelInfo(false)}>
          <div className="glass-panel animate-scale-in" style={{ maxWidth: '350px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
              <h2 className="gradient-text" style={{ margin: 0 }}>Níveis e XP</h2>
              <button className="btn-icon" onClick={() => setShowLevelInfo(false)} style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-col" style={{ gap: '0.8rem' }}>
              {LEVELS.map(l => {
                const isReached = gameState.xp >= l.minXp;
                const isCurrent = getLevel(gameState.xp).level === l.level;
                
                return (
                  <div 
                    key={l.level} 
                    className={`history-item flex-row ${isCurrent ? 'active' : ''}`}
                    style={{ 
                      padding: '0.8rem', 
                      background: isCurrent ? 'rgba(139, 92, 246, 0.15)' : isReached ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                      border: isCurrent ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                      opacity: isReached ? 1 : 0.5
                    }}
                  >
                    <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isReached ? 'var(--accent)' : 'inherit' }}>
                        NÍVEL {l.level}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 900 }}>{l.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="score-badge" style={{ 
                        background: isReached ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: isReached ? 'var(--success)' : 'inherit'
                      }}>
                        {l.minXp} XP
                      </div>
                      {isCurrent && <span style={{ fontSize: '0.55rem', display: 'block', marginTop: '0.2rem', fontWeight: 800, color: 'var(--primary)' }}>NÍVEL ATUAL</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setShowLevelInfo(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Celebration Animation Overlay */}
      {celebration && (
        <div className="modal-overlay flex-center" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 10001 }}>
          <div className="flex-col flex-center animate-celebrate">
            {celebration === 'trophy' ? (
              <>
                <div className="trophy-glow">
                  <Trophy size={150} color="#f59e0b" fill="#f59e0b" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginTop: '1rem', textAlign: 'center' }}>
                  TROFÉU DE OURO!
                </h1>
                <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>Tabuada dominada!</p>
              </>
            ) : celebration === 'star' ? (
              <>
                <div className="star-glow">
                  <Star size={150} color="#3b82f6" fill="#3b82f6" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginTop: '1rem', textAlign: 'center' }}>
                  BRILHO ESTELAR!
                </h1>
                <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>Poder matemático aumentado!</p>
              </>
            ) : celebration === 'study' ? (
              <>
                <div className="study-glow">
                  <NotebookPen size={150} color="#ec4899" fill="#ec4899" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginTop: '1rem', textAlign: 'center' }}>
                  FOCO TOTAL!
                </h1>
                <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>Mais 10 minutos de conhecimento!</p>
              </>
            ) : celebration === 'study-complete' ? (
              <>
                <div className="study-glow" style={{ color: '#10b981' }}>
                  <Notebook size={150} color="#10b981" fill="#10b981" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginTop: '1rem', textAlign: 'center' }}>
                  ESTUDO CONCLUÍDO!
                </h1>
                <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>Você está ficando mais inteligente!</p>
              </>
            ) : celebration === 'levelup' ? (
              <>
                <div className="rank-glow">
                  <Zap size={150} color="var(--accent)" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginTop: '1rem', textAlign: 'center' }}>
                  SUBIU DE NÍVEL!
                </h1>
                <div style={{ background: 'var(--accent)', color: 'white', padding: '0.5rem 2rem', borderRadius: '2rem', fontSize: '1.5rem', fontWeight: 900, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                  Nv. {getLevel(gameState.xp).level} — {getLevel(gameState.xp).name.toUpperCase()}
                </div>
              </>
            ) : celebration === 'mission' ? (
              <>
                <div className="trophy-glow">
                  <Target size={150} color="#f59e0b" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginTop: '1rem', textAlign: 'center' }}>
                  MISSÃO COMPLETA!
                </h1>
                <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>+100 XP Bônus!</p>
              </>
            ) : (
              <>
                <div className="rank-glow">
                  <BarChart3 size={150} color="var(--accent)" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginTop: '1rem', textAlign: 'center' }}>
                  SUBIU DE NÍVEL!
                </h1>
                <div style={{ background: 'var(--accent)', color: 'white', padding: '0.5rem 2rem', borderRadius: '2rem', fontSize: '1.5rem', fontWeight: 900, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                  {getLevel(gameState.xp).name.toUpperCase()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
