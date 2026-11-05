import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentPropsWithRef } from 'react';
import { cn } from '../cn';
import styles from './table.module.scss';

const tableVariants = cva(styles.table, {
  variants: {
    striped: {
      true: styles.striped,
      false: '',
    },
    compact: {
      true: styles.compact,
      false: '',
    },
    numeric: {
      true: styles.numeric,
      false: '',
    },
    hover: {
      true: styles.hover,
      false: '',
    },
  },
  defaultVariants: {
    striped: false,
    compact: false,
    numeric: false,
    hover: false,
  },
});

type TableProps = VariantProps<typeof tableVariants> & ComponentPropsWithRef<'table'>;

const Table = ({ className, striped, compact, numeric, hover, ...props }: TableProps) => (
  <table
    className={cn(tableVariants({ striped, compact, numeric, hover }), className)}
    {...props}
  />
);

export { Table, tableVariants };
