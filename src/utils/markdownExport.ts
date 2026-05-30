import type { Sprint, KPIMetrics, AssigneePerformance } from '../types';

// Markdown レポートを生成
export function generateMarkdownReport(
  sprint: Sprint,
  metrics: KPIMetrics,
  assignees: AssigneePerformance[],
): string {
  const done = sprint.issues.filter((i) => i.status === 'Done');
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ja-JP');

  const accuracyLines = done
    .filter((i) => i.estimatedHours > 0)
    .map((i) => {
      const acc = Math.round((i.actualHours / i.estimatedHours) * 100);
      return `- **${i.id}** ${i.title}: 見積${i.estimatedHours}h → 実績${i.actualHours}h (${acc}%)`;
    })
    .join('\n');

  const assigneeLines = assignees
    .map(
      (a) =>
        `| ${a.assignee} | ${a.completedPoints} | ${a.completedIssues}/${a.totalIssues} | ${a.accuracy}% | ${a.completionRate}% |`,
    )
    .join('\n');

  return `# ${sprint.name} レトロスペクティブレポート

**実施日**: ${new Date().toLocaleDateString('ja-JP')}
**期間**: ${fmtDate(sprint.startDate)} 〜 ${fmtDate(sprint.endDate)}

---

## 📊 スプリント成果

| 指標 | 計画 | 実績 | 達成率 |
|------|------|------|--------|
| Story Points | ${metrics.totalPoints} | ${metrics.completedPoints} | ${metrics.pointsCompletion}% |
| 課題数 | ${metrics.totalIssues} | ${metrics.completedIssues} | ${metrics.issuesCompletion}% |
| 推定時間 | ${metrics.estimatedHours}h | ${metrics.actualHours}h | ${metrics.hoursAccuracy}% |

---

## 👥 担当者別パフォーマンス

| 担当者 | 完了ポイント | 完了数 | 見積精度 | 完了率 |
|--------|-----------|--------|---------|--------|
${assigneeLines}

---

## 🔍 見積もり精度分析

### 課題別精度
${accuracyLines || '（完了課題なし）'}

---

*自動生成: Velocity Dashboard*
*${new Date().toLocaleString('ja-JP')}*
`;
}

// Markdown ファイルをダウンロード
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
