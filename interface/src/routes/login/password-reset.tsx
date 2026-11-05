import { Fault } from 'epicenter-libs';
import React, { FC, FormEvent, PropsWithChildren, useContext, useState } from 'react';
import invariant from 'tiny-invariant';
import { Lang as GenericLang, LangProps } from '~/components/lang';
import { Button } from '~/components/ui/button/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog/dialog';
import { Input } from '~/components/ui/input/input';
import { Label } from '~/components/ui/label/label';
import { useResetPassword } from '~/query/auth';
import styles from './login.module.scss';

const Lang: FC<LangProps> = (props) => <GenericLang {...props} ns="password-reset" />;

type FlowStep = 'initial' | 'success' | 'no_account' | 'no_email' | 'generic_error';

type FlowState = {
  step: FlowStep;
  setStep: (step: FlowStep) => void;
  handle: string;
  setHandle: (handle: string) => void;
  restart: () => void;
  close: () => void;
};

const FlowContext = React.createContext({} as FlowState);
const useFlowContext = () => useContext(FlowContext);

const Provider: FC<PropsWithChildren<{ close: () => void }>> = ({ children, close }) => {
  const [step, setStep] = useState<FlowStep>('initial');
  const [handle, setHandle] = useState('');
  const restart = () => {
    setStep('initial');
    setHandle('');
  };
  return (
    <FlowContext.Provider value={{ step, setStep, handle, setHandle, restart, close }}>
      {children}
    </FlowContext.Provider>
  );
};

const Initial = () => {
  const { close, handle, setHandle, setStep } = useFlowContext();

  const { mutateAsync } = useResetPassword();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let handle = formData.get('handle');
    invariant(typeof handle === 'string');

    handle = handle.trim();

    if (handle) {
      setHandle(handle);
      return mutateAsync(handle)
        .then(() => setStep('success'))
        .catch((error: Fault) => {
          switch (error.code) {
            case 'DATA_INTEGRITY_ERROR':
              return setStep('no_account');
            case 'NO_EMAIL':
              return setStep('no_email');
          }
          setStep('generic_error');
        });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <Lang>initial</Lang>
      </p>
      <Label>
        <Lang>handle</Lang>
        <Input name="handle" type="text" required defaultValue={handle} />
      </Label>
      <div className={styles.buttons}>
        <Button type="button" onClick={close} variant="secondary" size="sm">
          <Lang>cancel</Lang>
        </Button>
        <Button type="submit" size="sm">
          <Lang>reset</Lang>
        </Button>
      </div>
    </form>
  );
};

const Success = () => {
  const { close } = useFlowContext();
  return (
    <div>
      <p>
        <Lang>success</Lang>
      </p>
      <div className={styles.buttons}>
        <Button type="button" onClick={close} size="sm">
          <Lang>ok</Lang>
        </Button>
      </div>
    </div>
  );
};

const NoAccount = () => {
  const { close, handle, restart } = useFlowContext();
  return (
    <div>
      <p>
        <Lang d={{ handle }}>no_account</Lang>
      </p>
      <div className={styles.buttons}>
        <Button type="button" onClick={close} variant="secondary" size="sm">
          <Lang>cancel</Lang>
        </Button>
        <Button type="button" onClick={restart} size="sm">
          <Lang>try_again</Lang>
        </Button>
      </div>
    </div>
  );
};

const NoEmail = () => {
  const { close, handle } = useFlowContext();
  return (
    <div>
      <p>
        <Lang d={{ handle }}>no_email</Lang>
      </p>
      <div className={styles.buttons}>
        <Button type="button" onClick={close} size="sm">
          <Lang>cancel</Lang>
        </Button>
      </div>
    </div>
  );
};

const GenericError = () => {
  const { close } = useFlowContext();
  return (
    <div>
      <p>
        <Lang>generic_error</Lang>
      </p>
      <div className={styles.buttons}>
        <Button type="button" onClick={close} size="sm">
          <Lang>close</Lang>
        </Button>
      </div>
    </div>
  );
};

const Switch = () => {
  const { step } = useFlowContext();
  switch (step) {
    case 'success':
      return <Success />;
    case 'no_account':
      return <NoAccount />;
    case 'no_email':
      return <NoEmail />;
    case 'generic_error':
      return <GenericError />;
    default:
      return <Initial />;
  }
};

export const PasswordReset = () => {
  const [flowOpen, setFlowOpen] = useState(false);
  const close = () => setFlowOpen(false);
  return (
    <Dialog open={flowOpen} onOpenChange={setFlowOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Lang>forgot_password?</Lang>
        </Button>
      </DialogTrigger>
      <DialogContent className={styles.passwordReset}>
        <DialogTitle>
          <Lang ns="password-reset">reset</Lang>
        </DialogTitle>
        <Provider close={close}>
          <Switch />
        </Provider>
      </DialogContent>
    </Dialog>
  );
};
