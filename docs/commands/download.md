# Download Command

Download a file from a specified URL.

## Usage

```bash
stega download [options]
```

### Options

- --url, -u=<string>: URL to download (required)
- --output, -o=<string>: Destination file path (optional)

## Example

```bash
stega download --url=https://example.com/file.zip --output=localfile.zip
```

## Performance
For very large files, ensure sufficient disk space before starting. Progress bar might slow if console output is limited.

## Integrity Checks
Compare downloaded files against checksums (e.g., SHA256) for added security.

## Proxy Usage
If behind a corporate proxy, set HTTPS_PROXY or HTTP_PROXY environment variables before download.