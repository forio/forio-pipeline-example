import { FC, Fragment } from 'react';
import { Trans } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Lang } from '~/components/lang';
import { useLogout } from '~/query/auth';
import { matchUnrecoverableSession } from '~/query/regenerate-session';

export const NotFound = () => (
  <Fragment>
    <h2 className="text-lg font-medium">
      <Lang ns="error">not_found</Lang>
    </h2>
    <p>
      <Trans ns="error" i18nKey="go_home">
        <Link className="text-base font-medium text-primary underline" to="/" />
      </Trans>
    </p>
  </Fragment>
);

export const UnrecoverableSession = () => {
  const { mutate: logout } = useLogout();
  return (
    <Fragment>
      <h2 className="text-lg font-medium">
        <Lang ns="error">session_expired</Lang>
      </h2>
      <p>
        <Trans ns="error" i18nKey="REGENERATE_FAIL">
          <button onClick={() => logout()} />
        </Trans>
      </p>
    </Fragment>
  );
};

export const GenericError: FC<{
  error: Error | undefined;
}> = ({ error }) => {
  const { mutate: logout } = useLogout();
  return (
    <Fragment>
      <h2 className="text-lg font-medium">
        <Lang ns="error">something_went_wrong</Lang>
      </h2>
      <p>
        <Trans ns="error" i18nKey="GENERIC_ERROR">
          <button onClick={() => logout()} />
        </Trans>
      </p>
      {error && (
        <code className="my-2 max-h-72 max-w-sm overflow-auto break-words rounded-lg border bg-muted px-4 py-2 text-left text-xs">
          {error.stack}
        </code>
      )}
    </Fragment>
  );
};

export const Match = () => {
  const error = useRouteError();
  console.error(error);
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }
  if (error instanceof Error && matchUnrecoverableSession(error)) {
    return <UnrecoverableSession />;
  }
  return <GenericError error={error instanceof Error ? error : undefined} />;
};
