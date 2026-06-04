# Architecture — Velocity Dashboard

作成者: Architect Agent
最終更新: 2026-06-03
入力: `01-requirements.md`, `03-ux_review.md`, `analytics_report.md`, `review_report.md`

## 設計目標

すべての設計判断は次の 3 問いに答える:
1. Jira より画面が速く描けるか？
2. Jira への往復が減るか？
3. 状態復元（深リンク、リロード）が Jira より速いか？

> 抽象的なエレガンスより、知覚パフォーマンスと摩擦低減を優先する。

---

## 全体像

```
                 ┌──────────────────────────────────┐
                 │           Browser (SPA)           │
                 │  ┌────────────────────────────┐  │
                 │  │  features/  (route ベース)   │  │
                 │  │  - summary                  │  │
                 │  │  - progress                 │  │
                 │  │  - gantt                    │  │
                 │  │  - issues                   │  │
                 │  │  - reports                  │  │
                 │  └────────────────────────────┘  │
                 │  ┌────────────────────────────┐  │
                 │  │  shared/ (UI primitives)    │  │
                 │  │  components / hooks / store │  │
                 │  └────────────────────────────┘  │
                 │  ┌────────────────────────────┐  │
                 │  │ lib/  (純粋ロジック・型)     │  │
                 │  │  jiraApi / dataset / calc   │  │
                 │  └────────────────────────────┘  │
                 │  ┌────────────────────────────┐  │
                 │  │ TanStack Query (cache)      │  │
                 │  │ Zustand (UI state)          │  │
                 │  └────────────────────────────┘  │
                 └─────────────┬────────────────────┘
                               │ HTTPS / JSON
                               ▼
                 ┌──────────────────────────────────┐
                 │     server/  (Node.js)            │
                 │  ┌────────────────────────────┐  │
                 │  │  routes/                    │  │
                 │  │  - /api/auth                │  │
                 │  │  - /api/sprints             │  │
                 │  │  - /api/issues              │  │
                 │  └────────────────────────────┘  │
                 │  ┌────────────────────────────┐  │
                 │  │  cache (LRU + TTL)          │  │
                 │  │  - per-issue                │  │
                 │  │  - in-flight dedup          │  │
                 │  └────────────────────────────┘  │
                 │  ┌────────────────────────────┐  │
                 │  │  jira/ (REST v3 wrapper)    │  │
                 │  │  retry / backoff / circuit  │  │
                 │  └────────────────────────────┘  │
                 └─────────────┬────────────────────┘
                               │
                               ▼
                       Atlassian Cloud (Jira)
```

---

## ディレクトリ再構成（提案）

### 現状

```
src/
├── components/   # 19 ファイルがフラットに並ぶ
├── hooks/        # useDataset, useJiraAuth, useSprintData
├── services/     # jiraApi, mockDataGenerator
├── utils/        # data calc, hierarchy, markdown
└── types/        # all-in-one
```

### 提案: feature folder + shared

```
src/
├── features/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── useJiraAuth.ts
│   │   └── index.ts
│   ├── summary/
│   │   ├── SummaryTab.tsx
│   │   ├── KPICards.tsx
│   │   ├── MyTasksCard.tsx      # 新規 F-009
│   │   ├── AssigneeTable.tsx
│   │   └── index.ts
│   ├── progress/
│   │   ├── ProgressTab.tsx
│   │   ├── ProgressBoard.tsx
│   │   ├── BurndownChart.tsx
│   │   └── index.ts
│   ├── gantt/
│   │   ├── GanttTab.tsx
│   │   ├── GanttChart.tsx
│   │   └── index.ts
│   ├── issues/
│   │   ├── IssuesTab.tsx
│   │   ├── IssuesTable.tsx
│   │   ├── WorkLogList.tsx
│   │   ├── IssueEditModal.tsx
│   │   ├── FiltersBar.tsx
│   │   └── index.ts
│   └── reports/
│       ├── ReportsTab.tsx
│       ├── VelocityChart.tsx
│       ├── EstimateAccuracyChart.tsx
│       └── index.ts
├── shared/
│   ├── components/        # 汎用 UI
│   │   ├── TabBar.tsx
│   │   ├── SortableHeader.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── RenderErrorBoundary.tsx
│   │   ├── Modal.tsx          # 新規（focus trap, esc, autofocus）
│   │   ├── Badge.tsx          # 新規（停滞バッジ用）
│   │   └── CommandPalette.tsx # 新規 (Cmd+K)
│   ├── hooks/
│   │   ├── useKeyboard.ts     # 新規
│   │   └── useLocalStorage.ts
│   ├── stores/                # Zustand
│   │   ├── filters.ts
│   │   └── ui.ts              # ビューモード、選択スプリント
│   └── utils/
│       └── download.ts        # JSON/CSV ダウンロードヘルパー
├── lib/
│   ├── jiraApi/
│   │   ├── client.ts          # サーバー API クライアント (fetch)
│   │   ├── transform.ts       # Jira → 内部型
│   │   └── types.ts
│   ├── dataset/
│   │   ├── useDataset.ts
│   │   └── persistence.ts     # localStorage / IndexedDB ラッパー
│   └── calc/
│       ├── kpi.ts
│       ├── hierarchy.ts
│       ├── sprint.ts
│       ├── staleness.ts       # 新規（停滞検出）
│       └── overload.ts        # 新規（overload しきい値）
├── types/
│   ├── issue.ts
│   ├── sprint.ts
│   └── index.ts
├── App.tsx
└── main.tsx
```

