# コンソールを利用したAWS環境初期構築(Dify用)

## 前提
TODO あとで書く

MEMO:
AWS t3.smallで起動 SSDは30GB
AWSリージョンは東京

Difyをコンソールでコマンド打ちながら起動 -> 動作確認がGOAL

## Dockerインストール
```bash
# dnf最新化
$ sudo dnf update -y
# docker install
$ sudo dnf install -y docker git
```

## Docker起動・Dockerのユーザー追加
```bash
# Dockerの有効化・起動
$ sudo systemctl enable docker
$ sudo systemctl start docker

# ec2-user(自分)をdockerグループに追加
$ sudo usermod -aG docker ec2-user

# → コンソールを再起動

# dockerコマンド確認
$ docker ps

# 以下が表示されたらOK
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

## Docker CLI Pluginのインストール
```bash
# お作法
$ sudo mkdir -p /usr/local/lib/docker/cli-plugins
$ sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
$ sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 確認
$ docker compose version

# 以下が表示されればOK
Docker Compose version v5.1.0
```

---

## Swap領域の作成(低スペックEC2用)
```bash
# この辺はお作法。 4Gのところは好きな値を設定する
$ sudo fallocate -l 4G /swapfile
$ sudo chmod 600 /swapfile
$ sudo mkswap /swapfile
Setting up swapspace version 1, size = 4 GiB (4294963200 bytes)
no label, UUID=c1aec9b8-2b98-488a-b787-8c06a50f1388
$ sudo swapon /swapfile

# Swap領域の永続化
$ echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab

# 確認
$ free -h

# 以下のSwapが表示されたOK
               total        used        free      shared  buff/cache   available
Mem:           1.9Gi       277Mi       884Mi       0.0Ki       751Mi       1.4Gi
Swap:          4.0Gi          0B       4.0Gi
```
---

## Difyをダウンロード

```bash
$ cd /opt
# DifyをClone
$ sudo git clone https://github.com/langgenius/dify.git
$ sudo chown -R ec2-user:ec2-user dify

# Clone確認
$ ls

# difyフォルダがあればOK
aws  containerd  dify
```

## Dify環境変数ファイル作成

```bash
# ディレクトリ移動
$ cd dify/docker

# .env.exampleをコピーして.envを作成する
# 外部に本格的に公開する場合はDBパスワードなど、シークレットな値を別の値に"必ず"変更する
$ cp .env.example .env

# 確認
$ cat .env

# → .envの中身が表示されたらOK
```

## Dify起動
```bash
# dify/dockerディレクトリで実行する

# dockerを使用してDifyを起動する(時間がかかるので注意)
$ docker-compose up -d

# 起動確認
$ docker ps

# 以下のコンテナ等が起動していたらOK
CONTAINER ID   IMAGE                                       COMMAND                  CREATED         STATUS                   PORTS                                                                      NAMES
8e063776ee1e   nginx:latest                                "sh -c 'cp /docker-e…"   3 minutes ago   Up 3 minutes             0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:443->443/tcp, :::443->443/tcp   docker-nginx-1
bafb2e9a248c   langgenius/dify-api:1.13.0                  "/bin/bash /entrypoi…"   3 minutes ago   Up 3 minutes             5001/tcp                                                                   docker-worker-1
e13ad3907e73   langgenius/dify-api:1.13.0                  "/bin/bash /entrypoi…"   3 minutes ago   Up 3 minutes             5001/tcp                                                                   docker-worker_beat-1
5347cf3b765c   langgenius/dify-api:1.13.0                  "/bin/bash /entrypoi…"   3 minutes ago   Up 3 minutes             5001/tcp                                                                   docker-api-1
e48062568bda   langgenius/dify-plugin-daemon:0.5.3-local   "/bin/bash -c /app/e…"   3 minutes ago   Up 3 minutes             0.0.0.0:5003->5003/tcp, :::5003->5003/tcp                                  docker-plugin_daemon-1
80fa817563be   postgres:15-alpine                          "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes (healthy)   5432/tcp                                                                   docker-db_postgres-1
d008dddc6800   langgenius/dify-web:1.13.0                  "/bin/sh ./entrypoin…"   3 minutes ago   Up 3 minutes             3000/tcp                                                                   docker-web-1
aa31d94b9b7c   langgenius/dify-sandbox:0.2.12              "/main"                  3 minutes ago   Up 3 minutes (healthy)                                                                              docker-sandbox-1
bcad936e5b2f   ubuntu/squid:latest                         "sh -c 'cp /docker-e…"   3 minutes ago   Up 3 minutes             3128/tcp                                                                   docker-ssrf_proxy-1
ea1bd4b78820   semitechnologies/weaviate:1.27.0            "/bin/weaviate --hos…"   3 minutes ago   Up 3 minutes                                                                                        docker-weaviate-1
d397898b583d   redis:6-alpine                              "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes (healthy)   6379/tcp                                                                   docker-redis-1
```


### DifyにWebからアクセスする
URL: http://IPv4アドレス/install

メールアドレス、名前、パスワードを入力する欄が表示されればOK

---

### Difyで使用するメールサーバーの設定
`.env` 内にあるメールサーバー設定項目に値を設定する

```bash
# ------------------------------
# Mail related configuration
# ------------------------------

