import React from 'react';
import { Icon } from '../../shared/Icon';

export function Button({ children, variant = 'secondary', className = '', icon, ...props }) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
