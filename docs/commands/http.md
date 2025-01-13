# HTTP Command

Make HTTP requests (GET, POST, PUT, DELETE) directly from your console.

## Usage

```bash
stega http [options]
```

### Options

- --method=<string>: HTTP method (required)
- --url=<string>: Target URL (required)
- --data=<string>: Request body data (optional)
- --headers=<string>: Comma-separated headers (optional)

## Example

```bash
stega http --method=POST \
           --url=https://api.example.com/data \
           --data='{"msg":"hello"}' \
           --headers="Content-Type:application/json"
```

## Authentication
Use "Authorization:Bearer <token>" in headers for secured endpoints:
```bash
stega http --method=GET --url=https://api.example.com/private --headers="Authorization:Bearer MYTOKEN"
```

## Client-Side Caching
Use response headers like ETag or Cache-Control to optimize repeated requests.

## Connection Pooling
For numerous requests, explore external tooling or environment settings to reuse connections efficiently.