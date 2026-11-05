# Forio Pipeline Example

A [Forio Epicenter](https://forio.com/epicenter/) simulation built from the
**Epicenter React template** (`dev-base-build`) and laid out so the platform's
**pipeline** feature can clone it from GitHub and build it on Epicenter.

The interface is a React + Vite + TypeScript app using the `epicenter-libs` v3
adapters, TanStack Query, Radix UI, CSS Modules and `cva`. The sim itself is the
template's "Bike Shop" Excel model.

---

## Table of contents

1. [Repository layout](#repository-layout)
2. [Quick start](#quick-start)
3. [.env configuration](#env-configuration)
4. [Project scripts](#project-scripts)
5. [Building on Epicenter with the pipeline](#building-on-epicenter-with-the-pipeline)
6. [Architecture overview](#architecture-overview) • [Routing & guards](#routing--guards)
   • [Authentication flow](#authentication-flow) •
   [Data‑fetching conventions (`query/`)](#data-fetching-conventions-query) •
   [Extending the UI component system (`components/ui/`)](#extending-the-ui-component-system-componentsui)
7. [Internationalization (i18n)](#internationalization-i18n)

---

## Repository layout

The project uses Epicenter's **rational (directory) layout**: the platform clones
this repository into the project's `src/` directory, so the repository root *is*
`src/`.

```
<repo>/
  interface/     the npm project (Vite + React + TypeScript)
  model/         model.xlsx and model.ctx2
  pipeline/      copies of the *.cfg1 pipeline configs (live ones: config/pipeline on Epicenter)
  tests/         parity and browser tests
  update_notes/  reference material, discussion notes
  notes/         conversion guides; epicenter_credentials_local.md is git-ignored
  target/        git-ignored local build output, same shape as Epicenter's target/
```

* `npm run build` (in `interface/`) writes to `../target/interface`, the folder
  Epicenter serves at `/app/{account}/{project}/`.  Inside the pipeline's build
  container the same path is `/target/interface`.
* `npm run build:model` copies `model/` to `target/model` locally; on the platform
  the pipeline's `copy` operation does the same.
* Do **not** nest the npm project under `src/` in this repo: that would become
  `src/src/interface` on the platform.

---

## Quick start

```bash
cd interface

# 1  Use the Node version declared in .nvmrc (the pipeline builds with Node 24)
nvm use

# 2  Install deps
npm install

# 3  Point .env at your account/project (see below)

# 4  Run the dev server
npm run dev             # http://localhost:8888
```

> **Production note** When this bundle is served from
> `https://forio.com/app/<account>/<project>/…`, Epicenter automatically reads the
> **account** and **project** from the URL and injects them into every API call. The
> `.env` file is **only** used when you develop on `localhost`, because the browser URL no
> longer contains that information.

---

## .env configuration

`src/main.tsx` switches the Epicenter SDK into _local mode_ (`config.isLocal() === true`)
whenever the app is served by Vite. Provide the following variables in a top‑level
**`.env`** file:

| Variable                         | Example             | Purpose                                      |
| -------------------------------- | ------------------- | -------------------------------------------- |
| `VITE_DEV_ACCOUNT_SHORT_NAME`    | `acme-simulations`  | Your Epicenter account slug                  |
| `VITE_DEV_PROJECT_SHORT_NAME`    | `supply-chain-game` | The project (simulation) slug                |
| `VITE_DEV_API_HOST` _(optional)_ | `forio.com`         | Override only if you proxy the Epicenter API |

If `VITE_DEV_API_HOST` is omitted it falls back to `forio.com` – the public cloud.

```ts
// src/main.tsx – excerpt
if (config.isLocal()) {
  config.accountShortName = import.meta.env.VITE_DEV_ACCOUNT_SHORT_NAME;
  config.projectShortName = import.meta.env.VITE_DEV_PROJECT_SHORT_NAME;
  config.apiHost = import.meta.env.VITE_DEV_API_HOST; // default: "forio.com"
}
```

---

## Project scripts

Run these from `interface/`.

| Script                    | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`             | Launches Vite with React Fast‑refresh on **`localhost:8888`**            |
| `npm run build`           | Type‑checks (`tsc -b`) then builds a production bundle into `../target/interface` |
| `npm run build:model`     | Copies `../model` to `../target/model`                                   |
| `npm run preview`         | Serves the **built** bundle locally                                      |
| `npm run lint`            | ESLint + TypeScript rules (`eslint.config.js`)                           |
| `npm run deploy`          | Build, then upload `target/interface` and `target/model` with the File API (fast iteration loop) |
| `npm run pipeline -- …`   | Upload / run / list Epicenter pipeline configs (see below)               |
| `npm run project -- …`    | One-time project setup: `create`, `access`, `git`, `git-status`, `info`  |
| `postinstall`             | Applies any **patch‑package** overrides                                  |

### CLI credentials

The CLIs read `host:`, `author:` and `password:` from the git-ignored
`notes/epicenter_credentials_local.md` (first occurrence of each wins) and the
account / project short names from `interface/.env`.  Nothing secret goes into
git, tests or pipeline configs.

---

## Building on Epicenter with the pipeline

One-time setup (per project):

```bash
cd interface
npm run project -- create                 # creates the project with layout RATIONAL, accessType public
ssh-keygen -t ed25519 -N "" -f /tmp/deploy-key
#   add /tmp/deploy-key.pub as a read-only deploy key on the GitHub repo, then:
npm run project -- git git@github.com:forio/forio-pipeline-example.git /tmp/deploy-key /tmp/deploy-key.pub
npm run pipeline -- upload build          # pipeline/build.cfg1 → config/pipeline/build.cfg1
```

Every build afterwards:

```bash
git push                                   # the pipeline builds what is on GitHub
npm run pipeline -- run build              # git sync → npm ci → npm run build → copy model
```

The config (`pipeline/build.cfg1`) runs four operations: `git` (syncs `src/` with
`main`, discarding local changes), two `npm` steps in a Node 24 container with
`/src` and `/target` mounted (working directory `/src/interface`), and `copy`
`MODEL`.  `pipeline/build-dev.cfg1` is the same for the `develop` branch.
Pipeline configs live outside the git checkout; re-upload from `pipeline/` if
`config/pipeline` is empty after a reset.

---

## Architecture overview

### Routing & guards

File‑based routes live under **`src/routes/`**. A single HashRouter tree is created in
`main.tsx`:

| URL             | Guard                | Shell              | Purpose                                                |
| --------------- | -------------------- | ------------------ | ------------------------------------------------------ |
| `#/`            | `RequireFocusedAuth` | `PlayerShell`      | Participant view                                       |
| `#/facilitator` | `RequireFocusedAuth` | `FacilitatorShell` | Facilitator dashboard (lazy‑loaded)                    |
| `#/login`       | `RedirectIfAuthed`   | –                  | Public login page                                      |
| `#/logout`      | –                    | –                  | Triggers `authAdapter.logout()` and clears local state |

- **`RequireFocusedAuth`** – redirects to `/login` unless a _session + group_ exist.
- **`RedirectIfAuthed`** – keeps logged‑in users away from `/login`, forwarding them to
  the correct shell.

### Authentication flow

All auth calls use the **`authAdapter`** from `epicenter-libs` v3, wrapped in
TanStack Query **mutations** (`src/query/auth.ts`).

1. **Login** `authAdapter.login({ handle, password, groupKey? })` – if the response has
   `multipleGroups: true` we fetch the list of groups, render a radio table, and re‑submit
   with a chosen `groupKey`.
2. **Session regeneration** Epicenter expires tokens after inactivity. Errors with codes
   `AUTHENTICATION_EXPIRED` or `AUTHENTICATION_INVALIDATED` trigger the
   `regenerateSession()` helper, which calls `authAdapter.regenerate()` and then retries
   the failed query transparently.
3. **Logout (`#/logout`)** The dedicated route calls `authAdapter.logout()`, clears the
   QueryClient, wipes Jotai atoms, and finally navigates to `/login`.

### Data‑fetching conventions (`query/`)

Every _read_ lives in its own module, returning a **`queryOptions`** object. Components
consume them via `useQuery(...)`.

#### Key design rules

1. **Include every variable the `queryFn` depends on in `queryKey`.** This guarantees that
   a change in any dependency results in a _new_ cache entry instead of stale data reuse.
2. **Order key parts from broad → narrow.** Doing so lets you selectively invalidate
   coarse slices (e.g. `['episode']`) without evicting unrelated child caches.

#### Example – `EpisodeQuery.current`

```ts
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
      throw new Error('No episode found');
    },
    staleTime: Infinity,
    enabled: Boolean(session.groupName),
  });
```

> When you pass this object to `useQuery(EpisodeQuery.current({ session }))` the key is
> guaranteed to change whenever **`session.groupName`** does, which forces a refetch
> instead of leaking data across groups.

### Extending the UI component system (`components/ui/`)

- **CSS Modules** – local, hashed class names.
- **Radix UI primitives** – accessibility & behaviour (e.g. `@radix-ui/react-dialog`).
- **Design tokens** – all colours, spacing, and radii live in `src/styles/tokens.scss`
  (Radix colour scales mapped to CSS variables).
- **`cva` (class‑variance‑authority)** – declarative styling variants.

#### `cva` primer

```ts
import { cva, type VariantProps } from 'class-variance-authority';
import styles from './tag.module.scss';

// 1 Define once
export const tagVariants = cva(styles.base, {
  variants: {
    intent: {
      info: styles.info,
      success: styles.success,
      danger: styles.danger,
    },
    size: {
      sm: styles.sm,
      lg: styles.lg,
    },
  },
  compoundVariants: [
    {
      intent: 'danger',
      size: 'lg',
      class: styles.dangerLgShadow,
    },
  ],
  defaultVariants: {
    intent: 'info',
    size: 'sm',
  },
});

// 2 Consume in the component
export interface TagProps extends VariantProps<typeof tagVariants> {}

export const Tag: React.FC<React.PropsWithChildren<TagProps>> = ({ intent, size, children }) => (
  <span className={tagVariants({ intent, size })}>{children}</span>
);
```

**Guidelines**

- Keep _layout_ (flex, grid) out of variants – reserve variants for _visual‑state_
  concerns (intent, size, emphasis).
- The first argument (`styles.base`) should contain all structural CSS; variants add or
  override.
- If a component accepts `asChild`, remember to forward the `className` to `Slot`.

---

## Internationalization (i18n)

This template includes built-in support for localization using [react-i18next](https://react.i18next.com/) and the custom `Lang` component.

Translation files live under `src/assets/lang/<language>/<namespace>.json` and are loaded at build time via [vite-plugin-i18next-loader](https://github.com/i18next/vite-plugin-i18next-loader). By default, the app is initialized with:

```ts
// src/main.tsx – excerpt
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',             // default language
  fallbackLng: 'en',     // fallback language
  defaultNS: 'common',   // default namespace
  fallbackNS: 'common',
  interpolation: { escapeValue: false },
});
```

Use the `Lang` component to translate strings in your JSX:

```tsx
import { Lang } from '~/components/lang';

// Default namespace ('common')
<Lang>sim_title</Lang>

// Specify another namespace (e.g. 'error')
<Lang ns="error">not_found</Lang>

// Interpolation via the `d` prop
<Lang ns="password-reset" d={{ handle: username }}>
  no_account
</Lang>
```

`Lang` props:
- `children`: translation key (string)
- `ns?`: optional namespace (defaults to `common`)
- `d?`: optional dictionary for interpolation
- `kp?`: optional keyPrefix for nested keys

For more complex translations with JSX markup, use the `Trans` component from `react-i18next`:

```tsx
import { Trans } from 'react-i18next';

<Trans ns="error" i18nKey="GENERIC_ERROR" components={{ 0: <a href="/logout" /> }} />
```

---

Happy sim-building! 🚀
