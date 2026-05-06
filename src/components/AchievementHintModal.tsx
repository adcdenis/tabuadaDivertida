import { Star, NotebookPen } from 'lucide-react';

interface Props {
  hint: 'star' | 'notebook' | null;
  onClose: () => void;
}

export default function AchievementHintModal({ hint, onClose }: Props) {
  if (!hint) return null;

  return (
    <div className="modal-overlay flex-center" onClick={onClose}>
      <div className="glass-panel animate-scale-in" style={{ maxWidth: '300px', padding: '1.5rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="flex-col flex-center" style={{ gap: '1rem' }}>
          {hint === 'star' ? (
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
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={onClose}>
            Entendi!
          </button>
        </div>
      </div>
    </div>
  );
}
