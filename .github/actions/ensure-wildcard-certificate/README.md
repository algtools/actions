# Ensure Wildcard Certificate

A composite GitHub Action that ensures a wildcard SSL certificate exists in Cloudflare ACM (Access Certificate Manager). This action is idempotent - it will create a new certificate only if one doesn't already exist for the specified domain, and will wait until the certificate is active before completing.

## Features

- 🔍 **Intelligent Detection**: Queries Cloudflare API to check for existing wildcard certificates
- 🔒 **Automatic Creation**: Creates a new certificate only if missing
- ⏱️ **Status Monitoring**: Waits until certificate status is ACTIVE
- 🔁 **Idempotent**: Safe to run multiple times - won't create duplicates
- 🛡️ **Secure Logging**: Automatically redacts sensitive data from all logs
- 📊 **Detailed Output**: Provides certificate ID, status, and creation information

## Usage

### Basic Example

```yaml
- name: Ensure wildcard certificate exists
  uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
  with:
    slug: 'my-project'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    custom_domain: 'example.com'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Complete Deployment Workflow

```yaml
name: Deploy with Wildcard Certificate

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  setup-certificate:
    name: Ensure SSL Certificate
    runs-on: ubuntu-latest
    outputs:
      certificate_id: ${{ steps.cert.outputs.certificate_id }}
    steps:
      - name: Ensure wildcard certificate
        id: cert
        uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: 'my-app'
          current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
          custom_domain: 'myapp.com'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Display certificate info
        run: |
          echo "Certificate ID: ${{ steps.cert.outputs.certificate_id }}"
          echo "Status: ${{ steps.cert.outputs.certificate_status }}"
          echo "New Certificate: ${{ steps.cert.outputs.certificate_created }}"

  deploy:
    name: Deploy Application
    needs: setup-certificate
    runs-on: ubuntu-latest
    steps:
      - name: Deploy with certificate
        run: |
          echo "Deploying with certificate: ${{ needs.setup-certificate.outputs.certificate_id }}"
          # Your deployment steps here
```

### Multi-Environment Setup

```yaml
name: Multi-Environment Certificate Setup

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  ensure-certificate:
    runs-on: ubuntu-latest
    steps:
      - name: Ensure wildcard certificate for staging
        if: github.event.inputs.environment == 'staging'
        uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: 'my-app-staging'
          current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID_STAGING }}
          custom_domain: 'staging.myapp.com'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Ensure wildcard certificate for production
        if: github.event.inputs.environment == 'production'
        uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: 'my-app-production'
          current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID_PRODUCTION }}
          custom_domain: 'myapp.com'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          max_wait_seconds: '600'
```

### Custom Wait Configuration

```yaml
- name: Ensure certificate with custom timeouts
  uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
  with:
    slug: 'my-project'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    custom_domain: 'example.com'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    max_wait_seconds: '600'  # Wait up to 10 minutes
    poll_interval_seconds: '15'  # Check every 15 seconds
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `slug` | Project or application slug identifier | Yes | - |
| `current_zone` | Cloudflare zone ID for the domain | Yes | - |
| `custom_domain` | Custom domain for the wildcard certificate (e.g., `example.com` for `*.example.com`) | Yes | - |
| `cloudflare_api_token` | Cloudflare API token with SSL/TLS certificates permissions | Yes | - |
| `cloudflare_account_id` | Cloudflare account ID | Yes | - |
| `max_wait_seconds` | Maximum time to wait for certificate activation (in seconds) | No | `300` |
| `poll_interval_seconds` | Interval between status checks (in seconds) | No | `10` |

### Input Details

#### `slug`

A unique identifier for your project or application. This is used for tracking and logging purposes.

**Examples:**
- `'my-api'`
- `'user-portal'`
- `'payment-service'`

#### `current_zone`

The Cloudflare zone ID for your domain. This identifies which DNS zone the certificate should be created in.

**Where to find:**
1. Log in to Cloudflare Dashboard
2. Select your domain
3. Find Zone ID in the right sidebar under "API" section

