# 2026-11-05 — Conversion to the Epicenter pipeline build

Source: `notes/pipeline_dev_instructions.md`. Repository: https://github.com/forio/forio-pipeline-example

## Shared infrastructure created / changed (epicenter-sandbox-1.forio.com, account `wgh`)

| Item | Value |
| --- | --- |
| Project | `forio-pipeline-example` ("Forio Pipeline Example"), layout `RATIONAL`, `accessType: public` |
| Web access | `structure.enforceFilePermissions: false` (allow all URLs by default) |
| Git integration | `ssh://git@github.com/forio/forio-pipeline-example.git`, ed25519 deploy key (read-only, registered on GitHub as "epicenter-sandbox-1") |
| Pipeline configs | `config/pipeline/build.cfg1` (main), `config/pipeline/build-dev.cfg1` (develop) — copies in `pipeline/` |
| Test group | `pipeline-test` with the users from the credentials file (1 facilitator, 2 participants) |
| Sim URL | https://epicenter-sandbox-1.forio.com/app/wgh/forio-pipeline-example/ |

## Platform facts learned (not in the instructions)

* The git integration decodes `privateKey` as the **base64 body of a PKCS#8 key** (no PEM
  armor) and the `uri` with a URL parser, so use `ssh://git@github.com/org/repo.git`; an
  OpenSSH-format private key fails with "Not a base64 encoded stream" and the scp-style URI
  with "Illegal character in scheme name".
* The npm operation's working directory is `/src/interface` and the project's `target/` is
  mounted at `/target`; `../target` therefore lands in `src/target`. `vite.config.ts` writes
  to `/target/interface` when that mount exists.
* The pipeline log (`log/pipeline/<name>-<auditKey>.log`) is JSON objects concatenated
  without newlines.
* Authentication is project-scoped, so creating a project needs an admin login against
  `/api/v3/<account>/project/authentication`.

## Verification

* Pipeline `build` SUCCEEDED (git → npm ci → npm run build → copy MODEL), ~35 s.
* `GET /app/wgh/forio-pipeline-example/` → 200, title "Bike Shop", login page renders with
  no console errors (`2026-11-05-pipeline-build-login.png`).
* `npm run test:smoke` → episode created by facilitator, participant run of `model.xlsx`
  (`language=excel`), variables `Step`, `Price`, `Bike_Sales`, `Profit` returned.
