import '@csstools/normalize.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, errorManager } from 'epicenter-libs';
import i18n from 'i18next';
import { Provider as JotaiProvider } from 'jotai';
import { createRoot } from 'react-dom/client';
import { initReactI18next } from 'react-i18next';
import { RouterProvider, createHashRouter } from 'react-router';
import resources from 'virtual:i18next-loader';
import { ErrorBoundary } from '~/layouts/error-boundary';
import { RedirectIfAuthed } from '~/layouts/redirect-if-authed';
import { RequireFocusedAuth } from '~/layouts/require-focused-auth';
import {
  awaitingLogoutAtom,
  matchAttemptRegenerate,
  matchUnrecoverableSession,
  regenerateSession,
} from '~/query/regenerate-session';
import { FacilitatorShell } from '~/routes/facilitator/facilitator';
import { Login } from '~/routes/login/login';
import { Logout } from '~/routes/logout/logout';
import { PlayerHome } from '~/routes/play/index';
import { PlayerShell } from '~/routes/play/play';
import { store } from '~/store';
import '~/styles/global.scss';
import { readSessionSync } from './query/auth';

if (config.isLocal()) {
  config.accountShortName = import.meta.env.VITE_DEV_ACCOUNT_SHORT_NAME;
  config.projectShortName = import.meta.env.VITE_DEV_PROJECT_SHORT_NAME;
  config.apiHost = import.meta.env.VITE_DEV_API_HOST;
}

errorManager.clearHandlers();
errorManager.registerHandler(
  (error) => error.code === 'COMETD_RECONNECTED',
  async (_error) => console.warn('PUSH_RECONNECTED')
);

errorManager.registerHandler(matchAttemptRegenerate, (error, retry) => {
  const awaitingLogout = store.get(awaitingLogoutAtom);
  if (awaitingLogout) throw error;
  return regenerateSession().then(retry);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        if (matchUnrecoverableSession(error)) return false;
        return failureCount < 3;
      },
      throwOnError(error) {
        return matchUnrecoverableSession(error);
      },
    },
  },
});

const resolveInitialRoleHome = () => {
  /**
   * App may load with an existing session, particularly after impersonation.
   * Redirect to the appropriate role home, but only once.
   */
  const key = 'initial-path-resolved';

  const done = sessionStorage.getItem(key) === 'true';
  if (done) return;
  else {
    const session = readSessionSync();
    switch (session?.groupRole) {
      case 'FACILITATOR': {
        history.replaceState(null, '', '#/facilitator');
        break;
      }
      case 'PARTICIPANT': // stay on index
      default:
        break;
    }
    sessionStorage.setItem(key, 'true');
  }
};

resolveInitialRoleHome();

const router = createHashRouter([
  // load player code eagerly
  {
    element: <RequireFocusedAuth />,
    errorElement: <PlayerShell.errorElement />,
    children: [
      {
        path: '/',
        element: <PlayerShell />,
        children: [
          {
            index: true,
            element: <PlayerHome />,
          },
        ],
      },
    ],
  },
  // load facilitator code lazily
  {
    element: <RequireFocusedAuth />,
    errorElement: <FacilitatorShell.errorElement />,
    children: [
      {
        path: '/facilitator',
        element: <FacilitatorShell />,
        children: [
          {
            index: true,
            lazy: () =>
              import('~/routes/facilitator/index/index').then((module) => ({
                Component: module.Route,
              })),
          },
        ],
      },
    ],
  },
  {
    element: <RedirectIfAuthed />,
    children: [
      {
        path: '/login',
        element: <Login />,
        index: true,
      },
    ],
  },
  {
    path: '/logout',
    element: <Logout />,
    loader: Logout.loader(queryClient),
  },
]);

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  fallbackNS: 'common',
  interpolation: {
    escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <JotaiProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </JotaiProvider>
  </ErrorBoundary>
);