**Example:** `'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'`

#### `custom_domain`

The base domain for the wildcard certificate. The action will create a certificate for both `example.com` and `*.example.com`.

**Examples:**
- `'example.com'` → Creates cert for `example.com` and `*.example.com`
- `'api.myapp.com'` → Creates cert for `api.myapp.com` and `*.api.myapp.com`
- `'staging.example.com'` → Creates cert for `staging.example.com` and `*.staging.example.com`

#### `cloudflare_api_token`

A Cloudflare API token with SSL/TLS certificate management permissions. This should be stored as a GitHub secret.

**Required permissions:**
- Zone - SSL and Certificates - Edit
- Zone - SSL and Certificates - Read

**Setup:**
1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use "Edit zone SSL and TLS" template or create custom token with permissions above
4. Add to GitHub repository secrets as `CLOUDFLARE_API_TOKEN`

#### `cloudflare_account_id`

Your Cloudflare account ID. Found in the Cloudflare Dashboard. Store as a GitHub secret.

**Where to find:**
- Cloudflare Dashboard → Account Home → Account ID (right sidebar)
- Or in the URL: `dash.cloudflare.com/<account-id>/`

#### `max_wait_seconds`

Maximum time (in seconds) to wait for the certificate to become active after creation. If the certificate doesn't reach active status within this time, the action will fail.

**Default:** `300` (5 minutes)

**Recommended values:**
- Development/Testing: `180` (3 minutes)
- Production: `600` (10 minutes)

#### `poll_interval_seconds`

How often (in seconds) to check the certificate status while waiting for activation.

**Default:** `10` (check every 10 seconds)

**Recommended values:**
- Frequent checks: `5`
- Balanced: `10`
- Reduced API calls: `30`

## Outputs

| Output | Description |
|--------|-------------|
| `certificate_id` | ID of the wildcard certificate (existing or newly created) |
| `certificate_status` | Final status of the certificate (should be "active") |
| `certificate_created` | Whether a new certificate was created (`true` or `false`) |

### Using Outputs

```yaml
- name: Ensure certificate
  id: cert
  uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
  with:
    slug: 'my-app'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    custom_domain: 'example.com'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

- name: Use certificate in deployment
  run: |
    echo "Certificate ID: ${{ steps.cert.outputs.certificate_id }}"
    echo "Status: ${{ steps.cert.outputs.certificate_status }}"
    
    if [ "${{ steps.cert.outputs.certificate_created }}" == "true" ]; then
      echo "🎉 New certificate was created!"
    else
      echo "✓ Using existing certificate"
    fi

- name: Configure application with certificate
  env:
    CERT_ID: ${{ steps.cert.outputs.certificate_id }}
  run: |
    # Use certificate ID in your deployment configuration
    ./deploy.sh --certificate-id "$CERT_ID"
```

## How It Works

### 1. Certificate Detection

The action queries the Cloudflare API to check for existing wildcard certificates matching the specified domain pattern.

```
Query: GET /zones/{zone_id}/ssl/certificate_packs
Filter: hosts[] contains "*.example.com"
```

### 2. Certificate Creation (if needed)

If no matching certificate is found, the action creates a new one:

```
POST /zones/{zone_id}/ssl/certificate_packs/order
Body: {
  "type": "advanced",
  "hosts": ["example.com", "*.example.com"],
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

## Detailed Logging

The action provides comprehensive logging throughout the process:

### Input Validation
- Validates all required inputs
- Displays configuration (with sensitive data masked)
- Shows wildcard pattern and wait settings

### Certificate Detection
- Queries Cloudflare API for existing certificates
- Reports whether certificate was found or needs creation
- Shows certificate ID and current status

### Certificate Creation (if needed)
- Creates new certificate with specified parameters
- Displays creation confirmation
- Shows initial status

### Status Monitoring
- Real-time status updates during wait period
- Progress indicator showing elapsed/remaining time
- Clear indication when certificate becomes active

### Security Features
- Automatically masks API tokens and sensitive IDs
- Filters sensitive information from all logs
- Redacts credentials from error messages

### Example Log Output

```
======================================
🔒 Wildcard SSL Certificate
======================================