### 移行戦略

機械的に移動だけする。コードは変えない。**1 PR / feature folder** で移動。

---

## レイヤリング規則（厳守）

| 層 | 何を import してよいか |
|----|---------------------|
| `features/*/` | `shared/`, `lib/`, `types/` (他の `features/*/` は import 禁止) |
| `shared/` | `lib/`, `types/`（features は禁止） |
| `lib/` | `types/` のみ（React 非依存にする） |
| `types/` | なし |

ESLint の `import/no-restricted-paths` で強制。

理由: `lib/` を React 非依存にすると、サーバー側コードからも同じロジックを共有できる（特に `kpi.ts` `staleness.ts` などの計算）。

---

## バックエンド導入

### なぜ必要か（Reviewer R-001 の対応）

- Atlassian Cloud は **CORS でブラウザからの Basic Auth を弾く** ことが多い
- API Token を `sessionStorage` に保管するのはセキュリティ上の懸念
- レート制限を **チーム単位で平準化** するには中継が必要
- インテリジェントキャッシュ（per-issue 粒度）は **サーバーで持つほうが効く**

### 構成

```
server/
├── src/
│   ├── index.ts              # Fastify or Hono
│   ├── routes/
│   │   ├── auth.ts           # POST /api/auth/login, /api/auth/logout
│   │   ├── sprints.ts        # GET /api/sprints, /api/sprints/:id
│   │   ├── issues.ts         # GET /api/issues, /api/issues/:key
│   │   └── health.ts
│   ├── jira/
│   │   ├── client.ts         # Jira REST v3 wrapper
│   │   ├── retry.ts          # exponential backoff
│   │   └── dedupe.ts         # in-flight request dedup
│   ├── cache/
│   │   ├── lru.ts            # LRU + TTL（Map ベースで十分）
│   │   └── keys.ts
│   ├── session/
│   │   └── tokens.ts         # encrypted at rest（Redis or in-memory）
│   └── lib/
│       └── (シンボリックリンクで src/lib を共有)
├── package.json
└── tsconfig.json
```

技術選定:
- **Fastify** または **Hono** (Cloudflare Workers にもデプロイ可能で柔軟)
- セッション: `iron-session` (encrypted cookie)
- キャッシュ: 最初は in-memory `LRUCache`、後でスケールしたら Redis に置換

### モノレポ化

```
velocity-dashboard/
├── apps/
│   ├── web/   (現在の src/, vite.config.ts, index.html)
│   └── api/   (server/)
├── packages/
│   ├── lib/   (純粋ロジック、両方が import)
│   └── types/
├── package.json (workspaces)
└── pnpm-workspace.yaml
```

pnpm workspaces（または npm workspaces）で運用。

---

## 状態管理の境界

| 種類 | ライブラリ | 例 |
|------|----------|------|
| サーバー由来データ | TanStack Query | スプリント、課題（API レスポンス） |
| ローカル編集データ | Zustand + localStorage 永続化 | 編集中のダーティ状態、ローカル新規課題 |
| UI 状態 | Zustand（永続化なし） | 選択中タブ、選択中スプリント、モーダル開閉 |
| フォーム状態 | React useState | モーダル内のフィールド |

