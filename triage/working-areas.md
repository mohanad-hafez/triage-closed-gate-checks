# GitHub App working areas

This file is the routing source of truth for automated issue triage. Keep entries short, searchable, and tied to current engineering seams. Human owner candidates can be added as ownership stabilizes; team handles are useful for routing but should not be assigned directly to issues.

These areas are based on recent contribution patterns in `github/github-app`, not only product taxonomy.

## Conversation, composer, and agent UX

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:conversation`, `area:composer-agent`
- **Paths:** `src/components/conversation/`, `src/components/prompt-composer/`, `src/components/chats-view/`, `src/stores/conversationStore.ts`
- **Signals:** messages, composer, attachments, model picker, prompt history, response toolbar, chat timeline, agent UX

## Session runtime and protocol

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:session-runtime`, `area:protocol`
- **Paths:** `src-tauri/src/session/`, `src-tauri/src/websocket.rs`, `src/hooks/useWebSocket*.ts`, `src/types/index.ts`, `src-tauri/src/types.rs`
- **Signals:** session lifecycle, streaming, WebSocket, protocol, stuck runs, model metadata, CLI process behavior

## Workspaces, repositories, and git state

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:workspaces`, `area:git-state`
- **Paths:** `src/components/workspace-view/`, `src/components/workspace-header/`, `src/stores/workspaceStore.ts`, `src-tauri/src/workspace/`, `src-tauri/src/handlers/workspace.rs`
- **Signals:** workspace, repository, branch, worktree, clone, file sync, local changes, workspace tabs, right panel

## PR review, diffs, and comments

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:pull-requests`, `area:diff-review`
- **Paths:** `src/components/PullRequestDetailView.tsx`, `src/components/diff-surface/`, `src/components/pr-detail/`, `src/components/pull-request-comments/`, `src-tauri/src/github/`, `src-tauri/src/diff_document/`, `src-tauri/src/handlers/review.rs`
- **Signals:** pull request, PR, diff, review comment, checks, changed files, inline review, PR sync

## Canvas, terminal, tools, and extensions

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:canvas-tools`, `area:terminal`
- **Paths:** `.github/extensions/`, `src/components/widget-*/`, `src/components/TerminalPane.tsx`, `src-tauri/src/tools/`
- **Signals:** canvas, widget, terminal, tool call, extension, browser preview, MCP/tool integration

## Automation, workflows, and scheduled runs

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:workflows`, `area:automation`
- **Paths:** `.github/workflows/`, `src/components/workflows/`, `src-tauri/src/scheduler.rs`, `src/lib/cloudWorkflowTriggers.ts`
- **Signals:** scheduled workflow, GitHub Actions, run history, triggers, automation, CI workflow

## Settings, feature flags, and diagnostics

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:settings-diagnostics`, `area:feature-flags`
- **Paths:** `src/components/settings/`, `src/stores/featureFlagStore.ts`, `src/lib/debugFlags.ts`, `.github/extensions/log-trace-visualizer/`, `src-tauri/src/logging/`
- **Signals:** settings, experiments, diagnostics export, logs, traces, profiler, feature flag

## Onboarding, accessibility, and app shell

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:onboarding`, `area:app-shell`
- **Paths:** `src/components/onboarding/`, `src/components/home/`, `src/components/sidebar/`, `src/App.tsx`, `src/router.tsx`, `src/lib/keyboard-shortcuts.ts`, `src/hooks/useAppHotkeys.ts`
- **Signals:** first run, setup, install, sign in, getting started, home prompt, sidebar, navigation, keyboard navigation, accessibility

## Persistence and data model

- **Routing owner:** `@github/github-app`
- **Human owner candidates:** _Use recent git blame when concrete paths are present_
- **Labels:** `area:persistence`, `area:data-model`
- **Paths:** `src-tauri/src/database/`, `src-tauri/src/project_handlers.rs`, `src/stores/`
- **Signals:** persisted sessions, projects, database, usage data, token usage, state recovery, migrations
