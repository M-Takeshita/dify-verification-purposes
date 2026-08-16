# Google DriveからDifyナレッジパイプラインへの自動連携手順書

## 1. 目的

Google Driveの指定フォルダ内に配置されたナレッジ用ファイルを監視し、ファイルの新規作成または更新を検知した場合に、Google Apps Script（GAS）からDifyのナレッジパイプラインへ自動連携する。

### 処理概要

```text
Google Drive
    ↓
GASによる定期監視
    ↓
ファイルの更新日時を確認
    ↓
新規・更新あり
    ↓
Difyへファイルアップロード
    ↓
Difyナレッジパイプライン実行
    ↓
同期成功日時をGASに保存
```

更新がないファイルはDifyへ送信しない。

---

# 2. 前提条件

以下が準備済みであること。

- Google Driveにナレッジファイルを格納するフォルダがある
- Difyにナレッジベースが作成済み
- Difyにナレッジパイプラインが作成・公開済み
- Dify APIキーを発行済み
- Google Apps Scriptを作成済み

---

# 3. Google Driveの準備

ナレッジ連携対象となる専用フォルダを作成する。

例：

```text
AI参照フォルダ
├─ 基本的な遠隔監視の社内フロー_LPP対応_RAG用.md
├─ Webカメラセット.md
└─ その他ナレッジ.md
```

GASでは、このフォルダ直下のファイルを監視対象とする。

## フォルダIDの確認

Google DriveのURLが以下の場合、

```text
https://drive.google.com/drive/folders/xxxxxxxxxxxxxxxxxxxx
```

`folders/` より後ろの、

```text
xxxxxxxxxxxxxxxxxxxx
```

がフォルダIDとなる。

### 注意

現在の実装では、指定フォルダの**直下に存在するファイルのみ**を対象とする。

以下の場合、

```text
AI参照フォルダ
├─ A.md
└─ サブフォルダ
    └─ B.md
```

`A.md` は対象になるが、`B.md` は対象外となる。

---

# 4. Dify側の情報を確認する

以下を準備する。

## 4.1 API Base URL

Dify Cloudの場合：

```text
https://api.dify.ai/v1
```

---

## 4.2 API Key

Difyから発行したナレッジ用APIキーを使用する。

例：

```text
dataset-xxxxxxxxxxxxxxxx
```

実際の値は外部へ公開しないこと。

---

## 4.3 Dataset ID

対象となるDifyナレッジベースのDataset IDを確認する。

この値を以下として使用する。

```text
DIFY_DATASET_ID
```

---

## 4.4 Start Node ID

ナレッジパイプラインのデータソースノードIDを取得する。

以下のAPIを実行する。

```bash
curl --request GET \
  --url 'https://api.dify.ai/v1/datasets/<DIFY_DATASET_ID>/pipeline/datasource-plugins' \
  --header 'Authorization: Bearer <DIFY_API_KEY>'
```

返却結果から、対象となる `local_file` の `node_id` を確認する。

例：

```json
{
  "node_id": "1756442998557",
  "datasource_type": "local_file"
}
```

この場合、

```text
DIFY_START_NODE_ID=1756442998557
```

とする。

---

# 5. GASのScript Propertiesを設定する

Apps Scriptを開き、

```text
プロジェクトの設定
↓
スクリプト プロパティ
```

から以下を登録する。

| プロパティ名 | 設定内容 |
|---|---|
| `DIFY_API_BASE_URL` | Dify APIのBase URL |
| `DIFY_API_KEY` | Dify APIキー |
| `DIFY_DATASET_ID` | 対象ナレッジのDataset ID |
| `DIFY_START_NODE_ID` | ナレッジパイプラインのStart Node ID |
| `GOOGLE_DRIVE_FOLDER_ID` | 監視対象Google DriveフォルダID |

例：

```text
DIFY_API_BASE_URL=https://api.dify.ai/v1

DIFY_API_KEY=xxxxxxxxxxxxxxxx

DIFY_DATASET_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

DIFY_START_NODE_ID=1756442998557

GOOGLE_DRIVE_FOLDER_ID=xxxxxxxxxxxxxxxxxxxx
```

