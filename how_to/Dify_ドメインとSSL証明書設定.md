# Dify AWS環境 ドメイン・SSL設定手順書

## 1. 概要

AWS EC2上にDocker Composeで構築したDifyに対して、以下を設定する。

- さくらインターネットで取得済みのドメインをDifyへ割り当てる
- AWS EC2へ固定IP（Elastic IP）を設定する
- さくらインターネットのDNSからEC2へ名前解決する
- Dify付属のNginx + Certbotを使用してLet's EncryptのSSL証明書を取得する
- HTTPSでDifyへアクセスできるようにする

### 想定環境

- Dify: 1.16.1
- AWS EC2
- Docker / Docker Compose
- ドメイン管理: さくらインターネット
- SSL証明書: Let's Encrypt
- Webサーバー: Dify付属Nginx

---

## 2. 構成

```text
ブラウザ
   │
   │ https://dify.example.com
   ▼
さくらインターネット DNS
   │
   │ Aレコード
   ▼
AWS Elastic IP
   │
   ▼
EC2
   │
   ├─ TCP/80
   └─ TCP/443
   │
   ▼
Dify Nginx Container
   │
   ▼
Dify
```

本手順では例として以下のドメインを使用する。

```text
dify.example.com
```

実際の作業時には、自身のドメインへ読み替えること。

---

# 3. AWS Elastic IPの設定

EC2へ割り当てるIPアドレスが変化すると、DNS設定を変更する必要が発生する。

そのため、EC2にはElastic IPを設定することを推奨する。

AWSコンソールから以下を実施する。

```text
EC2
↓
ネットワーク＆セキュリティ
↓
Elastic IP
↓
Elastic IPアドレスを割り当てる
```

作成したElastic IPを対象のEC2へ関連付ける。

例:

```text
54.123.45.67
```

以降、このIPアドレスを例として使用する。

> Elastic IPを含むパブリックIPv4アドレスにはAWSの利用料金が発生するため注意すること。

---

# 4. Security Groupの設定

対象EC2のSecurity Groupを確認する。

インバウンドルールとして最低限以下を許可する。

| 種類 | プロトコル | ポート | ソース |
|---|---|---:|---|
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |

Let's Encryptによる証明書取得でもHTTPポート `80` を使用する。

SSHを使用する場合は、

```text
TCP/22
```

を `0.0.0.0/0` へ公開するのではなく、可能であれば管理端末のグローバルIPのみに制限する。

---

# 5. さくらインターネット DNS設定

## 5.1 サブドメインを使用する場合

本手順では以下を使用する。

```text
dify.example.com
```

さくらインターネットのドメイン管理画面からDNSレコードを設定する。

```text
ドメインコントロールパネル
↓
対象ドメイン
↓
ゾーン / DNSレコード設定
```

以下のAレコードを追加する。

| 項目 | 値 |
|---|---|
| エントリ名 | dify |
| 種別 | A |
| 値 | EC2のElastic IP |

例:

```text
dify    A    54.123.45.67
```

これにより、

```text
dify.example.com
```

がEC2へ向く。

---

## 5.2 ルートドメインを使用する場合

以下をDifyそのものに使用する場合、

```text
example.com
```

ルートドメインのAレコードをEC2へ設定する。

例:

```text
@    A    54.123.45.67
```

ただし、将来的にWebサイトなど別用途でドメインを使用する可能性がある場合は、

```text
dify.example.com
```

のようなサブドメインを使用することを推奨する。

---

# 6. DNSの確認

DNS設定後、ローカルPCなどから確認する。

```bash
dig dify.example.com +short
```

以下のようにEC2のElastic IPが返れば正常。

```text
54.123.45.67
```

または、

```bash
nslookup dify.example.com
```

でも確認可能。

期待するIPアドレスが返らない場合は、SSL証明書取得へ進まずDNS設定を確認する。

DNS変更直後は反映まで時間がかかる場合がある。

---

# 7. EC2へSSH接続

対象EC2へSSHで接続する。

例:

```bash
ssh -i example.pem ec2-user@54.123.45.67
```

Ubuntuの場合は、

```bash
ssh -i example.pem ubuntu@54.123.45.67
```

など、EC2のOSに合わせたユーザーを指定する。

---

# 8. Difyディレクトリへ移動

Difyをcloneしたディレクトリへ移動する。

例:

```bash
cd ~/dify/docker
```

現在のコンテナ状態を確認する。

```bash
docker compose ps
```

Difyが正常に起動していることを確認する。

---

# 9. `.env` のバックアップ

設定変更前に `.env` をバックアップする。

```bash
cp .env .env.backup
```

日時付きでバックアップする場合は、

```bash
cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
```

としてもよい。

---

# 10. SSL証明書取得前の設定

`.env` を編集する。

```bash
nano .env
```

または、

```bash
vi .env
```

以下を設定する。

