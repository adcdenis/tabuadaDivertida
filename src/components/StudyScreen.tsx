import { motion } from 'framer-motion';
import { Play, ArrowLeft } from 'lucide-react';
import { pageVariants } from '../motionVariants';
import type { Question } from '../types';
import { formatTime } from '../utils';

interface Props {
  questions: Question[];
  studyIndex: number;
  isFlipped: boolean;
  elapsedTime: number;
  isPaused: boolean;
  onCardClick: () => void;
  onBack: () => void;
}

export default function StudyScreen({ questions, studyIndex, isFlipped, elapsedTime, isPaused, onCardClick, onBack }: Props) {
  if (questions.length === 0) return null;

  return (
    <motion.div
      key="study"
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
          <div className="progress-fill" style={{ width: `${(studyIndex / questions.length) * 100}%` }} />
        </div>
        <p>Cartão {studyIndex + 1} de {questions.length}</p>

        <div
          className={`study-card ${isFlipped ? 'flipped' : ''} ${isPaused ? 'study-paused' : ''}`}
          onClick={onCardClick}
          style={{ marginTop: '2rem', marginBottom: '2rem', position: 'relative' }}
        >
          <div className="study-card-inner">
            <div className="study-card-front">
              {questions[studyIndex].table} x {questions[studyIndex].multiplier}
            </div>
            <div className="study-card-back">
              {questions[studyIndex].answer}
            </div>
          </div>
          {isPaused && (
            <div className="pause-overlay flex-center flex-col">
              <Play size={48} color="white" />
              <span style={{ fontWeight: 900, marginTop: '1rem' }}>PAUSADO POR INATIVIDADE</span>
              <span style={{ fontSize: '0.8rem' }}>Toque para continuar</span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          {isFlipped ? 'Toque no cartão para a próxima' : 'Toque no cartão para ver a resposta'}
        </p>

        <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={onBack}>
          <ArrowLeft size={20} /> Sair do Estudo
        </button>
      </div>
    </motion.div>
  );
}
