import { useSuspenseQuery } from '@tanstack/react-query';
import { useGuardedSession } from '~/query/auth';
import { EpisodeQuery } from '~/query/episode';
import { RunQuery } from '~/query/run';

export const PlayerHome = () => {
  const session = useGuardedSession();

  const { data: episode } = useSuspenseQuery(EpisodeQuery.current({ session }));
  const { data: run } = useSuspenseQuery(
    RunQuery.byUserPerEpisode({ session, episodeKey: episode.episodeKey })
  );
  const { data: _variables } = useSuspenseQuery(
    RunQuery.variables({
      runKey: run.runKey,
    })
  );

  return null;
};
