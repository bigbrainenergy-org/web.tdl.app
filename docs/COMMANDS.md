# Commands
## TypeScript Debugging

See what files are being compiled by TypeScript

```sh
npx tsc --build --verbose --listFiles | less
```

Same thing but also includes WHY those files were included

```sh
npx tsc --build --verbose --explainFiles | less
```
