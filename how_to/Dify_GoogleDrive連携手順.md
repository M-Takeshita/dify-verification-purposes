# Dify × Google Drive ナレッジベース連携手順書

## 1. 概要

Self-hosted Dify から Google Drive をデータソースとして接続し、Google Drive 上のファイルをナレッジベースとして利用するための手順を記載する。

### 想定環境

- Dify: `1.16.1`
- Dify稼働環境: AWS EC2
- Docker ComposeによるSelf-host
- Dify公開URL: `https://dify-demo.los-ij.co.jp`
- Google Workspace: **未契約**
- Google Cloud: OAuth / Google Drive API設定のために利用
- Googleアカウント: 通常の個人Googleアカウントでも可

Google Workspace契約は必須ではない。

ただし、Google Drive APIとOAuth 2.0を利用するため、Google Cloud Projectの作成は必要となる。

DifyではGoogle DriveをOAuth対応のデータソースとして認証できる。 citeturn943278search8turn943278search3

---

# 2. 全体構成

```text
Google Drive
    │
    │ Google Drive API
    │ OAuth 2.0
    ↓
Google Cloud Project
    │
    │ Client ID
    │ Client Secret
    ↓
Dify 1.16.1
    │
    ├─ Google Drive Plugin
    │
    └─ Knowledge Pipeline
           ↓
       Knowledge Base
```

AWS側では以下のような構成を想定する。

```text
Internet
   │
   │ HTTPS
   ↓
https://dify-demo.los-ij.co.jp
   │
   ↓
EC2 / nginx
   │
   ├─ web
   ├─ api
   ├─ worker
   ├─ PostgreSQL
   ├─ Redis
   └─ Weaviate
```

---

# 3. 前提条件

以下が完了していること。

- Difyが正常起動している
- 独自ドメインからDifyへアクセスできる
- HTTPS化されている
- Googleアカウントを所有している

今回の例：

```text
https://dify-demo.los-ij.co.jp
```

---

# 4. Google Cloud Projectを作成する

Google Cloud ConsoleへGoogleアカウントでログインする。

新規プロジェクトを作成する。

例：

```text
Project Name:
dify-google-drive-demo
```

Google Workspace契約がなくても、Google APIを利用するためのCloud Projectは作成できる。

---

# 5. Google Drive APIを有効化する

Google Cloud Consoleから以下へ移動する。

```text
APIとサービス
↓
ライブラリ
↓
Google Drive API
```

`有効にする` をクリックする。

---

# 6. Google Auth Platformを設定する

Google Cloud Consoleから、

```text
Google Auth Platform
```

を開く。

## Audience

以下の設定とする。

```text
User Type:
External

Publishing Status:
Testing
```

### Test users

DifyからGoogle Driveへログインするときに使用するGoogleアカウントを登録する。

例：

```text
example@gmail.com
```

Testing状態では、登録したテストユーザーを使用してOAuth認証を実施する。

---

# 7. Google Drive OAuth Scopeを設定する

Google Auth Platformから、

```text
データアクセス
↓
スコープを追加または削除
```

を開く。

以下を登録する。

```text
https://www.googleapis.com/auth/drive.readonly
```

```text
https://www.googleapis.com/auth/drive.metadata.readonly
```

`drive.readonly` はGoogle Drive内のファイルを読み取るためのスコープであり、GoogleではRestricted Scopeとして分類されている。 citeturn943278search6turn943278search27

`drive.metadata.readonly` はファイル内容ではなく、Drive上のファイルメタデータを読み取るためのスコープとなる。 citeturn943278search35

DEMO・検証環境では、

```text
External
+
Testing
+
Test User
```

で利用する。

本番環境や多数のユーザーへ公開する場合は、Google OAuth Verification等を別途検討する。

---

# 8. OAuth Clientを作成する

Google Auth Platformから、

```text
クライアント
↓
クライアントを作成
```

を選択する。

Application Type：

```text
Web application
```

とする。

---

# 9. DifyのCallback URLを登録する