Certificate Details:
  Domain: *.example.com
  Certificate ID: abc123def456
  Status: active
  Created New: true
  Slug: my-project

Zone Details:
  Zone ID: a1b2c3d4***

Security:
  ✓ API credentials redacted from logs
  ✓ Certificate verification completed
  ✓ Idempotent operation

✓ New wildcard certificate created and activated
```

## Use Cases

### Automated Certificate Provisioning

Automatically provision SSL certificates when deploying new applications:

```yaml
name: Deploy New Application

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: 'Application name'
        required: true
      domain:
        description: 'Domain name'
        required: true

jobs:
  provision:
    runs-on: ubuntu-latest
    steps:
      - name: Provision certificate
        uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: ${{ github.event.inputs.app_name }}
          current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
          custom_domain: ${{ github.event.inputs.domain }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy application
        run: |
          # Deploy with SSL enabled
          ./deploy.sh --app ${{ github.event.inputs.app_name }}
```

### Pre-Deployment Certificate Check

Ensure certificates are ready before deploying:

```yaml
name: Pre-Deployment Check

on:
  push:
    branches: [main]

jobs:
  pre-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Verify certificate exists
        uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: 'production-app'
          current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
          custom_domain: 'myapp.com'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy:
    needs: pre-deploy
    runs-on: ubuntu-latest
    steps:
      - name: Deploy application
        run: echo "Deploying with verified certificate..."
```

### Multi-Region Certificate Setup

Set up certificates across multiple regions or zones:

```yaml
name: Multi-Region Certificate Setup

on:
  workflow_dispatch:

jobs:
  setup-us:
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: 'app-us-east'
          current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID_US }}
          custom_domain: 'us.myapp.com'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  setup-eu:
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: 'app-eu-west'
          current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID_EU }}
          custom_domain: 'eu.myapp.com'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Required Permissions

### Workflow Permissions

```yaml
permissions:
  contents: read  # Minimal permissions required
```

### Cloudflare API Token Permissions

Your Cloudflare API token must have:

- **Zone - SSL and Certificates - Edit**: To create certificates
- **Zone - SSL and Certificates - Read**: To query existing certificates

## Certificate Details

### Type
The action creates **Advanced certificates** with the following properties:

- **Certificate Authority**: Let's Encrypt
- **Validation Method**: TXT (DNS-based)
- **Validity**: 90 days
- **Hosts**: Both apex domain and wildcard (e.g., `example.com` and `*.example.com`)

### Lifecycle

- **Creation**: Instant API call
- **Validation**: Automatic via Cloudflare DNS
- **Activation**: Typically 1-5 minutes
- **Renewal**: Automatic by Cloudflare

### Status States

| Status | Description | Action Behavior |
|--------|-------------|-----------------|
| `pending` | Certificate order placed | Waits and polls |
| `initializing` | Validation in progress | Waits and polls |
| `active` | Certificate ready to use | Completes successfully |
| `failed` | Validation or issuance failed | Exits with error |
| `expired` | Certificate has expired | Exits with error |

## Troubleshooting

### Certificate Not Found

**Issue:** Action doesn't detect existing certificate and creates duplicate

**Solution:** Ensure the domain exactly matches:
```yaml
# These are different certificates:
custom_domain: 'example.com'      # Creates *.example.com
custom_domain: 'www.example.com'  # Creates *.www.example.com
```

### API Authentication Failed

**Error:** "Failed to query Cloudflare API: Authentication failed"

**Solution:** 
1. Verify API token has correct permissions
2. Check token hasn't expired
3. Ensure token is for correct Cloudflare account
4. Regenerate token if needed

### Certificate Creation Failed

**Error:** "Failed to create certificate: [error message]"

**Common causes:**
1. **Zone not found**: Verify `current_zone` ID is correct
2. **Permission denied**: API token lacks SSL certificate permissions
3. **Invalid domain**: Domain doesn't belong to specified zone
4. **Rate limit**: Too many certificate requests (wait and retry)

