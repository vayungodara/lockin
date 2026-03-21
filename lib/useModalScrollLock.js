import { useEffect } from 'react';

export function useModalScrollLock(isOpen) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.setAttribute('data-modal-open', 'true');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.removeAttribute('data-modal-open');
    };
  }, [isOpen]);
}