## LAST_SYNCED_ATについて

`LAST_SYNCED_AT` は手動設定しない。

GASがファイルごとに、

```text
LAST_SYNCED_AT_<Google Drive File ID>
```

というScript Propertyを自動作成する。

例：

```text
LAST_SYNCED_AT_1abcDEFxxxxx
=
2026-08-16T03:40:00.000Z
```

この値とGoogle Driveのファイル更新日時を比較して、再同期が必要か判定する。

---

# 6. GASの処理内容

GASでは主に以下の処理を行う。

## 6.1 `syncDifyKnowledge()`

メイン処理。

指定したGoogle Driveフォルダからファイル一覧を取得し、各ファイルについて更新確認を行う。

```text
フォルダ取得
↓
ファイル一覧取得
↓
ファイルごとに更新確認
↓
更新あり → Dify連携
↓
更新なし → スキップ
```

---

## 6.2 `syncFileIfUpdated()`

各ファイルについて、

```text
Google Drive最終更新日時
```

と、

```text
LAST_SYNCED_AT_<File ID>
```

を比較する。

Google Drive側の更新日時が新しい場合のみDifyへ送信する。

---

## 6.3 `uploadPipelineFile()`

以下のDify APIへファイルをアップロードする。

```http
POST /datasets/pipeline/file-upload
```

成功すると、DifyからアップロードファイルIDが返却される。

例：

```json
{
  "id": "07071cd7-3759-45ad-844a-16c0149ea580"
}
```

---

## 6.4 `runKnowledgePipeline()`

アップロードしたファイルIDを使用して、ナレッジパイプラインを実行する。

```http
POST /datasets/{dataset_id}/pipeline/run
```

主な送信内容：

```json
{
  "inputs": {
    "パイプラインで定義した入力変数": "値"
  },
  "datasource_type": "local_file",
  "datasource_info_list": [
    {
      "reference": "アップロードファイルID",
      "name": "ファイル名"
    }
  ],
  "start_node_id": "Start Node ID",
  "is_published": true,
  "response_mode": "blocking"
}
```

---

# 7. ナレッジパイプラインの入力変数について

Difyナレッジパイプライン側で必須入力項目を設定している場合は、API実行時にも `inputs` へ値を渡す必要がある。

例えば、

```text
Delimiter
Maximum Chunk Length
Chunk Overlap Length
```

など。

設定例：

```text
Delimiter：\n\n
Maximum Chunk Length：600
Chunk Overlap Length：100
```

ただし、APIの `inputs` に指定するキーは、画面上の表示名ではなく、**Dify側で定義されている入力変数名を使用すること。**

入力変数が不足している場合、

```text
Dilmiter is required in input form
```

などのエラーが発生する。

その場合は、

```http
GET /datasets/{dataset_id}/pipeline/datasource-plugins
```

のレスポンスに含まれる入力変数情報を確認し、`inputs` を修正する。

---

# 8. 初回動作確認

## 8.1 Google Driveファイル一覧を確認

まず、

```javascript
testListDriveFiles()
```

を手動実行する。

実行ログ例：

```text
フォルダ: AI参照フォルダ

1: 基本的な遠隔監視の社内フロー_LPP対応_RAG用.md
2: Webカメラセット.md

ファイル数: 2
```

想定しているファイルが表示されればGoogle Driveの設定は正常。

---

## 8.2 Dify連携テスト

次に、

```javascript
syncDifyKnowledge()
```

を手動実行する。

初回は同期履歴が存在しないため、フォルダ内の全ファイルが同期対象になる。

ログ例：

```text
監視フォルダ: AI参照フォルダ

更新検知:
基本的な遠隔監視の社内フロー_LPP対応_RAG用.md

Difyアップロード完了

Pipeline response: ...

Dify Pipeline実行完了

同期完了
```

---

# 9. 2回目の動作確認

ファイルを変更せずに再度、

```javascript
syncDifyKnowledge()
```

を実行する。

正常であれば、

```text
更新なし:
基本的な遠隔監視の社内フロー_LPP対応_RAG用.md
```

