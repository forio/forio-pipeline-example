import { useAtomValue } from 'jotai';
import { Navigate, Outlet } from 'react-router';
import { sessionAtom } from '~/query/auth';

export const RedirectIfAuthed = () => {
  const session = useAtomValue(sessionAtom);
  if (!session) return <Outlet />;

  const { groupKey, groupRole } = session;
  if (!groupKey) return <Outlet />;
  if (groupRole === 'PARTICIPANT') return <Navigate to="/" />;
  if (groupRole === 'FACILITATOR') return <Navigate to="/facilitator" />;
};
