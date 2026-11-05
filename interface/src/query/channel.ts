import { Channel, GenericScope } from 'epicenter-libs';
import { useEffect, useMemo, useRef } from 'react';

type ChannelScope = GenericScope & {
  pushCategory: string;
};

export const useChannel = ({
  scopeBoundary,
  scopeKey,
  pushCategory,
}: {
  scopeBoundary: ChannelScope['scopeBoundary'];
  scopeKey: ChannelScope['scopeKey'];
  pushCategory: ChannelScope['pushCategory'];
}) =>
  useMemo(
    () =>
      [scopeBoundary, scopeKey, pushCategory].every(Boolean)
        ? new Channel({ scopeBoundary, scopeKey: scopeKey!, pushCategory })
        : undefined,
    [scopeBoundary, scopeKey, pushCategory]
  );

// When `channel`, subscription `callback`, or `token` changes,
// unsubscribe (cleanup) and resubscribe (body). Queue ensures most
// "up-to-date" subscribe comes last.
export const useChannelEffect = <M>({
  token,
  channel,
  callback,
}: {
  token: string;
  channel: Channel | undefined;
  callback: (data: M) => void;
}) => {
  const queue = useRef(Promise.resolve<any>(undefined));

  useEffect(() => {
    if (!channel) return;

    const subscribe = () => channel.subscribe(callback);
    const unsubscribe = () => channel.unsubscribe();

    queue.current = queue.current.then(subscribe);

    return () => {
      queue.current = queue.current.then(unsubscribe);
    };
  }, [channel, callback, token]);
};
