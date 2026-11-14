import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../../shared/Icon';

export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Icon name="check" size={20} />
            <span>{toast.message}</span>
            {toast.action && <a href={toast.action.href}>{toast.action.label}</a>}
            <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
              <Icon name="close" size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
