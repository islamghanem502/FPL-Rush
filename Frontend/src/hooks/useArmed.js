import { useEffect, useState } from 'react';

// "Tap again to confirm" instead of a modal: the first tap arms, a second tap
// within `timeout` ms acts, otherwise it quietly disarms.
export const useArmed = (timeout = 4000) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), timeout);
    return () => clearTimeout(t);
  }, [armed, timeout]);
  return [armed, setArmed];
};
