# [1.19.0](https://github.com/algtools/actions/compare/v1.18.1...v1.19.0) (2025-11-08)


### Features

* add GitHub action to create template releases with tarball asset ([796d749](https://github.com/algtools/actions/commit/796d749864df9b21be5d121267cf801a67e6ad6b))

## [1.18.1](https://github.com/algtools/actions/compare/v1.18.0...v1.18.1) (2025-11-08)


### Bug Fixes

* ensure proper quoting in output redirection for template type in workflow ([83f0046](https://github.com/algtools/actions/commit/83f004619695311677c0e2c1744cf7f86000bb4a))

# [1.18.0](https://github.com/algtools/actions/compare/v1.17.1...v1.18.0) (2025-11-08)


### Features

* new approach to the package system, added all scripts and duties to actions ([4d89da2](https://github.com/algtools/actions/commit/4d89da297bddd2ac4e7c7848e148de8a810915d2))

## [1.17.1](https://github.com/algtools/actions/compare/v1.17.0...v1.17.1) (2025-11-08)


### Bug Fixes

* implement template repository check in workflow to conditionally release app ([d4454a7](https://github.com/algtools/actions/commit/d4454a72fda2c5b1e801ce95c6645ca792f0ca7f))

# [1.17.0](https://github.com/algtools/actions/compare/v1.16.0...v1.17.0) (2025-11-08)


### Features

* enhance template provisioning, extra params and package.json update on pack ([e60582c](https://github.com/algtools/actions/commit/e60582c8c5c628992d23212640c52436385ebbf7))

# [1.16.0](https://github.com/algtools/actions/compare/v1.15.6...v1.16.0) (2025-11-08)


### Features

* add dev and qa branch creation and repository ruleset configuration to template action ([facd5d4](https://github.com/algtools/actions/commit/facd5d483fce7a8d4dd49035af4ded33496e192b))

## [1.15.6](https://github.com/algtools/actions/compare/v1.15.5...v1.15.6) (2025-11-08)


### Bug Fixes

* update pull request permissions to write in template release workflow ([7387f92](https://github.com/algtools/actions/commit/7387f9253ba2be6fe20b3a2860be6668f7f50d30))
* update token references from github_token to repo_token in workflows and README ([d7fc2b0](https://github.com/algtools/actions/commit/d7fc2b0fd4ebd5c54fb19c0ed92924bc90306ff7))

## [1.15.5](https://github.com/algtools/actions/compare/v1.15.4...v1.15.5) (2025-11-08)


### Bug Fixes

* update permissions for pull requests in template release workflow ([4eb1931](https://github.com/algtools/actions/commit/4eb19319c9db1393ef82f1c526539ba8f9fbd2fd))

## [1.15.4](https://github.com/algtools/actions/compare/v1.15.3...v1.15.4) (2025-11-08)


### Bug Fixes

* add copy-transform-utility action and transformTemplateToApp utility ([b665c25](https://github.com/algtools/actions/commit/b665c25f7204c7548ea2b691a92eada1187d59c0))

## [1.15.3](https://github.com/algtools/actions/compare/v1.15.2...v1.15.3) (2025-11-08)


### Bug Fixes

* enhance transform utility download process in template release workflow ([b66b479](https://github.com/algtools/actions/commit/b66b4798cc4625c271e75e74b7d9861928d4a1c6))

## [1.15.2](https://github.com/algtools/actions/compare/v1.15.1...v1.15.2) (2025-11-08)


### Bug Fixes

* streamline transform utility download in template release workflow using GitHub API ([415a1ca](https://github.com/algtools/actions/commit/415a1ca01ef69b8f657900e2ddbb5dcf0566af53))

## [1.15.1](https://github.com/algtools/actions/compare/v1.15.0...v1.15.1) (2025-11-08)


### Bug Fixes

* enhance template release workflow with admin token support and standardized descriptions ([30fd485](https://github.com/algtools/actions/commit/30fd48599ed6a9c097283aee97d44641db99d867))

# [1.15.0](https://github.com/algtools/actions/compare/v1.14.5...v1.15.0) (2025-11-08)


### Bug Fixes

* format README and update workflow to include transform utility copying ([ad33d16](https://github.com/algtools/actions/commit/ad33d160458c4bbc2a73448936ae9f40e843d656))


### Features

* Add update-provisioned-app action and workflow ([d74ef28](https://github.com/algtools/actions/commit/d74ef28524bde5e6a6c456e2f74f66a4d1c26788))
* Improve PR body generation in update-provisioned-app action ([67139bc](https://github.com/algtools/actions/commit/67139bccebd463ace7f8eea32b5478b1bccdffdf))

## [1.14.5](https://github.com/algtools/actions/compare/v1.14.4...v1.14.5) (2025-11-08)


### Bug Fixes

* standardize description formatting in template release workflow ([fdb8c58](https://github.com/algtools/actions/commit/fdb8c58c04fbb7b1c3697a00e47b445c02fcfded))

## [1.14.4](https://github.com/algtools/actions/compare/v1.14.3...v1.14.4) (2025-11-08)


### Bug Fixes

* update path for actions repository in template release workflow ([6d27e4c](https://github.com/algtools/actions/commit/6d27e4c8caf113d7618fddcf7a7411538e88317b))

## [1.14.3](https://github.com/algtools/actions/compare/v1.14.2...v1.14.3) (2025-11-08)


### Bug Fixes

* enhance template release workflow by adding checkout and copy steps for transform utility ([a7c0916](https://github.com/algtools/actions/commit/a7c09167322ebc348348104150bd18fac14f9274))

## [1.14.2](https://github.com/algtools/actions/compare/v1.14.1...v1.14.2) (2025-11-08)


### Bug Fixes

* ensure directories exist and create release-app.yml if missing in transformTemplateToApp ([f21dd49](https://github.com/algtools/actions/commit/f21dd4998f2598a2c947036c73aaf102a52f912a))

## [1.14.1](https://github.com/algtools/actions/compare/v1.14.0...v1.14.1) (2025-11-08)


### Bug Fixes

* move transform utility copy step to a new position in the action workflow ([63b0ab5](https://github.com/algtools/actions/commit/63b0ab58383ed1cf538f12d0f8fa822905b1e80c))

# [1.14.0](https://github.com/algtools/actions/compare/v1.13.1...v1.14.0) (2025-11-08)


### Features

* add script copying utility to template action ([2c01b3f](https://github.com/algtools/actions/commit/2c01b3fec8aae7d54045b235be897fe1192e05e9))

## [1.13.1](https://github.com/algtools/actions/compare/v1.13.0...v1.13.1) (2025-11-07)


### Bug Fixes

* added new transformTemplateToApp script ([c2a591b](https://github.com/algtools/actions/commit/c2a591b23079dbcd239d50ef5993b1f98ffd28c1))

# [1.13.0](https://github.com/algtools/actions/compare/v1.12.1...v1.13.0) (2025-11-07)


### Features

* add provision and test template actions for automated repository setup and validation ([55c2dbb](https://github.com/algtools/actions/commit/55c2dbbdd0eeb0f4b3cc2e599aaef6a4eb385a87))

## [1.12.1](https://github.com/algtools/actions/compare/v1.12.0...v1.12.1) (2025-11-07)


### Bug Fixes

* update SSL certificate handling to use custom domain input ([376453e](https://github.com/algtools/actions/commit/376453e4eb2b265730d293ad507f7ea6a762fc37))

# [1.12.0](https://github.com/algtools/actions/compare/v1.11.2...v1.12.0) (2025-11-07)


### Features

* introduce single-domain SSL certificate management action ([e00c1f5](https://github.com/algtools/actions/commit/e00c1f5dd09ea122d5b8c0e1fa2b6ba90af06e29))

## [1.11.2](https://github.com/algtools/actions/compare/v1.11.1...v1.11.2) (2025-11-07)


### Bug Fixes

* enhance database ID extraction to support both old and new wrangler output formats ([d07968f](https://github.com/algtools/actions/commit/d07968f85536ccb72c8b22745e6d8e6f41a1c448))

## [1.11.1](https://github.com/algtools/actions/compare/v1.11.0...v1.11.1) (2025-11-07)


### Bug Fixes

* correct string formatting for database description in preview deploy workflow ([e7a1663](https://github.com/algtools/actions/commit/e7a1663e152a77a355808a13151756836d4dc819))

# [1.11.0](https://github.com/algtools/actions/compare/v1.10.2...v1.11.0) (2025-11-07)


### Features

* add Manage Ephemeral D1 Database, removed wildcard cert check ([fabc13c](https://github.com/algtools/actions/commit/fabc13c38e72a52029fc3eec6f3360f5027dbd3f))

## [1.10.2](https://github.com/algtools/actions/compare/v1.10.1...v1.10.2) (2025-11-06)


### Bug Fixes

* update bump-version action to include npm registry configuration and authentication token ([ab9c1bc](https://github.com/algtools/actions/commit/ab9c1bc6bcdb02529892a8cef186aa4f6fef0296))

## [1.10.1](https://github.com/algtools/actions/compare/v1.10.0...v1.10.1) (2025-11-05)


### Bug Fixes

* remove unnecessary checks permission from preview deploy workflow ([af57a4f](https://github.com/algtools/actions/commit/af57a4fb75da903fcd00e06527704bb14bc6a12e))

# [1.10.0](https://github.com/algtools/actions/compare/v1.9.7...v1.10.0) (2025-11-05)


### Features

* remove update-deployment-status action and its usages from workflows ([d8d7656](https://github.com/algtools/actions/commit/d8d76566cd77ca8f075b2bef6467d582af094c45))

## [1.9.7](https://github.com/algtools/actions/compare/v1.9.6...v1.9.7) (2025-11-05)


### Bug Fixes

* update deployment status action to prevent auto-inactivation of previous deployments ([b1d48a5](https://github.com/algtools/actions/commit/b1d48a53f35e36a92fa8e240238b8fccb4d29435))

## [1.9.6](https://github.com/algtools/actions/compare/v1.9.5...v1.9.6) (2025-11-05)


### Bug Fixes

* enhance Cloudflare deployment action to support custom domains ([b66d881](https://github.com/algtools/actions/commit/b66d8818f6f152400044f9359cee7d84dce7a888))

## [1.9.5](https://github.com/algtools/actions/compare/v1.9.4...v1.9.5) (2025-11-05)


### Bug Fixes

* enhance Chromatic GitHub Check integration by adding repository checkout and upload flag ([9611bbf](https://github.com/algtools/actions/commit/9611bbf9c9e6c88be4fba810047ade5dbb87c60c))

## [1.9.4](https://github.com/algtools/actions/compare/v1.9.3...v1.9.4) (2025-11-05)


### Bug Fixes

* add production_environment flag to bypass environment protection rules in deployments ([a8ccf49](https://github.com/algtools/actions/commit/a8ccf49f3b92fae9cadbda217b457470b270acf7))

## [1.9.3](https://github.com/algtools/actions/compare/v1.9.2...v1.9.3) (2025-11-04)


### Bug Fixes

* add step to copy Storybook files to OpenNext assets directory in build workflow ([7876ca1](https://github.com/algtools/actions/commit/7876ca14383e63cdb4b94d908ca02aff01f0190a))

## [1.9.2](https://github.com/algtools/actions/compare/v1.9.1...v1.9.2) (2025-11-04)


### Bug Fixes

* streamline deployment creation by using JSON input for GitHub CLI ([b900875](https://github.com/algtools/actions/commit/b90087551dd93d6001b069e7b2c07002285a0420))

## [1.9.1](https://github.com/algtools/actions/compare/v1.9.0...v1.9.1) (2025-11-04)


### Bug Fixes

* bypass status check requirements by using empty required_contexts in deployment creation ([80e28ea](https://github.com/algtools/actions/commit/80e28ea089a88549ec7d74fdcb2341476fe2ea8d))
* standardize YAML descriptions and quotes in preview deploy workflow ([5ce32bd](https://github.com/algtools/actions/commit/5ce32bdd61e7be2c9c832208f5a365dbd6939927))

# [1.9.0](https://github.com/algtools/actions/compare/v1.8.1...v1.9.0) (2025-11-02)


### Features

* add configurable preview links in PR comments for reusable workflow ([5f5fb1b](https://github.com/algtools/actions/commit/5f5fb1b61d553e59b016c0ec83cc0a6112d6e3a1))

## [1.8.1](https://github.com/algtools/actions/compare/v1.8.0...v1.8.1) (2025-11-02)


### Bug Fixes

* include hidden files in artifact uploads for reusable workflow ([009fe5c](https://github.com/algtools/actions/commit/009fe5c96abc57d9233ee0a0598976e0a795ea1c))

# [1.8.0](https://github.com/algtools/actions/compare/v1.7.6...v1.8.0) (2025-11-02)


### Features

* add verification step for build outputs in reusable workflow ([b922459](https://github.com/algtools/actions/commit/b922459bd7726617d46f6821b6553ebc8802c97e))

## [1.7.6](https://github.com/algtools/actions/compare/v1.7.5...v1.7.6) (2025-11-02)


### Bug Fixes

* specify paths for uploaded artifacts in reusable workflow and add warning for missing files ([bd64fb6](https://github.com/algtools/actions/commit/bd64fb6aae806163faf8acc32d04e9f1d2eb809b))

## [1.7.5](https://github.com/algtools/actions/compare/v1.7.4...v1.7.5) (2025-11-02)


### Bug Fixes

* enhance reusable workflow with intermediate artifact uploads and cache logging ([49425b5](https://github.com/algtools/actions/commit/49425b572c2c53434ee05bdd6721f396f7aa17a5))

## [1.7.4](https://github.com/algtools/actions/compare/v1.7.3...v1.7.4) (2025-11-02)


### Bug Fixes

* enhance deployment status action to handle inactive state and improve error handling for deployment creation ([55ddbc3](https://github.com/algtools/actions/commit/55ddbc3f99b84ed786e00959d4733e679ef61171))

## [1.7.3](https://github.com/algtools/actions/compare/v1.7.2...v1.7.3) (2025-11-02)


### Bug Fixes

* improve artifact and Storybook file listing by adding checks for empty results ([184b0d2](https://github.com/algtools/actions/commit/184b0d27172c342dd4a19ff7863fcafb287b943b))

## [1.7.2](https://github.com/algtools/actions/compare/v1.7.1...v1.7.2) (2025-11-02)


### Bug Fixes

* add build cache configuration options to reusable workflows for improved build performance ([9ced4eb](https://github.com/algtools/actions/commit/9ced4eb7e98476189b56c1a283eedb0df310fc7d))

## [1.7.1](https://github.com/algtools/actions/compare/v1.7.0...v1.7.1) (2025-11-02)


### Bug Fixes

* correct flag usage in deployment status action configuration ([38ebaf3](https://github.com/algtools/actions/commit/38ebaf35ee2a78a402e8fc3c558c921449a6fedb))

# [1.7.0](https://github.com/algtools/actions/compare/v1.6.0...v1.7.0) (2025-11-02)


### Features

* add overwrite option to artifact upload action for improved workflow management ([e8ba7cb](https://github.com/algtools/actions/commit/e8ba7cbe52a490e17997f12955305cedf4a7fd5a))

# [1.6.0](https://github.com/algtools/actions/compare/v1.5.0...v1.6.0) (2025-11-02)


### Bug Fixes

* standardize string quotes in preview deploy workflow configuration ([6cc21e5](https://github.com/algtools/actions/commit/6cc21e53e9b03883d0b1ddac0579247880813522))
* update build command execution to use eval for proper parsing ([f005009](https://github.com/algtools/actions/commit/f005009310c3adc7650abccb9b088809c9dc1762))
* update Prettier ignore file and enhance release configuration with git commit options ([6653651](https://github.com/algtools/actions/commit/665365159c4f38412c9703f2b2299d66c5f17d78))


### Features

* enhance artifact handling in preview deploy workflow with download verification and conditional build execution ([507fccd](https://github.com/algtools/actions/commit/507fccd4c59c1ef296500180bba4d554d86eb0ec))

# [1.5.0](https://github.com/algtools/actions/compare/v1.4.0...v1.5.0) (2025-11-01)


### Features

* add new GitHub actions for testing, deployment status updates, and reusable workflows ([f89095a](https://github.com/algtools/actions/commit/f89095a5e74ad3cd59916a1aa048e4ec9084f727))

# [1.4.0](https://github.com/algtools/actions/compare/v1.3.0...v1.4.0) (2025-11-01)

### Features

- enable inclusion of hidden files in artifact uploads ([acf298d](https://github.com/algtools/actions/commit/acf298d7a9c583926a1c0124d37f8c0212a47521))

# [1.3.0](https://github.com/algtools/actions/compare/v1.2.5...v1.3.0) (2025-11-01)

### Features

- add option to include hidden files in upload artifacts action ([d2b6575](https://github.com/algtools/actions/commit/d2b6575d41219b9bec459b564e6d5cdd6a18860c))

## [1.2.5](https://github.com/algtools/actions/compare/v1.2.4...v1.2.5) (2025-11-01)

### Bug Fixes

- enhance JSONC to JSON conversion in deploy action with optional main field update ([ead2f29](https://github.com/algtools/actions/commit/ead2f295f5d33df25b5cd6e32eeab2d38ac9d1a0))

## [1.2.4](https://github.com/algtools/actions/compare/v1.2.3...v1.2.4) (2025-11-01)

### Bug Fixes

- update file counting logic in deploy action for clarity and consistency ([4d636ac](https://github.com/algtools/actions/commit/4d636ace0ec9cdfc8ed0a4998ee4815e5f4d3901))

## [1.2.3](https://github.com/algtools/actions/compare/v1.2.2...v1.2.3) (2025-11-01)

### Bug Fixes

- enhance file listing in deploy action to prevent broken pipe errors ([d0530a2](https://github.com/algtools/actions/commit/d0530a2bd9fffacb5731838c3cbbb226317c1a98))

## [1.2.2](https://github.com/algtools/actions/compare/v1.2.1...v1.2.2) (2025-11-01)

### Bug Fixes

- improve error handling when listing files in upload artifacts action ([66f0423](https://github.com/algtools/actions/commit/66f04234a81d3097d93377e55847119d1553145e))

## [1.2.1](https://github.com/algtools/actions/compare/v1.2.0...v1.2.1) (2025-11-01)

### Bug Fixes

- suppress errors when listing Storybook directory contents in chromatic upload action ([16c0348](https://github.com/algtools/actions/commit/16c034881edecdf0e9c378797fa44cf9b8d98ca7))

# [1.2.0](https://github.com/algtools/actions/compare/v1.1.4...v1.2.0) (2025-10-31)

### Features

- add auto accept changes input to chromatic upload action ([59a4fa7](https://github.com/algtools/actions/commit/59a4fa7543b5e4815804e93e93244e6b7279293d))

## [1.1.4](https://github.com/algtools/actions/compare/v1.1.3...v1.1.4) (2025-10-31)

## [1.1.3](https://github.com/algtools/actions/compare/v1.1.2...v1.1.3) (2025-10-29)

### Bug Fixes

- update deployment workflows to include dynamic worker name ([cba55fe](https://github.com/algtools/actions/commit/cba55feb24f65cdd618962e7f2d11df3fb8247e2))

## [1.1.2](https://github.com/algtools/actions/compare/v1.1.1...v1.1.2) (2025-10-29)

### Bug Fixes

- add ID to PR comment step in preview deployment workflow ([f781c94](https://github.com/algtools/actions/commit/f781c94e9f6b6b74144fe0e61e4671cd1dfd09d9))

## [1.1.1](https://github.com/algtools/actions/compare/v1.1.0...v1.1.1) (2025-10-29)

### Bug Fixes

- update preview deployment environment to a static value ([5520555](https://github.com/algtools/actions/commit/5520555655a68bd0717bfdeb96102ee7a687f5a9))

# [1.1.0](https://github.com/algtools/actions/compare/v1.0.0...v1.1.0) (2025-10-29)

### Features

- improved preview deployment workflow ([6c99f11](https://github.com/algtools/actions/commit/6c99f11a59bf34f044633123626fe58e7c0743ff))

# 1.0.0 (2025-10-28)

### Bug Fixes

- add double quotes around tag range in git log command for release notes ([1120d1e](https://github.com/algtools/actions/commit/1120d1e66b9023307710a519692d5d2a00bd493e))
- Add package-lock.json for chromatic-upload tests ([447d4d9](https://github.com/algtools/actions/commit/447d4d94894ed8ec325722fe594c2d633fdd96db))
- ensure consistent output redirection in workflow files ([8aadc2e](https://github.com/algtools/actions/commit/8aadc2e9842d0d04bfe3e732cef2abaf7d86fd3f))
- Fix shell quoting in chromatic test workflow summary ([9b14ae2](https://github.com/algtools/actions/commit/9b14ae2d46277b866f2d09811bda64ee43cb892b))
- improve error handling and environment variable setup for worker deletion in cleanup workflow ([8867703](https://github.com/algtools/actions/commit/88677037a988f7ee8e424bcf286f287ec48bdad9))
- rename GitHub token secret to gh_token for consistency in workflow files ([990c622](https://github.com/algtools/actions/commit/990c622b8e49d0f7c655340a63194e4044ca8fb3))
- rename GitHub token secret to gh_token for consistency in workflow files ([af7066b](https://github.com/algtools/actions/commit/af7066b299cbb7f9f53b71834e68ee75902064b2))
- simplify release message format ([db83a8b](https://github.com/algtools/actions/commit/db83a8bb11d9100bbbd98c22d6bee26148e8e004))
- simplify release message format in .releaserc.json by removing notes ([f7923c2](https://github.com/algtools/actions/commit/f7923c20bf44ae72c06b24fee444c9b368aee362))
- streamline deletion commands in cleanup-preview workflow ([7f6f39d](https://github.com/algtools/actions/commit/7f6f39de8b2c9e0381656d3ac83c6d90c349523f))
- update dedupe_key parameter check to use double quotes ([99f3f84](https://github.com/algtools/actions/commit/99f3f8415f59ac03bdff78ee34720fcd98162f34))
- update release name template placeholder from {version} to {0} in README and workflow files ([9a5f9f0](https://github.com/algtools/actions/commit/9a5f9f0731461ecc474340c0073487f36ffb375d))
- use double quotes for output variable paths in workflows ([0d4aab5](https://github.com/algtools/actions/commit/0d4aab56694e9dc056357b47d99136254d3ec8ff))

### Features

- add actionlint validation for GitHub workflows and update README with setup instructions ([6427854](https://github.com/algtools/actions/commit/6427854c449095ab5dec2514678d334129b61683))
- Add build-no-secrets composite action ([9e855de](https://github.com/algtools/actions/commit/9e855de3e1796010c5fd08a112869d17cc00daff))
- Add chromatic-upload-from-artifact composite action ([b2ae675](https://github.com/algtools/actions/commit/b2ae675777fe04c6be5865bed1f2e7c45234c7c1))
- Add Cloudflare Workers dev deployment to reusable workflow ([31e173b](https://github.com/algtools/actions/commit/31e173b0199b7951634e71869552aea659f36c44))
- Add comment-pr GitHub Action ([7f5aa30](https://github.com/algtools/actions/commit/7f5aa3078917072185bd6af9cd2c1cfb31053246))
- add dependency installation step in bump-version action for improved workflow reliability ([8b6d3f6](https://github.com/algtools/actions/commit/8b6d3f6c2b5075c0d4feb2f30f15dcfaa0c0b597))
- Add deploy-cloudflare-from-artifact action ([f2bdeee](https://github.com/algtools/actions/commit/f2bdeee88aa3c6627b0c1d7f34cdd8c4b77baf4d))
- Add ensure-wildcard-certificate GitHub Action ([ee7b07a](https://github.com/algtools/actions/commit/ee7b07aff76be496281ae0185204cd613db31c86))
- add GitHub token input for Package Registry authentication in setup-node action ([579e60c](https://github.com/algtools/actions/commit/579e60c33c1afc4924a524225bbd26c9de0b8722))
- Add PR comment for deployment status ([7b2b72d](https://github.com/algtools/actions/commit/7b2b72da0e30f9ac5ec788dd0617ff119fe52556))
- Add reusable PR build workflow ([001db37](https://github.com/algtools/actions/commit/001db372b83df4267f7ecabfc433653602441a63))
- Add reusable workflow for Cloudflare Worker deployment ([a975f66](https://github.com/algtools/actions/commit/a975f66b4c52a23afb4ec65708535c33d0efcdbc))
- Add reusable workflow for preview deployments ([caf1119](https://github.com/algtools/actions/commit/caf1119b554b2631cbd7dd8e6c1ca4d489a6fd59))
- add reusable workflows for template versioning and packaging with semantic-release ([333f76b](https://github.com/algtools/actions/commit/333f76bd2065197159a48860368ccb2d18217f36))
- Add Sentry release GitHub Action ([84e31cb](https://github.com/algtools/actions/commit/84e31cb41fb237eae245ec494d1861509e1e35e8))
- Add setup-node composite action with caching and audit ([52a2392](https://github.com/algtools/actions/commit/52a2392308f2f630dff93eb5144c6b373d0ad02c))
- add support for custom domain configuration in Cloudflare deployment action ([42c1cda](https://github.com/algtools/actions/commit/42c1cda35b459cec5d6e8cb7dc702e287e2ee8df))
- Add upload-artifacts composite action ([fc1298c](https://github.com/algtools/actions/commit/fc1298cf50a6cb7bf1e30d47d5b495b4b8a9ea50))
- add wrangler config update step for deployment in Cloudflare action ([2c6ac82](https://github.com/algtools/actions/commit/2c6ac82283c8ae6997386c310f0f452a3ff7e0ed))
- added cleanup-preview action, updated preview-deploy ([edce125](https://github.com/algtools/actions/commit/edce125919c5afbcf825f61afdce9f1f13ac84c8))
- Configure actionlint for PR checks and reviews ([4003e5c](https://github.com/algtools/actions/commit/4003e5c6f7286725f26dc33054e79d52bae66b38))
- enhance deployment workflow with GitHub release creation and version extraction ([ef986b7](https://github.com/algtools/actions/commit/ef986b775f1e8b98259de745f5a7ee81a4d828b6))
- enhance setup-node action with automatic package manager detection and improved caching ([860d29a](https://github.com/algtools/actions/commit/860d29a35e69fc855d5a6bb1876bf785d27b0328))
- enhance upload-artifacts action by converting comma-separated paths to newline-separated ([87ed27a](https://github.com/algtools/actions/commit/87ed27afa09df3a2fd4eb418b4077fd72125f5da))
- improve cache path handling in setup-node action for better dependency management ([033dd5e](https://github.com/algtools/actions/commit/033dd5e82a22ec8e36bd1f71529e34f0acbcefa3))
- initialize project with semantic-release setup, add .gitignore, and configure commitlint ([6212621](https://github.com/algtools/actions/commit/6212621afe5a715edbfb1131b0bb1066f26e22ff))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file is automatically generated by [semantic-release](https://github.com/semantic-release/semantic-release).
