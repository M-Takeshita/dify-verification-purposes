# Dify SSL証明書 自動更新手順書

## 1. 概要

AWS EC2上でDocker Composeを利用して稼働しているDifyについて、Let's EncryptのSSL証明書を自動更新する。

Dify付属のCertbotコンテナを利用し、以下の処理をsystemd timerから定期実行する。

```text
systemd timer
    ↓
Certbot起動確認
    ↓
SSL証明書更新チェック
    ↓
必要な場合のみ証明書更新
    ↓
Nginx reload
    ↓
新しい証明書を反映
```

本手順では1日2回、証明書の更新チェックを実施する。

---

# 2. 前提

以下が完了していること。

- AWS EC2上でDifyが稼働している
- Dify 1.16.1
- Docker / Docker Composeを利用している
- Dify付属Nginxを利用している
- Dify付属Certbotを利用している
- Let's Encrypt証明書を取得済み
- HTTPSアクセスが正常に動作している
- Security GroupでHTTP `TCP/80` がインターネットから到達可能
- Security GroupでHTTPS `TCP/443` が必要な接続元から到達可能

本手順の対象ドメイン例:

```text
dify-demo.los-ij.co.jp
```

---

# 3. Dify Dockerディレクトリへ移動

Difyの `docker` ディレクトリへ移動する。

例:

```bash
cd ~/dify/docker
```

現在位置を確認する。

```bash
pwd
```

Docker Composeが正常に認識されていることを確認する。

```bash
docker compose ps
```

---

# 4. SSL証明書更新スクリプトを作成

Difyの `docker` ディレクトリにいる状態で、以下をまとめて実行する。

```bash
DIFY_DOCKER_DIR="$(pwd)"; DOCKER_BIN="$(command -v docker)"; sudo tee /usr/local/sbin/dify-cert-renew.sh > /dev/null <<EOF
#!/bin/bash
set -euo pipefail

cd "$DIFY_DOCKER_DIR"

echo "\$(date '+%Y-%m-%d %H:%M:%S') Starting Dify certificate renewal"

"$DOCKER_BIN" compose --profile certbot up -d --no-deps certbot
"$DOCKER_BIN" compose exec -T certbot /bin/sh /update-cert.sh
"$DOCKER_BIN" compose exec -T nginx nginx -s reload

echo "\$(date '+%Y-%m-%d %H:%M:%S') Dify certificate renewal completed"
EOF
sudo chmod 755 /usr/local/sbin/dify-cert-renew.sh
```

このスクリプトでは以下を実施する。

1. DifyのDockerディレクトリへ移動
2. Certbotコンテナの起動確認
3. Let's Encrypt証明書の更新チェック
4. 必要な場合のみ証明書を更新
5. Nginxをreload
6. 更新後の証明書を反映

---

# 5. スクリプトの確認

作成内容を確認する。

```bash
sudo cat /usr/local/sbin/dify-cert-renew.sh
```

実行権限を確認する。

```bash
ls -l /usr/local/sbin/dify-cert-renew.sh
```

以下のように実行権限 `x` が付いていること。

```text
-rwxr-xr-x. 1 root root ...
```

---

# 6. スクリプト単体の動作確認

まずsystemdへ登録する前に手動実行する。

```bash
sudo /usr/local/sbin/dify-cert-renew.sh
```

正常に終了すれば最後に以下のようなメッセージが表示される。

```text
2026-08-15 09:44:52 Dify certificate renewal completed
```

証明書の有効期限が十分残っている場合は、以下のような表示になる。

```text
The following certificates are not due for renewal yet:

/etc/letsencrypt/live/dify-demo.los-ij.co.jp/fullchain.pem expires on 2026-11-13 (skipped)

No renewals were attempted.
```

これはエラーではない。

Certbotは証明書の更新時期を判定し、まだ更新不要の場合は証明書を再発行しない。

---

# 7. systemd Serviceを作成

以下を実行する。

```bash
sudo tee /etc/systemd/system/dify-cert-renew.service > /dev/null <<'EOF'
[Unit]
Description=Renew Dify Let's Encrypt certificate
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/dify-cert-renew.sh
EOF
```

確認する。

```bash
sudo cat /etc/systemd/system/dify-cert-renew.service
```

---

# 8. systemd Timerを作成

1日2回、証明書更新チェックを実施する。

```bash
sudo tee /etc/systemd/system/dify-cert-renew.timer > /dev/null <<'EOF'
[Unit]
Description=Run Dify SSL certificate renewal twice daily

[Timer]
OnCalendar=*-*-* 03:15:00
OnCalendar=*-*-* 15:15:00
RandomizedDelaySec=30m
Persistent=true

[Install]
WantedBy=timers.target
EOF
```

