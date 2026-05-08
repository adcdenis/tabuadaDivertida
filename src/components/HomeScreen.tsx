import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, BarChart3, Trophy, Star, NotebookPen, HelpCircle, Target, Check, Zap } from 'lucide-react';
import { pageVariants } from '../motionVariants';
import type { GameState, Achievements, Screen } from '../types';
import { getLevel, getNextLevel, getLevelProgress, formatTime } from '../utils';

interface Props {
  userName: string;
  gameState: GameState;
  achievements: Achievements;
  onScreenChange: (screen: Screen) => void;
  onUserNameChange: (name: string) => void;
  onHelpOpen: () => void;
  onLevelInfoOpen: () => void;
  onAchievementHint: (hint: 'star' | 'notebook') => void;
  onThemeToggle: () => void;
}

export default function HomeScreen({
  userName, gameState, achievements, onScreenChange, onUserNameChange, onHelpOpen, onLevelInfoOpen, onAchievementHint,
}: Props) {
  const [tempName, setTempName] = useState(userName);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveName = () => {
    if (tempName.trim()) {
      localStorage.setItem('tabuada_user_name', tempName.trim());
      onUserNameChange(tempName.trim());
      setIsEditing(false);
    }
  };

  return (
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
        {isEditing ? (
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
              onClick={() => { setIsEditing(true); setTempName(userName); }}
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

        <div className="xp-bar-container" style={{ maxWidth: '300px', cursor: 'pointer' }} onClick={onLevelInfoOpen}>
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
          <button className="btn btn-primary" onClick={() => onScreenChange('study-config')}>
            <BookOpen size={24} /> Estudar
          </button>
          <button className="btn btn-primary" onClick={() => onScreenChange('test-config')}>
            <Play size={24} /> Teste
          </button>
        </div>

        <div className="glass-panel" style={{ width: '100%', padding: '1rem' }}>
          <div className="flex-row" style={{ marginBottom: '0.8rem' }}>
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--accent)' }}>CONQUISTAS</span>
              <button onClick={onHelpOpen} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <HelpCircle size={16} />
              </button>
            </div>
          </div>

          <div className="flex-col" style={{ gap: '0.3rem', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>TROFÉUS CONQUISTADOS</span>
            <div className="flex-row" style={{ gap: '0.25rem', width: '100%' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => {
                const isEarned = achievements.trophies.includes(t);
                return (
                  <div 
                    key={t} 
                    className="flex-col flex-center" 
                    style={{ 
                      flex: 1, 
                      padding: '0.4rem 0', 
                      background: isEarned ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))' : 'rgba(255,255,255,0.03)', 
                      borderRadius: '0.5rem', 
                      opacity: isEarned ? 1 : 0.3,
                      border: isEarned ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                      boxShadow: isEarned ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Trophy 
                      size={16} 
                      color={isEarned ? "#f59e0b" : "#94a3b8"} 
                      fill={isEarned ? "#f59e0b" : "transparent"}
                      strokeWidth={2.5}
                    />
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isEarned ? "#f59e0b" : "#94a3b8" }}>{t}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '0.8rem' }}>
            <div className="flex-row flex-center" style={{ gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => onAchievementHint('star')}>
              <Star size={24} color="var(--primary)" fill={achievements.stars === 10 ? "var(--primary)" : "transparent"} />
              <div className="flex-col" style={{ alignItems: 'flex-start', gap: '0' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>ESTRELA</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{achievements.stars}/10</span>
              </div>
            </div>
            <div className="flex-row flex-center" style={{ gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => onAchievementHint('notebook')}>
              <NotebookPen size={24} color="#ec4899" fill={achievements.notebooks === 10 ? "#ec4899" : "transparent"} />
              <div className="flex-col" style={{ alignItems: 'flex-start', gap: '0' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>ESTUDO</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{achievements.notebooks}/10</span>
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={() => onScreenChange('stats')} style={{ width: '100%', maxWidth: '300px' }}>
          <BarChart3 size={24} /> Estatísticas
        </button>
      </div>
    </motion.div>
  );
}
