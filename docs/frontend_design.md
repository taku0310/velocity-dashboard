# Frontend Design Notes

作成者: Frontend Agent
最終更新: 2026-06-03
入力: `02-architecture.md`, `03-ux_review.md`, `wireframe.md`

Frontend Agent の主要成果物はコードですが、再設計に伴う実装判断をここに残します。

## コンポーネントツリーの方針

### features/* の共通形

```
features/<name>/
├── <Name>Tab.tsx          # ルートコンポーネント（lazy 対象）
├── components/            # そのタブ内でしか使わないコンポーネント
├── hooks/                 # タブ専用のフック
└── index.ts               # Public API（Tab だけ export）
```

ルール:
- タブ内のコンポーネントは外（他 feature）から import されない
- 「他タブからも使う」になった瞬間 `shared/components/` へ昇格
- これにより、タブを丸ごと差し替えるリファクタが安全になる

---

## 状態管理マッピング

| 種類 | 実装 | 例 |
|------|------|------|
| サーバーデータ | TanStack Query | `useSprints()` `useIssue(key)` |
| ローカル編集 | Zustand + persist | `useLocalEdits` |
| マージ済データ | カスタムフック | `useSprints()` ← 上 2 つを合成 |
| UI 状態（共有） | Zustand | `useUIStore` (selectedSprintId, activeTab, openModalId) |
| フォーム状態 | useState | モーダル内のフィールド値 |
| URL 状態 | カスタムフック | `useRoute()` (hash route) |

### Zustand store の構造

```ts
// shared/stores/ui.ts
interface UIStore {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  selectedSprintId: string | null;
  setSelectedSprintId: (id: string | null) => void;
  hideCompletedSprints: boolean;
  toggleHideCompletedSprints: () => void;
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

// shared/stores/filters.ts
interface FiltersStore {
  search: string;
  status: 'all' | IssueStatus;
  assignee: string;
  label: string;
  setSearch: (v: string) => void;
  // ...
  clearAll: () => void;
}
```

URL からの初期化は `useRoute()` フックが行う（深リンク対応）。

---

## ルーティング実装方針

`wouter` を採用（1KB）。

```tsx
import { Route, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';

<Router hook={useHashLocation}>
  <Switch>
    <Route path="/" component={SummaryTab} />
    <Route path="/summary" component={SummaryTab} />
    <Route path="/progress" component={ProgressTab} />
    <Route path="/gantt" component={GanttTab} />
    <Route path="/issues/:issueKey?" component={IssuesTab} />
    <Route path="/reports" component={ReportsTab} />
  </Switch>
</Router>
```

`useParams()` で `issueKey` を読み、IssuesTab がモーダルを自動オープン。

---

## キーボード制御の集約

```ts
// shared/hooks/useKeyboard.ts
export function useGlobalKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        uiStore.openCommandPalette();
      } else if (e.key === '/' && !isTyping()) {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      } else if (e.key === 'Escape') {
        // 最も内側のオーバーレイを閉じる順序
        if (uiStore.commandPaletteOpen) uiStore.closeCommandPalette();
        else if (uiStore.openModalId) uiStore.closeModal();
      }
      // g + s/p/g/i/r
      // ... コンボキー処理
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

function isTyping(): boolean {
  const t = document.activeElement;
  return t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA';
}
```

App ルートで 1 度だけ呼ぶ。

---

## Modal の共通化

現状 `IssueEditModal` と `SprintEditModal` がそれぞれ focus trap / esc 未対応（Reviewer R-002）。

```tsx
// shared/components/Modal.tsx
export function Modal({ open, onClose, title, children, footer }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!open) return;
    // focus trap
    const firstFocusable = ref.current?.querySelector('input, button, select, textarea');
    (firstFocusable as HTMLElement)?.focus();
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" ref={ref} ...>
      {/* ... */}
    </div>
  );
}
```

`IssueEditModal` / `SprintEditModal` は `<Modal>` の上に乗せる。

---

## 既存からの段階的移行

破壊的変更を一気にやらない。**機能ごとに別 PR**。

| PR | 内容 | 動作確認 |
|----|------|---------|
| 1 | `lib/` フォルダ確立、`utils/` の React 非依存部を移動 | ビルドが通ること |
| 2 | `shared/components/Modal.tsx` 導入、既存 2 モーダルが乗る | モーダル動作、Esc 閉じ、focus 動作 |
| 3 | `features/auth/` に `LoginForm` `useJiraAuth` 移動 | ログイン動作 |
| 4 | `features/summary/` に切り出し + MyTasksCard 新規追加 | サマリタブ表示 |
| 5 | `features/progress/` 切り出し | 進捗タブ表示 |
| 6 | `features/gantt/` 切り出し | ガント表示 + DnD |
| 7 | `features/issues/` 切り出し | 課題管理 |
| 8 | `features/reports/` 切り出し | レポート |
| 9 | TanStack Query 導入。`useSprintData` を置換 | サーバー由来データの取得が同等動作 |
| 10 | Zustand 導入。`Dashboard.tsx` の useState を移行 | UI 状態の保持 |
| 11 | `wouter` 導入。ハッシュルーティング | 深リンクが動く |
| 12 | バンドル分割（lazy import + manualChunks） | ビルド成果物減少 |
| 13 | キーボードショートカット集約 | `/` `Cmd+K` `Esc` |
| 14 | CommandPalette 実装 | Cmd+K で検索可能 |
| 15 | フィルタチップ化 | 視認性向上 |

各 PR は **300 行以内 / 8 ファイル以内** を目安に分ける（Reviewer Agent の方針）。

---

## パフォーマンス計測

`lib/perf.ts` に簡易ヘルパー:

```ts
export function mark(label: string) {
  if (typeof performance !== 'undefined') {
    performance.mark(label);
  }
}

export function measure(label: string, start: string, end: string) {
  try {
    performance.measure(label, start, end);
    const entry = performance.getEntriesByName(label, 'measure').at(-1);
    if (entry && import.meta.env.DEV) {
      console.log(`[perf] ${label}: ${entry.duration.toFixed(1)}ms`);
    }
  } catch {/* noop */}
}
```

呼び出し例:

```tsx
useEffect(() => { mark('boot:react-mounted'); }, []);
```

開発時のみコンソール出力、本番では数値だけ収集（Sentry / Datadog 等）。

---

## アクセシビリティ

- すべての button に明示的 `aria-label`（アイコンのみのケース）
- モーダルは `role="dialog"` `aria-modal="true"`
- フォーカスリング: Tailwind の `focus-visible:` を全インタラクティブ要素に
- カラーコントラスト: WCAG AA 準拠（現状の slate-700 on slate-900 は要検証）
- DnD: キーボード代替提供（モーダルからの編集で同じ操作が可能 = OK）

---

## 国際化

現状 i18n なし、日本語ハードコード。

**v1.0 では i18n しない** 判断。理由:
- 想定ユーザーはチーム内日本語話者
- i18n は早すぎる最適化、設定肥大化のリスク（Jira の負け筋）

将来必要になったら `react-i18next`、文字列を `t('summary.your_tasks')` 形式に置換。今やる必要なし。
