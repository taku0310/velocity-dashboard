# Feature Proposals — 次の実装優先順位

作成者: AI PM Agent
最終更新: 2026-06-03 (再設計反映)

## 評価基準

`.claude/agents/ai-pm.md` に従い、以下を全て満たすものだけ採用:

1. Jira を超える 4 つのテスト（視認・操作・検索・速報）に合格
2. ROI = `分節約 / 週 / ユーザー ÷ 実装日数` > 5
3. 次の 3 機能を unlock または簡略化する

入力（再設計版）:
- `01-requirements.md`
- `03-ux_review.md`
- `02-architecture.md`
- `analytics_report.md`
- `review_report.md`

---

## v1.0 採用機能（合計 ~5 日の実装）

### 採用 #1: 「あなたの今日のタスク」(F-009)

**証跡**: requirements J1, ux_review #1 (🔴), wireframe.md サマリ部

**ROI**: 2 分/週 ÷ 0.5 日 = 4 (基準未満だが J1 達成にマスト)

**実装範囲**: `features/summary/MyTasksCard.tsx` 新規。サマリタブ最上部に挿入。

---

### 採用 #2: 停滞 + Review 滞留 + overload ハイライト (F-010 + F-011 + analytics #3)

**証跡**: requirements J2/J4, ux_review #4/#5 (🟠🔴), analytics_report #3

**ROI**: 10 分/週 ÷ 1 日 = 10

**実装範囲**:
- `lib/calc/staleness.ts` `lib/calc/overload.ts` 新規
- `shared/components/Badge.tsx` 新規
- AssigneeTable に `進行中件数 / Review滞留 / 未完了pt` 列追加
- 表示先 4 箇所（Issues / Kanban / Gantt / MyTasks）でバッジ使用

---

### 採用 #3: エピック進捗 + ETA (analytics #1)

**証跡**: analytics_report #1, wireframe 進捗タブ

**ROI**: チームリードが週次で reprioritize しやすくなる、5 分/週 × 2 人 = 10 分 ÷ 0.5 日 = 20

**実装範囲**:
- `lib/calc/epic.ts` 新規
- ProgressBoard / IssuesTable のエピックヘッダーに進捗バー + ETA 表示

---

### 採用 #4: フィルタ視認 + Cmd+K + フォーカス/Esc (ux_review #3/#6 + Reviewer R-002)

**証跡**: ux_review #3 #6, review_report R-002, wireframe コマンドパレット

**ROI**: 5 分/週 ÷ 1.5 日 = 3.3（基準未満だが UX 4 基準全てに影響）

**実装範囲**:
- `shared/components/Modal.tsx` 共通化（focus trap, Esc）
- `shared/components/CommandPalette.tsx` 新規
- `FiltersBar` チップ化
- `useGlobalKeyboard` フック

---

### 採用 #5: ハッシュルーティング + 深リンク (ux_review #7)

**証跡**: ux_review #7

**ROI**: 月数回の頻度だが、Slack からの飛び込みは「Jira を開きたくない」最大の動機

**実装範囲**:
- `wouter` 導入（1KB）
- URL ↔ Zustand 双方向同期

---

## v1.0 で却下した機能

### ❌ Jira への双方向書き戻し
- スコープ外（requirements.md で明示済み）

### ❌ Storybook 導入
- エンドユーザー価値 0。Frontend 内部品質改善は内部ベロシティに効くが、v1.0 後でよい

### ❌ 完全な国際化 (i18n)
- 想定ユーザー日本語話者。早すぎる最適化

### ❌ チケットコメント機能 / 通知システム / カスタムフィールド
- UX Agent 拒否権発動。Jira の負け筋

### ❌ TanStack Query / Zustand を v1.0 で導入
- ⚠ 一部 PR では導入する（Frontend Agent の移行ロードマップ Step 9-10）が、必須機能 (#1〜#5) は現行の useState + useDataset で実装可能。Tier 1 ブロック解除後にやる
- 早すぎるアーキテクチャ刷新は v1.0 リリースを遅らせる

---

## v1.1 候補

### キャリーオーバー率 (analytics #4)
ROI: 7 分/週 ÷ 0.7 日 = 10

### タイプ別見積精度 (analytics #2)
モックでは効果見えづらいので、実 Jira 接続後の検討

### Vim 風キーボード (`g s` / `g p` 等)
熱心なユーザーのみ。`Cmd+K` で大部分の操作は代替可能

### Reviewer R-001 対応 (Node.js バックエンド)
セキュリティ的にはマスト。だが「動くアプリ」としては現状でモック / 直接 Jira（CORS が許す環境）で運用可能。
- **重要**: 実 Jira を CORS 設定の無いブラウザから叩くと失敗する → バックエンド導入は **実 Jira 接続を必要とした時点でマスト**

---

## 順位（v1.0 内）

| 順位 | 機能 | 日数 | UX 基準への寄与 |
|------|------|------|---------------|
| 1 | あなたの今日のタスク | 0.5 | 🟠 速報 |
| 2 | 停滞 + overload | 1.0 | 🔵 視認、🟠 速報 |
| 3 | エピック ETA | 0.5 | 🟠 速報 |
| 4 | Modal 共通化 + Cmd+K + フィルタ視認 | 1.5 | 🟢 操作、🟡 検索 |
| 5 | ハッシュルーティング | 0.5 | 🟢 操作 |

**合計約 4 日の実装で、UX 4 基準すべてに大きく寄与する。**

---

## 並行で進める内部品質改善（ユーザー影響なし）

UX 改善と並行して、Architect の移行ロードマップに沿った内部整理:

| PR | 内容 | 工数 |
|----|------|------|
| Refactor #1 | `lib/` フォルダ確立 | 0.3 日 |
| Refactor #2 | features/* に切り出し | 1.5 日 |
| Refactor #3 | TanStack Query + Zustand 導入 | 1.5 日 |
| Refactor #4 | バンドル分割 | 0.3 日 |
| Infra #1 | Vitest + Playwright 初期セットアップ | 0.5 日 |
| Infra #2 | CI で Tier 1 パフォーマンス budget 検証 | 0.5 日 |

これらは UX 改善 PR と交互に混ぜる（純粋リファクタだけ続くと、ユーザー価値が止まる）。

---

## 推奨スケジュール

```
Sprint α (3 日)
- Day 1: MyTasksCard + lib/calc/staleness.ts + lib/calc/overload.ts
- Day 2: 停滞 + overload ハイライト各所反映 + バッジコンポーネント
- Day 3: エピック ETA + ProgressBoard 反映

Sprint β (2 日)
- Day 1: Modal 共通化 + Esc/Focus 修正
- Day 2: Cmd+K Palette + FiltersBar チップ化

Sprint γ (1 日)
- Day 1: wouter ハッシュルーティング + 深リンク

並行 (合間で実施)
- Refactor #1 (lib/ 切り出し) — Sprint α 直前
- Refactor #2 (features/ 移行) — Sprint β 前後で分割
- Infra #1 (Vitest) — Sprint α と同時開始
```

合計 6 日でデリバリー、内部リファクタを含めても 10 日以内で v1.0 リリース可能。