となり、Difyへの送信は行われない。

---

# 10. ファイル更新テスト

Google Drive内の対象ファイルを1つ編集する。

その後、

```javascript
syncDifyKnowledge()
```

を実行する。

例えば、

```text
A.md → 更新なし

B.md → 更新検知
       ↓
       Difyへ同期
```

となれば正常。

---

# 11. 定期実行の設定

動作確認完了後、GASの時間主導型トリガーを設定する。

Apps Script左メニューから、

```text
トリガー
↓
トリガーを追加
```

を選択する。

以下のように設定する。

| 項目 | 設定 |
|---|---|
| 実行する関数 | `syncDifyKnowledge` |
| 実行するデプロイ | Head |
| イベントのソース | 時間主導型 |
| 時間ベースのトリガー | 分ベースのタイマー |
| 間隔 | 10分おき |

推奨：

```text
10分おき
```

---

# 12. 自動同期後の動作

トリガー設定後は以下のように動作する。

```text
10分ごとにGAS実行
       ↓
Google Driveフォルダ確認
       ↓
各ファイルの更新日時を確認
       ↓

更新なし
→ 何もしない

更新あり
→ Difyへファイルアップロード
→ ナレッジパイプライン実行
→ LAST_SYNCED_ATを更新
```

---

# 13. エラー時の動作

Difyへのアップロードまたはナレッジパイプライン実行に失敗した場合は、そのファイルの `LAST_SYNCED_AT` を更新しない。

そのため、次回のトリガー実行時に再度同期対象となる。

例：

```text
Google Drive更新
↓
Dify同期
↓
エラー
↓
LAST_SYNCED_ATは更新しない
↓
10分後
↓
再試行
```

---

# 14. 主なエラーと確認ポイント

## `Exception: Invalid argument: id`

Google DriveフォルダIDを確認する。

Script PropertiesにはURL全体ではなく、

```text
xxxxxxxxxxxxxxxxxxxx
```

のようにフォルダIDのみを登録する。

また、

```text
GOOGLE_DRIVE_FOLDER_ID
```

というプロパティ名になっていることを確認する。

---

## `Dilmiter is required in input form`

Difyナレッジパイプライン側で必須になっている入力変数が、APIの `inputs` に渡されていない。

`datasource-plugins` APIから実際の入力変数名を確認し、`runKnowledgePipeline()` の `inputs` に追加する。

---

## HTTP 401

主に以下を確認する。

- `DIFY_API_KEY`
- Authorization Header
- APIキーの権限

---

## HTTP 400 / 500

主に以下を確認する。

- `DIFY_DATASET_ID`
- `DIFY_START_NODE_ID`
- `inputs`
- `datasource_type`
- パイプラインが公開済みか

---

# 15. 運用上の注意

## Google Driveから削除されたファイル

現在の実装では、

```text
Google Driveからファイル削除
```

を検知して、

```text
Dify側のナレッジも削除
```

する処理は実装していない。

削除同期が必要な場合は、別途Difyのドキュメント削除APIを組み込む必要がある。

## ファイル更新時

現在はGoogle Driveの最終更新日時を使用して差分判定を行う。

```text
Google Drive更新日時
>
前回同期日時
```

の場合のみDifyへ送信する。

## サブフォルダ

現在は指定フォルダ直下のみが対象。

サブフォルダも監視対象とする場合は、再帰的なフォルダ探索処理を追加する必要がある。

---

# 16. 最終構成

```text
Google Drive
「AI参照フォルダ」
       │
       │ ファイル更新
       ▼
Google Apps Script
       │
       ├─ 10分ごとに起動
       ├─ 更新日時比較
       └─ 更新ファイルのみ取得
       │
       ▼
Dify API
       │
       ├─ file-upload
       │
       ▼
Knowledge Pipeline
       │
       ├─ Markdownチャンク化
       ├─ インデックス作成
       └─ ナレッジ登録
       │
       ▼
Dify RAG
       │
       ▼
AIチャットボット
```

以上で、Google Drive上のナレッジファイル更新をDifyへ自動連携する。