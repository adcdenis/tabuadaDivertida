import React, { useState, useEffect, useRef } from 'react';
import { Play, BookOpen, BarChart3, ArrowLeft, Check, Trophy, Star, NotebookPen, HelpCircle, X, Sun, Moon, Notebook } from 'lucide-react';
import confetti from 'canvas-confetti';
import packageJson from '../package.json';

type Screen = 'welcome' | 'home' | 'study-config' | 'study' | 'test-config' | 'test' | 'test-result' | 'stats';

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

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  
  // Study State
  const [studyTables, setStudyTables] = useState<number[]>([]);
  const [studyRandom, setStudyRandom] = useState(false);
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Test State
  const [testTables, setTestTables] = useState<number[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [testErrors, setTestErrors] = useState<TestResult['errors']>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
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
  const [resetAction, setResetAction] = useState<'stats' | 'user' | null>(null);

  const [theme, setTheme] = useState<'rosa' | 'azul'>('rosa');
  const [tempTheme, setTempTheme] = useState<'rosa' | 'azul'>('rosa');

  // Achievements State
  const [achievements, setAchievements] = useState({
    trophies: [] as number[],
    stars: 0,
    notebooks: 0,
    totalStudyTime: 0
  });

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [celebration, setCelebration] = useState<'trophy' | 'star' | 'study' | 'rank' | 'study-complete' | null>(null);

  const RANKS = [
    { name: 'Iniciante', min: 0 },
    { name: 'Intermediário', min: 12 },
    { name: 'Avançado', min: 25 }
  ];

  const getRank = (pts?: number) => {
    const total = pts !== undefined ? pts : achievements.trophies.length + achievements.stars + achievements.notebooks;
    const currentRank = [...RANKS].reverse().find(r => total >= r.min);
    return currentRank ? currentRank.name : 'Iniciante';
  };

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const savedName = localStorage.getItem('tabuada_user_name');
    const savedPassword = localStorage.getItem('tabuada_reset_password');
    const savedTheme = localStorage.getItem('tabuada_theme') as 'rosa' | 'azul' | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      setTempTheme(savedTheme);
      if (savedTheme === 'azul') document.body.classList.add('theme-azul');
    }

    if (savedName && savedPassword) {
      setUserName(savedName);
    } else {
      setCurrentScreen('welcome');
    }

    const saved = localStorage.getItem('tabuada_history');
    if (saved) setHistory(JSON.parse(saved));
    const savedStudies = localStorage.getItem('tabuada_study_history');
    if (savedStudies) setStudyHistory(JSON.parse(savedStudies));

    const savedAchievements = localStorage.getItem('tabuada_achievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }
  }, []);

  const saveWelcomeData = () => {
    if (tempName.trim() === '') return;
    localStorage.setItem('tabuada_user_name', tempName.trim());
    localStorage.setItem('tabuada_reset_password', 'root');
    localStorage.setItem('tabuada_theme', tempTheme);
    setUserName(tempName.trim());
    setTheme(tempTheme);
    setCurrentScreen('home');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'rosa' ? 'azul' : 'rosa';
    setTheme(newTheme);
    localStorage.setItem('tabuada_theme', newTheme);
    if (newTheme === 'azul') {
      document.body.classList.add('theme-azul');
    } else {
      document.body.classList.remove('theme-azul');
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('tabuada_user_name', tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleResetConfirm = () => {
    if (resetInput === 'root') {
      if (resetAction === 'stats') {
        setHistory([]);
        setStudyHistory([]);
        localStorage.removeItem('tabuada_history');
        localStorage.removeItem('tabuada_study_history');
        setAchievements({ trophies: [], stars: 0, notebooks: 0, totalStudyTime: 0 });
        localStorage.removeItem('tabuada_achievements');
      } else if (resetAction === 'user') {
        localStorage.clear();
        setUserName('');
        setHistory([]);
        setStudyHistory([]);
        setTheme('rosa');
        document.body.classList.remove('theme-azul');
        setCurrentScreen('welcome');
      }
      setShowResetPrompt(false);
      setResetInput('');
      setResetAction(null);
    } else {
      alert('Senha incorreta!');
    }
  };

  const saveResult = (result: TestResult) => {
    const newHistory = [result, ...history];
    setHistory(newHistory);
    localStorage.setItem('tabuada_history', JSON.stringify(newHistory));
  };

  const saveStudyResult = (cardsStudied: number, timeSpent: number) => {
    if (cardsStudied === 0 && timeSpent < 2) return; // Ignore accidental clicks
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

    // Update study achievements
    const newTotalTime = achievements.totalStudyTime + timeSpent;
    const newNotebooks = Math.min(10, Math.floor(newTotalTime / (10 * 60)));
    const updatedAchievements = { 
      ...achievements, 
      totalStudyTime: newTotalTime,
      notebooks: newNotebooks
    };
    const oldTotal = achievements.trophies.length + achievements.stars + achievements.notebooks;
    const newTotal = updatedAchievements.trophies.length + updatedAchievements.stars + updatedAchievements.notebooks;

    setAchievements(updatedAchievements);
    localStorage.setItem('tabuada_achievements', JSON.stringify(updatedAchievements));

    if (getRank(newTotal) !== getRank(oldTotal)) {
      setCelebration('rank');
      setTimeout(() => setCelebration(null), 3000);
    } else if (newNotebooks > achievements.notebooks) {
      setCelebration('study');
      setTimeout(() => setCelebration(null), 3000);
    } else {
      // General study completion celebration
      setCelebration('study-complete');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#8b5cf6', '#ffffff']
      });
      setTimeout(() => setCelebration(null), 3000);
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
    if (studyRandom) {
      q = q.sort(() => Math.random() - 0.5);
    }
    setStudyQuestions(q);
    setStudyIndex(0);
    setStudyElapsedTime(0);
    setIsFlipped(false);
    studyInactivityRef.current = 0;
    setIsStudyPaused(false);
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

  const toggleTestTable = (table: number) => {
    setTestTables(prev => 
      prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
    );
  };

  const startTest = () => {
    if (testTables.length === 0) return;
    
    // Generate all possible combinations from selected tables
    const allPossible: Question[] = [];
    testTables.forEach(t => {
      for (let m = 1; m <= 10; m++) {
        allPossible.push({ table: t, multiplier: m, answer: t * m });
      }
    });

    // Shuffle and pick 10
    const shuffled = allPossible.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    const questions: TestQuestion[] = selected.map(q => {
      const options = new Set<number>([q.answer]);
      while (options.size < 4) {
        // Generate plausible wrong options from the same tables
        const wrongT = testTables[Math.floor(Math.random() * testTables.length)];
        const wrongM = Math.floor(Math.random() * 10) + 1;
        options.add(wrongT * wrongM);
      }
      return {
        ...q,
        options: Array.from(options).sort(() => Math.random() - 0.5)
      };
    });

    setTestQuestions(questions);
    setTestIndex(0);
    setTestScore(0);
    setTestErrors([]);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setElapsedTime(0);
    setCurrentScreen('test');
  };

  const answerTest = (selected: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks
    
    const currentQ = testQuestions[testIndex];
    const correct = selected === currentQ.answer;
    
    setSelectedAnswer(selected);
    setIsAnswerCorrect(correct);

    if (correct) {
      setTestScore(s => s + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setTestErrors(prev => [...prev, {
        question: `${currentQ.table} x ${currentQ.multiplier}`,
        expected: currentQ.answer,
        selected
      }]);
    }
    
    setTimeout(() => {
      if (testIndex < 9) {
        setTestIndex(testIndex + 1);
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
      } else {
        finishTest(correct ? testScore + 1 : testScore);
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
      }
    }, 1200);
  };

  const finishTest = (finalScore: number) => {
    const result: TestResult = {
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      score: finalScore,
      total: 10,
      tables: testTables,
      errors: testErrors, // NOTE: The last error might not be in state yet, but finishTest is called after answering
      timeSeconds: elapsedTime
    };
    saveResult(result);

    // Update Test Achievements
    if (finalScore === 10) {
      let updatedAchievements = { ...achievements };
      let changed = false;

      if (testTables.length === 1) {
        // Trophy Effect (Golden Blast)
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff']
        });

        const table = testTables[0];
        if (!achievements.trophies.includes(table) && achievements.trophies.length < 10) {
          updatedAchievements.trophies = [...achievements.trophies, table];
          changed = true;
        }
      } else if (testTables.length > 1) {
        // Random Star Effect (Epic Side Cannons)
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

        if (achievements.stars < 10) {
          updatedAchievements.stars += 1;
          changed = true;
        }
      }

      if (changed) {
        setAchievements(updatedAchievements);
        localStorage.setItem('tabuada_achievements', JSON.stringify(updatedAchievements));

        const oldTotal = achievements.trophies.length + achievements.stars + achievements.notebooks;
        const newTotal = updatedAchievements.trophies.length + updatedAchievements.stars + updatedAchievements.notebooks;

        if (getRank(newTotal) !== getRank(oldTotal)) {
          setCelebration('rank');
          setTimeout(() => setCelebration(null), 3000);
        } else {
          setCelebration(testTables.length === 1 ? 'trophy' : 'star');
          setTimeout(() => setCelebration(null), 3000);
        }
      } else {
        // Just general 10/10 celebration if no new points earned (though 10/10 usually earns points)
        setCelebration(testTables.length === 1 ? 'trophy' : 'star');
        setTimeout(() => setCelebration(null), 3000);
      }
    }

    setCurrentScreen('test-result');
  };


  const handleBack = () => {
    if (currentScreen === 'study') {
      saveStudyResult(studyIndex, studyElapsedTime);
    }
    setCurrentScreen('home');
  };

  return (
    <div className="app-container">
      {/* Header with Back Button */}
      {/* Global Theme Toggle */}
      <button 
        className="theme-toggle" 
        onClick={toggleTheme} 
        title={`Mudar para tema ${theme === 'rosa' ? 'Azul' : 'Rosa'}`}
      >
        {theme === 'rosa' ? <Moon size={24} /> : <Sun size={24} />}
      </button>

      {/* Header removed as Back button moved to bottom of specific screens */}

      {currentScreen === 'welcome' && (
        <div className="glass-panel flex-col flex-center animate-fade-in" style={{ flex: 1 }}>
          <h1 className="gradient-text">Bem-vindo(a)!</h1>
          <p style={{ textAlign: 'center', marginBottom: '1rem' }}>Para começarmos, como podemos te chamar?</p>
          
          <input 
            type="text" 
            placeholder="Seu nome" 
            className="input-field"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            maxLength={50}
          />

{/* 
          <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>Crie uma senha para resetar suas estatísticas depois:</p>
          <input 
            type="password" 
            placeholder="Sua senha secreta" 
            className="input-field"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
          />
*/}

          <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>Escolha o seu tema preferido:</p>
          <div className="grid-cols-2" style={{ width: '100%' }}>
            <button 
              className={`btn ${tempTheme === 'rosa' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setTempTheme('rosa'); document.body.classList.remove('theme-azul'); }}
              style={{ background: tempTheme === 'rosa' ? '#8b5cf6' : '', borderColor: '#8b5cf6' }}
            >
              Rosa
            </button>
            <button 
              className={`btn ${tempTheme === 'azul' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setTempTheme('azul'); document.body.classList.add('theme-azul'); }}
              style={{ background: tempTheme === 'azul' ? '#3b82f6' : '', borderColor: '#3b82f6' }}
            >
              Azul
            </button>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ marginTop: '2rem' }} 
            onClick={saveWelcomeData}
            disabled={!tempName.trim()}
          >
            Começar <Play size={20} />
          </button>
        </div>
      )}

      {currentScreen === 'home' && (
        <div className="glass-panel flex-col flex-center animate-fade-in" style={{ flex: 1 }}>
          <img 
            src="/math-fun.svg" 
            alt="Ilustração de matemática" 
            style={{ width: '100%', maxWidth: '160px', marginBottom: '1rem' }}
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
            <h1 
              className="gradient-text" 
              onClick={() => { setIsEditingName(true); setTempName(userName); }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              title="Clique para mudar seu nome"
            >
              Olá, {userName}!
            </h1>
          )}
          <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Pronto para aprender e testar seus conhecimentos em matemática?</p>
          
          <div className="flex-col" style={{ width: '100%', maxWidth: '300px', marginBottom: '2rem' }}>
            <button className="btn btn-primary" onClick={() => setCurrentScreen('study-config')}>
              <BookOpen size={24} /> Estudar
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentScreen('test-config')}>
              <Play size={24} /> Teste
            </button>
            <button className="btn btn-secondary" onClick={() => setCurrentScreen('stats')}>
              <BarChart3 size={24} /> Estatísticas
            </button>
          </div>
          
          {/* Ranking System moved to bottom */}
          <div className="glass-panel" style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem' }}>
            <div className="flex-col" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
              <div className="flex-row">
                <div className="flex-row" style={{ gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)' }}>MEU NÍVEL</span>
                  <button 
                    onClick={() => setShowHelpModal(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title="Como ganhar pontos?"
                  >
                    <HelpCircle size={18} />
                  </button>
                </div>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{achievements.trophies.length + achievements.stars + achievements.notebooks} / 30 pts</span>
              </div>
              
              {/* Rank Progression Bar */}
              <div style={{ display: 'flex', overflowX: 'auto', gap: '0.4rem', paddingBottom: '0.5rem', scrollbarWidth: 'none' }} className="no-scrollbar">
                {RANKS.map(r => {
                  const isCurrent = getRank() === r.name;
                  const isUnlocked = (achievements.trophies.length + achievements.stars + achievements.notebooks) >= r.min;
                  return (
                    <div 
                      key={r.name} 
                      style={{ 
                        flexShrink: 0,
                        padding: '0.3rem 0.6rem',
                        borderRadius: '0.5rem',
                        background: isCurrent ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: isCurrent ? 'white' : isUnlocked ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                        fontSize: '0.65rem',
                        fontWeight: isCurrent ? 900 : 700,
                        border: isCurrent ? 'none' : isUnlocked ? '1px solid rgba(255,255,255,0.1)' : '1px dashed rgba(255,255,255,0.1)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {r.name.toUpperCase()}
                    </div>
                  );
                })}
              </div>
              
              {/* Large Current Rank Display */}
              <h2 style={{ margin: '0.5rem 0', color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {getRank()}
              </h2>
            </div>
            {/* Trophies Collection */}
            <div className="flex-col" style={{ gap: '0.3rem', marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, textAlign: 'left' }}>TROFÉUS CONQUISTADOS</span>
              <div className="flex-row" style={{ gap: '0.25rem', width: '100%' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => {
                  const hasTrophy = achievements.trophies.includes(t);
                  return (
                    <div 
                      key={t} 
                      className="flex-col flex-center" 
                      style={{ 
                        flex: 1,
                        padding: '0.3rem 0', 
                        background: hasTrophy ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)', 
                        borderRadius: '0.4rem',
                        opacity: hasTrophy ? 1 : 0.2,
                        border: hasTrophy ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                        transition: 'all 0.3s ease'
                      }}
                      title={`Tabuada do ${t}`}
                    >
                      <Trophy size={14} color={hasTrophy ? "#f59e0b" : "#cbd5e1"} />
                      <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>{t}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: '0.8rem' }}>
              <div className="flex-row flex-center" style={{ gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '1rem', flex: 1 }}>
                <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    background: `conic-gradient(var(--primary) ${achievements.stars * 36}deg, rgba(255,255,255,0.1) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.5s ease'
                  }}>
                    <div style={{ width: '80%', height: '80%', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={24} color="var(--primary)" fill={achievements.stars === 10 ? "var(--primary)" : "transparent"} />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '2px 5px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                    {achievements.stars}/10
                  </div>
                </div>
                <div className="flex-col" style={{ alignItems: 'flex-start', gap: '0' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>ESTRELA</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{10 - achievements.stars} faltam</span>
                </div>
              </div>

              <div className="flex-row flex-center" style={{ gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '1rem', flex: 1 }}>
                <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    background: `conic-gradient(#ec4899 ${achievements.notebooks * 36}deg, rgba(255,255,255,0.1) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.5s ease'
                  }}>
                    <div style={{ width: '80%', height: '80%', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <NotebookPen size={24} color="#ec4899" fill={achievements.notebooks === 10 ? "#ec4899" : "transparent"} />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ec4899', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '2px 5px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                    {achievements.notebooks}/10
                  </div>
                </div>
                <div className="flex-col" style={{ alignItems: 'flex-start', gap: '0' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>ESTUDO</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{Math.max(0, 10 - achievements.notebooks)} faltam</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'study-config' && (
        <div className="glass-panel animate-fade-in">
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
      )}

      {currentScreen === 'study' && studyQuestions.length > 0 && (
        <div className="glass-panel animate-fade-in flex-col flex-center" style={{ flex: 1, position: 'relative' }}>
          
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
              if (isStudyPaused) return; // First click only resumes
              
              if (!isFlipped) {
                setIsFlipped(true);
              } else {
                nextStudyCard();
              }
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
      )}

      {currentScreen === 'test-config' && (
        <div className="glass-panel animate-fade-in">
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
      )}

      {currentScreen === 'test' && testQuestions.length > 0 && (
        <div className="glass-panel animate-fade-in flex-col flex-center" style={{ flex: 1, position: 'relative' }}>
          
          <div className="timer-badge">
            {formatTime(elapsedTime)}
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(testIndex / 10) * 100}%` }} />
          </div>
          <p>Questão {testIndex + 1} de 10</p>

          <div style={{ fontSize: '3rem', fontWeight: 900, margin: '2rem 0', textAlign: 'center' }}>
            {testQuestions[testIndex].table} x {testQuestions[testIndex].multiplier} = ?
          </div>

          <div className="grid-cols-2" style={{ width: '100%' }}>
            {testQuestions[testIndex].options.map((opt, i) => {
              let btnClass = "btn btn-secondary test-option";
              if (selectedAnswer !== null) {
                if (opt === testQuestions[testIndex].answer) {
                  btnClass += " animate-correct";
                } else if (opt === selectedAnswer && !isAnswerCorrect) {
                  btnClass += " animate-dissolve";
                }
              }

              return (
                <button 
                  key={i} 
                  className={btnClass}
                  onClick={() => answerTest(opt)}
                  disabled={selectedAnswer !== null}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={handleBack}>
            <ArrowLeft size={20} /> Sair do Teste
          </button>
        </div>
      )}

      {currentScreen === 'test-result' && (
        <div className="glass-panel animate-fade-in flex-col">
          <h2>Resultado do Teste</h2>
          
          <div className="flex-center flex-col" style={{ margin: '1rem 0' }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: testScore >= 7 ? 'var(--success)' : testScore >= 5 ? 'var(--accent)' : 'var(--error)' }}>
              {testScore}/10
            </div>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              {testScore >= 7 ? 'Excelente trabalho!' : testScore >= 5 ? 'Foi bem, mas pode melhorar!' : 'Continue praticando!'}
            </p>
            <div className="badge" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              Tempo: {formatTime(elapsedTime)}
            </div>
          </div>

          {testErrors.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Erros:</h3>
              <div className="flex-col" style={{ gap: '0.5rem' }}>
                {testErrors.map((err, i) => (
                  <div key={i} className="history-item">
                    <span style={{ fontWeight: 700 }}>{err.question}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-error" style={{ textDecoration: 'line-through', marginRight: '0.5rem' }}>{err.selected}</span>
                      <span className="text-success" style={{ fontWeight: 700 }}>{err.expected}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setCurrentScreen('home')}>
            <Check size={20} /> Concluir
          </button>
        </div>
      )}

      {currentScreen === 'stats' && (
        <div className="glass-panel animate-fade-in flex-col">
          <h2>Estatísticas</h2>

          <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
            <button 
              className={`btn ${statsTab === 'tests' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatsTab('tests')}
            >
              Testes
            </button>
            <button 
              className={`btn ${statsTab === 'studies' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatsTab('studies')}
            >
              Estudos
            </button>
          </div>
          
          {statsTab === 'tests' && (
            history.length === 0 ? (
              <p style={{ textAlign: 'center', margin: '2rem 0' }}>Nenhum teste realizado ainda.</p>
            ) : (
              <>
                <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
                  <div className="history-item flex-col flex-center">
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>{history.length}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Testes Totais</span>
                  </div>
                  <div className="history-item flex-col flex-center">
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>
                      {Math.round((history.reduce((acc, h) => acc + h.score, 0) / (history.length * 10)) * 100)}%
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Taxa de Acerto</span>
                  </div>
                </div>

                <h3 style={{ textAlign: 'left', fontSize: '1.1rem', marginTop: '1rem' }}>Histórico de Testes</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }} className="flex-col">
                  {history.map((h, i) => (
                    <div key={i} className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="flex-row" style={{ width: '100%', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{h.date}</span>
                        <span style={{ fontWeight: 900, color: h.score >= 7 ? 'var(--success)' : h.score >= 5 ? 'var(--accent)' : 'var(--error)' }}>{h.score}/10</span>
                      </div>
                      <div className="flex-row" style={{ width: '100%', fontSize: '0.85rem' }}>
                        <span>Tabuadas: {h.tables.join(', ')}</span>
                        {h.timeSeconds !== undefined && (
                          <span style={{ opacity: 0.8 }}>⏱️ {formatTime(h.timeSeconds)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {statsTab === 'studies' && (
            studyHistory.length === 0 ? (
              <p style={{ textAlign: 'center', margin: '2rem 0' }}>Nenhum estudo realizado ainda.</p>
            ) : (
              <>
                <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
                  <div className="history-item flex-col flex-center">
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>{studyHistory.length}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Sessões</span>
                  </div>
                  <div className="history-item flex-col flex-center">
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>
                      {formatTime(studyHistory.reduce((acc, h) => acc + h.timeSeconds, 0))}
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tempo Total</span>
                  </div>
                </div>

                <h3 style={{ textAlign: 'left', fontSize: '1.1rem', marginTop: '1rem' }}>Histórico de Estudos</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }} className="flex-col">
                  {studyHistory.map((h, i) => (
                    <div key={i} className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="flex-row" style={{ width: '100%', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{h.date}</span>
                        <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{h.totalCards} cards</span>
                      </div>
                      <div className="flex-row" style={{ width: '100%', fontSize: '0.85rem' }}>
                        <span>Tabuadas: {h.tables.join(', ')} ({h.type})</span>
                        <span style={{ opacity: 0.8 }}>⏱️ {formatTime(h.timeSeconds)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }} className="flex-col">
            {!showResetPrompt ? (
              <div className="flex-col">
                <button className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => { setShowResetPrompt(true); setResetAction('stats'); }}>
                  Zerar Estatísticas
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.9rem' }} onClick={() => { setShowResetPrompt(true); setResetAction('user'); }}>
                  Reiniciar Perfil / Nome
                </button>
              </div>
            ) : (
              <div className="flex-col animate-fade-in">
                <p style={{ fontSize: '0.9rem', color: 'var(--error)' }}>Digite a senha de reset:</p>
                <input 
                  type="password" 
                  className="input-field" 
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="Senha"
                />
                <div className="flex-row">
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowResetPrompt(false); setResetInput(''); }}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, background: 'var(--error)' }} onClick={handleResetConfirm}>
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleBack}>
            <ArrowLeft size={20} /> Voltar
          </button>
        </div>
      )}
      {/* Rodapé */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Antonio Denilson Canuto</p>
        <p>Versão {packageJson.version}</p>
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-overlay flex-center" onClick={() => setShowHelpModal(false)}>
          <div className="glass-panel animate-scale-in" style={{ maxWidth: '350px', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
              <h2 className="gradient-text" style={{ margin: 0 }}>Como Progredir?</h2>
              <button className="btn-icon" onClick={() => setShowHelpModal(false)} style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-col" style={{ gap: '1rem', textAlign: 'left' }}>
              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Trophy size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Troféus</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Acerte 10/10 em um teste de tabuada única. Cada número (2-9) vale 1 troféu.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <Star size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Estrela Mestra</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Acerte 10/10 em um teste randômico. Cada vitória preenche 1 das 10 partes.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <NotebookPen size={20} color="#ec4899" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Caderno de Estudo</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>A cada 10 minutos de estudo, você preenche 1 das 10 partes do caderno.</p>
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'flex-start', gap: '0.8rem' }}>
                <HelpCircle size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Níveis</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Junte pontos de todas as conquistas para subir de nível até virar um Darth Vader!</p>
                </div>
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setShowHelpModal(false)}>
              Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Celebration Animation Overlay */}
      {celebration && (
        <div className="modal-overlay flex-center no-pointer-events" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 10001 }}>
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
            ) : (
              <>
                <div className="rank-glow">
                  <BarChart3 size={150} color="var(--accent)" />
                </div>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginTop: '1rem', textAlign: 'center' }}>
                  SUBIU DE NÍVEL!
                </h1>
                <div style={{ background: 'var(--accent)', color: 'white', padding: '0.5rem 2rem', borderRadius: '2rem', fontSize: '1.5rem', fontWeight: 900, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                  {getRank().toUpperCase()}
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
