# Analytics Report — Velocity Dashboard

作成者: Data Analyst Agent
最終更新: 2026-06-03
データ源: `src/services/mockDataGenerator.ts` で生成される 6 スプリント × 約 15 課題 + 4 エピック

## 評価原則

各インサイトは次の問いに答えるかで採否する: **「これを見たチームリードは来週、行動を変えるか？」**

行動を変えないインサイトは UI に出さない。

---

## 発見 1: エピック横断の進捗遅延（最高インパクト）

**観測**

- 4 つのエピックは 6 スプリントに分散して課題が紐付いている
- しかしどのエピックも **明確な「完了予定日」を持っていない**
- スプリント単位の Velocity は計算されているが、**エピック単位の Velocity** はどこにも出ていない

**意味するところ**

エピック「決済基盤刷新」が今のペースで何スプリント後に完了するか、誰も即答できない。これは Jira の最大の弱点でもある（Advanced Roadmaps が必要）。

**行動変容**

- 「決済基盤刷新は残り 30pt、平均 Velocity 12pt/sprint → あと 3 スプリント」と毎週見えれば、Sprint 24 の段階で遅延を検知して reprioritize できる
- 現在は遅延を「気づいた頃には 3 スプリント後」になっている

**UI 提案**

サマリタブまたは新「エピック」タブに **エピック進捗バー** を配置:

```
🟣 EPIC-1 決済基盤刷新
   ▓▓▓▓▓▓▓▓░░░░░░░░░░  45% (28/62pt)  ETA: Sprint 26 (+2 sprint)
```

実装コスト: 0.5 日（既存のエピック紐付けデータから集計するだけ）

---

## 発見 2: 見積精度のタイプ別偏り

**観測**

モック生成ロジックを見ると、見積精度は `accuracyVariance = 0.5 + rand()` で一様分布。実データではタイプ別に偏るはず:

| タイプ | 期待される傾向（経験則） |
|--------|---------------------|
| Bug | 見積より長くなりがち（調査時間が読みにくい） |
| Feature | 中央値はほぼ合うが分散が大きい |
| Improvement | 過小評価されやすい（巻き込み修正） |
| Task | 概ね正確 |

**意味するところ**

タイプ別に見積精度を見せれば、「Bug は見積もりの 1.5 倍で見積もろう」のような次スプリントの判断材料になる。

**UI 提案**

見積精度散布図にタイプ別の色分けと、サマリに「タイプ別精度テーブル」を追加:

```
タイプ        平均精度    過小評価傾向
Bug          72%        +35%
Feature      89%        +8%
Improvement  76%        +25%
Task         94%        +3%
```

実装コスト: 0.5 日

---

## 発見 3: Review ステータスの滞留

**観測**

モック生成では `In Progress` ステータスのチケットがランダムに発生する。一方で **Review に長期間留まるチケット** は実プロジェクトで頻発する。現在 Review の滞留時間を集計するロジックが無い。

**意味するところ**

「PR レビューが詰まっている」はチームのパフォーマンスを最も下げる要因の一つ。これを早期発見すれば、誰かをレビューに専念させる判断ができる。

**UI 提案**

担当者別パフォーマンスに「Review 滞留中件数」列を追加。閾値（3 件以上）でハイライト。

```
担当者       完了pt  進行中  Review滞留  未完了pt
田中 太郎    8       2       0          18
佐藤 花子    12      3       3 ⚠        25
鈴木 一郎    5       1       1          12
```

実装コスト: 0.3 日

---

## 発見 4: スプリント間のキャリーオーバー（積み残し）

**観測**

スプリントが終わって完了しなかった課題が次スプリントに繰り越される。現在この「キャリーオーバー率」を表示する場所が無い。

データから計算可能:
- スプリント N で `status !== 'Done'` の課題のうち、スプリント N+1 にも同じ ID で存在 → キャリーオーバー
- 比率が 30% を超えるとスプリント計画が常に過剰

**UI 提案**

Velocity 推移グラフに **キャリーオーバー pt** を別系列で追加（積み上げ棒）:

```
Sprint 24  ▓▓▓▓▓▓▓▓ 完了 30pt  ░░░░ 持越 8pt
Sprint 23  ▓▓▓▓▓▓ 完了 24pt    ░░ 持越 4pt
```

実装コスト: 0.7 日（複数スプリント横断のロジックが新規）

---

## 発見 5: 担当者の「専門領域」可視化

**観測**

ラベル × 担当者のクロス集計をすると、「ECOM-1234 系の課題は田中さんが多く対応」のような暗黙知が見える。

**意味するところ**

休暇時の引き継ぎや、新メンバーのアサイン判断に直結する。

**UI 提案**

「担当者」タブを新設し、ヒートマップ:

```
            frontend  backend  api  ui  bugfix
田中 太郎    ▓▓▓▓     ▓        ▓    ▓▓  
佐藤 花子    ▓        ▓▓▓▓     ▓▓▓        ▓
鈴木 一郎              ▓        ▓▓        ▓▓▓
```

実装コスト: 1 日（新タブ + ヒートマップ実装）

しかし... **UX Agent の評価が必要**: 新タブが「クリック数を増やす」に該当しないか？ → 「担当者をクリック」のような既存導線から到達するならアリ。タブ追加は却下候補。

---

## 推奨優先順位

| # | 機能 | ROI（行動変容 × 実装易さ） | 採否 |
|---|------|--------------------------|------|
| 1 | エピック進捗 ETA | ★★★★★ | **採用** |
| 3 | Review 滞留検出 | ★★★★ | **採用**（feature_proposals の overload 検出に統合） |
| 4 | キャリーオーバー率 | ★★★ | **採用**（v1.1） |
| 2 | タイプ別見積精度 | ★★ | 検討（モックでは効果見えづらい、実データ次第） |
| 5 | 担当者専門領域ヒートマップ | ★★ | 却下候補（新タブで負ける可能性） |

---

## 計算ロジック（Backend Agent 向け）

実装する場合の擬似コード。

```ts
// エピック ETA
function epicETA(epic: Issue, sprints: Sprint[]): { remainingPt: number; etaSprintIndex: number } {
  const linkedIssues = sprints.flatMap(s => s.issues).filter(i => i.epicId === epic.id);
  const remainingPt = linkedIssues.filter(i => i.status !== 'Done').reduce((s, i) => s + i.points, 0);
  const avgVelocity = sprints.slice(-3).reduce((s, sp) => s + sp.completedPoints, 0) / 3;
  if (avgVelocity <= 0) return { remainingPt, etaSprintIndex: Infinity };
  return { remainingPt, etaSprintIndex: Math.ceil(remainingPt / avgVelocity) };
}

// Review 滞留: 単純化のため、ステータスが Review のチケットの「最新 worklog 日付」が N 日以上前
function reviewStallCount(assignee: string, issues: Issue[], thresholdDays = 2): number {
  const now = Date.now();
  return issues.filter(i =>
    i.assignee === assignee &&
    i.status === 'Review' &&
    (!i.worklogs?.length || (now - new Date(i.worklogs.at(-1)!.date).getTime()) / 86400_000 > thresholdDays)
  ).length;
}
```
