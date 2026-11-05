import { Fault, Router } from 'epicenter-libs';
import type { Config } from './config';

export const normalizeFetchResponse = async (
  response: Response,
  reader?: (response: Response) => Promise<any>
) => {
  const contentType = response.headers.get('content-type') || '';
  const matchJSON = contentType.toLowerCase().includes('application/json');

  let payload;
  try {
    payload = reader
      ? await reader(response)
      : matchJSON
      ? await response.json()
      : await response.text();
  } catch (parseError) {
    throw new Fault(
      {
        status: response.status,
        message: `Failed to parse response from ${response.url} with response type ${contentType}.`,
        cause: parseError,
      },
      response
    );
  }

  if (response.ok) return payload;

  const message =
    typeof payload === 'string'
      ? payload
      : payload?.message || 'An unknown error occurred';

  throw new Fault(
    {
      status: response.status,
      message,
      information:
        typeof payload === 'object' && 'information' in payload
          ? payload.information
          : undefined,
    },
    response
  );
};

export const router = (config: Config) =>
  new Router()
    .withServer(config.SERVER)
    .withAccountShortName(config.ACCOUNT_SHORT_NAME)
    .withProjectShortName(config.PROJECT_SHORT_NAME);

/**
 * Admin login. The authentication route is project-scoped; pass `projectShortName` to
 * authenticate against another project in the account (e.g. the literal `project`
 * segment used by account-level routes) when the configured project does not exist yet.
 */
export const login = (config: Config, projectShortName?: string) =>
  (projectShortName ? router(config).withProjectShortName(projectShortName) : router(config))
    .post('/authentication', {
      inert: true,
      body: {
        handle: config.ADMIN_HANDLE,
        password: config.ADMIN_PASSWORD,
        objectType: 'admin',
      },
    })
    .then(({ body }) => body)
    .then(({ token }) => token as string);

export const getFiles = (token: string, path: string, config: Config) =>
  router(config)
    .withAuthorization(`Bearer ${token}`)
    .get(`file/${path}`)
    .then(
      ({ body }) =>
        body as Array<{ name: string; objectType: 'directory' | 'file' }>
    );

export const downloadFile = (token: string, path: string, config: Config) => {
  const url = router(config).getURL(`file/download/${path}`);
  return fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => normalizeFetchResponse(res, (res) => res.blob()));
};

/**
 * Empties a directory by deleting all files and subdirectories
 * Handles errors gracefully and continues deletion even if some files fail
 */
export const emptyDirectory = async (path: string, token: string, config: Config) => {
  let files;
  try {
    files = await getFiles(token, path, config);
  } catch (error) {
    console.warn(`Could not list files in ${path}:`, error);
    return; // Continue gracefully if directory doesn't exist or can't be listed
  }

  for (const file of files) {
    try {
      await router(config)
        .withAuthorization(`Bearer ${token}`)
        .delete(`file/${path}/${file.name}`);
    } catch (error) {
      // Log error but continue with remaining files
      console.warn(`Failed to delete ${path}/${file.name}:`, error);
    }
  }

  return;
};

export const postFile = (path: string, token: string, config: Config) => (file: File) => {
  const payload = new FormData();
  payload.append('file', file);

  const url = router(config).getURL(`file/${path}`);
  return fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  }).then(normalizeFetchResponse);
};

export const postZip = postFile;

export const deleteFile = (path: string, token: string, config: Config) =>
  router(config)
    .withAuthorization(`Bearer ${token}`)
    .delete(`file/${path}`)
    .then(({ body }) => body);

export const downloadText = (path: string, token: string, config: Config) => {
  const url = router(config).getURL(`file/download/${path}`);
  return fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => normalizeFetchResponse(res, (res) => res.text()));
};

export const explodeZip = (path: string, token: string, config: Config) => {
  const url = router(config).getURL(`file/explode/${path}`);
  return fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  }).then(normalizeFetchResponse);
};
