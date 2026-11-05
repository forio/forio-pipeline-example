import { ComponentPropsWithRef } from 'react';
import { cn } from '../cn';
import styles from './card.module.scss';

type CardProps = ComponentPropsWithRef<'div'>;

const Card = ({ className, ...props }: CardProps) => (
  <div className={cn(styles.card, className)} {...props} />
);

export { Card };
