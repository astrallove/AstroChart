# CI Investigation: Why commit `b12869ad` did not trigger a build

## Context

Commit `b12869ad763be330979b6f5637da7d3d602c7df9` in PR #5 (`ralph/issue-3` branch) did not trigger a CI build. This document explains the root cause.

## Root Cause

**The commit was pushed using `GITHUB_TOKEN` credentials, and GitHub Actions suppresses workflow triggers from `GITHUB_TOKEN` to prevent recursive runs.**

The repository does have a CI workflow (`checks.yaml`) that triggers on `pull_request` and `push` to `main`:

| Workflow | File | Trigger Events |
|----------|------|---------------|
| checks | `checks.yaml` | `pull_request`, `push` to `main` |
| Node.js Package | `npm-publish.yml` | `release` (published) |
| Agentic Development with Claude and Ralph | `ralph.yml` | `issues` (labeled, edited), `issue_comment` (created), `pull_request` (labeled) |
| Prune merged branches | `prune-branches.yml` | `schedule` (weekly), `workflow_dispatch` |

The `checks.yaml` workflow is correctly configured to run lint, tests, and build on every pull request. However, commit `b12869ad` was pushed to the PR branch by the Ralph workflow, which uses `GITHUB_TOKEN` for git operations.

Per [GitHub's documentation](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow):

> When you use the repository's GITHUB_TOKEN to perform tasks, events triggered by the GITHUB_TOKEN, with the exception of workflow_dispatch and repository_dispatch, will not create a new workflow run. This prevents you from accidentally creating recursive workflow runs.

## Detailed Timeline

| Time (UTC) | Event | Details |
|------------|-------|---------|
| 22:09:02 | Commit `66787727` pushed | Ralph bot pushes first commit to `ralph/issue-3` |
| 22:09:57 | PR #5 created | Created via GitHub API using PAT (`GH_PAT_TOKEN`) by `astrallovedev` |
| 22:10:00 | `checks` workflow triggered | `pull_request.opened` event fires for `66787727` — **build runs** |
| 22:12:26 | Commit `e2d975bd` pushed to `main` | New commit lands on `main` |
| 22:14:38 | Commit `b12869ad` pushed | Ralph bot merges `origin/main` into `ralph/issue-3` (merge commit with parents `66787727` + `e2d975bd`) |
| — | No workflow triggered | Push was made with `GITHUB_TOKEN` → `pull_request.synchronize` event suppressed |

### Why the first commit got a build but the second did not

The first commit (`66787727`) did not directly trigger a build either. The build ran because **PR #5 was created** immediately after the first commit was pushed. The PR was created via the GitHub API using the `GH_PAT_TOKEN` (a Personal Access Token), which is attributed to `astrallovedev`. Events from PATs *do* trigger workflow runs, so the `pull_request.opened` event fired and the `checks` workflow ran.

The second commit (`b12869ad`) was pushed later via `git push` using the default credentials set up by `actions/checkout`, which uses `GITHUB_TOKEN`. The push appeared in the event log as coming from `github-actions[bot]`. Since `GITHUB_TOKEN` events are suppressed, the expected `pull_request.synchronize` event never fired.

### Evidence

- Workflow run `22159660422`: triggered by `pull_request` event, `head_sha=66787727`, `triggering_actor=astrallovedev` — confirms the build was from PR creation, not from the push
- No workflow run exists with `head_sha` matching `b12869ad`
- Push events in the repo audit log show `github-actions[bot]` pushing at 22:16:43Z (the `b12869ad` push)
- The Ralph workflow (`ralph.yml`) passes `secrets.GH_PAT_TOKEN` to the action but `actions/checkout` defaults to `GITHUB_TOKEN` for git credentials

## Recommended Fix

Configure `actions/checkout` in the Ralph workflow to use the PAT for git operations. This ensures pushes made during the workflow are attributed to the PAT owner and trigger downstream workflow events.

In `.github/workflows/ralph.yml`, update the checkout step:

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
  with:
    token: ${{ secrets.GH_PAT_TOKEN }}
```

When `actions/checkout` receives a `token` parameter, it configures the git credential helper to use that token for subsequent git operations (push, fetch, etc.). Commits pushed with a PAT are not subject to the `GITHUB_TOKEN` event suppression, so `pull_request.synchronize` events will fire and the `checks` workflow will run for every new commit on a PR branch.

### Alternative approaches

- **Use a GitHub App installation token** instead of a PAT, generated via `actions/create-github-app-token`. App tokens also trigger workflow events and are more granular than PATs.
- **Add `workflow: write` permission** and use `workflow_dispatch` to explicitly trigger the checks workflow after pushing. This is more complex and less conventional.
