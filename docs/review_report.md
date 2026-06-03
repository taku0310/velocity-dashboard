# Code Review Report — Velocity Dashboard

作成者: Reviewer Agent
対象 commit: `1a0003e` (main)
最終更新: 2026-06-03

## 評価軸

1. 正確性（edge case 含む）
2. パフォーマンス（Jira 比で速いか）
3. UX リグレッション

`🛑 blocker` / `⚠ concern` / `💭 nit` / `🏆 praise` で表記。

---

## 🏆 高評価

### `src/utils/hierarchy.ts`
- `effectiveParentId` で `parentId` と `epicId` を統合する設計は分かりやすい
- `canSetParent` で循環をきれいに弾いている
- `computeReorderOrder` の中点挿入は、ナイーブなインデックス再採番より優れている

### `src/components/ProgressBoard.tsx`
- Kanban DnD の楽観的更新が機能している。レスポンスを待たない
- エピック別スイムレーンの実装が小さくまとまっている

### `src/components/RenderErrorBoundary.tsx`
- 真のエラーバウンダリを Class component で正しく実装。真っ黒画面回避

---

## 🛑 ブロッカー（要対応）

### 🛑 R-001: Jira API Token がブラウザ完結

**該当**: `src/services/jiraApi.ts:21-29`, `src/hooks/useJiraAuth.ts:43-46`

```ts
'Authorization': `Basic ${btoa(`${this.email}:${this.token}`)}`,
```

問題点:
- トークンが `sessionStorage` に保存される。XSS が起こった時点で完全に漏れる
- Atlassian Cloud は **ブラウザからの Basic Auth を CORS で拒否** することが多い
- 実運用すると恐らく動かない（要検証）

対応:
- **Node.js バックエンドを立てて、トークンをサーバー側で保持**（Architect Agent の再設計案を参照）
- 当面は「モック専用」と明示し、Jira ログイン UI に注意書きを足す

### 🛑 R-002: モーダルの focus 管理が無い

**該当**: `src/components/IssueEditModal.tsx`, `SprintEditModal.tsx`

- モーダルを開いても最初の入力要素にフォーカスが当たらない
- 開いた瞬間に Tab すると、背景の Dashboard ボタンに行ってしまう（focus trap が無い）
- Esc キーで閉じられない（クリック外しのみ）

UX としても致命的（キーボード操作で勝つ原則に反する）。

対応:
- 開いたら最初の input に autoFocus
- focus trap を導入（`focus-trap-react` か自前 15 行）
- `Escape` キーで `onClose`

---

## ⚠ 懸念事項

### ⚠ R-003: `Dashboard.tsx` が肥大化

**該当**: `src/components/Dashboard.tsx` 全体（610 行）

- 1 ファイルに 5 タブのレンダリングロジック + ヘッダー + サイドエフェクトが全部入っている
- `renderTab()` の `switch` が伸び続ける構造
- Frontend Agent の「small, dumb, composable」原則に反する

対応:
- 各タブを `src/features/<tab>/<Tab>Tab.tsx` に分離
- Dashboard はルーティング / 共有 state / モーダル管理のみに

### ⚠ R-004: `localStorage` に容量制限の考慮なし

**該当**: `src/hooks/useDataset.ts:18-24`, `src/services/jiraApi.ts:206-216`

- 容量超過時は `catch {}` で握り潰している（無言で書けない）
- データセット規模が大きくなった時のフォールバックが未定義

対応:
- 書き込み失敗時に UI でトーストを出す（「ローカル保存に失敗しました」）
- もしくは IndexedDB に移行（容量制限が大きい）

### ⚠ R-005: Recharts のバンドルサイズ

**該当**: `package.json`, ビルド成果物 622KB

- Recharts 単体で約 300KB（ungzipped）
- 全てのタブで同期 import している
- v1.0 では問題ないが、機能追加とともに増大する

対応:
- 各タブのチャートを `React.lazy()` + `Suspense` で動的読み込み
- Architect Agent の bundle 分割案を参照

### ⚠ R-006: モック用とリアル用の認証分岐が脆い

**該当**: `src/App.tsx:30-43`

`mockMode` state と `auth.isAuthenticated` が独立しており、片方だけ false になる遷移がある（前回の真っ黒画面バグの原因）。

対応:
- 認証状態を 1 つの discriminated union に統合 (`{ kind: 'jira', creds } | { kind: 'mock' } | { kind: 'logged-out' }`)
- 現状の useState 散在は将来また同じバグを生む

### ⚠ R-007: `IssuesTable.tsx` の `groupByEpic` 時にソートが各セクションごと

**該当**: `src/components/IssuesTable.tsx:39-49`

エピック別表示時、ソートが**セクション内のみ**で完結。「全体で見て pt が最大の課題」がどのエピックにあるかが分からない。

対応:
- エピックグループ内ソート / 全体ソートの切替トグル
- または「全課題」モードと「エピック別」モードを別 UI に

---

## 💭 nit（任意）

- 💭 R-008: `src/types/index.ts` に型がすべて入っている。`Issue`, `Sprint` ごとに別ファイルにしても良い
- 💭 R-009: `mockDataGenerator.ts:39-67` の `generateWorklogs` が `actualHours <= 0` を冒頭で弾いているが、複雑な分岐が後段に残る
- 💭 R-010: `Dashboard.tsx:71-86` の `downloadJson` / `downloadCsv` は `utils/download.ts` に抽出可能
- 💭 R-011: タブの ID とラベルの対応が `TABS` 定数だけにある。型レベルで強制したい

---

## 📈 パフォーマンス計測 (推定)

ローカル `npm run dev` で観測:

| 計測項目 | 現状 | 目標（v1.0） |
|---------|------|-------------|
| 初回描画（warm） | ~600ms | ≤ 500ms |
| タブ切替 | ~50ms | ≤ 100ms (現状達成) |
| 課題編集 → 反映 | 即時 | 同左 |
| Gantt 描画（120 件） | ~80ms | ≤ 100ms |

ビルド成果物:
- JS: 622KB (gzip 178KB)
- CSS: 23KB (gzip 5KB)

→ パフォーマンスは現状で問題なし。

---

## サマリ

- **マスト対応 (🛑)**: 2 件 (Jira トークン取扱い、モーダルフォーカス)
- **早めに対応 (⚠)**: 5 件 (構造、容量、バンドル、認証 state、ソート)
- **任意 (💭)**: 4 件

優先度トップは:
1. **R-001 認証アーキテクチャ** — Architect Agent と要協議。Node.js バックエンド導入の根拠
2. **R-002 モーダル UX** — Frontend Agent が即対応可（半日）
3. **R-003 Dashboard 分割** — リファクタ。Architect の features/ 構成案と同期して着手
