- [Contributing to OpenSearch](#contributing-to-opensearch)
- [Developer Guide](#developer-guide)
  - [Install Dependencies](#install-dependencies)
    - [opensearch-dashboards-test-library](#opensearch-dashboards-test-library)
  - [Run Tests](#run-tests)
  - [Formatting](#formatting)
  - [Onboarding](#onboarding)
- [First Things First](#first-things-first)
- [Ways to Contribute](#ways-to-contribute)
  - [Bug Reports](#bug-reports)
  - [Feature Requests](#feature-requests)
  - [Documentation Changes](#documentation-changes)
  - [Contributing Code](#contributing-code)
- [Developer Certificate of Origin](#developer-certificate-of-origin)
- [License Headers](#license-headers)
  - [Java](#java)
  - [Python](#python)
  - [Shell](#shell)
- [Review Process](#review-process)

## Contributing to OpenSearch

OpenSearch is a community project that is built and maintained by people just like **you**. We're glad you're interested in helping out. There are several different ways you can do it, but before we talk about that, let's talk about how to get started.

## Developer Guide

### Install Dependencies

#### opensearch-dashboards-test-library

opensearch-dashboards-test-library is the test utility library used by this project, it is already a published package in NPM. You can import the lastest version by installing from NPM registry

```
"@opensearch-dashboards-test/opensearch-dashboards-test-library": "^1.0.1"
```

You can aslo import from the git repository target branch to use the development code directly

```
"@opensearch-dashboards-test/opensearch-dashboards-test-library": "opensearch-project/opensearch-dashboards-test-library#main"
```

You need to delete the package from the node_modules folder and run npm install again, to reflect the change.

```
$ npm uninstall @opensearch-dashboards-test/opensearch-dashboards-test-library && npm install opensearch-project/opensearch-dashboards-test-library#main
```

### Run Tests

You can run the cypress tests by cli:

```
$ npx cypress run --spec "cypress/integration/core-opensearch-dashboards/vanilla-opensearch-dashboards/*.js"
```

By default, it uses headless mode (hide the broswer) You can turn on the browser display by:

```
$ npx cypress run --spec "cypress/integration/core-opensearch-dashboards/vanilla-opensearch-dashboards/*.js --headed"
```

You can also manually trigger the test via browser UI by:

```
$ npx cypress open
```

And you can override certain cypress config or environment variable by appling additional cli arguments, for example to override the baseUrl and OpensearchUrl to test a remote endpoint:

```
$ npx cypress run --spec "cypress/integration/core-opensearch-dashboards/vanilla-opensearch-dashboards/*.js" --env "openSearchUrl=https://foo.com" --config "baseUrl=https://foo.com/_dashboards"
```

### Formatting

`prettier` is used to standardize formatting of files. You can format all files (new and existing) by running

```
$ npx prettier * --write
```

This should be done before opening a PR to keep checked-in code consistent.

### Onboarding

To onboard your release tests (Dashboards plugins) onto this repo test function, you can follow the next steps.

0. Create a name to identify your plugin, e.g `plugin-name`

The dir name shall be descriptive to identify your plugin. You can use the same name defined in build repo https://github.com/opensearch-project/opensearch-build/tree/main/scripts/components

1. Place test files under `cypress/integration/plugins/<plugin-name>`

2. Place fixtures under `cypress/fixtures/plugins/<plugin-name>`

3. Place custom commands under `cypress/fixtures/plugins/<plugin-name>`

4. Place constants to `cypress/utils/constants.js`

5. Run tests

Start OpenSearch and OpenSearch Dashboards. Then refer to the [test execution file](/integtest.sh).

E.g if you want to run all plugin tests with security enabled.

```
npx cypress run --env SECURITY_ENABLED=true --spec "cypress/integration/plugins/*/*"
```

E.g if you want to run AD plugin tests with security enabled.

```
npx cypress run --env SECURITY_ENABLED=true --spec "cypress/integration/plugins/anomaly-detection-dashboards-plugin"
```

For the complete ways to run Cypress, you can refer to the Cypress official site https://docs.cypress.io/guides/getting-started/.installing-cypress#Opening-Cypress.

The env paramaters are defined in https://github.com/opensearch-project/opensearch-dashboards-functional-test/blob/main/cypress.json where you can look for or add the desired parameters. You can refer to the Cypress official site https://docs.cypress.io/guides/guides/environment-variables#Setting.

6. [optional] Remove copied tests from your plugin and execute them remotely from your plugin

Since your release tests have been moved in this repo, to avoid maintain duplicated code and potentially diverged Cypress versions in two repos, you can remove them from your plugin. Then execute the tests inside this repo from your CI. See AD's example https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/blob/main/.github/workflows/remote-integ-tests-workflow.yml However, this can be decided at plugin level to phase out the changes.

7. [optional] Verify test execution from OpenSearch build repo

The tests inside this repo will be executed from OpenSearch build repo. You can verify that by running test script from https://github.com/opensearch-project/opensearch-build/tree/main/src/test_workflow Please refer to the repo to the way of test exeuction. Below is the set of commands you can use based on current situation.

Suppose your plugin is ready for version 1.2.0

```
./build.sh manifests/1.2.0/opensearch-1.2.0.yml

./build.sh manifests/1.2.0/opensearch-dashboards-1.2.0.yml

./assemble.sh builds/opensearch/manifest.yml

./assemble.sh builds/opensearch-dashboards/manifest.yml

./test.sh integ-test manifests/1.2.0/opensearch-dashboards-1.2.0-test.yml

```

## First Things First

1. **When in doubt, open an issue** - For almost any type of contribution, the first step is opening an issue. Even if you think you already know what the solution is, writing down a description of the problem you're trying to solve will help everyone get context when they review your pull request. If it's truly a trivial change (e.g. spelling error), you can skip this step -- but as the subject says, when it doubt, [open an issue](issues).

2. **Only submit your own work** (or work you have sufficient rights to submit) - Please make sure that any code or documentation you submit is your work or you have the rights to submit. We respect the intellectual property rights of others, and as part of contributing, we'll ask you to sign your contribution with a "Developer Certificate of Origin" (DCO) that states you have the rights to submit this work and you understand we'll use your contribution. There's more information about this topic in the [DCO section](#developer-certificate-of-origin).

## Ways to Contribute

### Bug Reports

Ugh! Bugs!

A bug is when software behaves in a way that you didn't expect and the developer didn't intend. To help us understand what's going on, we first want to make sure you're working from the latest version.

Once you've confirmed that the bug still exists in the latest version, you'll want to check to make sure it's not something we already know about on the [open issues GitHub page](issues).

If you've upgraded to the latest version and you can't find it in our open issues list, then you'll need to tell us how to reproduce it Provide as much information as you can. You may think that the problem lies with your query, when actually it depends on how your data is indexed. The easier it is for us to recreate your problem, the faster it is likely to be fixed.

### Feature Requests

If you've thought of a way that OpenSearch could be better, we want to hear about it. We track feature requests using GitHub, so please feel free to open an issue which describes the feature you would like to see, why you need it, and how it should work.

### Documentation Changes

TODO

### Contributing Code

As with other types of contributions, the first step is to [open an issue on GitHub](issues/new/choose). Opening an issue before you make changes makes sure that someone else isn't already working on that particular problem. It also lets us all work together to find the right approach before you spend a bunch of time on a PR. So again, when in doubt, open an issue.

## Developer Certificate of Origin

OpenSearch is an open source product released under the Apache 2.0 license (see either [the Apache site](https://www.apache.org/licenses/LICENSE-2.0) or the [LICENSE.txt file](LICENSE.txt)). The Apache 2.0 license allows you to freely use, modify, distribute, and sell your own products that include Apache 2.0 licensed software.

We respect intellectual property rights of others and we want to make sure all incoming contributions are correctly attributed and licensed. A Developer Certificate of Origin (DCO) is a lightweight mechanism to do that.

The DCO is a declaration attached to every contribution made by every developer. In the commit message of the contribution, the developer simply adds a `Signed-off-by` statement and thereby agrees to the DCO, which you can find below or at [DeveloperCertificate.org](http://developercertificate.org/).

```
Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the
    best of my knowledge, is covered under an appropriate open
    source license and I have the right under that license to
    submit that work with modifications, whether created in whole
    or in part by me, under the same open source license (unless
    I am permitted to submit under a different license), as
    Indicated in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including
    all personal information I submit with it, including my
    sign-off) is maintained indefinitely and may be redistributed
    consistent with this project or the open source license(s)
    involved.
```

We require that every contribution to OpenSearch is signed with a Developer Certificate of Origin. Additionally, please use your real name. We do not accept anonymous contributors nor those utilizing pseudonyms.

Each commit must include a DCO which looks like this

```
Signed-off-by: Jane Smith <jane.smith@email.com>
```

You may type this line on your own when writing your commit messages. However, if your user.name and user.email are set in your git configs, you can use `-s` or `– – signoff` to add the `Signed-off-by` line to the end of the commit message.

## License Headers

New files in your code contributions should contain the following license header. If you are modifying existing files with license headers, or including new files that already have license headers, do not remove or modify them without guidance.

### Java

```
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
```

### Python

```
# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0
```

### Shell

```
# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0
```

## Review Process

We deeply appreciate everyone who takes the time to make a contribution. We will review all contributions as quickly as possible. As a reminder, [opening an issue](issues/new/choose) discussing your change before you make it is the best way to smooth the PR process. This will prevent a rejection because someone else is already working on the problem, or because the solution is incompatible with the architectural direction.

During the PR process, expect that there will be some back-and-forth. Please try to respond to comments in a timely fashion, and if you don't wish to continue with the PR, let us know. If a PR takes too many iterations for its complexity or size, we may reject it. Additionally, if you stop responding we may close the PR as abandoned. In either case, if you feel this was done in error, please add a comment on the PR.

If we accept the PR, a [maintainer](MAINTAINERS.md) will merge your change and usually take care of backporting it to appropriate branches ourselves.

If we reject the PR, we will close the pull request with a comment explaining why. This decision isn't always final: if you feel we have misunderstood your intended change or otherwise think that we should reconsider then please continue the conversation with a comment on the PR and we'll do our best to address any further points you raise.