```env
NGINX_SERVER_NAME=dify.example.com

NGINX_HTTPS_ENABLED=false

NGINX_PORT=80
NGINX_SSL_PORT=443

NGINX_SSL_CERT_FILENAME=fullchain.pem
NGINX_SSL_CERT_KEY_FILENAME=privkey.pem

NGINX_ENABLE_CERTBOT_CHALLENGE=true

CERTBOT_DOMAIN=dify.example.com
CERTBOT_EMAIL=your-email@example.com

EXPOSE_NGINX_PORT=80
EXPOSE_NGINX_SSL_PORT=443
```

以下は実環境に合わせて変更する。

```text
dify.example.com
your-email@example.com
```

`CERTBOT_EMAIL` にはLet's Encrypt関連の通知を受信できるメールアドレスを設定する。

---

# 11. 設定内容の確認

重複設定がないか確認する。

```bash
grep -E 'NGINX_SERVER_NAME|NGINX_HTTPS_ENABLED|NGINX_PORT|NGINX_SSL_PORT|NGINX_SSL_CERT|NGINX_ENABLE_CERTBOT|CERTBOT_|EXPOSE_NGINX' .env
```

同じ設定項目が複数存在する場合は整理する。

特に、

```env
NGINX_HTTPS_ENABLED=
CERTBOT_DOMAIN=
NGINX_SERVER_NAME=
```

などが複数定義されていないことを確認する。

---

# 12. Nginx / Certbotを起動

Certbot profileを有効にしてNginxとCertbotを起動する。

```bash
docker compose --profile certbot up -d --no-deps --force-recreate certbot nginx
```

状態確認:

```bash
docker compose ps
```

NginxとCertbotが起動していることを確認する。

必要に応じてログを確認する。

```bash
docker compose logs nginx
```

```bash
docker compose logs certbot
```

---

# 13. HTTPアクセス確認

SSL証明書取得前に、ドメイン経由でEC2へアクセスできることを確認する。

```bash
curl -I http://dify.example.com
```

何らかのHTTPレスポンスが返れば、少なくとも以下の経路は成立している。

```text
DNS
↓
EC2
↓
Security Group TCP/80
↓
Nginx
```

タイムアウトする場合は以下を確認する。

- DNSのAレコード
- Elastic IP
- Security Groupの80番ポート
- EC2 OS側のFirewall
- Dify Nginxコンテナ
- Dockerのポート公開設定

---

# 14. Let's Encrypt証明書を取得

Certbotコンテナ内のDify付属スクリプトを実行する。

```bash
docker compose exec -it certbot /bin/sh /update-cert.sh
```

正常に完了したことを確認する。

証明書ディレクトリも確認する。

```bash
ls -la volumes/certbot/conf/live/
```

対象ドメインのディレクトリが存在することを確認する。

例:

```bash
ls -la volumes/certbot/conf/live/dify.example.com/
```

以下のファイルが存在すれば証明書が発行されている。

```text
cert.pem
chain.pem
fullchain.pem
privkey.pem
```

---

# 15. HTTPSを有効化

証明書取得後、再度 `.env` を編集する。

```bash
nano .env
```

以下を、

```env
NGINX_HTTPS_ENABLED=false
```

から、

```env
NGINX_HTTPS_ENABLED=true
```

へ変更する。

最終的な設定例:

```env
NGINX_SERVER_NAME=dify.example.com

NGINX_HTTPS_ENABLED=true

NGINX_PORT=80
NGINX_SSL_PORT=443

NGINX_SSL_CERT_FILENAME=fullchain.pem
NGINX_SSL_CERT_KEY_FILENAME=privkey.pem

NGINX_ENABLE_CERTBOT_CHALLENGE=true

CERTBOT_DOMAIN=dify.example.com
CERTBOT_EMAIL=your-email@example.com

EXPOSE_NGINX_PORT=80
EXPOSE_NGINX_SSL_PORT=443
```

---

# 16. Nginxを再作成

設定変更を反映する。

```bash
docker compose --profile certbot up -d --no-deps --force-recreate nginx
```

状態を確認する。

```bash
docker compose ps
```

Nginxログも確認する。

```bash
docker compose logs --tail=100 nginx
```

エラーが発生していなければHTTPSアクセスを確認する。

---

# 17. HTTPSアクセス確認

ブラウザから以下へアクセスする。

```text
https://dify.example.com
```

Difyの画面が表示され、ブラウザ上でSSL証明書エラーが表示されなければ設定完了。

CLIからも確認する。

```bash
curl -I https://dify.example.com
```

SSL証明書の詳細を確認する場合:

```bash
openssl s_client \
  -connect dify.example.com:443 \
  -servername dify.example.com \
  </dev/null
```

---

# 18. Dify URL関連設定

単一ドメインで通常のDifyを利用する場合、すべてのURL変数を明示設定する必要はない。

ただし、外部URLを生成する機能を使用する場合はHTTPSのURLを設定する。

例:

```env
CONSOLE_WEB_URL=https://dify.example.com
APP_WEB_URL=https://dify.example.com
```

