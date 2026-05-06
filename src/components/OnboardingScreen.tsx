import { User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../motionVariants';

interface Props {
  tempName: string;
  onTempNameChange: (name: string) => void;
  onSave: () => void;
}

export default function OnboardingScreen({ tempName, onTempNameChange, onSave }: Props) {
  return (
    <motion.div
      key="onboarding"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-transition-wrapper"
    >
      <div className="glass-panel">
        <div className="flex-col flex-center">
          <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--primary)' }}>
            <User size={48} color="white" />
          </div>
          <h2>Como podemos te chamar?</h2>
          <p>Para personalizar sua jornada na matemática!</p>
          <input
            className="input-field"
            placeholder="Seu nome"
            value={tempName}
            onChange={(e) => onTempNameChange(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onSave()}
            maxLength={20}
            style={{ textAlign: 'center', fontSize: '1.2rem' }}
          />
          <button
            className="btn btn-primary"
            style={{ marginTop: '1.5rem', width: '100%' }}
            onClick={onSave}
            disabled={!tempName.trim()}
          >
            Vamos lá! <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
