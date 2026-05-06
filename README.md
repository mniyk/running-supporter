# ランニング距離アナウンスアプリ

スマホブラウザで動くシンプルなランニング距離アナウンスアプリ。
GPS で距離を計測し、設定した間隔ごとに日本語音声でアナウンスします。

## 技術スタック

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Web Speech API (SpeechSynthesis)
- Geolocation API + Wake Lock API

## ローカル開発

GPS と音声はHTTPS が必要です。開発時は `--host` でLAN上のスマホからアクセスします。

```bash
npm install
npm run dev -- --host
```

起動後に表示されるローカルIPアドレス（例: `http://192.168.x.x:5173`）を
スマホのブラウザで開いてください。

> **iOS Safari の注意**: HTTPSでないと位置情報が使えません。
> ローカル開発は Android Chrome か PC で確認し、本番はHTTPS 環境にデプロイしてください。

## ビルド

```bash
npm run build
```

`dist/` に静的ファイルが生成されます。

## デプロイ

### Vercel

```bash
npm install -g vercel
vercel
```

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # Public directory: dist / SPA: yes
npm run build
firebase deploy
```

## 機能

| 機能 | 詳細 |
|------|------|
| GPS 距離計測 | Haversine 公式、精度 20m 以下のみ使用 |
| 音声アナウンス | 50m / 100m / 200m / 500m 間隔で選択可 |
| 画面スリープ防止 | Wake Lock API（非対応ブラウザは警告表示）|
| iOS Safari 対応 | スタート時に音声コンテキストを解放 |
