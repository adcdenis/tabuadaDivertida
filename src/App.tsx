import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Screen, ThemeName, TestQuestion, Question, TestResult, StudyResult, GameState, Achievements, DailyMission } from './types';
import { TEST_QUESTION_COUNT, XP_PER_CORRECT, XP_PER_STUDY_CARD, XP_BONUS_SINGLE, XP_BONUS_MULTI, XP_MISSION, STUDY_INACTIVITY_LIMIT, NOTEBOOK_MINUTES, THEMES } from './constants';
import { getToday, getLevel, generateDailyMission, generateTestQuestions, generateStudyQuestions, getStreakAfterActivity } from './utils';
import { useCelebrationQueue } from './hooks/useCelebrationQueue';
import { useSound } from './hooks/useSound';
import BackgroundSymbols from './components/BackgroundSymbols';
import ThemeSelector from './components/ThemeSelector';
import XpPopup from './components/XpPopup';
import OnboardingScreen from './components/OnboardingScreen';
import HomeScreen from './components/HomeScreen';
import StudyConfigScreen from './components/StudyConfigScreen';
import StudyScreen from './components/StudyScreen';
import TestConfigScreen from './components/TestConfigScreen';
import TestScreen from './components/TestScreen';
import TestResultScreen from './components/TestResultScreen';
import StatsScreen from './components/StatsScreen';
import HelpModal from './components/HelpModal';
import AchievementHintModal from './components/AchievementHintModal';
import LevelInfoModal from './components/LevelInfoModal';
import CelebrationOverlay from './components/CelebrationOverlay';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    return localStorage.getItem('tabuada_user_name') ? 'home' : 'onboarding';
  });

  // Study state
  const [studyTables, setStudyTables] = useState<number[]>([]);
  const [studyRandom, setStudyRandom] = useState(false);
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyElapsedTime, setStudyElapsedTime] = useState(0);
  const [isStudyPaused, setIsStudyPaused] = useState(false);
  const studyInactivityRef = useRef(0);

  // Test state
  const [testTables, setTestTables] = useState<number[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [testErrors, setTestErrors] = useState<TestResult['errors']>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Persistent state
  const [history, setHistory] = useState<TestResult[]>([]);
  const [studyHistory, setStudyHistory] = useState<StudyResult[]>([]);
  const [userName, setUserName] = useState('');
  const [tempName, setTempName] = useState('');
  const [theme, setTheme] = useState<ThemeName>('rosa');
  const [achievements, setAchievements] = useState<Achievements>({ trophies: [], stars: 0, notebooks: 0, totalStudyTime: 0 });
  const achievementsRef = useRef(achievements);
  useEffect(() => { achievementsRef.current = achievements; }, [achievements]);
  const [gameState, setGameState] = useState<GameState>({ xp: 0, streak: 0, lastActiveDate: '', dailyMission: null, todayActive: false });
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // UI state
  const [statsTab, setStatsTab] = useState<'tests' | 'studies'>('tests');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [achievementHint, setAchievementHint] = useState<'star' | 'notebook' | null>(null);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [xpPopup, setXpPopup] = useState<number | null>(null);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('tabuada_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const { currentCelebration, triggerCelebration } = useCelebrationQueue();
  const { playSound } = useSound(soundEnabled);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('tabuada_sound_enabled', String(next));
      return next;
    });
  };

  // Local timer for test mode
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentScreen === 'test' && selectedAnswer === null) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [currentScreen, selectedAnswer]);

  // Study timer with inactivity detection
  useEffect(() => {
    if (currentScreen !== 'study') return;

    const resetInactivity = () => {
      studyInactivityRef.current = 0;
    };

    const interval = setInterval(() => {
      if (studyInactivityRef.current < STUDY_INACTIVITY_LIMIT) {
        setStudyElapsedTime(prev => prev + 1);
        studyInactivityRef.current += 1;
      } else {
        setIsStudyPaused(true);
      }
    }, 1000);

    document.addEventListener('mousedown', resetInactivity);
    document.addEventListener('touchstart', resetInactivity);
    document.addEventListener('keydown', resetInactivity);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', resetInactivity);
      document.removeEventListener('touchstart', resetInactivity);
      document.removeEventListener('keydown', resetInactivity);
    };
  }, [currentScreen]);

  // Load saved data on mount
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
    }

    const saved = localStorage.getItem('tabuada_history');
    if (saved) try { setHistory(JSON.parse(saved)); } catch {}
    const savedStudies = localStorage.getItem('tabuada_study_history');
    if (savedStudies) try { setStudyHistory(JSON.parse(savedStudies)); } catch {}
    const savedAchievements = localStorage.getItem('tabuada_achievements');
    if (savedAchievements) try { setAchievements(JSON.parse(savedAchievements)); } catch {}

    const savedGameState = localStorage.getItem('tabuada_game_state');
    if (savedGameState) {
      try {
        const gs: GameState = JSON.parse(savedGameState);
        const today = getToday();
        if (gs.lastActiveDate === today) {
          setGameState(gs);
        } else {
          const lastDate = new Date(gs.lastActiveDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          const newStreak = diffDays === 1 && gs.todayActive ? gs.streak : (diffDays > 1 ? 0 : gs.streak);
          const newMission = generateDailyMission(today);
          const updatedGs: GameState = { ...gs, streak: newStreak, dailyMission: newMission, todayActive: false };
          setGameState(updatedGs);
          localStorage.setItem('tabuada_game_state', JSON.stringify(updatedGs));
        }
      } catch {}
    } else {
      const today = getToday();
      const initialGs: GameState = { xp: 0, streak: 0, lastActiveDate: today, dailyMission: generateDailyMission(today), todayActive: false };
      setGameState(initialGs);
      localStorage.setItem('tabuada_game_state', JSON.stringify(initialGs));
    }
  }, []);

  const addXP = useCallback((amount: number) => {
    setXpPopup(amount);
    setTimeout(() => setXpPopup(null), 1200);

    const prev = gameStateRef.current;
    const newXp = prev.xp + amount;
    const oldLevel = getLevel(prev.xp);
    const newLevel = getLevel(newXp);
    const { streak, todayActive, lastActiveDate } = getStreakAfterActivity(prev);

    const updatedGs: GameState = { ...prev, xp: newXp, streak, lastActiveDate, todayActive };
    setGameState(updatedGs);
    localStorage.setItem('tabuada_game_state', JSON.stringify(updatedGs));

    if (newLevel.level > oldLevel.level) {
      setTimeout(() => {
        playSound('levelup');
        triggerCelebration('levelup', () => {
          confetti({ particleCount: 200, spread: 160, origin: { y: 0.5 }, colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'] });
        });
      }, 300);
    }
  }, [triggerCelebration]);

  const updateMissionProgress = useCallback((type: DailyMission['type'], amount: number, param?: number) => {
    const prev = gameStateRef.current;
    const mission = prev.dailyMission;
    if (!mission || mission.completed || mission.type !== type) return;
    if (type === 'acertar_tabuada' && param !== mission.param) return;

    const newProgress = Math.min(mission.target, mission.progress + amount);
    const completed = newProgress >= mission.target;
    const updatedMission: DailyMission = { ...mission, progress: newProgress, completed };
    const updatedGs: GameState = { ...prev, dailyMission: updatedMission };

    setGameState(updatedGs);
    localStorage.setItem('tabuada_game_state', JSON.stringify(updatedGs));

    if (completed && !mission.completed) {
      setTimeout(() => {
        playSound('mission');
        addXP(XP_MISSION);
        triggerCelebration('mission', () => {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'] });
        });
      }, 500);
    }
  }, [addXP, triggerCelebration]);

  const saveResult = useCallback((result: TestResult) => {
    setHistory(prev => {
      const newHistory = [result, ...prev];
      localStorage.setItem('tabuada_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const saveStudyResult = useCallback((cardsStudied: number, timeSpent: number) => {
    const prev = achievementsRef.current;
    const newTotalTime = prev.totalStudyTime + timeSpent;
    const newNotebooks = Math.min(10, Math.floor(newTotalTime / (NOTEBOOK_MINUTES * 60)));

    const result: StudyResult = {
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      tables: studyTables,
      timeSeconds: timeSpent,
      totalCards: cardsStudied,
      type: studyRandom ? 'Aleatória' : 'Sequencial',
    };

    setStudyHistory(prev => {
      const newHistory = [result, ...prev];
      localStorage.setItem('tabuada_study_history', JSON.stringify(newHistory));
      return newHistory;
    });

    setAchievements({
      trophies: prev.trophies,
      stars: prev.stars,
      totalStudyTime: newTotalTime,
      notebooks: newNotebooks,
    });
    localStorage.setItem('tabuada_achievements', JSON.stringify({
      trophies: prev.trophies,
      stars: prev.stars,
      totalStudyTime: newTotalTime,
      notebooks: newNotebooks,
    }));

    setTimeout(() => {
      if (newNotebooks > prev.notebooks) {
        playSound('achievement');
        triggerCelebration('study');
      } else {
        playSound('complete');
        triggerCelebration('study-complete', () => {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#ec4899', '#8b5cf6', '#ffffff'] });
        });
      }
    }, 0);

    addXP(cardsStudied * XP_PER_STUDY_CARD);

    if (studyTables.length >= 3) updateMissionProgress('sessao_estudo', 1);
    updateMissionProgress('estudar_tempo', timeSpent);
  }, [studyTables, studyRandom, addXP, updateMissionProgress, triggerCelebration]);

  const toggleStudyTable = (table: number) => {
    setStudyTables(prev => prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]);
  };

  const startStudy = () => {
    if (studyTables.length === 0) return;
    setStudyQuestions(generateStudyQuestions(studyTables, studyRandom));
    setStudyIndex(0);
    setStudyElapsedTime(0);
    studyInactivityRef.current = 0;
    setIsFlipped(false);
    setIsStudyPaused(false);
    setCurrentScreen('study');
  };

  const nextStudyCard = () => {
    if (!isFlipped) return;
    setIsFlipped(false);
    setTimeout(() => {
      if (studyIndex < studyQuestions.length - 1) {
        setStudyIndex(prev => prev + 1);
      } else {
        saveStudyResult(studyIndex + 1, studyElapsedTime);
        setCurrentScreen('study-config');
      }
    }, 300);
  };

  const handleStudyCardClick = () => {
    studyInactivityRef.current = 0;
    if (isStudyPaused) {
      setIsStudyPaused(false);
      return;
    }
    if (!isFlipped) {
      playSound('flip');
      setIsFlipped(true);
    }
    else nextStudyCard();
  };

  const toggleTestTable = (table: number) => {
    setTestTables(prev => prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]);
  };

  const startTest = () => {
    if (testTables.length === 0) return;
    setTestQuestions(generateTestQuestions(testTables, TEST_QUESTION_COUNT));
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

    const newScore = correct ? testScore + 1 : testScore;
    if (correct) {
      playSound('correct');
      setTestScore(newScore);
      addXP(XP_PER_CORRECT);
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 }, colors: ['#10b981', '#ffffff'] });
      updateMissionProgress('acertar_tabuada', 1, currentQ.table);
    } else {
      playSound('wrong');
      setTestErrors(prev => [...prev, { question: `${currentQ.table} x ${currentQ.multiplier}`, expected: currentQ.answer, selected }]);
    }

    setTimeout(() => {
      if (testIndex < 9) {
        setTestIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        finishTest(newScore);
        setSelectedAnswer(null);
      }
    }, 1200);
  };

  const finishTest = (finalScore: number) => {
    const prevAch = achievementsRef.current;

    const result: TestResult = {
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      score: finalScore,
      total: 10,
      tables: testTables,
      errors: testErrors,
      timeSeconds: elapsedTime,
    };
    saveResult(result);

    const newTotalTime = prevAch.totalStudyTime + elapsedTime;
    const newNotebooks = Math.min(10, Math.floor(newTotalTime / (NOTEBOOK_MINUTES * 60)));
    let updatedAch: Achievements = { ...prevAch, totalStudyTime: newTotalTime, notebooks: newNotebooks };

    if (finalScore === 10) {
      const bonusXP = testTables.length === 1 ? XP_BONUS_SINGLE : XP_BONUS_MULTI;
      addXP(bonusXP);
      updateMissionProgress('teste_perfeito', 1);

      if (testTables.length === 1) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'] });
        const table = testTables[0];
        if (!prevAch.trophies.includes(table)) {
          updatedAch.trophies = [...prevAch.trophies, table];
          playSound('achievement');
          setTimeout(() => {
            triggerCelebration('trophy', () => {
              confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'] });
            });
          }, 100);
        }
      } else if (testTables.length > 1 && prevAch.stars < 10) {
        playSound('achievement');
        updatedAch.stars = prevAch.stars + 1;
        setTimeout(() => {
          triggerCelebration('star', () => {
            const duration = 2 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
            const interval: ReturnType<typeof setInterval> = setInterval(() => {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) return clearInterval(interval);
              const particleCount = 50 * (timeLeft / duration);
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
          });
        }, 100);
      }
    }

    setAchievements(updatedAch);
    localStorage.setItem('tabuada_achievements', JSON.stringify(updatedAch));

    setCurrentScreen('test-result');
  };

  const handleBack = () => {
    if (currentScreen === 'study') {
      saveStudyResult(studyIndex, studyElapsedTime);
    }
    setCurrentScreen('home');
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('tabuada_user_name', tempName.trim());
      setCurrentScreen('home');
    }
  };

  const handleThemeToggle = (newTheme: ThemeName) => {
    const currentLevel = getLevel(gameState.xp).level;
    const themeConfig = THEMES.find(t => t.name === newTheme);
    if (!themeConfig || currentLevel < themeConfig.requiredLevel) return;
    setTheme(newTheme);
    localStorage.setItem('tabuada_theme', newTheme);
    document.body.className = '';
    if (newTheme !== 'rosa') document.body.classList.add(`theme-${newTheme}`);
    setShowThemeSelector(false);
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
      setGameState({ xp: 0, streak: 0, lastActiveDate: today, dailyMission: generateDailyMission(today), todayActive: false });
      setCurrentScreen('onboarding');
      setShowResetPrompt(false);
      setResetInput('');
    } else {
      alert('Senha incorreta!');
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <BackgroundSymbols />
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 100, display: 'flex', gap: '0.5rem' }}>
        <button className="theme-toggle" onClick={() => setShowThemeSelector(o => !o)} style={{ position: 'static' }}>
          <Zap size={20} />
        </button>
        <button className="theme-toggle" onClick={toggleSound} style={{ position: 'static' }}>
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <ThemeSelector
        theme={theme}
        xp={gameState.xp}
        show={showThemeSelector}
        onToggle={handleThemeToggle}
      />

      <XpPopup amount={xpPopup} />

      <AnimatePresence mode="wait">
        {currentScreen === 'onboarding' && (
          <OnboardingScreen
            tempName={tempName}
            onTempNameChange={setTempName}
            onSave={handleSaveName}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            userName={userName}
            gameState={gameState}
            achievements={achievements}
            onScreenChange={setCurrentScreen}
            onUserNameChange={setUserName}
            onHelpOpen={() => setShowHelpModal(true)}
            onLevelInfoOpen={() => setShowLevelInfo(true)}
            onAchievementHint={setAchievementHint}
            onThemeToggle={() => setShowThemeSelector(o => !o)}
          />
        )}

        {currentScreen === 'study-config' && (
          <StudyConfigScreen
            studyTables={studyTables}
            studyRandom={studyRandom}
            onToggleTable={toggleStudyTable}
            onSetRandom={setStudyRandom}
            onStart={startStudy}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'study' && (
          <StudyScreen
            questions={studyQuestions}
            studyIndex={studyIndex}
            isFlipped={isFlipped}
            elapsedTime={studyElapsedTime}
            isPaused={isStudyPaused}
            onCardClick={handleStudyCardClick}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'test-config' && (
          <TestConfigScreen
            testTables={testTables}
            onToggleTable={toggleTestTable}
            onStart={startTest}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'test' && (
          <TestScreen
            questions={testQuestions}
            testIndex={testIndex}
            elapsedTime={elapsedTime}
            selectedAnswer={selectedAnswer}
            onAnswer={answerTest}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'test-result' && (
          <TestResultScreen
            score={testScore}
            onComplete={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'stats' && (
          <StatsScreen
            history={history}
            studyHistory={studyHistory}
            achievements={achievements}
            gameState={gameState}
            statsTab={statsTab}
            showReset={showResetPrompt}
            onBack={handleBack}
            onStatsTabChange={setStatsTab}
            onResetToggle={() => setShowResetPrompt(o => !o)}
            onResetConfirm={handleResetConfirm}
            onResetInputChange={setResetInput}
            resetInput={resetInput}
            onLevelInfoOpen={() => setShowLevelInfo(true)}
          />
        )}
      </AnimatePresence>

      <Footer />

      <HelpModal show={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <AchievementHintModal hint={achievementHint} onClose={() => setAchievementHint(null)} />
      <LevelInfoModal show={showLevelInfo} xp={gameState.xp} onClose={() => setShowLevelInfo(false)} />
      <CelebrationOverlay celebration={currentCelebration} xp={gameState.xp} />
    </div>
  );
};

export default App;
