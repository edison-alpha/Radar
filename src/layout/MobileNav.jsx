import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Icon } from '../shared/Icon';

export function MobileNav({ route, onExplore, onRadar, onMethodology }) {
  const reduceMotion = useReducedMotion();
  const items = [
    { id: 'home', label: 'Explore', icon: 'list', action: onExplore },
    { id: 'monitor', label: 'Radar', icon: 'gauge', action: onRadar },
    { id: 'methodology', label: 'Methodology', icon: 'book', action: onMethodology },
  ];
  const activeIndex = items.findIndex((item) => item.id === route);
  return (
    <nav className="mobile-dock" aria-label="Mobile navigation">
      <div className="mobile-dock-links">
        <motion.span
          className="mobile-dock-indicator"
          initial={false}
          animate={{ x: `${Math.max(activeIndex, 0) * 100}%`, opacity: activeIndex < 0 ? 0 : 1 }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38 }}
          aria-hidden="true"
        />
        {items.map((item) => (
          <button key={item.id} onClick={item.action} aria-label={item.label} aria-current={route === item.id ? 'page' : undefined}>
            <Icon name={item.icon} size={20} />
          </button>
        ))}
      </div>
    </nav>
  );
}
