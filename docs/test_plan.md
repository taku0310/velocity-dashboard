# Test Plan — Velocity Dashboard

作成者: QA Agent
最終更新: 2026-06-03
入力: `01-requirements.md`, `02-architecture.md`, `03-ux_review.md`

## テスト戦略

3 階層、優先順位もこの順。

1. **パフォーマンスバジェット** — 各タブ切替 ≤ 100ms 等が CI で守られる
2. **失敗モード** — Jira が落ちている / 遅い / 期限切れ等のリカバリー UX が壊れていない
3. **ハッピーパス E2E** — 5 ジョブが完走する

> Unit テストは Tier 4。**1〜3 を満たすために必要な範囲** だけ書く。

## ツール

| 層 | ツール |
|----|------|
| Unit | Vitest (Vite 統合、設定 0) |
| Component | React Testing Library |
| E2E | Playwright |
| Perf | Lighthouse CI + 自前 `performance.mark` |

導入順: Vitest → RTL → Playwright → Lighthouse CI（Storybook は別軸、QA テストには必須でない）

---

## Tier 1: パフォーマンスバジェット

CI で自動計測し、超過したらビルド失敗。

### P1-001: 初回描画（cold）

| 条件 | 値 |
|------|---|
| シナリオ | localhost + フィクスチャ JSON ロード |
| 計測 | DOMContentLoaded → 「自分の今日のタスク」表示 |
| 上限 | 1.5 秒 (M1 Mac で計測) |
| 計測法 | Playwright `page.evaluate(() => performance.now())` |

### P1-002: 初回描画（warm）

| 条件 | localStorage に dataset あり |
| 上限 | 0.5 秒 |

### P1-003: タブ切替

| シナリオ | サマリ → 進捗 → ガント → 課題管理 → レポート |
| 上限 | 各遷移 100ms（lazy load 初回は 200ms 許容） |

### P1-004: 課題編集モーダル開閉

| シナリオ | テーブル行クリック → モーダル表示 → Esc |
| 上限 | 開閉とも 150ms |

### P1-005: Kanban DnD 楽観的更新

| シナリオ | カード drop → 新カラムに表示 |
| 上限 | 50ms（同期処理である） |

### P1-006: ビルド成果物サイズ

| 計測 | `dist/` の JS 合計 (gzipped) |
| 上限 | 250 KB (現状 178 KB に対し、機能追加で 70 KB の余裕) |

### Lighthouse スコア

| 指標 | 目標 |
|------|------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |

---

## Tier 2: 失敗モード

各シナリオは「リカバリー UX が定義通りか」を確認。

### F2-001: Jira 認証失敗

- **Given** ログイン画面
- **When** 不正なトークンを入力して送信
- **Then** 赤いエラーメッセージが表示される（モーダルではない、フォーム内）
- **Then** トークン入力欄に値が残る（再入力負担を減らす）

### F2-002: Jira API レート制限 (429)

- **Given** ダッシュボード起動中、サーバー経由で Jira へリクエスト
- **When** Jira が 429 + `Retry-After: 30` を返す
- **Then** トースト「Jira API レート制限中。30 秒後に再試行します」
- **Then** 30 秒後に自動リトライ
- **Then** その間、既存の localStorage キャッシュは表示し続ける

### F2-003: Jira 到達不可 (502)

- **Given** ネットワークオフライン or Jira down
- **When** スプリント取得を試みる
- **Then** モックフォールバックが有効ならモックデータで継続
- **Then** バナー「Jira に到達できないためキャッシュを表示中」

### F2-004: localStorage が満杯

- **Given** 容量上限 (5MB) 近辺
- **When** 課題を新規作成
- **Then** トースト「ローカル保存に失敗。エクスポートを推奨」
- **Then** メモリ内ではデータが保持される（次回リロードで消える）

### F2-005: セッションタイムアウト

- **Given** 24 時間後
- **When** ユーザー操作
- **Then** ログイン画面にリダイレクト + バナー「セッション期限切れ」
- **Then** 編集中だった内容は localStorage に保存される

### F2-006: 不正な JSON インポート

- **Given** インポートメニュー
- **When** 配列でないファイルや欠損 JSON
- **Then** alert ではなくトーストで「インポート失敗: スプリント配列ではありません」
- **Then** 既存 dataset は破壊されない

### F2-007: チャート描画エラー

- **Given** dataset に無効値 (NaN, null in chart fields)
- **When** タブ表示
- **Then** `RenderErrorBoundary` がそのタブだけを切り出す
- **Then** 他タブと UI シェルは生存

### F2-008: モーダル中にデータ更新

