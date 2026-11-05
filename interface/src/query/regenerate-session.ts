import { authAdapter, Fault, Session } from 'epicenter-libs';
import { atom } from 'jotai';
import { store } from '~/store';
import { ADMIN_LOGIN_ERROR, readSessionSync, sessionAtom } from './auth';

export const matchAttemptRegenerate = (() => {
  const status = 401;
  const codes = ['AUTHENTICATION_EXPIRED', 'AUTHENTICATION_INVALIDATED'];
  return (error: Fault) =>
    Boolean(error.status === status && error.code && codes.includes(error.code));
})();

export const awaitingLogoutAtom = atom(false);

let regeneratePromise: null | Promise<Session> = null; // one global promise
export const regenerateSession = () => {
  if (regeneratePromise) return regeneratePromise;
  const session = readSessionSync();
  if (!session?.groupKey) return Promise.reject();
  regeneratePromise = authAdapter.regenerate(session.groupKey, {
    inert: true,
  });
  return regeneratePromise
    .then((session) => {
      regeneratePromise = null;
      if (session.objectType === 'admin') throw new Error(ADMIN_LOGIN_ERROR);
      store.set(sessionAtom, session);
    })
    .catch((error) => {
      console.error(error);
      regeneratePromise = null;
      store.set(awaitingLogoutAtom, true);
      throw error;
    });
};

export const matchUnrecoverableSession = (error: Fault) =>
  error.message === 'UNRECOVERABLE_SESSION';