Self-hosted DifyのGoogle Drive Pluginでは、Callback URLは以下の形式となる。

```text
https://<Difyドメイン>/console/api/oauth/plugin/langgenius/google_drive/google_drive/datasource/callback
```

Dify公式Google Drive PluginでもSelf-hosted環境用のOAuth Callback設定が案内されている。 citeturn943278search3

今回の場合：

```text
https://dify-demo.los-ij.co.jp/console/api/oauth/plugin/langgenius/google_drive/google_drive/datasource/callback
```

Google CloudのOAuth Client設定で、

```text
承認済みのリダイレクトURI
```

に上記を登録する。

Google OAuthでは、認可リクエストの`redirect_uri`とGoogle Cloud Consoleへ登録したURIが完全一致する必要がある。 citeturn943278search7

---

# 10. Client ID / Client Secretを取得する

OAuth Client作成後、

```text
Client ID
Client Secret
```

が発行される。

この2つをDify側で使用する。

Client Secretは外部公開しないこと。

---

# 11. Difyの外部URLを設定する

AWS EC2へSSH接続する。

DifyのDockerディレクトリへ移動する。

```bash
cd ~/dify/docker
```

`.env` を編集する。

外部公開URLは以下とする。

```env
CONSOLE_API_URL=https://dify-demo.los-ij.co.jp
CONSOLE_WEB_URL=https://dify-demo.los-ij.co.jp
SERVICE_API_URL=https://dify-demo.los-ij.co.jp
APP_API_URL=https://dify-demo.los-ij.co.jp
APP_WEB_URL=https://dify-demo.los-ij.co.jp
```

---

# 12. SERVER_CONSOLE_API_URLを設定する

ここは特に重要。

Dify WebコンテナからAPIコンテナへの通信はDocker内部ネットワークを使用する。

そのため、

```env
SERVER_CONSOLE_API_URL=http://api:5001
```

とする。

### NG

```env
SERVER_CONSOLE_API_URL=https://api:5001
```

### OK

```env
SERVER_CONSOLE_API_URL=http://api:5001
```

外部通信はHTTPSだが、

```text
web → api
```

のDocker内部通信はHTTPとなる。

全体としては以下。

```text
Browser
   │
   │ HTTPS
   ↓
https://dify-demo.los-ij.co.jp
   │
   ↓
nginx
   │
   ↓
web
   │
   │ HTTP
   ↓
http://api:5001
```

---

# 13. Dify 1.16.1のCollaboration Modeを無効化する

Dify 1.16.1で、

```text
データを同期中
```

の表示から進まない場合は、

`.env` に以下を設定する。

```env
ENABLE_COLLABORATION_MODE=false
```

同じ設定を重複して記載しないこと。

確認：

```bash
grep ENABLE_COLLABORATION_MODE .env
```

期待値：

```text
ENABLE_COLLABORATION_MODE=false
```

---

# 14. 推奨.env設定

今回の環境では最低限以下を設定する。

```env
CONSOLE_API_URL=https://dify-demo.los-ij.co.jp

SERVER_CONSOLE_API_URL=http://api:5001

CONSOLE_WEB_URL=https://dify-demo.los-ij.co.jp

SERVICE_API_URL=https://dify-demo.los-ij.co.jp

APP_API_URL=https://dify-demo.los-ij.co.jp

APP_WEB_URL=https://dify-demo.los-ij.co.jp

ENABLE_COLLABORATION_MODE=false
```

確認コマンド：

```bash
grep -E '^(CONSOLE_API_URL|SERVER_CONSOLE_API_URL|CONSOLE_WEB_URL|SERVICE_API_URL|APP_API_URL|APP_WEB_URL|ENABLE_COLLABORATION_MODE)=' .env
```

---

# 15. Docker Composeを再作成する

`.env`変更後はコンテナを再作成する。

```bash
docker compose down
```

```bash
docker compose up -d
```

状態確認：

```bash
docker compose ps
```

API等が正常に起動していることを確認する。

---

# 16. SERVER_CONSOLE_API_URLの反映確認

