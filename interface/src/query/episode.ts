import { queryOptions } from '@tanstack/react-query';
import { Fault, UserSession, episodeAdapter } from 'epicenter-libs';
import { EpisodeReadOutView } from '~/types/episode';

const current = ({ session }: { session: UserSession }) =>
  queryOptions({
    queryKey: ['episode', 'current', session.groupName, session.groupRole],
    queryFn: async () => {
      const [current] = await episodeAdapter
        .query({
          sort: ['-episode.created'],
          max: 1,
        })
        .then((response) => response.values as Array<EpisodeReadOutView>);
      if (current) return current;
      if (session.groupRole === 'FACILITATOR') {
        const episodeName = 'ep'.concat(Date.now().toString());
        return episodeAdapter
          .create(episodeName, session.groupName!)
          .then((episode) => episode as unknown as EpisodeReadOutView);
      }
      throw new Fault({ status: 404, message: 'No episode found' });
    },
    staleTime: Infinity,
    retry(failureCount, error) {
      if (error instanceof Fault && error.status === 404) return false;
      return failureCount < 3;
    },
  });

const push = (groupName: string) =>
  episodeAdapter
    .create('ep'.concat(Date.now().toString()), groupName)
    .then((episode) => episode as unknown as EpisodeReadOutView);

const list = ({ session }: { session: UserSession }) =>
  queryOptions({
    queryKey: ['episode', 'list', session.groupName],
    queryFn: async () =>
      episodeAdapter
        .query({ sort: ['-episode.created'] })
        .then((response) => response.values as Array<EpisodeReadOutView>),
    staleTime: Infinity,
  });

export const EpisodeQuery = {
  current,
  push,
  list,
};
