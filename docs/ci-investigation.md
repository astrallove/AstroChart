# CI Investigation: Why commit `b12869ad` did not trigger a build

## Context

Commit `b12869ad763be330979b6f5637da7d3d602c7df9` in PR #5 (`ralph/issue-3` branch) did not trigger a CI build. This document explains the root cause and provides a recommended fix.

## Root Cause

**No CI workflow exists that triggers on `push` or `pull_request` events.**

The repository has three workflows, none of which run CI checks on code changes:

| Workflow | File | Trigger Events |
|----------|------|---------------|
| Node.js Package | `npm-publish.yml` | `release` (published) |
| Agentic Development with Claude and Ralph | `ralph.yml` | `issues` (labeled, edited), `issue_comment` (created), `pull_request` (labeled) |
| Prune merged branches | `prune-branches.yml` | `schedule` (weekly), `workflow_dispatch` |

- **npm-publish.yml** only runs when a GitHub release is published. It does run `npm ci` and `npm test`, but only as a pre-publish step during releases.
- **ralph.yml** triggers on issue and PR label events for the Ralph agentic workflow. It does not run tests.
- **prune-branches.yml** runs on a weekly schedule to clean up merged branches. It does not run tests.

Because no workflow listens for `push` or `pull_request` events, commits and pull requests never trigger a build.

## Recommended Fix

Add a CI workflow file at `.github/workflows/ci.yml` with the following content:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
      - uses: actions/setup-node@6044e13b5dc448c55e2357c09f80417699197238 # v6.2.0
        with:
          node-version: 16
      - run: npm ci
      - run: npm test
```

### Notes on the recommended configuration

- **Triggers**: Runs on pushes to `main` and on all pull request events, ensuring every code change is validated.
- **Pinned action SHAs**: Uses the same pinned commit SHAs as the existing `npm-publish.yml` workflow (`actions/checkout@de0fac2e...` and `actions/setup-node@6044e13b...`) for consistency and supply-chain security.
- **Node.js version**: Uses Node.js 16 to match the existing `npm-publish.yml` configuration.
- **Commands**: Runs `npm ci` (clean install) followed by `npm test`, matching the existing publish workflow's test step.

### How to apply

A repository administrator must manually create the file `.github/workflows/ci.yml` with the content above. This cannot be done via a pull request from an automated workflow due to GitHub's restriction on modifying workflow files without the `workflows` token permission.
