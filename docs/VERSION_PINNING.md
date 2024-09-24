# Version Pinning

For anything that is not using `latest` or `beta` (aka, locked to a version like `3.x` or similar), we should have the reasoning documented so that we know:

1) Why the version lock was introduced in the first place
2) When it can be removed or bumped to a newer version

Anything with version pinning in our `package.json` should be in this document.

## Dependencies

### `pinia-plugin-persisted-state` - `3.x.`

Version 4 introduces a couple breaking changes that we have yet to migrate the code to. It seems to cause some TypeScript breakage, but it's not immediately apparent why. Needs further investigation.

See also:
https://github.com/prazdevs/pinia-plugin-persistedstate/releases/tag/v4.0.0

## Dev Depedencies

### `typescript` - `5.5.x`

TypeScript ESLint has yet to add support for TypeScript 5.6, pending this PR:
https://github.com/typescript-eslint/typescript-eslint/pull/9972

Once supported (PR is merged), we should be able to return to `latest`.

## Engines

### `node` - `20.x`

This needs to be in lockstep with the version of node we're using both for the devcontainer and for production. Because it tends to not change often, and has breaking changes when it does, it's best to keep this locked to whatever current major version we're using.

### `yarn` - `1.x`

The `1.x` release train is yarn "Classic", which is still the defacto way to use Yarn. The yarn project wants people to move to yarn "modern", but it's got sharp edges that aren't worth the effort atm.
