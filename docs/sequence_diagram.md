# Sequence Diagrams — Velocity Dashboard

作成者: Architect Agent
最終更新: 2026-06-03

性能上の hot path 5 つを Mermaid で記述。

---

## 1. 初回ロード（cold cache）

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant W as web (SPA)
    participant A as api (Node.js)
    participant C as cache (LRU)
    participant J as Jira REST

    U->>B: open #/
    B->>W: GET / (HTML + JS)
    Note over W: First paint: ロゴ + スケルトン
    par 並列フェッチ
      W->>A: GET /api/sprints
      W->>A: GET /api/users/me
    end
    A->>C: lookup sprints
    C-->>A: miss
    A->>J: GET /rest/agile/1.0/board/{id}/sprint
    J-->>A: sprints[]
    A->>C: store (TTL 5min)
    A-->>W: sprints[]
    par 各スプリントの issues を並列取得
      W->>A: GET /api/sprints/sprint-24/issues
      W->>A: GET /api/sprints/sprint-23/issues
    end
    Note over W: Suspense解消、KPI / Velocity 順次描画
    W-->>U: サマリタブ描画完了
```

**性能目標**:
- ロゴ + スケルトン表示: 0.5 秒
- KPI 表示: 1 秒（warm cache なら 0.3 秒）

---

## 2. タブ切替（client-side only）

```mermaid
sequenceDiagram
    participant U as User
    participant W as web (SPA)
    participant Z as Zustand (ui store)
    participant Q as TanStack Query (cache)

    U->>W: click "ガント" タブ
    W->>Z: setActiveTab('gantt')
    Note over W: lazy import GanttTab
    W->>Q: useQuery(['sprints'])
    Q-->>W: cached data (no fetch)
    Note over W: GanttChart 描画
    W-->>U: 100ms 以内に表示

    Note over W: バックグラウンド refetch（staleTime 超過時）
    W->>+A as api: GET /api/sprints
    A-->>-W: fresh data
    Note over W: 差分があれば再描画（楽観的）
```

**性能目標**: タブ切替 ≤ 100ms（lazy import が初回のみ追加コスト ~50ms）

---

## 3. 課題のステータス変更（Kanban DnD、楽観的更新）

```mermaid
sequenceDiagram
    participant U as User
    participant W as web (SPA)
    participant Z as Zustand (local edits)
    participant Q as TanStack Query
    participant A as api

    U->>W: ドラッグ ECOM-1234 → Done 列
    W->>Z: optimistic update: status = 'Done'
    Z-->>W: immediate re-render
    W-->>U: UI 即時更新

    par バックグラウンドで永続化
      W->>A: PATCH /api/issues/ECOM-1234 { status: 'Done' }
      A-->>W: 200 OK
      W->>Q: invalidateQueries(['issues', 'ECOM-1234'])
    end

    alt エラーレスポンス
      A-->>W: 500
      W->>Z: rollback optimistic update
      W-->>U: トースト表示 "更新失敗"
    end
```

**性能目標**: ユーザー体感 0ms（楽観的更新）、永続化は別レーン

---

## 4. Cmd+K グローバル検索

```mermaid
sequenceDiagram
    participant U as User
    participant W as web (SPA)
    participant K as CommandPalette
    participant Q as TanStack Query

    U->>W: Cmd+K
    W->>K: openPalette()
    K-->>U: パレット表示（既存全課題を memoize 済）
    U->>K: "ECOM-12" と入力
    K->>K: client-side filter（既にメモリ上）
    K-->>U: 結果リスト（即時）
    U->>K: 矢印 + Enter で選択
    K->>W: navigate to #/issues/ECOM-1234
    W->>W: open IssueEditModal
    W-->>U: モーダル表示
```

**性能目標**:
- パレット起動: 50ms 以内
- 入力 → 結果: 同期計算（数百件程度ならフィルタは < 10ms）

---

## 5. 深リンク（Slack から URL ペースト）

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant W as web (SPA)
    participant Q as TanStack Query
    participant A as api

    U->>B: paste #/issues/ECOM-1234
    B->>W: load app
    W->>Q: prefetch ['issues', 'ECOM-1234']
    Q->>A: GET /api/issues/ECOM-1234
    A-->>Q: issue data
    Note over W: 並行でスプリントもロード
    W->>W: render IssuesTab + open modal for ECOM-1234
    W-->>U: 該当チケットが既に開いた状態で表示
```

**性能目標**: 深リンク → モーダル表示 ≤ 1.5 秒（warm cache なら 0.5 秒）

---

## 観測すべき計測点

実装時に next/prev 比較を容易にするため、以下に `performance.mark()` を仕込む:

| ID | mark タイミング |
|----|---------------|
| `boot:html-loaded` | HTML が DOMContentLoaded |
| `boot:react-mounted` | App コンポーネント mount |
| `boot:first-data` | 最初のスプリント取得完了 |
| `boot:first-paint-content` | KPI Cards 表示完了 |
| `tab:switch:start` | タブクリック |
| `tab:switch:painted` | 新タブの最初の意味あるコンテンツ |
| `mutation:optimistic` | 楽観的更新後の paint |
| `mutation:server-ack` | サーバーが 200 返却 |

`PerformanceObserver` で集計し、開発時はコンソールに出す。本番では Sentry / DataDog 等に送信を検討。
