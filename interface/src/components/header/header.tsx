import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Lang } from '~/components/lang';
import { Button } from '~/components/ui/button/button';
import { useLogout } from '~/query/auth';
import styles from './header.module.scss';

const useNetworkActive = () => {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  return Boolean(fetching || mutating);
};

const NetworkIndicator = () =>
  useNetworkActive() ? (
    <div className={styles.networkIndicator}>
      <div className={styles.pingDot} />
    </div>
  ) : (
    <div className={styles.dot} />
  );

export const Header = ({
  children,
  banner,
}: {
  children?: React.ReactNode;
  banner?: React.ReactNode;
}) => {
  const { mutate: logout } = useLogout();

  return (
    <header>
      <div className={styles.shell}>
        <div className={styles.leftGroup}>
          {import.meta.env.VITE_PROJECT_NAME}
          <NetworkIndicator />
        </div>
        <nav className={styles.nav}>
          {children}
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <Lang>logout</Lang>
          </Button>
        </nav>
      </div>
      {banner}
    </header>
  );
};
