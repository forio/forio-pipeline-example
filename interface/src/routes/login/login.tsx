import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Fault, Group } from 'epicenter-libs';
import { useState } from 'react';
import invariant from 'tiny-invariant';
import { Lang } from '~/components/lang';
import { Alert } from '~/components/ui/alert/alert';
import { Button } from '~/components/ui/button/button';
import { Card } from '~/components/ui/card/card';
import { Input } from '~/components/ui/input/input';
import { Label } from '~/components/ui/label/label';
import { Table } from '~/components/ui/table/table';
import { useLogin } from '~/query/auth';
import styles from './login.module.scss';
import { PasswordReset } from './password-reset';

export function Login() {
  const { mutateAsync: login } = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  const needsSelectGroup = availableGroups.length > 1;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const handle = formData.get('handle');
    const password = formData.get('password');
    const groupKey = formData.get('groupKey');

    invariant(typeof handle === 'string' && typeof password === 'string');

    if (!handle.trim() || !password.trim()) return setError('REQUIRED_FIELD');
    if (needsSelectGroup && !groupKey) return setError('NEEDS_SELECT_GROUP');
    if (groupKey !== null) invariant(typeof groupKey === 'string');

    return login({
      handle,
      password,
      groupKey: groupKey ?? undefined,
    })
      .then(([, groups]) => {
        setError(null);
        if (groups) setAvailableGroups(groups);
      })
      .catch((error: Fault) => setError(error.code ?? 'GENERIC_ERROR'));
  };

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLTableRowElement>('tr');
    if (!row) return;
    const radio = row.querySelector<HTMLInputElement>('input[type="radio"]');
    if (!radio) return;
    radio.click();
    radio.focus();
  };

  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <Card className={styles.content}>
          <form onSubmit={handleSubmit}>
            <h1>
              <Lang>login</Lang>
            </h1>
            <div className={styles.group}>
              <Label>
                <Lang>handle</Lang>
                <Input name="handle" type="text" readOnly={needsSelectGroup} />
              </Label>
              <Label>
                <Lang>password</Lang>
                <Input name="password" type="password" readOnly={needsSelectGroup} />
              </Label>
            </div>
            {needsSelectGroup && (
              <Table compact striped hover>
                <caption>
                  <Lang>select_workshop</Lang>
                </caption>
                <thead>
                  <tr>
                    <th>{null}</th>
                    <th>
                      <Lang>event</Lang>
                    </th>
                    <th>
                      <Lang>organization</Lang>
                    </th>
                    <th>
                      <Lang>start_date</Lang>
                    </th>
                    <th>
                      <Lang>workshop_id</Lang>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {availableGroups.map((group) => (
                    <tr key={group.groupKey} onClick={handleRowClick}>
                      <td>
                        <VisuallyHidden>
                          <input type="radio" name="groupKey" value={group.groupKey} />
                        </VisuallyHidden>
                      </td>
                      <td>{group.event}</td>
                      <td>{group.organization}</td>
                      <td>{new Date(group.startDate!).toLocaleDateString()}</td>
                      <td>{group.name}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {needsSelectGroup ? (
              <div className={styles.finalize}>
                <Button type="submit" variant="primary" size="md">
                  <Lang>login</Lang>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget?.form?.reset();
                    setAvailableGroups([]);
                  }}
                >
                  <Lang>login_as_another_user</Lang>
                </Button>
              </div>
            ) : (
              <Button type="submit" variant="primary" size="md">
                <Lang>login</Lang>
              </Button>
            )}
            {error && (
              <Alert variant="error">
                <Lang ns="error" kp="login">
                  {error}
                </Lang>
              </Alert>
            )}
          </form>
          <PasswordReset />
        </Card>
      </div>
    </div>
  );
}