設定内容を確認する。

```bash
sudo cat /etc/systemd/system/dify-cert-renew.timer
```

---

# 9. Timerをsystemdへ反映

systemdへ設定を読み込ませる。

```bash
sudo systemctl daemon-reload
```

Timerを有効化し、即時起動する。

```bash
sudo systemctl enable --now dify-cert-renew.timer
```

これによりEC2を再起動した場合でもTimerが自動的に有効になる。

---

# 10. Timerの確認

以下を実行する。

```bash
systemctl status dify-cert-renew.timer
```

または、

```bash
systemctl list-timers --all | grep dify
```

`NEXT` に次回実行時刻が表示されていれば正常。

例:

```text
NEXT                         LEFT
Sun 2026-08-16 03:xx:xx UTC ...
```

---

# 11. Serviceを手動実行してテスト

Timerを待たずにServiceを手動実行する。

```bash
sudo systemctl start dify-cert-renew.service
```

実行結果を確認する。

```bash
sudo systemctl status dify-cert-renew.service
```

正常時の例:

```text
dify-cert-renew.service - Renew Dify Let's Encrypt certificate

Loaded: loaded
Active: inactive (dead)

Process:
ExecStart=/usr/local/sbin/dify-cert-renew.sh
code=exited
status=0/SUCCESS
```

最も重要なのは以下。

```text
status=0/SUCCESS
```

この表示があれば処理は正常終了している。

---

# 12. `inactive (dead)` について

以下の表示になっていても問題ない。

```text
Active: inactive (dead)
```

本Serviceは、

```ini
Type=oneshot
```

としている。

そのため、

```text
Service開始
    ↓
証明書更新処理
    ↓
Nginx reload
    ↓
Service終了
```

という動作になる。

処理終了後に `inactive (dead)` になるのは正常。

常時起動するServiceではない。

---

# 13. 正常時のログ例

実際の正常実行例:

```text
The following certificates are not due for renewal yet:

/etc/letsencrypt/live/dify-demo.los-ij.co.jp/fullchain.pem expires on 2026-11-13 (skipped)

No renewals were attempted.

Certificate operation successful

Please ensure to reload Nginx to apply any certificate changes.

2026/08/15 09:44:52 [notice] 24#24: signal process started

2026-08-15 09:44:52 Dify certificate renewal completed
```

以下が確認できれば正常。

```text
Certificate operation successful
```

```text
signal process started
```

```text
Dify certificate renewal completed
```

---

# 14. systemdログの確認

直近のログを確認する。

```bash
sudo journalctl -u dify-cert-renew.service -n 100 --no-pager
```

リアルタイムで確認する場合:

```bash
sudo journalctl -u dify-cert-renew.service -f
```

Timer側のログ:

```bash
sudo journalctl -u dify-cert-renew.timer -n 100 --no-pager
```

---

# 15. SSL証明書の有効期限確認

Certbotコンテナから確認する。

```bash
docker compose exec certbot certbot certificates
```

またはホスト側からHTTPS証明書を確認する。

```bash
echo | openssl s_client \
  -connect dify-demo.los-ij.co.jp:443 \
  -servername dify-demo.los-ij.co.jp \
  2>/dev/null |
openssl x509 -noout -dates
```

例:

```text
notBefore=Aug 15 08:30:00 2026 GMT
notAfter=Nov 13 08:29:59 2026 GMT
```

---

# 16. 自動更新の動作

通常は以下のように動作する。

```text
03:15頃
   │
   ▼
systemd timer
   │
   ▼
dify-cert-renew.service
   │
   ▼
dify-cert-renew.sh
   │
   ├─ Certbotコンテナ起動
   │
   ├─ certbot renew
   │
   └─ nginx reload
   │
   ▼
終了
```

同様に15:15頃にも実行される。

`RandomizedDelaySec=30m` を設定しているため、実際には設定時刻から最大30分程度ずらして実行される。

---

# 17. 証明書が更新不要の場合

以下の表示は正常。

```text
No renewals were attempted.
```

例えば、

```text
expires on 2026-11-13 (skipped)
```

となっている場合、まだCertbotの更新対象期間に入っていない。

そのため、

```text
証明書更新チェック
↓
更新不要
↓
スキップ
↓
Nginx reload
↓
正常終了
```

となる。

---

# 18. HTTP 80番ポートについて

