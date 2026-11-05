import { QueryClient } from '@tanstack/react-query';
import { authAdapter } from 'epicenter-libs';
import { Suspense, use } from 'react';
import { Navigate, useLoaderData } from 'react-router';
import { Lang } from '~/components/lang';
import { sessionAtom } from '~/query/auth';
import { store } from '~/store';
import { AppliedAwaited } from '~/types/app';
import './logout.scss';

const loader = (queryClient: QueryClient) => async () => ({
  promise: authAdapter
    .logout({
      // 401 on logout is fine, avoid propagating to errorManager
      inert: (fault) => fault.status === 401,
    })
    .catch(() => null)
    .then(() => {
      queryClient.clear();
      sessionStorage.clear();
      store.set(sessionAtom, undefined);
    }),
});

const Impl = () => {
  const { promise } = useLoaderData<AppliedAwaited<typeof loader>>();
  use(promise);
  return <Navigate to="/login" replace />;
};

export const Logout = () => (
  <Suspense
    fallback={
      <div id="logout">
        <Lang>logging_out</Lang>
      </div>
    }
  >
    <Impl />
  </Suspense>
);

Logout.loader = loader;
