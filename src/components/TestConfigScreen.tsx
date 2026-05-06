import { motion } from 'framer-motion';
import { Play, ArrowLeft } from 'lucide-react';
import { pageVariants } from '../motionVariants';

interface Props {
  testTables: number[];
  onToggleTable: (table: number) => void;
  onStart: () => void;
  onBack: () => void;
}

export default function TestConfigScreen({ testTables, onToggleTable, onStart, onBack }: Props) {
  return (
    <motion.div
      key="test-config"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-transition-wrapper"
    >
      <div className="glass-panel">
        <h2>Modo Teste</h2>
        <div className="flex-col">
          <p>Selecione as tabuadas para o teste:</p>
          <div className="grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                className={`btn table-selector-btn ${testTables.includes(n) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onToggleTable(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: '2rem' }}
            onClick={onStart}
            disabled={testTables.length === 0}
          >
            <Play size={20} /> Iniciar Teste (10 questões)
          </button>

          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={onBack}>
            <ArrowLeft size={20} /> Voltar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
