## [1.2.1](https://github.com/algtools/actions/compare/v1.2.0...v1.2.1) (2025-11-01)


### Bug Fixes

* suppress errors when listing Storybook directory contents in chromatic upload action ([16c0348](https://github.com/algtools/actions/commit/16c034881edecdf0e9c378797fa44cf9b8d98ca7))

# [1.2.0](https://github.com/algtools/actions/compare/v1.1.4...v1.2.0) (2025-10-31)


### Features

* add auto accept changes input to chromatic upload action ([59a4fa7](https://github.com/algtools/actions/commit/59a4fa7543b5e4815804e93e93244e6b7279293d))

## [1.1.4](https://github.com/algtools/actions/compare/v1.1.3...v1.1.4) (2025-10-31)

## [1.1.3](https://github.com/algtools/actions/compare/v1.1.2...v1.1.3) (2025-10-29)


### Bug Fixes

* update deployment workflows to include dynamic worker name ([cba55fe](https://github.com/algtools/actions/commit/cba55feb24f65cdd618962e7f2d11df3fb8247e2))

## [1.1.2](https://github.com/algtools/actions/compare/v1.1.1...v1.1.2) (2025-10-29)


### Bug Fixes

* add ID to PR comment step in preview deployment workflow ([f781c94](https://github.com/algtools/actions/commit/f781c94e9f6b6b74144fe0e61e4671cd1dfd09d9))

## [1.1.1](https://github.com/algtools/actions/compare/v1.1.0...v1.1.1) (2025-10-29)


### Bug Fixes

* update preview deployment environment to a static value ([5520555](https://github.com/algtools/actions/commit/5520555655a68bd0717bfdeb96102ee7a687f5a9))

# [1.1.0](https://github.com/algtools/actions/compare/v1.0.0...v1.1.0) (2025-10-29)


### Features

* improved preview deployment workflow ([6c99f11](https://github.com/algtools/actions/commit/6c99f11a59bf34f044633123626fe58e7c0743ff))

# 1.0.0 (2025-10-28)


### Bug Fixes

* add double quotes around tag range in git log command for release notes ([1120d1e](https://github.com/algtools/actions/commit/1120d1e66b9023307710a519692d5d2a00bd493e))
* Add package-lock.json for chromatic-upload tests ([447d4d9](https://github.com/algtools/actions/commit/447d4d94894ed8ec325722fe594c2d633fdd96db))
* ensure consistent output redirection in workflow files ([8aadc2e](https://github.com/algtools/actions/commit/8aadc2e9842d0d04bfe3e732cef2abaf7d86fd3f))
* Fix shell quoting in chromatic test workflow summary ([9b14ae2](https://github.com/algtools/actions/commit/9b14ae2d46277b866f2d09811bda64ee43cb892b))
* improve error handling and environment variable setup for worker deletion in cleanup workflow ([8867703](https://github.com/algtools/actions/commit/88677037a988f7ee8e424bcf286f287ec48bdad9))
* rename GitHub token secret to gh_token for consistency in workflow files ([990c622](https://github.com/algtools/actions/commit/990c622b8e49d0f7c655340a63194e4044ca8fb3))
* rename GitHub token secret to gh_token for consistency in workflow files ([af7066b](https://github.com/algtools/actions/commit/af7066b299cbb7f9f53b71834e68ee75902064b2))
* simplify release message format ([db83a8b](https://github.com/algtools/actions/commit/db83a8bb11d9100bbbd98c22d6bee26148e8e004))
* simplify release message format in .releaserc.json by removing notes ([f7923c2](https://github.com/algtools/actions/commit/f7923c20bf44ae72c06b24fee444c9b368aee362))
* streamline deletion commands in cleanup-preview workflow ([7f6f39d](https://github.com/algtools/actions/commit/7f6f39de8b2c9e0381656d3ac83c6d90c349523f))
* update dedupe_key parameter check to use double quotes ([99f3f84](https://github.com/algtools/actions/commit/99f3f8415f59ac03bdff78ee34720fcd98162f34))
* update release name template placeholder from {version} to {0} in README and workflow files ([9a5f9f0](https://github.com/algtools/actions/commit/9a5f9f0731461ecc474340c0073487f36ffb375d))
* use double quotes for output variable paths in workflows ([0d4aab5](https://github.com/algtools/actions/commit/0d4aab56694e9dc056357b47d99136254d3ec8ff))


### Features

* add actionlint validation for GitHub workflows and update README with setup instructions ([6427854](https://github.com/algtools/actions/commit/6427854c449095ab5dec2514678d334129b61683))
* Add build-no-secrets composite action ([9e855de](https://github.com/algtools/actions/commit/9e855de3e1796010c5fd08a112869d17cc00daff))
* Add chromatic-upload-from-artifact composite action ([b2ae675](https://github.com/algtools/actions/commit/b2ae675777fe04c6be5865bed1f2e7c45234c7c1))
* Add Cloudflare Workers dev deployment to reusable workflow ([31e173b](https://github.com/algtools/actions/commit/31e173b0199b7951634e71869552aea659f36c44))
* Add comment-pr GitHub Action ([7f5aa30](https://github.com/algtools/actions/commit/7f5aa3078917072185bd6af9cd2c1cfb31053246))
* add dependency installation step in bump-version action for improved workflow reliability ([8b6d3f6](https://github.com/algtools/actions/commit/8b6d3f6c2b5075c0d4feb2f30f15dcfaa0c0b597))
* Add deploy-cloudflare-from-artifact action ([f2bdeee](https://github.com/algtools/actions/commit/f2bdeee88aa3c6627b0c1d7f34cdd8c4b77baf4d))
* Add ensure-wildcard-certificate GitHub Action ([ee7b07a](https://github.com/algtools/actions/commit/ee7b07aff76be496281ae0185204cd613db31c86))
* add GitHub token input for Package Registry authentication in setup-node action ([579e60c](https://github.com/algtools/actions/commit/579e60c33c1afc4924a524225bbd26c9de0b8722))
* Add PR comment for deployment status ([7b2b72d](https://github.com/algtools/actions/commit/7b2b72da0e30f9ac5ec788dd0617ff119fe52556))
* Add reusable PR build workflow ([001db37](https://github.com/algtools/actions/commit/001db372b83df4267f7ecabfc433653602441a63))
* Add reusable workflow for Cloudflare Worker deployment ([a975f66](https://github.com/algtools/actions/commit/a975f66b4c52a23afb4ec65708535c33d0efcdbc))
* Add reusable workflow for preview deployments ([caf1119](https://github.com/algtools/actions/commit/caf1119b554b2631cbd7dd8e6c1ca4d489a6fd59))
* add reusable workflows for template versioning and packaging with semantic-release ([333f76b](https://github.com/algtools/actions/commit/333f76bd2065197159a48860368ccb2d18217f36))
* Add Sentry release GitHub Action ([84e31cb](https://github.com/algtools/actions/commit/84e31cb41fb237eae245ec494d1861509e1e35e8))
* Add setup-node composite action with caching and audit ([52a2392](https://github.com/algtools/actions/commit/52a2392308f2f630dff93eb5144c6b373d0ad02c))
* add support for custom domain configuration in Cloudflare deployment action ([42c1cda](https://github.com/algtools/actions/commit/42c1cda35b459cec5d6e8cb7dc702e287e2ee8df))
* Add upload-artifacts composite action ([fc1298c](https://github.com/algtools/actions/commit/fc1298cf50a6cb7bf1e30d47d5b495b4b8a9ea50))
* add wrangler config update step for deployment in Cloudflare action ([2c6ac82](https://github.com/algtools/actions/commit/2c6ac82283c8ae6997386c310f0f452a3ff7e0ed))
* added cleanup-preview action, updated preview-deploy ([edce125](https://github.com/algtools/actions/commit/edce125919c5afbcf825f61afdce9f1f13ac84c8))
* Configure actionlint for PR checks and reviews ([4003e5c](https://github.com/algtools/actions/commit/4003e5c6f7286725f26dc33054e79d52bae66b38))
* enhance deployment workflow with GitHub release creation and version extraction ([ef986b7](https://github.com/algtools/actions/commit/ef986b775f1e8b98259de745f5a7ee81a4d828b6))
* enhance setup-node action with automatic package manager detection and improved caching ([860d29a](https://github.com/algtools/actions/commit/860d29a35e69fc855d5a6bb1876bf785d27b0328))
* enhance upload-artifacts action by converting comma-separated paths to newline-separated ([87ed27a](https://github.com/algtools/actions/commit/87ed27afa09df3a2fd4eb418b4077fd72125f5da))
* improve cache path handling in setup-node action for better dependency management ([033dd5e](https://github.com/algtools/actions/commit/033dd5e82a22ec8e36bd1f71529e34f0acbcefa3))
* initialize project with semantic-release setup, add .gitignore, and configure commitlint ([6212621](https://github.com/algtools/actions/commit/6212621afe5a715edbfb1131b0bb1066f26e22ff))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file is automatically generated by [semantic-release](https://github.com/semantic-release/semantic-release).
