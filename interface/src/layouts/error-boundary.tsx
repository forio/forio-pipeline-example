import { useAtomValue } from 'jotai';
import React from 'react';
import { isRouteErrorResponse, Navigate, useRouteError } from 'react-router';
import { sessionAtom } from '~/query/auth';

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { hasError: boolean; error: Error | undefined }
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="">
          <div className="">
            <h1 className="">😵 Splat!</h1>
            <p className="">Something went wrong.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const NotFound = () => (
  <div className="">
    <div className="">
      <h1 className="">🔍 404</h1>
      <p className="">Page not found.</p>
    </div>
  </div>
);

export const RouteErrorBoundary = () => {
  const error = useRouteError();
  const session = useAtomValue(sessionAtom);

  if (isRouteErrorResponse(error) && error.status === 404) {
    if (!session) return <Navigate to="/login" />;
    const { groupKey } = session;
    if (!groupKey) return <Navigate to="/login" />;
    return <NotFound />;
  }
};
