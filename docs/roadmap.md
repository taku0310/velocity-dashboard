# Roadmap — Velocity Dashboard

作成者: Product Owner Agent
最終更新: 2026-06-03 (9 エージェント再設計反映)

## v0.x — 現在地

完了済み (commit `b87442e` 時点):

- [x] 5 タブ構成（サマリ / 進捗 / ガント / 課題管理 / レポート）
- [x] エピックスイムレーン (進捗)
- [x] プロジェクト全体ガント + 階層 DnD + タイプバッジ
- [x] エピック別グルーピング (課題管理)
- [x] 全列ソート（担当者別 + 全課題一覧）
- [x] 全 5 タブで Markdown / CSV / JSON エクスポート
- [x] localStorage 永続化、JSON import / export
- [x] ローカル CRUD（課題・スプリント）
- [x] スプリント完了バッジ、完了スプリント非表示トグル
- [x] 9 エージェント組織と全成果物ドキュメント

---

## v1.0 — UX 4 基準完全制覇

目標: J1〜J5 すべてで Jira を上回る。合計 ~10 日 (UX 4 日 + 内部 4 日 + バッファ)。

### Sprint α — UX P0 ✅ 完了 (commit `eb3e2c9`)

- [x] **PR-α1**: `src/lib/calc/` を確立し `staleness.ts` `overload.ts` `epic.ts` を投入
- [x] **PR-α2**: `MyTasksCard.tsx` でサマリ最上部に F-009 を実装
- [x] **PR-α3**: `Badge.tsx` (`StalenessBadge` / `OverloadBadge`) を全タブで使用
- [x] **PR-α4**: エピック ETA + 進捗バーを進捗タブのエピックヘッダーに
- [x] **PR-α5**: 担当者テーブルに 進行中 / Review滞留 / 未完了pt 列追加、しきい値超過行をティント

### Sprint β — UX P1 ✅ 完了 (commit `8d6d022`)

- [x] **PR-β1**: `Modal.tsx` 共通化 + IssueEditModal / SprintEditModal を移行（Reviewer R-002 解消）
- [x] **PR-β2**: `useGlobalKeyboard` で `/` フォーカス + `Cmd+K` ハンドラ
- [x] **PR-β3**: `CommandPalette` 実装（課題 / エピック / スプリント検索、矢印 + Enter）
- [x] **PR-β4**: `FiltersBar` のチップ化と適用中バーの視覚強化

### Sprint γ — UX P1 続 ✅ 完了 (commit `fdb408a`)

- [x] **PR-γ1**: 自前 `useHashRoute` でハッシュルーティング (wouter 不採用、外部依存なし)
- [x] **PR-γ2**: ガント「今日に移動」ボタン + 初回マウントの自動スクロール
- [x] **PR-γ3**: 編集モーダルに「詳細を表示」折りたたみ

### Sprint δ — 内部リファクタ ✅ 完了 (commit `<next>`)

- [x] **PR-R1**: `lib/` 確立（PR-α1 で実施済）
- [x] **PR-R2-R8**: 5 タブをそれぞれ `src/features/<name>/<Name>Tab.tsx` に切り出し
- [ ] **PR-R9**: TanStack Query 導入（v1.1 で実 Jira バックエンド統合時にまとめて）
- [ ] **PR-R10**: Zustand 導入（v1.1 で）
- [x] **PR-R11**: `vite.config.ts` で manualChunks（react / recharts / icons 分離）+ 各タブを `React.lazy()` で動的読み込み

### Sprint ε — テスト基盤 (1 日)

- [x] **PR-T1**: Vitest 導入 + lib/calc/ と utils/hierarchy のユニットテスト 27 件
- [ ] **PR-T2**: Playwright 導入 + E3-J1〜J5 (Tier 3) (0.5 日)
- [ ] (任意) Lighthouse CI または自前 perf budget (0.5 日)

### v1.0 リリース基準

- [ ] Sprint α-γ の UX 機能すべてマージ
- [ ] Reviewer Agent のサインオフ
- [ ] QA Agent の Tier 1 + Tier 3 通過
- [ ] UX Agent の受け入れチェックリスト全項目 OK (`wireframe.md` 末尾)
- [ ] 既存機能の non-regression 確認（手動 + E2E）

---

## v1.1 — 拡張

### バックエンド着手

- [ ] **PR-B1**: Node.js (Fastify) スケルトン + `/api/health` (0.5 日)
- [ ] **PR-B2**: `/api/auth` (login/logout/me) + iron-session (0.5 日)
- [ ] **PR-B3**: `/api/sprints` + `/api/issues` + LRU キャッシュ + dedup (1.5 日)
- [ ] **PR-B4**: クライアント `lib/jiraApi/client.ts` を `useServerProxy` フラグで切替 (0.5 日)
- [ ] **PR-B5**: モノレポ化 (pnpm workspaces) (1.0 日)

### 機能追加

- [ ] キャリーオーバー率の Velocity グラフ重ね描き (Analyst #4)
- [ ] タイプ別見積精度（実 Jira 接続後の評価次第） (Analyst #2)
- [ ] Vim 風キーボードコンボ (`g s` 等)
- [ ] IndexedDB 移行（localStorage 容量制限解消）

---

## v2.0 — Insights & Personalization

- [ ] パーソナル KPI（自分の Velocity / 見積精度の時系列）
- [ ] エピック完了予測の信頼区間表示
- [ ] チーム健康度ダッシュボード（バーンダウン / overload / stagnation の縦並び）

---

## やらないことリスト（厳守）

| やらない | 理由 |
|----------|------|
| Jira への双方向書き戻し | スコープ外 |
| Jira ワークフローカスタマイズ | Jira の負け筋 |
| 通知（メール / Slack） | UX 改善に寄与しない |
| Wiki / Confluence 機能 | スコープ外 |
| モバイル専用アプリ | レスポンシブで十分 |
| 任意のカスタムフィールド | 設定肥大化 |
| ピボットテーブル | 情報密度方針に反する (UX 拒否) |
| チケットコメント機能 | Jira への二重管理を生む (UX 拒否) |
| 任意のフィルタ条件保存 | Jira の負け筋 (UX 拒否) |
| Storybook (v1.0 中) | エンドユーザー価値 0、v1.0 後に検討 |
| i18n (v1.0 中) | 想定ユーザー日本語話者、早すぎる最適化 |

---

## 進捗の追い方

- このファイルのチェックボックス更新が真実の情報源
- 各 PR のタイトルに `PR-α2` のような ID を含める → 追跡しやすい
- GitHub Issues は使わない（Jira の代替を作っているのに自分が Issues に追われたら本末転倒）

## 9 エージェントの今後の関わり方

| エージェント | v1.0 中の役割 |
|-------------|------------|
| Product Owner | スコープ変更時の判断、roadmap 更新 |
| Architect | features/ 切り出し PR のレイヤリング確認 |
| Backend | v1.1 で着手（v1.0 中は待機） |
| Frontend | 各 UX PR の実装、`features/*/` への移行 |
| UX | 各 PR を「Jira を超えているか」観点でレビュー（拒否権あり） |
| Reviewer | 各 PR のコードレビュー、Tier 1 失敗を blocker 扱い |
| QA | テストフィクスチャ整備、Playwright シナリオ実装 |
| Data Analyst | 実データ投入後に Analyst #2 #4 の評価 |
| AI PM | スプリントごとに roadmap の優先順位を見直し |
