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
Product Owner ─→ Architect ─→ Backend / Frontend ─→ Reviewer ─→ QA ─→ Release
                                       ↑                                ↑
                                       │                                │
                                 UX Agent ──┴──── Data Analyst ── AI PM ┘
                                  (拒否権)        (根拠)          (優先順位)
```

## 全エージェント成果物（再設計反映済）

| エージェント | ファイル | 状態 |
|-------------|---------|------|
| Product Owner | `01-requirements.md` | ✅ 作成済 |
| Product Owner | `roadmap.md` | ✅ 作成済 |
| Architect | `02-architecture.md` | ✅ 作成済 |
| Architect | `sequence_diagram.md` | ✅ 作成済 |
| Backend | `api-spec.md` | ✅ 作成済 |
| Frontend | `frontend_design.md` | ✅ 作成済 |
| UX | `03-ux_review.md` | ✅ 作成済 |
| UX | `wireframe.md` | ✅ 作成済 |
| Reviewer | `review_report.md` | ✅ 作成済 |
| QA | `test_plan.md` | ✅ 作成済 |
| Data Analyst | `analytics_report.md` | ✅ 作成済 |
| AI PM | `feature_proposals.md` | ✅ 作成済 |

## 9 エージェントの判断サマリ

| 役職 | 鍵となる判断 |
|------|------------|
| **Product Owner** | 5 つの jobs-to-be-done を定義。Jira 比のクリック数を全 J で削減 |
| **Architect** | feature folder + shared + lib の 3 層構造。`lib/` は React 非依存に。Node.js バックエンド導入は CORS / セキュリティ理由でマスト（v1.x で着手） |
| **Backend** | サーバー API はトークン中継 + per-issue LRU キャッシュ + in-flight dedup。実装は v1.x（バックエンド無しモード継続可） |
| **Frontend** | TanStack Query (server state) + Zustand (UI state)。`Modal` 共通化で Esc/Focus 対応。`wouter` で深リンク |
| **UX** | 「あなたの今日のタスク」「停滞バッジ」「overload ハイライト」を v1.0 のマストに指定。コメント・通知・任意フィルタ保存は拒否 |
| **Reviewer** | Jira トークンのブラウザ完結が🛑、モーダルフォーカスも🛑。Dashboard.tsx 肥大化は⚠（features/* 切り出しで解消） |
| **QA** | Tier 1 = パフォーマンスバジェット、Tier 2 = 失敗モード、Tier 3 = E2E、Tier 4 = Unit の優先順位 |
| **Data Analyst** | エピック ETA が最高 ROI、次に Review 滞留、キャリーオーバー率 |
| **AI PM** | v1.0 として 5 機能 (~4 日) を採用、内部リファクタ 5 PR (~4 日) を並行。Storybook / i18n は却下 |

## 再設計の方向性まとめ

### コード構造
- `src/components/` のフラット 19 ファイル → `features/<name>/` + `shared/` + `lib/` の 3 層
- レイヤリングは ESLint `import/no-restricted-paths` で強制
- 段階的移行 (15 PRs)、1 PR ≤ 8 ファイル ≤ 300 行

### データ
- サーバーデータ: TanStack Query
- ローカル編集: Zustand + persist
- UI 状態: Zustand
- フォーム: useState
- URL: wouter の hash routing

### UX
- 全タブで動作するキーボードショートカット (`/` `Cmd+K` `Esc`)
- 深リンク (`#/issues/ECOM-1234`)
- フィルタ視認チップ化
- 停滞 / overload / Review 滞留の自動ハイライト
- エピック ETA 表示

### 品質
- Vitest + Playwright + Lighthouse CI
- Tier 1 = パフォーマンスバジェットを CI に組み込み
- 失敗モードテストを Tier 2 として優先

### バックエンド
- 当面はクライアント完結（モック / 直接 Jira）
- 実 Jira 接続が必要になった時点で Node.js バックエンド導入（v1.x）

## エージェント呼び出し

Claude Code セッション内で:
```
/agents
```
で一覧表示、もしくは `subagent_type` で個別呼出。

例:
- 「UX Agent として新機能 X を批評してください」
- 「QA Agent として PR #N のテストプランを書いてください」

各エージェントの責務は `.claude/agents/<name>.md` を参照。

## 既存機能の維持

再設計はあくまで **「整理」と「拡張」** であり、既存の動作機能は v1.0 リリース時に全て維持されます。

| 既存機能 | v1.0 での扱い |
|---------|--------------|
| サマリタブ (KPI / Velocity / バーンダウン / 担当者別 / 見積精度) | 維持 + MyTasksCard 追加 |
| 進捗タブ (エピックスイムレーン + Kanban DnD) | 維持 + エピック ETA 追加 |
| ガントタブ (プロジェクト全体 + 階層 DnD + タイプバッジ) | 維持 + 今日に移動ボタン |
| 課題管理タブ (エピックグルーピング + 全列ソート + 全スプリント表示) | 維持 + フィルタチップ化 |
| レポートタブ (Markdown / CSV / JSON エクスポート) | 維持 |
| スプリント完了バッジ / 完了スプリント非表示 | 維持 |
| ローカル編集 + JSON import / export | 維持（IndexedDB 移行は v1.x で検討） |
| モック / 実 Jira 両対応 | 維持 |

破壊的変更はゼロ。**機械的な move リファクタ + 機能追加** のみで v1.0 を達成する。