# Mail type, support: resend, smtp, sendgrid
MAIL_TYPE=resend

# Default send from email address, if not specified
# If using SendGrid, use the 'from' field for authentication if necessary.
MAIL_DEFAULT_SEND_FROM=

# API-Key for the Resend email provider, used when MAIL_TYPE is `resend`.
RESEND_API_URL=https://api.resend.com
RESEND_API_KEY=your-resend-api-key


# SMTP server configuration, used when MAIL_TYPE is `smtp`
SMTP_SERVER=
SMTP_PORT=465
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=true
SMTP_OPPORTUNISTIC_TLS=false
# Optional: override the local hostname used for SMTP HELO/EHLO
SMTP_LOCAL_HOSTNAME=

# Sendgid configuration
SENDGRID_API_KEY=
```

[Linuxコマンド例]
```bash
sed -i \
-e 's/^MAIL_TYPE\(=.*\)\?$/MAIL_TYPE=smtp/' \
-e 's/^MAIL_DEFAULT_SEND_FROM\(=.*\)\?$/MAIL_DEFAULT_SEND_FROM=noreply@example.com/' \
-e 's/^SMTP_SERVER\(=.*\)\?$/SMTP_SERVER=smtp.example.com/' \
-e 's/^SMTP_PORT\(=.*\)\?$/SMTP_PORT=465/' \
-e 's/^SMTP_USERNAME\(=.*\)\?$/SMTP_USERNAME=user@example.com/' \
-e 's/^SMTP_PASSWORD\(=.*\)\?$/SMTP_PASSWORD=example_password/' \
-e 's/^SMTP_USE_TLS\(=.*\)\?$/SMTP_USE_TLS=true/' \
-e 's/^SMTP_OPPORTUNISTIC_TLS\(=.*\)\?$/SMTP_OPPORTUNISTIC_TLS=false/' \
.env
```

```bash
sed -i \
-e 's/^MAIL_DEFAULT_SEND_FROM\(=.*\)\?$/MAIL_DEFAULT_SEND_FROM=dify-noreply@los-ij.co.jp/' \
.env
```

# DifyベースURLの設定
以下設定を追加しないと、メール送信時にドメイン部分が空で送られてしまう
必ず、ドメインを設定すること
```bash
# Example: https://console.dify.ai
CONSOLE_WEB_URL=
```

[Linuxコマンド例]
```bash
sed -i \
-e 's/^CONSOLE_WEB_URL\(=.*\)\?$/MAIL_TYPE=https://example.com' \
.env
```

# [参考]: v1.16.1で同期中のまま処理が止まってしまう場合
公式GitHubのIssue #39745で、今回と同じ「Syncing Data…が永久に終わらない」症状について、原因が Collaboration / WebSocket 周りとされ、ENABLE_COLLABORATION_MODE=false にすると解消したという回避策が報告されています。

```bash
cd ~/dify/docker

# ENABLE_COLLABORATION_MODEが.envに存在するか確認する
grep ENABLE_COLLABORATION_MODE .env

# 存在した場合はfalseに変更する
sed -i 's/^ENABLE_COLLABORATION_MODE=.*/ENABLE_COLLABORATION_MODE=false/' .env
# 存在しない場合は新規で追加する(多分使うことはないコマンド)
echo 'ENABLE_COLLABORATION_MODE=false' >> .env

# 再起動
docker compose down
docker compose up -d
```
