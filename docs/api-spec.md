# API Specification — Velocity Dashboard Backend

作成者: Backend Agent
最終更新: 2026-06-03
ベース URL: `/api`
プロトコル: HTTPS / JSON

## 認証

セッションベース。`/api/auth/login` で Jira トークンを送ると、サーバーがそれを暗号化された Cookie に格納する。以降のリクエストには Cookie を付ける。

| Cookie | 説明 |
|--------|------|
| `vd_session` | iron-session で暗号化された JSON。Jira email + token を格納 |
| 期限 | 24 時間（最終アクセスから） |
| 属性 | HttpOnly, Secure, SameSite=Lax |

## エンドポイント

### POST `/api/auth/login`

Jira 認証情報を受け取りセッション開始。

**Request**:
```json
{
  "instanceUrl": "https://your-domain.atlassian.net",
  "email": "you@example.com",
  "token": "xxx",
  "boardId": "123"
}
```

**Response 200**:
```json
{
  "user": {
    "accountId": "557058:abc",
    "displayName": "田中 太郎",
    "email": "you@example.com"
  }
}
```

**Response 401**: 認証失敗
**Response 502**: Jira 到達不可

---

### POST `/api/auth/logout`

セッション破棄。

**Response 204**: 常に成功

---

### GET `/api/auth/me`

現在のログインユーザー。

**Response 200**: `{ "user": { ... } }`
**Response 401**: 未ログイン

---

### GET `/api/sprints`

ボードのスプリント一覧（過去 6 件）。

**Response 200**:
```json
{
  "sprints": [
    {
      "id": "sprint-24",
      "name": "Sprint 24",
      "state": "active",
      "startDate": "2026-05-20T00:00:00.000Z",
      "endDate": "2026-06-03T00:00:00.000Z"
    },
    { "id": "sprint-23", ... }
  ]
}
```

**Cache**: 60s server / 60s client (TanStack Query staleTime)

---

### GET `/api/sprints/:sprintId/issues`

特定スプリントの全課題。

**Response 200**:
```json
{
  "sprintId": "sprint-24",
  "issues": [
    {
      "id": "ECOM-1234",
      "title": "ログイン画面実装",
      "status": "In Progress",
      "type": "Feature",
      "priority": "High",
      "points": 5,
      "assignee": "田中 太郎",
      "estimatedHours": 12,
      "actualHours": 6.5,
      "labels": ["frontend", "auth"],
      "startDate": "2026-05-22T00:00:00.000Z",
      "dueDate": "2026-05-27T00:00:00.000Z",
      "completionDate": null,
      "epicId": "EPIC-1",
      "parentId": null,
      "order": 0,
      "lastActivityAt": "2026-05-31T08:23:11.000Z"
    }
  ]
}
```

**Cache**: 30s server / 30s client

**Notes**:
- `lastActivityAt` は **停滞検出** に使う。Jira 側の `updated` または `changelog` 最新タイムスタンプから算出
- バッチで取得し、`epicId` / `parentId` を Jira の `customfield_*` から変換する

---

### GET `/api/issues/:key`

個別取得（深リンクや Cmd+K 経由）。

**Response 200**: 単一 `issue` オブジェクト
**Response 404**: 存在しない

**Cache**: 5min server / 5min client

---

### PATCH `/api/issues/:key`

課題更新。フロントの楽観的更新と組み合わせる。

**Request**:
```json
{
  "status": "Done",
  "assignee": "佐藤 花子",
  "points": 8
}
```

更新可能フィールド: `status`, `assignee`, `points`, `estimatedHours`, `actualHours`, `priority`, `labels`, `startDate`, `dueDate`, `epicId`, `parentId`, `order`, `title`

**Response 200**: 更新後の issue
**Response 400**: バリデーションエラー（フィールド名・型）
**Response 403**: Jira 側で権限なし
**Response 409**: 楽観ロック衝突（オプション、後実装）

**Notes**:
- サーバーは Jira の対応する API を呼ぶが、ローカルキャッシュは即座に書き換える（楽観的）
- 失敗時はクライアントがロールバック判断

---

### POST `/api/issues`

新規作成。

**Request**: 上記 PATCH の Request からのフィールド + `sprintId`, `id` (オプション、未指定なら Jira が採番)

**Response 201**: 作成された issue

---

### GET `/api/users`

ボードに割当のあるユーザー一覧（担当者選択肢用）。

**Response 200**:
```json
{
  "users": [
    { "accountId": "557058:abc", "displayName": "田中 太郎", "email": "..." },
    ...
  ]
}
```

**Cache**: 5min server / 5min client

---

## エラーレスポンス共通形式

```json
{
  "error": {
    "code": "JIRA_RATE_LIMITED",
    "message": "Jira API レート制限。30 秒後に再試行してください",
    "retryAfterSeconds": 30
  }
}
```

| code | HTTP | 意味 |
|------|------|------|
| `UNAUTHENTICATED` | 401 | セッション無効 |
| `JIRA_UNREACHABLE` | 502 | Jira への接続失敗 |
| `JIRA_RATE_LIMITED` | 429 | Jira からのレート制限 |
| `JIRA_FORBIDDEN` | 403 | Jira 側で権限なし |
| `VALIDATION_FAILED` | 400 | リクエスト形式不正 |
| `NOT_FOUND` | 404 | リソース無し |

---

## リトライ・バックオフ戦略（サーバー → Jira）

```
attempt 1: 即時
attempt 2: 500ms 後
attempt 3: 1500ms 後（指数 + jitter）
attempt 4: 4000ms 後
それ以上: 諦めて 502 返却
```

`429` のレスポンスは `Retry-After` ヘッダを尊重する。

---

## In-flight dedup

同じキー（例: `GET /sprints/sprint-24/issues`）に対する並行リクエストは 1 つに統合する。

```ts
const inflight = new Map<string, Promise<Result>>();

async function fetchWithDedup(key: string, fetcher: () => Promise<Result>): Promise<Result> {
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = fetcher().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
```

これにより、複数タブから同時にスプリント一覧を要求しても Jira へのリクエストは 1 つだけ。

---

## 暫定方針: 「バックエンド無し」モードの維持

Architect Agent の再設計プランは Node.js バックエンド導入を含むが、**v0 で既に動いているモック / Jira API 直接モードを破棄しない**。

戦略:
- フロントの `lib/jiraApi/client.ts` に **`useServerProxy` フラグ** を持たせる
- フラグ ON: `/api/*` を叩く
- フラグ OFF: 現在の挙動を維持（モックデータ or 直接 Jira）

これにより、サーバー実装前の v1.0 リリースを止めない。
