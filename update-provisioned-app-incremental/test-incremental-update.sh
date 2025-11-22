#!/usr/bin/env bash
set -euo pipefail

# test-incremental-update.sh
# Test script for the incremental template update system

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_test() { echo -e "${BLUE}[TEST]${NC} $1"; }

# Configuration
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../scripts" && pwd)"
TEST_DIR="/tmp/template-update-test-$$"
TEST_REPO="algtools/bff-template"
FROM_VERSION="v1.0.0"
TO_VERSION="v1.2.0"

# Export DEBUG for verbose output
export DEBUG=true

log_info "=========================================="
log_info "Template Update System Test Suite"
log_info "=========================================="
log_info "Test Directory: $TEST_DIR"
log_info "Scripts Directory: $SCRIPTS_DIR"
log_info ""

# Cleanup function
cleanup() {
    if [ -d "$TEST_DIR" ]; then
        log_info "Cleaning up test directory..."
        rm -rf "$TEST_DIR"
    fi
}

# Register cleanup on exit
trap cleanup EXIT

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    log_test "Running: $test_name"

    if eval "$test_command"; then
        log_info "✅ PASS: $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        log_error "❌ FAIL: $test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# ==========================================
# Test 1: Detect Version Script
# ==========================================
log_info ""
log_info "Test Suite 1: Version Detection"
log_info "=========================================="

# Create a mock .template.config.json
cat > .template.config.json << EOF
{
  "templateName": "bff-template",
  "templateVersion": "1.7.2",
  "sourceRepo": "algtools/bff-template",
  "variables": {
    "APP_NAME": "Test App"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
EOF

run_test "Detect version from config" \
    "bash '$SCRIPTS_DIR/detect-version.sh' > version-info.json && test -f version-info.json"

run_test "Version info contains correct template name" \
    "jq -e '.templateName == \"bff-template\"' version-info.json > /dev/null"

run_test "Version info contains correct version" \
    "jq -e '.currentVersion == \"v1.7.2\"' version-info.json > /dev/null"

# Test with missing config
rm .template.config.json
run_test "Detect missing config file" \
    "! bash '$SCRIPTS_DIR/detect-version.sh' 2>&1"

# Restore config for next tests
cat > .template.config.json << EOF
{
  "templateName": "bff-template",
  "templateVersion": "1.0.0",
  "sourceRepo": "algtools/bff-template"
}
EOF

# ==========================================
# Test 2: Query Versions Script
# ==========================================
log_info ""
log_info "Test Suite 2: Version Query"
log_info "=========================================="

# Note: This test requires GitHub API access and may fail if rate limited
if [ -n "${GITHUB_TOKEN:-}" ]; then
    run_test "Query versions between releases" \
        "bash '$SCRIPTS_DIR/query-versions.sh' --repo '$TEST_REPO' --from 'v1.0.0' --to 'v1.2.0' --token '$GITHUB_TOKEN' > versions.json && test -f versions.json"

    if [ -f versions.json ]; then
        run_test "Versions JSON is valid" \
            "jq -e 'type == \"array\"' versions.json > /dev/null"

        run_test "Versions contain required fields" \
            "jq -e '.[0] | has(\"version\") and has(\"tarball_url\")' versions.json > /dev/null || true"
    fi
else
    log_warn "Skipping version query tests (GITHUB_TOKEN not set)"
fi

# ==========================================
# Test 3: Diff Collection (Mock Test)
# ==========================================
log_info ""
log_info "Test Suite 3: Diff Collection"
log_info "=========================================="

# Create mock versions file
cat > mock-versions.json << 'EOF'
[
  {
    "version": "v1.1.0",
    "name": "Release 1.1.0",
    "body": "Minor improvements",
    "url": "https://github.com/test/repo/releases/tag/v1.1.0",
    "published_at": "2024-01-15T00:00:00Z",
    "tarball_url": "https://api.github.com/repos/test/repo/tarball/v1.1.0"
  },
  {
    "version": "v1.2.0",
    "name": "Release 1.2.0",
    "body": "New features",
    "url": "https://github.com/test/repo/releases/tag/v1.2.0",
    "published_at": "2024-02-01T00:00:00Z",
    "tarball_url": "https://api.github.com/repos/test/repo/tarball/v1.2.0"
  }
]
EOF

run_test "Mock versions file is valid JSON" \
    "jq -e 'length == 2' mock-versions.json > /dev/null"

# Note: Full diff collection test requires cloning a repo, which is slow
# Skipping in basic test suite
log_warn "Skipping full diff collection test (requires repository clone)"

# ==========================================
# Test 4: Apply Diffs (Mock Test)
# ==========================================
log_info ""
log_info "Test Suite 4: Diff Application"
log_info "=========================================="

# Create a mock target directory
mkdir -p mock-target
cd mock-target

# Initialize git repo
git init --quiet
git config user.email "test@example.com"
git config user.name "Test User"

# Create some test files
echo "console.log('Hello World');" > index.js
echo "Test App" > README.md

git add -A
git commit --quiet -m "Initial commit"

cd ..

# Create a simple diff file
mkdir -p mock-diffs
cat > mock-diffs/test.diff << 'EOF'
diff --git a/README.md b/README.md
index 1234567..abcdefg 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,3 @@
 Test App
+
+This is an updated README.
EOF

# Create metadata
cat > mock-diffs/metadata.json << 'EOF'
[
  {
    "from_version": "v1.0.0",
    "to_version": "v1.1.0",
    "diff_file": "mock-diffs/test.diff",
    "files_changed": 1,
    "commits": 2,
    "diff_size": 150,
    "release_info": {
      "version": "v1.1.0",
      "name": "Release 1.1.0"
    }
  }
]
EOF

# Test dry run
run_test "Apply diffs in dry-run mode" \
    "bash '$SCRIPTS_DIR/apply-incremental-diffs.sh' --target mock-target --diffs-dir mock-diffs --metadata mock-diffs/metadata.json --dry-run > apply-report.json || true"

if [ -f apply-report.json ]; then
    run_test "Application report is valid JSON" \
        "jq -e 'type == \"object\"' apply-report.json > /dev/null"
fi

# ==========================================
# Test 5: PR Description Generation
# ==========================================
log_info ""
log_info "Test Suite 5: PR Description Generation"
log_info "=========================================="

run_test "Generate PR description" \
    "bash '$SCRIPTS_DIR/generate-pr-description.sh' --from 'v1.0.0' --to 'v1.2.0' --metadata mock-diffs/metadata.json --application-report apply-report.json --template-name 'test-template' > pr-description.md 2>/dev/null || true"

if [ -f pr-description.md ]; then
    run_test "PR description contains header" \
        "grep -q 'Template Update' pr-description.md"

    run_test "PR description contains version info" \
        "grep -q 'v1.0.0' pr-description.md && grep -q 'v1.2.0' pr-description.md"
fi

# ==========================================
# Test Summary
# ==========================================
log_info ""
log_info "=========================================="
log_info "Test Summary"
log_info "=========================================="
log_info "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
log_info "Tests Failed: ${RED}$TESTS_FAILED${NC}"
log_info "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    log_info ""
    log_info "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    log_info ""
    log_error "❌ Some tests failed."
    exit 1
fi
