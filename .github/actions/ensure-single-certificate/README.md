# Ensure Single Certificate

A composite GitHub Action that ensures a single-domain SSL certificate exists in Cloudflare ACM (Access Certificate Manager). This action is idempotent - it will create a new certificate only if one doesn't already exist for the specified domain, and will wait until the certificate is active before completing.

## Features

- 🔍 **Intelligent Detection**: Queries Cloudflare API to check for existing single-domain certificates
- 🔒 **Automatic Creation**: Creates a new certificate only if missing
- ⏱️ **Status Monitoring**: Waits until certificate status is ACTIVE
- 🔁 **Idempotent**: Safe to run multiple times - won't create duplicates
- 🛡️ **Secure Logging**: Automatically redacts sensitive data from all logs
- 🎯 **Single Domain Only**: Creates certificates for single domains without wildcard

## Difference from Wildcard Certificate Action

This action creates certificates for a **single domain only** (e.g., `example.com`), while the `ensure-wildcard-certificate` action creates certificates for both the base domain and wildcard pattern (e.g., `example.com` + `*.example.com`).

Use this action when you need a certificate for a specific domain without wildcard coverage.

## Usage

### Basic Example

```yaml
- name: Ensure single certificate exists
  uses: algtools/actions/.github/actions/ensure-single-certificate@main
  with:
    domain: 'api.example.com'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### With Custom Timeout

```yaml
- name: Ensure single certificate with custom timeout
  uses: algtools/actions/.github/actions/ensure-single-certificate@main
  with:
    domain: 'secure.example.com'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    max_wait_seconds: '600'
    poll_interval_seconds: '15'
```

### Using Certificate Outputs

```yaml
- name: Ensure single certificate
  id: cert
  uses: algtools/actions/.github/actions/ensure-single-certificate@main
  with:
    domain: 'service.example.com'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

- name: Display certificate info
  run: |
    echo "Certificate ID: ${{ steps.cert.outputs.certificate_id }}"
    echo "Status: ${{ steps.cert.outputs.certificate_status }}"
    echo "New Certificate: ${{ steps.cert.outputs.certificate_created }}"
```

## Inputs

| Input                   | Description                                                  | Required | Default |
| ----------------------- | ------------------------------------------------------------ | -------- | ------- |
| `domain`                | Domain for the single certificate (e.g., `example.com`)      | Yes      | -       |
| `current_zone`          | Cloudflare zone ID for the domain                            | Yes      | -       |
| `cloudflare_api_token`  | Cloudflare API token with SSL/TLS certificates permissions   | Yes      | -       |
| `cloudflare_account_id` | Cloudflare account ID                                        | Yes      | -       |
| `max_wait_seconds`      | Maximum time to wait for certificate activation (in seconds) | No       | `300`   |
| `poll_interval_seconds` | Interval between status checks (in seconds)                  | No       | `10`    |

## Outputs

| Output                | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `certificate_id`      | ID of the single certificate (existing or newly created) |
| `certificate_status`  | Final status of the certificate                          |
| `certificate_created` | Whether a new certificate was created (`true`/`false`)   |

## Requirements

### Cloudflare API Token Permissions

The API token must have the following permissions:

- **Zone → SSL and Certificates → Edit**
- **Zone → Zone → Read**

### Zone ID

The `current_zone` must be the zone ID for the **parent domain** (e.g., for `api.example.com`, provide the zone ID for `example.com`).

## How It Works

### 1. Certificate Detection

The action queries the Cloudflare API to check for existing single-domain certificates matching the specified domain.

```
Query: GET /zones/{zone_id}/ssl/certificate_packs
Filter: hosts[] contains "example.com" AND hosts length == 1
```

### 2. Certificate Creation (if needed)

If no matching certificate is found, the action creates a new one:

```
POST /zones/{zone_id}/ssl/certificate_packs/order
Body: {
  "type": "advanced",
  "hosts": ["example.com"],
  "validation_method": "txt",
  "validity_days": 90,
  "certificate_authority": "lets_encrypt"
}
```

### 3. Status Monitoring

The action polls the certificate status until it becomes `active`:

```
Status Flow: pending → initializing → active
Check Interval: Every 10 seconds (configurable)
Max Wait: 300 seconds (configurable)
```

### 4. Output Generation

Once active, the action outputs the certificate details for use in subsequent workflow steps.

## When to Use This Action

Use the **single certificate** action when:

- You need a certificate for a specific domain without wildcard
- You want to minimize certificate scope for security
- You have a single endpoint that doesn't need subdomain coverage

Use the **wildcard certificate** action when:

- You need to cover multiple subdomains (e.g., `*.example.com`)
- You're deploying preview environments with dynamic subdomains
- You want a single certificate for a domain and all its subdomains

## Examples

### Specific Service Domain

```yaml
- name: Ensure API certificate
  uses: algtools/actions/.github/actions/ensure-single-certificate@main
  with:
    domain: 'api.example.com'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID_EXAMPLE_COM }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Production Domain

```yaml
- name: Ensure production certificate
  uses: algtools/actions/.github/actions/ensure-single-certificate@main
  with:
    domain: 'app.mycompany.com'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID_PROD }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Security Features

- Automatically masks API tokens and sensitive IDs
- Redacts zone IDs from logs (shows only first 8 characters)
- No secrets exposed in error messages
- Idempotent operation prevents accidental duplication

## Troubleshooting

### Certificate Already Exists

If a certificate already exists for the domain, the action will detect it and skip creation, returning the existing certificate ID.

### Certificate Creation Fails

Common reasons for certificate creation failure:

- Invalid API token or insufficient permissions
- Domain not in specified zone
- Zone ID incorrect
- Account ID incorrect
- Rate limiting from Cloudflare

### Certificate Not Activating

If a certificate doesn't activate within the timeout:

- Increase `max_wait_seconds` (default: 300)
- Check Cloudflare dashboard for certificate status
- Verify DNS is configured correctly
- Check for DNS propagation issues

## Best Practices

1. **Use Organization Secrets**: Store Cloudflare credentials as organization-level secrets
2. **Monitor Certificate Expiry**: Let's Encrypt certificates expire after 90 days
3. **Pre-generate Certificates**: Run this action manually before deployments to avoid delays
4. **Use Appropriate Timeouts**: Default 5 minutes is usually sufficient, but adjust if needed
5. **Check Outputs**: Always verify `certificate_status` is "active" before proceeding

## Related Actions

- **ensure-wildcard-certificate**: For wildcard certificates covering subdomains
- **generate-ssl-certificate workflow**: Manual workflow for certificate generation

## Support

For issues or questions:

- Check Cloudflare API documentation
- Review action logs for detailed error messages
- Open an issue in the algtools/actions repository
