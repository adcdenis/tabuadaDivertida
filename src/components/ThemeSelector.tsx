import type { ThemeName } from '../types';
import { THEMES } from '../constants';
import { getLevel } from '../utils';
import { Lock } from 'lucide-react';

interface Props {
  theme: ThemeName;
  xp: number;
  show: boolean;
  onToggle: (theme: ThemeName) => void;
}

export default function ThemeSelector({ theme, xp, show, onToggle }: Props) {
  if (!show) return null;

  const currentLevel = getLevel(xp).level;

  return (
    <div style={{ position: 'absolute', top: '4.5rem', left: '1.5rem', zIndex: 200 }}>
      <div className="glass-panel animate-scale-in" style={{ padding: '0.8rem' }}>
        <div className="theme-grid">
          {THEMES.map(t => {
            const locked = currentLevel < t.requiredLevel;
            return (
              <div
                key={t.name}
                className={`theme-option ${theme === t.name ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => {
                  if (!locked) onToggle(t.name);
                }}
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
  );
}
