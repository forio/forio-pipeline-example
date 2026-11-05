import * as React from 'react';
import { cn } from '../cn';
import styles from './alert.module.scss';

export interface AlertProps {
  variant?: 'error';
}

/**
 * Alert displays a styled message box. Only 'error' variant is supported.
 */
export const Alert: React.FC<React.PropsWithChildren<AlertProps>> = ({
  variant = 'error',
  children,
}) => {
  return (
    <div className={cn(styles.alert, variant && styles[variant])} role="alert">
      {children}
    </div>
  );
};
Alert.displayName = 'Alert';
