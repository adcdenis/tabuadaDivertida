import { motion } from 'framer-motion';
import { Play, ArrowLeft } from 'lucide-react';
import { pageVariants } from '../motionVariants';

interface Props {
  studyTables: number[];
  studyRandom: boolean;
  onToggleTable: (table: number) => void;
  onSetRandom: (random: boolean) => void;
  onStart: () => void;
  onBack: () => void;
}

export default function StudyConfigScreen({ studyTables, studyRandom, onToggleTable, onSetRandom, onStart, onBack }: Props) {
  return (
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
                onClick={() => onToggleTable(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <p style={{ marginTop: '1rem' }}>Ordem das perguntas:</p>
          <div className="grid-cols-2">
            <button
              className={`btn ${!studyRandom ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onSetRandom(false)}
            >
              Sequencial
            </button>
            <button
              className={`btn ${studyRandom ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onSetRandom(true)}
            >
              Aleatória
            </button>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: '2rem' }}
            onClick={onStart}
            disabled={studyTables.length === 0}
          >
            <Play size={20} /> Iniciar Estudo
          </button>

          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={onBack}>
            <ArrowLeft size={20} /> Voltar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
