# Pipeline configs

Copies of the Epicenter pipeline configs for this project. The live copies are
`config/pipeline/<name>.cfg1` on the Epicenter project and are **not** part of the
git checkout, so re-upload from here after a reset:

```bash
cd interface
npm run pipeline -- upload build        # uploads pipeline/build.cfg1
npm run pipeline -- run build           # runs it and tails the log
npm run pipeline -- list build          # audit history
```

| Config          | Branch    | Use                                             |
| --------------- | --------- | ----------------------------------------------- |
| `build.cfg1`    | `main`    | Production build; run after merging to `main`.  |
| `build-dev.cfg1`| `develop` | Builds the development branch.                  |

Each config: `git` sync (discards local changes on the platform) → `npm ci` →
`npm run build` (Vite writes `/target/interface`) → `copy` `model/` → `target/model`.
