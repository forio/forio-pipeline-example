import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fault, UserSession, authAdapter, groupAdapter } from 'epicenter-libs';
import { atom, useAtomValue } from 'jotai';
import { useNavigate } from 'react-router';
import invariant from 'tiny-invariant';
import { store } from '~/store';

export const ADMIN_LOGIN_ERROR = 'ADMIN_LOGIN_ERROR';

const pureSessionAtom = atom(authAdapter.getLocalSession());
export const sessionAtom = atom(
  (get) => {
    const session = get(pureSessionAtom);
    if (session && session?.objectType === 'admin') throw new Error(ADMIN_LOGIN_ERROR);
    return session;
  },
  (_, set, session: UserSession | undefined) => set(pureSessionAtom, session)
);

export const readSessionSync = () => store.get(sessionAtom);

export const useGuardedSession = () => {
  const session = useAtomValue(sessionAtom);
  invariant(session, 'Requested session on un-guarded route.');
  return session;
};

/* QUERIES */

export const AuthQuery = {};

/* MUTATIONS */

export const useLogin = () =>
  useMutation({
    mutationFn: async ({
      handle,
      password,
      groupKey,
    }: {
      handle: string;
      password: string;
      groupKey?: string;
    }) => {
      const session = await authAdapter.login({
        handle,
        password,
        groupKey,
      });
      if (session.objectType === 'admin') throw new Error(ADMIN_LOGIN_ERROR);
      if (!session.groupKey && !session.multipleGroups) {
        throw new Fault({
          status: 401,
          message: 'No groups available',
          information: { code: 'NO_GROUPS' },
        });
      }
      if (session.groupKey) return [session] as const;
      const groups = await groupAdapter.getSessionGroups();
      if (!groups.length) {
        throw new Fault({
          status: 401,
          message: 'No groups available',
          information: { code: 'NO_GROUPS' },
        });
      }
      return [session, groups] as const;
    },
    onSuccess: ([session]) => store.set(sessionAtom, session),
  });

export const useLogout = (redirect = true) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      authAdapter
        .logout({
          // 401 on logout is fine, avoid propagating to errorManager
          inert: (fault) => fault.status === 401,
        })
        .catch(() => null),
    onSettled: () => {
      queryClient.clear();
      sessionStorage.clear();
      store.set(sessionAtom, undefined);
      if (redirect) navigate('/login');
    },
  });
};

export const useResetPassword = () =>
  useMutation({
    mutationFn: async (email: string) =>
      authAdapter
        .resetPassword(email, {
          subject: 'Forio Simulation Password Reset',
        })
        .catch((error: Fault) => {
          const { message } = error;
          const NO_EMAIL = `The requested person(${email}) does not have a known email address`;
          if (message === NO_EMAIL)
            throw new Fault({
              status: 404,
              message: 'No email found',
              information: { code: 'NO_EMAIL' },
            });

          throw error;
        }),
  });
