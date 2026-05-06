import { X } from 'lucide-react';
import { LEVELS } from '../constants';
import { getLevel } from '../utils';

interface Props {
  show: boolean;
  xp: number;
  onClose: () => void;
}

export default function LevelInfoModal({ show, xp, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="modal-overlay flex-center" onClick={onClose}>
      <div className="glass-panel animate-scale-in" style={{ maxWidth: '350px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
          <h2 className="gradient-text" style={{ margin: 0 }}>Níveis e XP</h2>
          <button className="btn-icon" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-col" style={{ gap: '0.8rem' }}>
          {LEVELS.map(l => {
            const isReached = xp >= l.minXp;
            const isCurrent = getLevel(xp).level === l.level;

            return (
              <div
                key={l.level}
                className={`history-item flex-row ${isCurrent ? 'active' : ''}`}
                style={{
                  padding: '0.8rem',
                  background: isCurrent ? 'rgba(139, 92, 246, 0.15)' : isReached ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  border: isCurrent ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isReached ? 1 : 0.5,
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
                    color: isReached ? 'var(--success)' : 'inherit',
                  }}>
                    {l.minXp} XP
                  </div>
                  {isCurrent && <span style={{ fontSize: '0.55rem', display: 'block', marginTop: '0.2rem', fontWeight: 800, color: 'var(--primary)' }}>NÍVEL ATUAL</span>}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
