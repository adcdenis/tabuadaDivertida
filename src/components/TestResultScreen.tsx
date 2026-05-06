import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { pageVariants } from '../motionVariants';

interface Props {
  score: number;
  onComplete: () => void;
}

export default function TestResultScreen({ score, onComplete }: Props) {
  return (
    <motion.div
      key="test-result"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-transition-wrapper"
    >
      <div className="glass-panel flex-col flex-center">
        <h2>Resultado</h2>
        <div style={{ fontSize: '4rem', fontWeight: 900, color: score >= 7 ? 'var(--success)' : score >= 5 ? 'var(--accent)' : 'var(--error)' }}>
          {score}/10
        </div>
        <p>{score >= 7 ? 'Excelente!' : score >= 5 ? 'Muito bem!' : 'Continue tentando!'}</p>
        <button className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={onComplete}>
          <Check size={20} /> Concluir
        </button>
      </div>
    </motion.div>
  );
}
