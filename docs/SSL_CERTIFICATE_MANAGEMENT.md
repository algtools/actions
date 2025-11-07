# SSL Certificate Management Guide

This guide explains how to manage SSL certificates for Cloudflare Workers deployments using the centralized certificate generation workflow.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Certificate Types](#certificate-types)
4. [Generating Certificates](#generating-certificates)
5. [Certificate Lifecycle](#certificate-lifecycle)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Migration Guide](#migration-guide)

## Overview

### Why Manual Certificate Generation?

Starting with the latest version of our deployment workflows, SSL certificates are **no longer automatically generated** during deployments. Instead, certificates must be pre-generated using the `generate-ssl-certificate` workflow.

**Benefits:**

- ⚡ **Faster Deployments**: Deployments no longer wait for SSL certificate provisioning (saves 30-60 seconds per deployment)
- 🎯 **Centralized Management**: All SSL certificates managed from one place
- 🛡️ **Better Control**: Pre-plan and validate certificates before deployments
- 🚫 **Reduced Failures**: SSL generation failures don't block deployments
- 💰 **Cost Savings**: Fewer API calls to Cloudflare during deployments

### How It Works

1. **One-Time Setup**: Generate SSL certificates for your domains using the manual workflow
2. **Deploy Freely**: Deployments use existing certificates without regeneration
3. **Auto-Renewal**: Cloudflare automatically renews certificates before expiration

## Quick Start

### Generate Your First Certificate

1. Navigate to **Actions** tab in the `algtools/actions` repository
2. Select **Generate SSL Certificate** workflow
3. Click **Run workflow**
4. Fill in the required inputs:
   - **Domain**: `example.com` or `api.example.com`
   - **Zone ID**: Your Cloudflare zone ID for the domain
   - **Certificate Type**: `wildcard` or `single`
5. Click **Run workflow** button

The workflow will:

- Check if a certificate already exists
- Create a new certificate if needed
- Wait for the certificate to become active
- Display certificate details in the workflow summary

## Certificate Types

### Wildcard Certificates

Wildcard certificates cover both the base domain and all its subdomains.

**Example:**

- Domain: `example.com`
- Certificate covers:
  - `example.com`
  - `*.example.com` (all subdomains)
  - `api.example.com`
  - `app.example.com`
  - `www.example.com`

**Use Case:** Multi-environment deployments, PR previews, dynamic subdomains

```yaml
# Generate wildcard certificate
Domain: algtools.algenium.dev
Certificate Type: wildcard
# Result: Covers *.algtools.algenium.dev
# - bff-pr-1.algtools.algenium.dev ✓
# - bff-pr-2.algtools.algenium.dev ✓
# - api.algtools.algenium.dev ✓
```

### Single Certificates

Single certificates cover only one specific domain.

**Example:**

- Domain: `api.example.com`
- Certificate covers:
  - `api.example.com` only

**Use Case:** Specific endpoints, production domains without subdomains

```yaml
# Generate single certificate
Domain: api.production.com
Certificate Type: single
# Result: Covers only api.production.com
```

## Generating Certificates

### Using the Workflow

#### Step 1: Access the Workflow

Navigate to: `algtools/actions` → **Actions** → **Generate SSL Certificate**

#### Step 2: Provide Inputs

| Input                     | Description                | Example                 |
| ------------------------- | -------------------------- | ----------------------- |
| **domain**                | Domain for the certificate | `algtools.algenium.dev` |
| **zone_id**               | Cloudflare zone ID         | `b07416a93d50b42c...`   |
| **certificate_type**      | `wildcard` or `single`     | `wildcard`              |
| **max_wait_seconds**      | Max wait time (optional)   | `300`                   |
| **poll_interval_seconds** | Check interval (optional)  | `10`                    |

#### Step 3: Run and Monitor

- Workflow will display progress in real-time
- Certificate details appear in the summary after completion
- Check the workflow logs for detailed information

### Required Permissions

The workflow uses organization-level secrets:

- `CLOUDFLARE_API_TOKEN`: Must have **Zone → SSL and Certificates → Edit** permission
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

These are already configured at the organization level.

## Certificate Lifecycle

### Creation

1. Workflow checks if certificate already exists
2. If not, creates new certificate with Let's Encrypt
3. Waits for certificate to become active (typically 30-90 seconds)
4. Returns certificate ID and status

### Validity Period

- **Duration**: 90 days (Let's Encrypt standard)
- **Auto-Renewal**: Cloudflare automatically renews before expiration
- **Monitoring**: No manual monitoring required

### Certificate Status

| Status         | Description                                   |
| -------------- | --------------------------------------------- |
| `pending`      | Certificate requested, waiting for validation |
| `initializing` | Certificate is being initialized              |
| `active`       | Certificate is active and ready to use ✓      |
| `failed`       | Certificate generation failed                 |
| `expired`      | Certificate has expired (should auto-renew)   |

### Checking Certificate Status

Via Cloudflare Dashboard:

1. Log in to Cloudflare Dashboard
2. Select your domain
3. Go to **SSL/TLS** → **Edge Certificates**
4. View certificate status and expiration

Via API:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/ssl/certificate_packs" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json"
```

## Common Scenarios

### Scenario 1: Multi-Environment Setup

For applications with dev, QA, and production environments:

```yaml
# Generate wildcard certificates for each environment

# Development
Domain: algtools.algenium.dev
Certificate Type: wildcard
# Covers: *.algtools.algenium.dev

# QA
Domain: algtools.algenium.qa
Certificate Type: wildcard
# Covers: *.algtools.algenium.qa

# Production
Domain: algtools.algenium.app
Certificate Type: wildcard
# Covers: *.algtools.algenium.app
```

### Scenario 2: PR Preview Environments

For PR previews with dynamic URLs:

```yaml
# Generate ONE wildcard certificate

Domain: algtools.algenium.dev
Certificate Type: wildcard
# This covers all PR previews:
# - bff-pr-1.algtools.algenium.dev
# - bff-pr-2.algtools.algenium.dev
# - bff-pr-100.algtools.algenium.dev
```

### Scenario 3: Subdomain Applications

For applications on subdomains:

```yaml
# Option 1: Wildcard for flexibility
Domain: api.example.com
Certificate Type: wildcard
# Covers: api.example.com + *.api.example.com

# Option 2: Single for security
Domain: api.example.com
Certificate Type: single
# Covers: api.example.com only
```

### Scenario 4: New Project Setup

When setting up a new project:

1. **Identify domains** needed for all environments
2. **Generate wildcard certificates** for each zone
3. **Verify certificates** are active
4. **Deploy** your application

Example for BFF Template:

```bash
# Step 1: Generate certificates
Domain: algtools.algenium.dev (wildcard)
Domain: algtools.algenium.qa (wildcard)
Domain: algtools.algenium.app (wildcard)

# Step 2: Verify in Cloudflare Dashboard
# Step 3: Deploy using existing workflows
```

## Troubleshooting

### Certificate Not Found Error

**Problem**: Deployment fails with "Certificate not found" or similar error.

**Solution**:

1. Run the `generate-ssl-certificate` workflow for your domain
2. Wait for certificate to become active
3. Retry deployment

### Certificate Creation Fails

**Problem**: Certificate generation workflow fails.

**Common Causes**:

- **Invalid Zone ID**: Verify zone ID matches the domain's zone
- **Insufficient Permissions**: Check API token has SSL certificate edit permissions
- **Domain Not in Zone**: Ensure domain belongs to the specified zone
- **Rate Limiting**: Cloudflare rate limits certificate creation

**Solution**:

1. Verify inputs are correct
2. Check Cloudflare API token permissions
3. Review workflow logs for specific error
4. Wait a few minutes and retry if rate limited

### Certificate Stuck in Pending

**Problem**: Certificate stays in "pending" or "initializing" status.

**Solution**:

1. **Wait**: Certificate validation can take up to 5 minutes
2. **Check DNS**: Ensure domain DNS is configured correctly
3. **Increase Timeout**: Use higher `max_wait_seconds` value (e.g., 600)
4. **Manual Check**: Verify in Cloudflare dashboard

### Duplicate Certificate Error

**Problem**: Workflow reports certificate already exists but deployment doesn't work.

**Solution**:

1. The workflow is idempotent - it reuses existing certificates
2. Check certificate status in Cloudflare dashboard
3. Verify certificate is "active"
4. If expired, delete old certificate and regenerate

### Wrong Zone ID

**Problem**: Using zone ID from wrong domain.

**Example**:

```yaml
# WRONG: Using algenium.dev zone for algtools.algenium.dev
Domain: algtools.algenium.dev
Zone ID: <zone-for-algenium.dev>  # ✓ Correct

# WRONG: Using wrong zone
Domain: algtools.algenium.dev
Zone ID: <zone-for-example.com>  # ✗ Wrong
```

**Solution**: Always use the zone ID for the parent domain.

## Best Practices

### 1. Use Wildcard Certificates for Environments

```yaml
# Good: One wildcard per environment
algtools.algenium.dev (wildcard)  # All dev deployments
algtools.algenium.qa (wildcard)   # All QA deployments
algtools.algenium.app (wildcard)  # All prod deployments

# Avoid: Individual certificates for each subdomain
bff.algtools.algenium.dev (single)
api.algtools.algenium.dev (single)
web.algtools.algenium.dev (single)
```

### 2. Pre-Generate Before Setup

Generate certificates **before** configuring CI/CD:

1. Generate all environment certificates
2. Verify certificates are active
3. Configure repository workflows
4. Deploy

### 3. Document Your Certificates

Maintain a record of generated certificates:

| Domain                | Type     | Zone         | Created    | Notes           |
| --------------------- | -------- | ------------ | ---------- | --------------- |
| algtools.algenium.dev | wildcard | algenium.dev | 2024-01-15 | Dev environment |
| algtools.algenium.qa  | wildcard | algenium.qa  | 2024-01-15 | QA environment  |
| algtools.algenium.app | wildcard | algenium.app | 2024-01-15 | Production      |

### 4. Monitor Expiration

While Cloudflare auto-renews certificates:

- Set calendar reminders at 60 days
- Monitor Cloudflare dashboard notifications
- Check certificate status periodically

### 5. Use Least Privilege

- Wildcard certificates increase attack surface slightly
- Use single certificates for highly sensitive endpoints if needed
- Balance security with operational convenience

### 6. Test in Development First

Before generating production certificates:

1. Test with development domain
2. Verify deployment works
3. Then generate QA/production certificates

## Migration Guide

### Migrating from Auto-Generated Certificates

If you're upgrading from workflows that auto-generated certificates:

#### Step 1: Inventory Existing Certificates

Check what certificates exist in Cloudflare:

1. Log in to Cloudflare Dashboard
2. For each domain, go to **SSL/TLS** → **Edge Certificates**
3. Note existing wildcard certificates

#### Step 2: Generate Missing Certificates

For any missing certificates:

1. Run `generate-ssl-certificate` workflow
2. Select appropriate certificate type
3. Verify certificate becomes active

#### Step 3: Update Workflows

Ensure you're using the latest versions of:

- `env-deploy-reusable` (SSL generation removed)
- `pr-build-reusable` (SSL inputs removed)
- `preview-deploy-reusable` (SSL inputs removed)

#### Step 4: Test Deployments

1. Test dev deployment
2. Test PR preview deployment
3. Test QA deployment
4. Test production deployment

#### Step 5: Remove Old Parameters

In consuming repositories, remove:

- `max_wait_seconds` inputs
- `poll_interval_seconds` inputs
- Any SSL-related configuration

### Migration Checklist

- [ ] Inventory existing certificates
- [ ] Generate missing certificates (dev, QA, prod)
- [ ] Verify all certificates are active
- [ ] Update workflow references to latest versions
- [ ] Remove SSL-related parameters from workflows
- [ ] Test dev deployment
- [ ] Test PR preview
- [ ] Test QA deployment
- [ ] Test production deployment
- [ ] Update documentation
- [ ] Notify team of changes

## FAQ

### Do I need to regenerate certificates every 90 days?

No. Cloudflare automatically renews Let's Encrypt certificates before they expire. You only need to generate each certificate once.

### Can I have both wildcard and single certificates for the same domain?

Yes. You can have both:

- Wildcard: `*.example.com`
- Single: `api.example.com`

The most specific certificate takes precedence.

### What happens if I run the workflow twice?

The workflow is idempotent. It will:

1. Check if certificate exists
2. If exists: Return existing certificate ID
3. If not exists: Create new certificate

### Can I delete certificates?

Yes, through Cloudflare Dashboard:

1. Go to **SSL/TLS** → **Edge Certificates**
2. Find the certificate
3. Click **Delete**

**Warning**: Only delete certificates that are no longer used.

### How many certificates can I have?

Cloudflare limits vary by plan:

- **Free**: 1 certificate per zone
- **Pro**: 1 certificate per zone
- **Business**: 1 certificate per zone
- **Enterprise**: Custom limits

Wildcard certificates help stay within limits.

### Where do I find my Zone ID?

1. Log in to Cloudflare Dashboard
2. Select your domain
3. Zone ID is in the right sidebar under **API**

### Can I use this for non-Cloudflare domains?

No. This workflow specifically uses Cloudflare's certificate management API. Domains must be managed by Cloudflare.

## Related Documentation

- [Ensure Wildcard Certificate Action](../.github/actions/ensure-wildcard-certificate/README.md)
- [Ensure Single Certificate Action](../.github/actions/ensure-single-certificate/README.md)
- [Environment Deploy Workflow](../README.md#environment-deploy)
- [Cloudflare SSL/TLS Documentation](https://developers.cloudflare.com/ssl/)

## Support

For issues or questions:

- Check [Troubleshooting](#troubleshooting) section above
- Review workflow logs for detailed errors
- Consult [Cloudflare SSL Documentation](https://developers.cloudflare.com/ssl/)
- Open an issue in the `algtools/actions` repository

---

**Last Updated**: 2024
**Version**: 1.0
**Maintainer**: Algenium Systems
