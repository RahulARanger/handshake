```toml
name = 'Update Test Run'
method = 'PUT'
url = 'http://127.0.0.1:6969/save/Run'
sortWeight = 3000000
id = '3b220e5c-6803-44d6-bcfc-7c1ee81c139d'

[body]
type = 'JSON'
raw = '''
{
  "status": "COMPLETED",
  "exitCode": 1
}'''
```
