import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { pageVariants } from '../motionVariants';
import type { TestQuestion } from '../types';
import { formatTime } from '../utils';

interface Props {
  questions: TestQuestion[];
  testIndex: number;
  elapsedTime: number;
  selectedAnswer: number | null;
  onAnswer: (option: number) => void;
  onBack: () => void;
}

export default function TestScreen({ questions, testIndex, elapsedTime, selectedAnswer, onAnswer, onBack }: Props) {
  if (questions.length === 0) return null;

  const currentQ = questions[testIndex];

  return (
    <motion.div
      key="test"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-transition-wrapper"
    >
      <div className="glass-panel flex-col flex-center" style={{ flex: 1, position: 'relative' }}>
        <div className="timer-badge">
          {formatTime(elapsedTime)}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(testIndex / questions.length) * 100}%` }} />
        </div>
        <p>Questão {testIndex + 1} de {questions.length}</p>

        <div className="question-display" style={{ margin: '2rem 0', fontSize: '3rem', fontWeight: 900 }}>
          {currentQ.table} x {currentQ.multiplier} = ?
        </div>

        <div className="grid-cols-2" style={{ width: '100%', gap: '1rem' }}>
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              className={`btn ${
                selectedAnswer === null
                  ? 'btn-secondary'
                  : option === currentQ.answer
                    ? 'animate-correct'
                    : option === selectedAnswer
                      ? 'animate-dissolve'
                      : 'btn-secondary'
              }`}
              onClick={() => onAnswer(option)}
              disabled={selectedAnswer !== null}
              style={{
                fontSize: '1.5rem',
                padding: '1.5rem 0',
                opacity: (selectedAnswer !== null && option !== selectedAnswer && option !== currentQ.answer) ? 0.3 : 1,
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={onBack}>
          <ArrowLeft size={20} /> Sair do Teste
        </button>
      </div>
    </motion.div>
  );
}
