import { Trophy, Star, NotebookPen, Notebook, Zap, Target, BarChart3 } from 'lucide-react';
import type { CelebrationType } from '../types';
import { getLevel } from '../utils';

interface Props {
  celebration: CelebrationType | null;
  xp: number;
}

export default function CelebrationOverlay({ celebration, xp }: Props) {
  if (!celebration) return null;

  return (
    <div className="modal-overlay flex-center" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 10001 }}>
      <div className="flex-col flex-center animate-celebrate">
        {celebration === 'trophy' ? (
          <>
            <div className="trophy-glow">
              <Trophy size={150} color="#f59e0b" fill="#f59e0b" strokeWidth={2.5} />
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
              Nv. {getLevel(xp).level} — {getLevel(xp).name.toUpperCase()}
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
              {getLevel(xp).name.toUpperCase()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
