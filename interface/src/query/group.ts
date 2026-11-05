import { queryOptions } from '@tanstack/react-query';
import { UserSession, groupAdapter } from 'epicenter-libs';
import { GroupPermissionReadOutView } from '~/types/group';

const members = ({ session }: { session: UserSession }) =>
  queryOptions({
    queryKey: ['group', 'members', session.groupKey],
    queryFn: async () => {
      return groupAdapter
        .get({
          augment: 'MEMBERS',
          groupKey: session.groupKey,
        })
        .then(
          (response) =>
            (response.members ?? []) as unknown as Array<GroupPermissionReadOutView>
        );
    },
  });

export const GroupQuery = {
  members,
};
