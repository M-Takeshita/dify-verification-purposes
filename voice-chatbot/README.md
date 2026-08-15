# Dify Voice Chatbot

ブラウザの音声認識で文字起こしした内容を、Dify API に送信する最小構成のサンプルです。

## 使い方

1. `.env.example` を `.env` にコピーします。
2. `.env` に Dify の URL と API キーを設定します。
3. `npm start` で起動します。
4. ブラウザで `http://localhost:3001` を開きます。

## 環境変数

- `DIFY_BASE_URL`
  例: `http://localhost/v1`
- `DIFY_API_KEY`
  Dify のアプリ API キー
- `DIFY_SKIP_TLS_VERIFY`
  `true` にすると Node 側の TLS 証明書検証をスキップ
- `DIFY_TIMEOUT_MS`
  Dify からデータが来ない状態のタイムアウト。省略時 `45000`
- `PORT`
  任意。省略時は `3001`

## 補足

- 音声入力はブラウザの Web Speech API を使っています。
- Chrome 系ブラウザを前提にしています。
- API キーをブラウザへ出さないため、Node 側で Dify へプロキシしています。
- 送信時に `fetch failed (UNABLE_TO_VERIFY_LEAF_SIGNATURE)` が出る場合は、Dify 側証明書チェーンの問題です。暫定回避として `.env` で `DIFY_SKIP_TLS_VERIFY=true` を使えます。
- Dify API は `streaming` モードで呼び出し、サーバー側で SSE を集約して返しています。
- `DIFY_TIMEOUT_MS` は応答全体の長さではなく、Dify からデータ断片が届かない時間の上限として使っています。
