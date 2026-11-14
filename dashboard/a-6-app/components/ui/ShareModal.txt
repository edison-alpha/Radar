import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Icon } from '../../shared/Icon';

const TARGETS = [
  {
    id: 'x',
    label: 'X',
    icon: 'x',
    color: '#ffffff',
    href: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: 'telegram',
    color: '#29a9eb',
    href: (u, t) => `https://t.me/share/url?url=${u}&text=${t}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'whatsapp',
    color: '#25d366',
    href: (u, t) => `https://wa.me/?text=${t}%20${u}`,
  },
];

/**
 * Clean share dialog: copy link, optional native share, and a few social targets.
 * Props: open, onClose, title, url (defaults to current page), text, onCopied(message).
 */
export function ShareModal({ open, onClose, title = 'Share', url, text = '', onCopied }) {
  const [copied, setCopied] = useState(false);
  const field = useRef(null);
  const reduceMotion = useReducedMotion();
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      field.current?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    onCopied?.('Link copied');
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url: shareUrl });
      onClose();
    } catch {
      /* user dismissed the sheet */
    }
  }

  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(text);
  const shift = reduceMotion ? 0 : 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="share-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="share-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.97, y: 12 * shift }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 * shift }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="share-head">
              <div>
                <h2>{title}</h2>
                {text && <p>{text}</p>}
              </div>
              <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="share-link">
              <Icon name="link" size={16} />
              <input
                ref={field}
                readOnly
                value={shareUrl}
                aria-label="Share link"
                onFocus={(event) => event.target.select()}
              />
              <button type="button" className="button button-primary" onClick={copy}>
                {copied ? <Icon name="check" size={14} /> : null}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="share-targets">
              {TARGETS.map((target) => (
                <a
                  key={target.id}
                  href={target.href(u, t)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-target"
                >
                  <Icon name={target.icon} size={20} style={{ color: target.color }} />
                  <span>{target.label}</span>
                </a>
              ))}
              {canNativeShare && (
                <button type="button" className="share-target" onClick={nativeShare}>
                  <Icon name="share" size={20} />
                  <span>More…</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
