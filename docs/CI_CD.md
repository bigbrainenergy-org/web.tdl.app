# Continous Integration and Continous Delivery (CI/CD)
## GitHub Actions
### Docker Publish

Because publishing the docker images is roughly equivalent to our CD "deploy to production" step while in early development, it makes sense to make it only fire on semver tag. This way, it remains an intentional way to trigger new releases, while allowing for main to serve as our development branch. In the future, it would make sense to separate this out into a development branch and production branch, with new commits to the production branch automatically getting a semver and triggering a release.

### Test Suite

The primary reason for having the test suite on a recurring schedule is to catch dependency vulnerabilities via `yarn audit` in the test suite.

REVIEW: This may be redundant with dependencybot serving a similar function.
