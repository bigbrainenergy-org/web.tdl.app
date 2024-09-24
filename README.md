# TDLAPP (new-web-tdl-app)

TDLAPP by Big Brain Energy

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

### Run test suites with live reloading

#### Integration

For Cypress, view the live GUI via https://localhost:6080

You can also switch between e2e and component testing in the Cypress GUI without stopping the command and rerunning the other.

Cypress e2e

```
yarn test:e2e
```

Cypress Components

```
yarn test:component
```

#### Unit

Results will be displayed in CLI directly

```
yarn test:unit
```

## Troubleshooting

eslint keeps crashing on first load (doesn't work until window reload):

https://github.com/microsoft/vscode-eslint/issues/1156
