# Velocity Dashboard

Jira スプリント実績分析ダッシュボード。React + TypeScript + Vite + Tailwind CSS + Recharts で構築。

## 主な機能

### 上司向け
- **Story Points 達成率**
- **Velocity 推移**（過去6スプリント）
- **見積もり精度**
- **担当者別パフォーマンス**
- **スプリント結果サマリー**（自動生成）

### チーム向け
- **バーンダウングラフ**
- **見積もり精度の散布図**
- **全課題一覧**（検索・ステータスフィルタ）
- **ワークログ詳細**

### 共通
- ビューモード切り替え（上司向け / チーム向け）
- スプリント選択
- Markdown レポートのエクスポート
- Jira API 失敗時のモックデータフォールバック

## セットアップ

```bash
npm install
cp .env.example .env
# .env を編集して Jira 接続情報を設定
npm run dev
```

http://localhost:5173 を開きます。

### 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `VITE_DATA_SOURCE` | `jira-api` または `mock` | `jira-api` |
| `VITE_USE_MOCK_FALLBACK` | API 失敗時にモックを使うか | `true` |
| `VITE_JIRA_INSTANCE_URL` | Jira インスタンス URL | — |
| `VITE_JIRA_BOARD_ID` | デフォルトボード ID | — |

## ログイン

ログイン画面で以下を入力します。

- Jira インスタンス URL（例: `https://your-domain.atlassian.net`）
- Email
- Jira API Token（[トークン生成](https://id.atlassian.com/manage-profile/security/api-tokens)）
- ボード ID

Jira を持っていない場合は **「モックデータで試す」** ボタンでサンプル表示できます。

## ビルド・デプロイ

```bash
npm run build
# → dist/ が生成される
```

Netlify / Vercel にそのままデプロイできます。SPA としてホストしてください。

## ディレクトリ構成

```
src/
├── components/   # React コンポーネント
├── hooks/        # カスタムフック（認証・データ取得）
├── services/     # Jira API クライアント・モックデータ
├── utils/        # KPI 計算・Markdown 生成
├── types/        # TypeScript 型定義
├── App.tsx
├── main.tsx
└── index.css
```

## セキュリティ

- API Token は **セッションストレージ** に保存（タブを閉じれば破棄）
- localStorage には API レスポンスのみキャッシュ（TTL 5分）
- HTTPS Jira インスタンスのみ推奨