本環境ではLet's EncryptのHTTP-01認証を使用している。

そのため、AWS Security Groupで以下を維持する。

```text
HTTP
TCP
80
0.0.0.0/0
```

証明書の初回発行時だけでなく、更新時にもLet's EncryptからHTTPアクセスが発生する可能性があるため、TCP/80を閉じないこと。

Dify自体をHTTPで利用する必要はない。

通常はNginx側でHTTPSへリダイレクトする。

```text
http://dify-demo.los-ij.co.jp
            ↓
https://dify-demo.los-ij.co.jp
```

---

# 19. トラブルシューティング

## 19.1 Serviceが失敗する

確認:

```bash
sudo systemctl status dify-cert-renew.service
```

詳細ログ:

```bash
sudo journalctl -u dify-cert-renew.service -n 200 --no-pager
```

---

## 19.2 Dockerが見つからない

確認:

```bash
command -v docker
```

例:

```text
/usr/bin/docker
```

更新スクリプト内でDockerの絶対パスを利用していることを確認する。

---

## 19.3 Docker Composeディレクトリが間違っている

確認:

```bash
sudo cat /usr/local/sbin/dify-cert-renew.sh
```

以下の `cd` が実際のDify Dockerディレクトリになっているか確認する。

```bash
cd "/path/to/dify/docker"
```

間違っている場合はスクリプトを修正する。

---

## 19.4 Certbotコンテナが起動しない

確認:

```bash
docker compose --profile certbot ps
```

ログ:

```bash
docker compose logs certbot
```

---

## 19.5 Nginx reloadに失敗する

確認:

```bash
docker compose exec nginx nginx -t
```

正常時:

```text
syntax is ok
test is successful
```

手動reload:

```bash
docker compose exec nginx nginx -s reload
```

---

## 19.6 証明書更新に失敗する

DNSを確認する。

```bash
dig dify-demo.los-ij.co.jp +short
```

EC2のElastic IPが返ること。

HTTP接続確認:

```bash
curl -I http://dify-demo.los-ij.co.jp
```

HTTPS確認:

```bash
curl -I https://dify-demo.los-ij.co.jp
```

以下も確認する。

- AWS Security Group TCP/80
- DNS Aレコード
- EC2 Elastic IP
- Dify Nginx
- Certbotコンテナ

---

# 20. 設定変更時

Timer設定を変更した場合:

```bash
sudo systemctl daemon-reload
```

その後Timerを再起動する。

```bash
sudo systemctl restart dify-cert-renew.timer
```

確認:

```bash
systemctl list-timers --all | grep dify
```

---

# 21. 自動更新を停止する場合

Timerを停止する。

```bash
sudo systemctl disable --now dify-cert-renew.timer
```

確認:

```bash
systemctl status dify-cert-renew.timer
```

---

# 22. 自動更新を再開する場合

```bash
sudo systemctl enable --now dify-cert-renew.timer
```

---

# 23. 最終チェックリスト

- [ ] Let's Encrypt証明書を取得済み
- [ ] HTTPSでDifyへアクセスできる
- [ ] TCP/80がLet's Encryptから到達可能
- [ ] `/usr/local/sbin/dify-cert-renew.sh` を作成した
- [ ] 更新スクリプトに実行権限が付いている
- [ ] 更新スクリプトを手動実行できる
- [ ] `dify-cert-renew.service` を作成した
- [ ] `dify-cert-renew.timer` を作成した
- [ ] `systemctl daemon-reload` を実行した
- [ ] Timerをenableした
- [ ] Timerがactiveになっている
- [ ] `systemctl list-timers` に次回実行時刻が表示される
- [ ] Service手動実行で `status=0/SUCCESS` になる
- [ ] Certbotの更新チェックが成功する
- [ ] Nginx reloadが成功する
- [ ] journalctlから正常終了を確認できる

---

# 24. 最終構成

```text
AWS EC2
 │
 ├─ Dify
 │
 ├─ Nginx Container
 │
 ├─ Certbot Container
 │
 │
 └─ systemd
      │
      └─ dify-cert-renew.timer
             │
             ├─ 03:15頃
             └─ 15:15頃
                   │
                   ▼
          dify-cert-renew.service
                   │
                   ▼
          dify-cert-renew.sh
                   │
                   ├─ Certbot起動
                   │
                   ├─ 証明書更新チェック
                   │
                   ├─ 必要時のみrenew
                   │
                   └─ Nginx reload
```

以上でDifyのLet's Encrypt SSL証明書自動更新設定は完了。