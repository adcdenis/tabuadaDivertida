import { useState, useCallback, useEffect } from 'react';
import type { CelebrationType } from '../types';

export function useCelebrationQueue() {
  const [current, setCurrent] = useState<CelebrationType | null>(null);
  const [queue, setQueue] = useState<{ type: CelebrationType; confetti?: () => void }[]>([]);

  const trigger = useCallback((type: CelebrationType, confettiAction?: () => void) => {
    setQueue(prev => [...prev, { type, confetti: confettiAction }]);
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      const next = queue[0];
      setCurrent(next.type);
      if (next.confetti) next.confetti();
      setQueue(prev => prev.slice(1));
      setTimeout(() => setCurrent(null), 3500);
    }
  }, [queue, current]);

  return { currentCelebration: current, triggerCelebration: trigger };
}