- **Given** ユーザーが課題編集モーダルを開いている
- **When** バックグラウンドでサーバーから更新が来る
- **Then** モーダル内データはサーバー更新で上書きされない（編集中なので）
- **Then** 保存時、サーバー側がより新しいなら 409 を返す（楽観ロック、オプション）

---

## Tier 3: ハッピーパス E2E

要件の 5 ジョブそれぞれをカバー。

### E3-J1: 自分の今日のタスクを把握する

```ts
test('現在ログイン中のユーザーは、サマリを開いて 3 秒以内に自分のタスクを見られる', async ({ page }) => {
  await loginAs(page, 'tanaka@example.com');
  const t0 = performance.now();
  await page.waitForSelector('text=田中 太郎 さんの今日のタスク');
  expect(performance.now() - t0).toBeLessThan(3000);
  await expect(page.getByText('ECOM-1234')).toBeVisible();
});
```

### E3-J2: 停滞チケットを発見する

```ts
test('In Progress で 3 日以上動いていない高優先度チケットに停滞バッジが付く', async ({ page }) => {
  await loginAs(page, 'tanaka@example.com');
  await page.click('text=課題管理');
  await page.click('button[data-filter="stalled"]');
  await expect(page.getByText('⚠ 停滞')).toHaveCount({ atLeast: 1 });
});
```

### E3-J3: サマリで状況把握する

```ts
test('サマリタブを開くと KPI / Velocity / バーンダウンが 1 画面に収まる', async ({ page }) => {
  await loginAs(page, 'tanaka@example.com');
  // モバイル以外の解像度
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.getByTestId('kpi-cards')).toBeInViewport();
  await expect(page.getByTestId('burndown')).toBeInViewport();
  await expect(page.getByTestId('velocity-chart')).toBeInViewport();
});
```

### E3-J4: overload を発見する

```ts
test('進行中 5 件以上の担当者は赤くハイライトされる', async ({ page }) => {
  await loginAs(page, 'tanaka@example.com');
  const row = page.getByTestId('assignee-row-佐藤 花子');
  await expect(row).toHaveCSS('background-color', 'rgba(220, 38, 38, 0.2)');
});
```

### E3-J5: ガントで階層 DnD

```ts
test('課題をドラッグして親を変更できる', async ({ page }) => {
  await loginAs(page, 'tanaka@example.com');
  await page.click('text=ガント');
  await page.dragAndDrop(
    '[data-issue-id=ECOM-1234] .drag-handle',
    '[data-issue-id=ECOM-1300] .row-drop-zone',
  );
  // 階層変更が反映されるとインデントが変わる
  await expect(page.locator('[data-issue-id=ECOM-1234]')).toHaveAttribute('data-depth', '1');
});
```

---

## Tier 4: Unit (最小限)

書くべき対象:
- `lib/calc/kpi.ts` — KPI 計算（境界値: 0 件, 100% 完了, 全未完了）
- `lib/calc/hierarchy.ts` — 既存の `canSetParent` の循環検出（A→B→C のループ）
- `lib/calc/staleness.ts` (新規) — 停滞判定（3/6/11 日の境界）
- `lib/calc/overload.ts` (新規) — しきい値判定（平均 + 1.5σ）
- `lib/calc/sprint.ts` — `recomputeSprint` (issues 変更時の集計)
- `lib/jiraApi/transform.ts` — Jira API → 内部型 (Bug/Feature/Improvement/Task/Epic の判定)

書かない対象:
- 個別 React コンポーネントの snapshot test → 壊れやすく価値が低い
- Recharts のプロパティテスト → ライブラリの責任

---

## テストフィクスチャ

`e2e/fixtures/dataset-baseline.json` を整備:

- 6 sprints, 4 epics, 90 issues
- 田中 太郎 が 3 件の In Progress（J1 検証用）
- 佐藤 花子 が 5 件の In Progress + 3 件の Review 滞留（J4 検証用）
- ECOM-1234 を `In Progress` + `lastActivityAt = 3 日前`（J2 検証用）

E2E 起動時は JSON import 機能でフィクスチャを読ませる。Jira 実環境には依存しない。

---

## CI 構成（提案）

```yaml
# .github/workflows/test.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:unit
      - run: npm run test:e2e
      - run: npm run perf:budget
```

`perf:budget` は Lighthouse CI または自前スクリプトで Tier 1 を検証。

## ハンドオフ

- Frontend Agent: `data-testid` を主要コンポーネントに付与 (`kpi-cards`, `assignee-row-{name}`, `issue-row-{id}`)
- Backend Agent: API モックレスポンスを `e2e/fixtures/jira-responses/` に整備
- Reviewer: Tier 1 が失敗した PR はマージしない
