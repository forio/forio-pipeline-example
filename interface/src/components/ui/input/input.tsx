import { ComponentPropsWithRef } from 'react';
import { cn } from '../cn';
import styles from './input.module.scss';

type InputProps = ComponentPropsWithRef<'input'>;

const Input = ({ className, ...props }: InputProps) => (
  <input className={cn(styles.input, className)} {...props} />
);

export { Input };