Webコンテナへ環境変数が反映されていることを確認する。

```bash
docker compose exec web env | grep SERVER_CONSOLE_API_URL
```

期待値：

```text
SERVER_CONSOLE_API_URL=http://api:5001
```

---

# 17. DifyへGoogle Drive Pluginを追加する

Difyへログインする。

Marketplaceから、

```text
Google Drive
```

Data Source Pluginをインストールする。

DifyではGoogle Driveなどの外部データソースをKnowledge Pipelineの入力として利用できる。 citeturn943278search15turn943278search29

---

# 18. Google Drive OAuthを設定する

DifyのGoogle Drive Data Source設定を開く。

例：

```text
Settings
↓
Data Sources
↓
Google Drive
↓
Configure
```

Custom OAuth設定を追加する。

Google Cloudで発行した、

```text
Client ID
Client Secret
```

を入力する。

Dify公式でもOAuth対応データソースについて、Custom OAuth Client ID / Client Secretを設定する方法が案内されている。 citeturn943278search0turn943278search8

保存後、

```text
Authorize
```

を実行する。

---

# 19. Google OAuth認証

Googleログイン画面が表示される。

Google Auth Platformの、

```text
Test users
```

へ登録したGoogleアカウントでログインする。

Google Driveへのアクセスを許可する。

認証成功後、Difyへリダイレクトされる。

---

# 20. Knowledge PipelineへGoogle Driveを設定する

DifyでKnowledge Pipelineを作成する。

構成例：

```text
Google Drive
     ↓
Document Extractor
     ↓
Chunking
     ↓
Knowledge Base
```

Google Driveから対象ファイル・フォルダを選択し、Knowledge Baseへ取り込む。

---

# 21. トラブルシューティング

## 21.1 Google OAuthでinvalid_requestになる

エラー例：

```text
You can't sign in to this app because it doesn't comply
with Google's OAuth 2.0 policy for keeping apps secure.

Error 400: invalid_request
```

リクエスト詳細：

```text
redirect_uri=/console/api/oauth/plugin/langgenius/google_drive/google_drive/datasource/callback
```

### 原因

DifyがGoogleへ、

```text
/console/api/...
```

という相対URLを送信している。

Google OAuthでは完全なURLが必要。

### 対応

`.env` の以下を設定する。

```env
CONSOLE_API_URL=https://dify-demo.los-ij.co.jp
```

その後、

```bash
docker compose down
docker compose up -d
```

を実行する。

正常時：

```text
redirect_uri=https://dify-demo.los-ij.co.jp/console/api/oauth/plugin/langgenius/google_drive/google_drive/datasource/callback
```

Google OAuthではredirect URIの完全一致が要求される。 citeturn943278search7

---

## 21.2 「このコンポーネントのレンダリング中に予期しないエラー」が発生する

ブラウザ側：

```text
An error occurred in the Server Components render.
```

Webコンテナログ：

```text
TypeError: fetch failed
```

```text
Client network socket disconnected before secure TLS
connection was established
```

```text
code: 'ECONNRESET'
host: 'api'
port: '5001'
```

### 原因

以下の誤設定。

```env
SERVER_CONSOLE_API_URL=https://api:5001
```

Docker内部のDify APIはHTTPSではなくHTTPで接続する。

### 修正

```env
SERVER_CONSOLE_API_URL=http://api:5001
```

コマンド：

```bash
sed -i \
's|^SERVER_CONSOLE_API_URL=.*|SERVER_CONSOLE_API_URL=http://api:5001|' \
.env
```

再作成：

```bash
docker compose down
docker compose up -d
```

---

## 21.3 「データを同期中」から進まない

Dify 1.16.1で発生した場合、

```env
ENABLE_COLLABORATION_MODE=false
```

を設定する。

その後、

```bash
docker compose down
docker compose up -d
```

を実行する。

---

## 21.4 Google OAuth Callback URLを確認する

基本形式：

```text
https://<Difyドメイン>/console/api/oauth/plugin/langgenius/google_drive/google_drive/datasource/callback
```

今回：