Webhook / Trigger機能を使用する場合:

```env
TRIGGER_URL=https://dify.example.com
```

その他、

```env
CONSOLE_API_URL=
SERVICE_API_URL=
APP_API_URL=
FILES_URL=
```

などを独自設定している場合は、古いIPアドレスや `http://` のURLが残っていないか確認する。

検索例:

```bash
grep -nE 'http://|https://' .env
```

特に、

```text
http://EC2-IP
```

などが残っている場合は用途を確認する。

---

# 19. HTTP → HTTPSリダイレクト確認

以下を実行する。

```bash
curl -I http://dify.example.com
```

HTTPSへリダイレクトする構成の場合、

```text
301
```

または

```text
302
```

などのレスポンスと、

```text
Location: https://dify.example.com/
```

が返ることを確認する。

---

# 20. SSL証明書更新

Let's Encryptの証明書には有効期限があるため、定期的に更新する必要がある。

手動更新は以下。

```bash
docker compose exec -it certbot /bin/sh /update-cert.sh
```

更新後にNginxをreloadする。

```bash
docker compose exec nginx nginx -s reload
```

本番運用ではcronやsystemd timerなどによる自動更新を推奨する。

---

# 21. トラブルシューティング

## 21.1 証明書取得に失敗する

まずDNSを確認する。

```bash
dig dify.example.com +short
```

EC2のElastic IPと一致していること。

次にHTTPアクセスを確認する。

```bash
curl -I http://dify.example.com
```

アクセスできない場合は以下を確認する。

- Security Group TCP/80
- Elastic IPの関連付け
- DNS設定
- Nginxコンテナ
- EC2のFirewall

---

## 21.2 Nginxが起動しない

ログを確認する。

```bash
docker compose logs --tail=200 nginx
```

設定ファイルを確認する。

```bash
docker compose exec nginx nginx -t
```

よくある原因:

- 証明書ファイルが存在しない
- `NGINX_HTTPS_ENABLED=true` にするタイミングが早い
- 証明書ファイル名が間違っている
- `.env` に同一設定が複数存在する

証明書取得前は必ず、

```env
NGINX_HTTPS_ENABLED=false
```

としておく。

---

## 21.3 Certbotのログ確認

```bash
docker compose logs --tail=200 certbot
```

または、

```bash
docker compose exec certbot sh
```

でコンテナ内部を確認する。

---

## 21.4 ポート使用状況確認

EC2上で確認する。

```bash
sudo ss -lntp | grep -E ':80|:443'
```

Docker側:

```bash
docker ps
```

80番または443番を別のWebサーバーやコンテナが使用している場合、Dify Nginxが正常に公開できない可能性がある。

---

## 21.5 Docker Compose全体確認

```bash
docker compose ps
```

異常終了しているコンテナがあればログを確認する。

```bash
docker compose logs --tail=100
```

---

# 22. 作業完了チェックリスト

- [ ] EC2にElastic IPを割り当てた
- [ ] Security GroupでTCP/80を許可した
- [ ] Security GroupでTCP/443を許可した
- [ ] さくらDNSにAレコードを追加した
- [ ] `dig` でドメインがElastic IPを返す
- [ ] `http://dify.example.com` へアクセスできる
- [ ] `.env` のバックアップを取得した
- [ ] `NGINX_SERVER_NAME` を設定した
- [ ] `CERTBOT_DOMAIN` を設定した
- [ ] `CERTBOT_EMAIL` を設定した
- [ ] Certbotコンテナを起動した
- [ ] Let's Encrypt証明書を取得した
- [ ] `fullchain.pem` が存在する
- [ ] `privkey.pem` が存在する
- [ ] `NGINX_HTTPS_ENABLED=true` に変更した
- [ ] Nginxを再作成した
- [ ] `https://dify.example.com` へアクセスできる
- [ ] SSL証明書エラーが発生しない
- [ ] `.env` に古いHTTP/IPアドレス設定が残っていない
- [ ] 証明書更新方法を確認した

---

# 23. 作業フローまとめ

```text
EC2へElastic IP割り当て
        │
        ▼
Security Group
80 / 443を許可
        │
        ▼
さくらDNS
Aレコード設定
        │
        ▼
digで名前解決確認
        │
        ▼
Dify .env設定
NGINX_HTTPS_ENABLED=false
        │
        ▼
Nginx + Certbot起動
        │
        ▼
HTTPアクセス確認
        │
        ▼
Let's Encrypt
SSL証明書取得
        │
        ▼
NGINX_HTTPS_ENABLED=true
        │
        ▼
Nginx再作成
        │
        ▼
HTTPSアクセス確認
        │
        ▼
完了
```

---

## 補足

EC2 1台でDifyを運用する構成であれば、本手順では以下のAWSサービスは必須ではない。

- Route 53
- Application Load Balancer（ALB）
- AWS Certificate Manager（ACM）

Dify付属のNginxとCertbotを使用してEC2上でSSL終端する構成とする。