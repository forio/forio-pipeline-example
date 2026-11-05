import { cva, VariantProps } from 'class-variance-authority';
import { ComponentPropsWithRef } from 'react';
import { cn } from '../cn';
import styles from './label.module.scss';

const labelVariants = cva(styles.label, {
  variants: {
    layout: {
      stack: styles.stack,
      inline: styles.inline,
    },
  },
  defaultVariants: {
    layout: 'stack',
  },
});

type LabelProps = VariantProps<typeof labelVariants> & ComponentPropsWithRef<'label'>;

const Label = ({ className, layout, ...props }: LabelProps) => {
  return <label className={cn(labelVariants({ layout }), className)} {...props} />;
};

export { Label };