```text
https://dify-demo.los-ij.co.jp/console/api/oauth/plugin/langgenius/google_drive/google_drive/datasource/callback
```

Google Cloudへ登録したURIと完全一致すること。

---

## 21.5 Google Drive APIが有効か確認する

Google Cloud Console：

```text
APIとサービス
↓
有効なAPIとサービス
```

以下が存在すること。

```text
Google Drive API
```

存在しない場合：

```text
APIとサービス
↓
ライブラリ
↓
Google Drive API
↓
有効にする
```

---

## 21.6 OAuth Scopeを確認する

Google Auth Platform：

```text
データアクセス
```

以下が存在すること。

```text
https://www.googleapis.com/auth/drive.readonly
```

```text
https://www.googleapis.com/auth/drive.metadata.readonly
```

---

## 21.7 Test Userを確認する

Google Auth Platform：

```text
Audience
```

確認：

```text
User Type:
External

Publishing Status:
Testing
```

さらに、

```text
Test users
```

へDifyとの認証に使用するGoogleアカウントが登録されていること。

---

# 22. ログ確認

## Web

```bash
docker compose logs --tail=200 web
```

リアルタイム：

```bash
docker compose logs -f web
```

## API

```bash
docker compose logs --tail=200 api
```

## Plugin Daemon

```bash
docker compose logs --tail=200 plugin_daemon
```

## 全サービス

```bash
docker compose ps
```

---

# 23. 最終チェックリスト

- [ ] DifyがHTTPSでアクセスできる
- [ ] Google Cloud Projectを作成した
- [ ] Google Drive APIを有効化した
- [ ] OAuth AudienceをExternalにした
- [ ] Publishing StatusをTestingにした
- [ ] Test Userを登録した
- [ ] `drive.readonly` を設定した
- [ ] `drive.metadata.readonly` を設定した
- [ ] OAuth ClientをWeb Applicationとして作成した
- [ ] Dify Callback URLをGoogleへ登録した
- [ ] Client IDをDifyへ設定した
- [ ] Client SecretをDifyへ設定した
- [ ] `CONSOLE_API_URL` をHTTPSのDifyドメインに設定した
- [ ] `SERVER_CONSOLE_API_URL=http://api:5001` とした
- [ ] `ENABLE_COLLABORATION_MODE=false` とした
- [ ] Docker Composeを再作成した
- [ ] Google OAuth認証が成功した
- [ ] Google Driveのファイル一覧をDifyから参照できる
- [ ] Knowledge PipelineからGoogle Driveのファイルを取り込める

---

# 24. 今回の主要な注意点

今回特にハマりやすかったポイントは以下の3点。

### 1. CONSOLE_API_URL

誤：

```env
CONSOLE_API_URL=
```

正：

```env
CONSOLE_API_URL=https://dify-demo.los-ij.co.jp
```

空の場合、Googleへ相対Callback URLが渡され、

```text
Error 400: invalid_request
```

になる可能性がある。

### 2. SERVER_CONSOLE_API_URL

誤：

```env
SERVER_CONSOLE_API_URL=https://api:5001
```

正：

```env
SERVER_CONSOLE_API_URL=http://api:5001
```

外部URLがHTTPSだからといってDocker内部通信までHTTPSにしてはいけない。

### 3. Dify 1.16.1 Collaboration Mode

```env
ENABLE_COLLABORATION_MODE=false
```

とすることで、「データを同期中」から進まない問題を回避できる場合がある。

---

# 25. セキュリティ上の注意

Google Driveの`drive.readonly`等は広範囲のDriveデータを読み取れるRestricted Scopeである。 citeturn943278search6

DEMO環境では、

```text
External
+
Testing
+
Test User限定
```

とし、不特定多数へOAuthアプリを公開しない。

本番利用時には、

- Google OAuth Verification
- Restricted Scopeの利用要件
- Google Driveデータの保存方法
- Difyへのアクセス制限
- Client Secret管理
- AWS Security Group
- HTTPS
- Difyのバージョンアップ

などを改めて検討すること。