# Velocity Dashboard - AI Development Organization

このリポジトリは 9 つの AI エージェントによる組織で運用されます。各エージェントは独立して判断し、前工程の成果物を入力として利用します。

## 最優先原則

**機能追加ではなく UX 改善を最優先**。すべての提案・実装は次の 4 つを満たす必要があります。

| 基準 | 質問 |
|------|------|
| 視認性 | Jira より見やすいか？ |
| 操作性 | Jira よりクリック数が少ないか？ |
| 検索性 | Jira より検索しやすいか？ |
| 速報性 | Jira より状況把握が速いか？ |

いずれかに反する提案は **UX Agent が拒否権を持って却下** します。

## ワークフロー

```
Product Owner
       │
       ▼
   Architect
       │
       ▼
Backend / Frontend (parallel)
       │
       ▼
   Reviewer
       │
       ▼
       QA
       │
       ▼
    Release
```

`UX Agent` `Data Analyst` `AI PM` はこのパイプラインに対して **水平に作用** します。
- UX Agent は全フェーズで拒否権を行使
- Data Analyst は機能提案の根拠を提供
- AI PM は次に何を作るかを決定

## エージェント一覧

| エージェント | 主要成果物 | 定義ファイル |
|-------------|-----------|-------------|
| Product Owner | `01-requirements.md` `roadmap.md` | `.claude/agents/product-owner.md` |
| Architect | `02-architecture.md` `sequence_diagram.md` | `.claude/agents/architect.md` |
| Backend | source code, `api-spec.md` | `.claude/agents/backend.md` |
| Frontend | source code, Storybook | `.claude/agents/frontend.md` |
| UX | `03-ux_review.md` `wireframe.md` | `.claude/agents/ux.md` |
| Reviewer | `review_report.md` | `.claude/agents/reviewer.md` |
| QA | `test_plan.md` | `.claude/agents/qa.md` |
| Data Analyst | `analytics_report.md` | `.claude/agents/data-analyst.md` |
| AI PM | `feature_proposals.md` | `.claude/agents/ai-pm.md` |

## 呼び出し方

Claude Code セッション内で次のように呼び出します。

```
/agents
```

で一覧を表示、もしくはプロンプト内で `subagent_type` に名前を指定。

例: 「UX Agent として現在の Gantt タブを批評してください」

## このリポジトリでの現状

- バックエンドはまだフロント内（`src/services/jiraApi.ts`）に同居。Backend Agent は分離 or 強化どちらを取るか判断する。
- TanStack Query / Zustand は未導入。Frontend Agent が導入タイミングを決める。
- Storybook 未導入。Frontend Agent の判断に委ねる。
- 既存の `src/` には Velocity / Progress / Gantt / Issues / Reports タブが既に動作している。UX Agent の最初の仕事は **既存画面の批評** であり、ゼロからの再設計ではない。
