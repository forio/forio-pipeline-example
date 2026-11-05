# Convert the dev-base-build to use Epicenter pipeline feature

## 1. General instructions

Convert this project to form that can be built using Epicenter pipeline.

Change the repository layout to follow the rational layout (also known as developer layout).

Push to new Git project.  
https://github.com/forio/forio-pipeline-example

Create a new project on the sandbox.  Update the Pipeline to clear the repo, sync the git, build the project.

Verify that the sim is correctly built and installed and can be run.


## 2. Repository layout: the repository root is Epicenter's `src/`

With the project's "rational" (directory) layout the platform clones the
repository into `src/`, so:

```
<repo>/
  interface/     the npm project (Vite + React + TypeScript from dev-base-build)
  model/         model file(s), data files, <model>.ctx2
  pipeline/      copies of the *.cfg1 pipeline configs (the live ones are in config/pipeline on Epicenter)
  tests/         parity and browser tests
  update_notes/  screenshots, spec, plan, VPAT, reference material
  notes/         conversion guides; epicenter_credentials_local.md is git-ignored
  target/        git-ignored local build output, same shape as Epicenter's target/
```

* Do **not** nest `src/interface` inside the repository: that would become
  `src/src/interface` on the platform and the pipeline's build container
  (working directory `/src/interface`) would not find `package.json`.
* Vite writes to `../target/interface` with `emptyOutDir: true` and
  `base: './'`; inside the build container the same path is
  `/target/interface`.  `npm run build:model` copies `../model` to
  `../target/model` locally (the pipeline's `copy` step does it on the
  platform).
* `target/interface` is what `/app/{account}/{project}/` serves and
  `target/model/<file>` is what runs; the File API paths are
  `target/interface`, `target/model` (there is no top-level `interface/`).

## 3. Project setup on Epicenter (once per project)

1. Create the project with the **directory (rational) layout**.
2. **Git integration**: `POST /api/v3/{account}/{project}/git/integration`
   (or the admin UI) with the SSH URL and an ed25519 key pair; add the public
   key as a GitHub deploy key.  `GET /git/status` shows the branch.
3. **Login-free sims**: set `accessType: "public"`
   (`PATCH /project`, body `{"objectType":"team","accessType":"public"}`).
   With a public project every `@Participant` endpoint accepts an anonymous
   session, so anonymous users can create and drive runs.  The project's
   `sessionTimeoutSeconds` (default 1200) is how long an idle run stays in
   memory.
4. **Test fixtures**: a public sim needs no users.  For authenticated sims,
   create the test group/users per project and record them only in the
   git-ignored credentials file.

## 4. The pipeline

Config = JSON file `config/pipeline/<name>.cfg1` on the project (keep a copy
in `pipeline/` in git):

```json
{
  "auditRetentionCount": 20,
  "operations": [
    { "objectType": "git",  "branch": "main", "confirmed": true },
    { "objectType": "npm",  "nodeVersion": "v24", "directory": "interface",
      "commands": ["npm", "ci"], "timeoutMinutes": 20 },
    { "objectType": "npm",  "nodeVersion": "v24", "directory": "interface",
      "commands": ["npm", "run", "build"], "timeoutMinutes": 20 },
    { "objectType": "copy", "items": [{ "location": "MODEL" }] }
  ]
}
```

| Operation | Notes |
|---|---|
| `git` | Synchronises `src/` with the remote branch, discarding local changes; `confirmed: true` is required. Points `src/` at that branch from then on. |
| `npm` | Runs **one argv command** in a Node container (`nvm` versions `v24`, `v16`) with `/src` and `/target` mounted; working dir `/src/interface` (or `proxy`). Network access works. Use one `npm` operation per command. Timeout 1–60 minutes (default 15). |
| `copy` | `src/<location>[/from]` → `target/<location>[/to]`, locations `INTERFACE`, `PROXY`, `MODEL`, `DATA`. |
| `clean` | Empties `target/`; avoid it, a failed build would leave the site empty. |
| `configure` | Creates vaults/personas. |

API: upload the config with `POST /file/config/pipeline` (multipart; **delete
the old file first**, uploads do not overwrite), run with
`POST /pipeline/{name}`, poll `GET /pipeline/{auditKey}` until `SUCCEEDED`,
read `log/pipeline/{name}-{auditKey}.log` (one JSON object per line).  The
NPS repo has a CLI for all of this (`interface/cli/pipeline.ts`:
`npm run pipeline -- upload|run|list <name>`).

Gotchas:

* Commit `package-lock.json`; `npm ci` fails without a matching lockfile.
* The pipeline builds what is on GitHub: push first.  Use a second config
  (`build-dev.cfg1`) that tracks the development branch, and re-run the
  `main` config after merging.
* Pipeline configs live outside the git checkout; if `config/pipeline` is
  empty after a reset, re-upload from `pipeline/`.
* The File-API CLI deploy (`npm run deploy`) is still the fastest loop while
  iterating; the pipeline is the reproducible build.

## 5. Credentials and shared infrastructure

* `notes/epicenter_credentials_local.md` is git-ignored; the CLI parses its
  `host:`, `author:`, `password:` lines (first occurrence wins) and takes
  account/project from `interface/.env`.  Nothing secret goes into git,
  tests or pipeline configs.
* Changes to shared infrastructure (project access type, pipeline configs,
  `target/` contents) are part of the deliverable: list them in the final
  report.
