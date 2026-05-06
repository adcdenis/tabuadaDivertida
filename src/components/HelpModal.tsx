import { X, Zap, Flame, Target, Trophy, Star, NotebookPen, Lock } from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
}

export default function HelpModal({ show, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="modal-overlay flex-center" onClick={onClose}>
      <div className="glass-panel animate-scale-in" style={{ maxWidth: '350px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
          <h2 className="gradient-text" style={{ margin: 0 }}>Como Progredir?</h2>
          <button className="btn-icon" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)' }}>
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

        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
          Entendido!
        </button>
      </div>
    </div>
  );
}