**現状の `useDataset`** はサーバー状態とローカル編集を混在させている。分離する:

```
TanStack Query → useServerSprints() → 純粋にサーバー由来
Zustand        → useLocalEdits()    → ユーザー編集
Component      → useSprints()       → 上 2 つをマージして返す
```

---

## キャッシュ戦略

### クライアント (TanStack Query)

| データ | staleTime | gcTime | 備考 |
|--------|-----------|--------|------|
| `/api/sprints` | 60s | 5min | バックグラウンド refetch |
| `/api/sprints/:id` | 30s | 5min | 選択中のスプリントのみ |
| `/api/issues/:key` | 5min | 30min | 個別取得 |
| `/api/users/me` | 5min | 30min | 担当者特定用 |

### サーバー (LRU + TTL)

| キー | TTL | サイズ |
|------|-----|-------|
| `jira:issue:{key}` | 60s | 5000 件 |
| `jira:sprint:{id}` | 60s | 200 件 |
| `jira:sprint:{id}:issues` | 30s | 200 件 |
| `jira:board:{id}:sprints` | 5min | 50 件 |

In-flight dedup: 同じキーに対する並行リクエストは 1 つにまとめる（thundering herd 対策）。

---

## バンドル分割（Reviewer R-005 対応）

```ts
// App.tsx
const SummaryTab  = lazy(() => import('./features/summary'));
const ProgressTab = lazy(() => import('./features/progress'));
const GanttTab    = lazy(() => import('./features/gantt'));
const IssuesTab   = lazy(() => import('./features/issues'));
const ReportsTab  = lazy(() => import('./features/reports'));
```

加えて `vite.config.ts` で manual chunks:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react', 'react-dom'],
        recharts: ['recharts'],
        ui: ['lucide-react'],
      },
    },
  },
},
```

期待効果:
- 初回 JS download: 622 KB → 約 350 KB（React + 共有部 + Summary タブのみ）
- 他タブは初回クリック時に lazy load

---

## ルーティング

現状: 単一画面、タブだけが state。深リンク不可（UX #7）。

提案: ハッシュルーティング（サーバー設定不要）

```
#/                          → サマリ
#/summary
#/progress
#/gantt
#/issues
#/issues/ECOM-1234          → 課題編集モーダルが開いた状態
#/sprints/sprint-24/progress → 特定スプリントの進捗
```

ライブラリ: 軽量に [Wouter](https://github.com/molefrog/wouter) (1KB) または自前 50 行。React Router は重い。

---

## エラーハンドリング戦略

| 層 | エラー扱い |
|----|----------|
| `lib/` | throws TypedError (`JiraApiError`, `NetworkError`) |
| TanStack Query | エラーオブジェクトを保持、UI 層が読む |
| `features/*/` | ローカル境界で `<RenderErrorBoundary>` ラップ。タブの 1 つが落ちても他は生存 |
| App ルート | 最終フォールバック（既存の `RenderErrorBoundary`） |

特に: API レスポンスエラーは「タブ単位で死ぬ」を許す。**Dashboard 全体が真っ黒にならない**ことが最優先。

---

## 移行ロードマップ（実装は別 PR で）

1. **Step 1**: ESLint `import/no-restricted-paths` を追加して移動の安全網を作る (0.2 日)
2. **Step 2**: `src/lib/` を確立。`utils/` の React 非依存部を移動 (0.3 日)
3. **Step 3**: `features/auth/` 切り出し (0.3 日)
4. **Step 4**: 各タブを `features/*/` に切り出し (1 日)
5. **Step 5**: TanStack Query + Zustand 導入、`useDataset` 分割 (1.5 日)
6. **Step 6**: ハッシュルーティング (0.5 日)
7. **Step 7**: バンドル分割 (0.3 日)
8. **Step 8**: Node.js バックエンド初版 (3 日)
9. **Step 9**: モノレポ化 (1 日)

**合計約 8 日**。Step 1-7 はインクリメンタル、各ステップで動作確認可能。Step 8-9 は大きいので別フェーズ。