**Debug steps:**
```yaml
- name: Debug certificate creation
  uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
  with:
    slug: 'debug-test'
    current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    custom_domain: 'example.com'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    max_wait_seconds: '60'  # Shorter timeout for debugging
```

### Timeout Waiting for Activation

**Error:** "Certificate did not become active within X seconds"

**Solutions:**
1. Increase `max_wait_seconds`:
   ```yaml
   max_wait_seconds: '600'  # Try 10 minutes
   ```

2. Check Cloudflare dashboard for certificate status:
   - Go to SSL/TLS → Edge Certificates
   - Look for certificate status and any validation issues

3. Verify DNS configuration:
   - Ensure domain is properly configured in Cloudflare
   - Check for DNS propagation issues

### Zone ID Mismatch

**Error:** "Zone not found" or "Domain doesn't belong to zone"

**Solution:** Verify zone ID matches the domain:
```yaml
# Get zone ID from Cloudflare dashboard
current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}  # Must match domain
custom_domain: 'example.com'  # Must be in this zone
```

## Security Best Practices

### 1. Store Credentials as Secrets

Never hardcode sensitive values:

```yaml
# ✅ Correct
cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
current_zone: ${{ secrets.CLOUDFLARE_ZONE_ID }}

# ❌ Wrong
cloudflare_api_token: 'abc123...'  # Never do this!
```

### 2. Use Minimal Token Permissions

Create API tokens with only required permissions:

```
Required:
✓ Zone - SSL and Certificates - Read
✓ Zone - SSL and Certificates - Edit

Not Required:
✗ Account - Account Settings
✗ Zone - Zone Settings
✗ Zone - DNS
```

### 3. Rotate Tokens Regularly

- Create new API tokens periodically
- Revoke old tokens after rotation
- Update GitHub secrets with new tokens

### 4. Use Environment Protection

For production deployments:

```yaml
jobs:
  ensure-certificate:
    environment: production  # Requires approval
    steps:
      - uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        with:
          slug: 'prod-app'
          # ... other inputs
```

### 5. Monitor Certificate Status

Set up monitoring to track certificate health:

```yaml
- name: Verify certificate after creation
  run: |
    if [ "${{ steps.cert.outputs.certificate_status }}" != "active" ]; then
      echo "::warning::Certificate is not active!"
      exit 1
    fi
```

## API Rate Limits

Cloudflare has rate limits for API requests:

- **Certificate Creation**: Limited to prevent abuse
- **Status Queries**: Generally higher limits

**Best Practices:**
- Use reasonable poll intervals (10-30 seconds)
- Don't create unnecessary certificates
- Leverage the idempotent nature of this action

## Compatibility

- ✅ Linux runners (ubuntu-latest)
- ✅ macOS runners (macos-latest)
- ✅ Windows runners (windows-latest)
- ✅ Self-hosted runners (with curl and jq)

## Dependencies

This action requires:
- `curl`: For API requests (pre-installed on all GitHub runners)
- `jq`: For JSON parsing (pre-installed on all GitHub runners)
- `bash`: For script execution

## Related Actions

- [`deploy-cloudflare-from-artifact`](../deploy-cloudflare-from-artifact/README.md): Deploy Cloudflare Workers with SSL
- [`build-no-secrets`](../build-no-secrets/README.md): Build projects securely
- [`upload-artifacts`](../upload-artifacts/README.md): Upload build artifacts

## Workflow Integration

This action works seamlessly with other Cloudflare deployment actions:

```yaml
jobs:
  setup-ssl:
    steps:
      - uses: algtools/actions/.github/actions/ensure-wildcard-certificate@v1
        # Sets up SSL certificate

  deploy:
    needs: setup-ssl
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        # Deploys with SSL enabled
```

## License

MIT License - see [LICENSE](../../../LICENSE) for details

## Support

For questions or issues, please open an issue in the [algtools/actions](https://github.com/algtools/actions) repository.
