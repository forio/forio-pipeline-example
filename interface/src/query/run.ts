import { queryOptions } from '@tanstack/react-query';
import { Fault, runAdapter, SCOPE_BOUNDARY, UserSession } from 'epicenter-libs';
import invariant from 'tiny-invariant';
import { EpisodeReadOutView } from '~/types/episode';
import { RunReadOutView } from '~/types/run';

export const MODEL = 'model.xlsx';

const byUserPerEpisode = ({
  session,
  episodeKey,
}: {
  session: UserSession;
  episodeKey: string;
}) =>
  queryOptions({
    queryKey: ['run', 'per-user', episodeKey, session.userKey],
    queryFn: async () => {
      const scope = {
        scopeBoundary: SCOPE_BOUNDARY.EPISODE,
        scopeKey: episodeKey,
        userKey: session.userKey,
      };
      const [run] = await runAdapter
        .query(MODEL, {
          scope,
          filter: ['run.hidden=false'],
          sort: ['-run.created'],
          max: 1,
        })
        .then((response) => response.values as Array<RunReadOutView>);
      if (run) return run;
      return runAdapter.create(MODEL, scope).then((run) => run as RunReadOutView);
    },
    staleTime: Infinity,
  });

const byWorld = ({ worldKey }: { worldKey: string }) =>
  queryOptions({
    queryKey: ['run', 'byWorld', worldKey],
    queryFn: () =>
      runAdapter
        .retrieveFromWorld(worldKey!, MODEL, { allowChannel: true })
        .then((response) => response as unknown as RunReadOutView),
    staleTime: Infinity,
  });

const RANGES = [
  'Time',
  'Bike_Sales',
  'Price',
  'Revenue',
  'Variable_Costs',
  'Fixed_Costs',
  'Total_Costs',
  'Profit',
  'Step',
] as const;

type Variables = { Step: number } & {
  [K in Exclude<(typeof RANGES)[number], 'Step'>]: number[];
};

const byEpisode = ({
  session,
  episode,
}: {
  session: UserSession;
  episode: EpisodeReadOutView;
}) => {
  const { groupRole, groupName } = session;

  invariant(
    groupRole === 'FACILITATOR',
    'Only Facilitator should call RunQuery.byEpisode'
  );

  invariant(groupName, 'Reached authenticated route without session.groupName');

  const filter = ['run.hidden=false'];
  const variables = [...RANGES];

  return queryOptions({
    queryKey: ['run', 'per-episode', groupName, episode.name, filter, variables],
    queryFn: () =>
      runAdapter
        .query(MODEL, {
          filter,
          variables,
          groupName,
          episodeName: episode.name,
        })
        .then((body) => body.values as unknown as Array<RunReadOutView<Variables>>),
  });
};

const variables = ({ runKey }: { runKey: string }) =>
  queryOptions({
    queryKey: ['run', 'variables', runKey, ...RANGES],
    queryFn: () =>
      runAdapter
        .getVariables(runKey!, [...RANGES], { ritual: 'REVIVE' })
        .then((response) => {
          invariant(
            !Array.isArray(response),
            'Fetched multiple runs when only one was expected.'
          );
          return response;
        })
        .then((response) => response as Variables),
  });

const METADATA_KEYS = [] as const;
type MetadataResponse = [];
export type Metadata = Record<string, unknown>;

const metadata = ({ runKey }: { runKey: string }) =>
  queryOptions({
    queryKey: ['run', 'metadata', runKey, ...METADATA_KEYS],
    queryFn: () =>
      runAdapter
        .getMetadata(runKey!, [...METADATA_KEYS])
        .catch((error) => {
          if (error instanceof Fault && error.status === 410) return [];
          throw error;
        })
        .then((response) => response as MetadataResponse)
        .then(
          (_values): Metadata => ({
            /* ... */
          })
        ),
  });

export const RunQuery = {
  byUserPerEpisode,
  byWorld,
  byEpisode,
  variables,
  metadata,
};
