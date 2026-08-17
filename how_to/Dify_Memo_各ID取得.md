dataset_id

```curl
 curl --request GET \
  --url 'https://xxxxxxxx.co.jp/v1/datasets?page=1&limit=20' \
  --header 'Authorization: Bearer dataset-dify_api_key'
```

node_id
```curl
curl --request GET \
  --url 'https://xxxxxx.co.jp/v1/datasets/{$dataset_id}}/pipeline/datasource-plugins' \
  --header 'Authorization: Bearer dataset-dify_api_key'
```