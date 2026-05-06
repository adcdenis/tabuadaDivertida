import { motion } from 'framer-motion';
import { ArrowLeft, Play, BookOpen, Target, Trophy, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { pageVariants } from '../motionVariants';
import type { TestResult, StudyResult, Achievements, GameState } from '../types';
import { getLevel, getLevelProgress, formatTime } from '../utils';

interface Props {
  history: TestResult[];
  studyHistory: StudyResult[];
  achievements: Achievements;
  gameState: GameState;
  statsTab: 'tests' | 'studies';
  showReset: boolean;
  onBack: () => void;
  onStatsTabChange: (tab: 'tests' | 'studies') => void;
  onResetToggle: () => void;
  onResetConfirm: () => void;
  onResetInputChange: (value: string) => void;
  resetInput: string;
  onLevelInfoOpen: () => void;
}

export default function StatsScreen({
  history, studyHistory, achievements, gameState, statsTab, showReset,
  onBack, onStatsTabChange, onResetToggle, onResetConfirm, onResetInputChange, resetInput, onLevelInfoOpen,
}: Props) {
  return (
    <motion.div
      key="stats"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-transition-wrapper"
    >
      <div className="glass-panel flex-col" style={{ gap: '0.8rem' }}>
        <div className="flex-row" style={{ marginBottom: '0' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>📊 Estatísticas</h2>
          <button className="btn btn-secondary btn-icon" onClick={onResetToggle} style={{ padding: '0.4rem' }}>
            <RefreshCw size={16} color="var(--error)" />
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))',
          borderRadius: '1rem',
          padding: '0.8rem 1rem',
          border: '1px solid rgba(139, 92, 246, 0.15)',
        }}>
          <div className="flex-row" style={{ marginBottom: '0.4rem' }}>
            <div className="xp-level-badge" style={{ fontSize: '0.7rem', cursor: 'pointer' }} onClick={onLevelInfoOpen}>
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

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '0.8rem', padding: '0.2rem', gap: 0 }}>
          <button
            onClick={() => onStatsTabChange('tests')}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
              background: statsTab === 'tests' ? 'var(--primary)' : 'transparent',
              color: statsTab === 'tests' ? 'white' : 'rgba(255,255,255,0.6)',
              fontWeight: 800, fontSize: '0.8rem', fontFamily: 'var(--font-family)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}
          >
            <Play size={13} /> Testes
            {history.length > 0 && (
              <span style={{
                background: statsTab === 'tests' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.65rem',
              }}>
                {history.length}
              </span>
            )}
          </button>
          <button
            onClick={() => onStatsTabChange('studies')}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
              background: statsTab === 'studies' ? 'var(--primary)' : 'transparent',
              color: statsTab === 'studies' ? 'white' : 'rgba(255,255,255,0.6)',
              fontWeight: 800, fontSize: '0.8rem', fontFamily: 'var(--font-family)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}
          >
            <BookOpen size={13} /> Estudos
            {studyHistory.length > 0 && (
              <span style={{
                background: statsTab === 'studies' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.65rem',
              }}>
                {studyHistory.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-col" style={{ gap: '0.4rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.3rem' }}>
          {statsTab === 'tests' ? (
            history.length === 0 ? (
              <div className="flex-col flex-center" style={{ padding: '2rem 1rem', opacity: 0.5, gap: '0.5rem' }}>
                <Play size={32} />
                <p style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 700 }}>Nenhum teste realizado ainda.</p>
                <p style={{ textAlign: 'center', fontSize: '0.75rem' }}>Faça um teste para ver seu histórico aqui!</p>
              </div>
            ) :
            [...history].reverse().map((h, i) => (
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
            [...studyHistory].reverse().map((h, i) => (
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

        {showReset && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertCircle size={18} color="var(--error)" />
              <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Resetar todos os dados?</p>
            </div>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>Isso irá apagar todo o progresso, XP, conquistas e histórico.</p>
            <input type="password" value={resetInput} onChange={e => onResetInputChange(e.target.value)} className="input-field" placeholder="Digite a senha" style={{ fontSize: '0.9rem', padding: '0.5rem 0.8rem' }} />
            <div className="grid-cols-2" style={{ marginTop: '0.8rem' }}>
              <button className="btn btn-secondary" onClick={onResetToggle}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: 'var(--error)' }} onClick={onResetConfirm}>Reset</button>
            </div>
          </div>
        )}
      </div>
      <button className="btn btn-secondary" style={{ marginTop: '0.8rem' }} onClick={onBack}>
        <ArrowLeft size={20} /> Voltar
      </button>
    </motion.div>
  );
}
