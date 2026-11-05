import { queryOptions } from '@tanstack/react-query';
import { Fault, UserSession, worldAdapter } from 'epicenter-libs';
import { EpisodeReadOutView } from '~/types/episode';
import { WorldReadOutView } from '~/types/world';

const bySessionPerEpisode = ({
  session,
  episode,
}: {
  session: UserSession;
  episode: EpisodeReadOutView;
}) =>
  queryOptions({
    queryKey: [
      'world',
      'bySessionPerEpisode',
      session.token,
      session.groupName,
      episode.name,
    ],
    queryFn: () =>
      worldAdapter
        .get({
          mine: true,
          groupName: session.groupName,
          episodeName: episode.name,
        })
        .then((response) => response as unknown as Array<WorldReadOutView>)
        .then(([mine]) => {
          if (!mine) throw new Fault({ status: 404, message: 'World not found' });
          return mine;
        }),
    staleTime: Infinity,
    retry(failureCount, error) {
      if (error instanceof Fault && error.status === 404) return false;
      return failureCount < 3;
    },
  });

const byEpisode = ({
  session,
  episode,
}: {
  session: UserSession;
  episode: EpisodeReadOutView;
}) =>
  queryOptions({
    queryKey: ['world', 'byEpisode', session.token, session.groupName, episode.name],
    queryFn: () =>
      worldAdapter
        .get({
          groupName: session.groupName,
          episodeName: episode.name,
        })
        .then((response) => response as unknown as Array<WorldReadOutView>),
    staleTime: Infinity,
  });

export const WorldQuery = {
  bySessionPerEpisode,
  byEpisode,
};
