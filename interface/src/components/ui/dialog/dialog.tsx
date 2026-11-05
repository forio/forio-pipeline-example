import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ComponentPropsWithRef } from 'react';
import { cn } from '../cn';
import styles from './dialog.module.scss';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;

type DialogOverlayProps = ComponentPropsWithRef<typeof DialogPrimitive.Overlay>;

const DialogOverlay = ({ className, ...props }: DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    className={cn(styles.overlay, className)}
    {...props}
  />
);

const DialogClose = () => (
  <DialogPrimitive.Close className={styles.close}>
    <X className={styles.closeIcon} />
    <span className={styles.srOnly}>Close</span>
  </DialogPrimitive.Close>
);

type DialogContentProps = ComponentPropsWithRef<typeof DialogPrimitive.Content> & {
  close?: React.ReactNode;
};

const DialogContent = ({ className, children, close = <DialogClose />, ...props }: DialogContentProps) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(styles.content, className)}
      {...props}
    >
      {children}
      {close}
    </DialogPrimitive.Content>
  </DialogPortal>
);

const DialogHeader = ({
  className,
  ...props
}: ComponentPropsWithRef<'div'>) => <div className={cn(styles.header, className)} {...props} />;

const DialogFooter = ({
  className,
  ...props
}: ComponentPropsWithRef<'div'>) => <div className={cn(styles.footer, className)} {...props} />;

type DialogTitleProps = ComponentPropsWithRef<typeof DialogPrimitive.Title>;

const DialogTitle = ({ className, ...props }: DialogTitleProps) => (
  <DialogPrimitive.Title className={cn(styles.title, className)} {...props} />
);

type DialogDescriptionProps = ComponentPropsWithRef<typeof DialogPrimitive.Description>;

const DialogDescription = ({ className, ...props }: DialogDescriptionProps) => (
  <DialogPrimitive.Description
    className={cn(styles.description, className)}
    {...props}
  />
);

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
};