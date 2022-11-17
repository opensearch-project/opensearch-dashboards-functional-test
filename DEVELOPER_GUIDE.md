- [Developer Guide](#developer-guide)
  - [Install Dependencies](#install-dependencies)
    - [opensearch-dashboards-test-library](#opensearch-dashboards-test-library)
  - [Run Tests](#run-tests)
  - [Formatting](#formatting)
  - [Test Development](#test-development)
    - [Experimental Features](#experimental-features)

## Developer Guide

### Install Dependencies

#### opensearch-dashboards-test-library

opensearch-dashboards-test-library is the test utility library used by this project, it is already a published package in NPM. You can import the lastest version by installing from NPM registry

```
"@opensearch-dashboards-test/opensearch-dashboards-test-library": "^1.0.1"
```

You can also import from the git repository target branch to use the development code directly

```
"@opensearch-dashboards-test/opensearch-dashboards-test-library": "opensearch-project/opensearch-dashboards-test-library#main"
```

You need to delete the package from the node_modules folder and run npm install again, to reflect the change.

```
$ npm uninstall @opensearch-dashboards-test/opensearch-dashboards-test-library && npm install opensearch-project/opensearch-dashboards-test-library#main
```

### Run Tests

You can run the cypress tests by cli. There are some handy scripts in [package.json](package.json) to run the tests with some pre-set configurations.

To run tests against a local cluster

without security:

```
$ yarn cypress run-without-security --spec "cypress/integration/core-opensearch-dashboards/vanilla-opensearch-dashboards/*.js"
```

with security:

```
$ yarn cypress run-with-security --spec "cypress/integration/core-opensearch-dashboards/opensearch-dashboards/*.js"
```

These tests run in headless mode by default. You can also manually trigger the test via browser UI by running:

```
$ yarn cypress open
```

And you can override certain [cypress config or environment variable](cypress.json) by applying additional cli arguments, for example to override the baseUrl and openSearchUrl to test a remote OpenSearch endpoint:

```
$ yarn cypress run --spec "cypress/integration/core-opensearch-dashboards/opensearch-dashboards/*.js" --config "baseUrl=https://<endpoint>/_dashboards" --env "openSearchUrl=https://<endpoint>,SECURITY_ENABLED=true,username=admin,password=xxxxxxxx,ENDPOINT_WITH_PROXY=true"
```

`SECURITY_ENABLED`: if true, the `username` and `password` passing in are used as basic authentication credentials during `cy.visit` and `cy.request`. Also, please notice security enabled endpoint normally uses https protocol, so you may want to pass in different urls.

`ENDPOINT_WITH_PROXY`: for an OpenSearch endpoint wrapped with a proxy that redirects the visiting url to the login url, even with auth option provided in `cy.visit`, the redirection to the login url still happens. So a login request before tests and cache the security cookie are needed and can be switched on by this argument.

`MANAGED_SERVICE_ENDPOINT`: set to true if tests are running against managed service domains.

### Formatting

`prettier` and `ESLint` is integrated and used to standardize formatting of files, where `prettier` takes care of the code formatting and `ESLint` takes care of the code style. You can check the formatting of all files (new and existing) by running

```
$ yarn lint
```
and auto fix the formatting of all files (new and existing) by running
```
$ yarn lint --fix
```

`Husky` precommit hook is used to automatically run `yarn lint`, please fix the files according to lint result before commiting code changes (run `yarn lint --fix` for fixable errors, or manully fix code according to error messages). If you have any doubts on `ESLint` rules, feel free to [open an issue](issues).


### Test Development

#### Experimental Features

When writing tests for experimental features, please follow these steps.

1. Figure out the folder location to put the tests

Similar to the regular tests, OSD Core tests go to the [folder](integration/core-opensearch-dashboards/opensearch-dashboards/) and OSD plugin tests go to the [folder](cypress/integration/plugins/).

2. Develop tests with a flag to turn on and off

Add an environment variable (e.g boolean) to only run tests for the experiemental feature when it is true. (Define such in [cypress configuration](cypress.json). Refer to `SECURITY_ENABLED` as an example) This is to ensure backward compatibility when integrating with [opensearch-build repo](https://github.com/opensearch-project/opensearch-build/blob/main/src/test_workflow/integ_test/service_opensearch_dashboards.py) whose OpenSearch Dashboards execution command or yml configuration may not be updated to support the experimental feature yet.

3. Set up Github action to run the tests inside the current repo

Create a new workflow by referring to [this template](https://github.com/opensearch-project/opensearch-dashboards-functional-test/blob/main/.github/workflows/release-e2e-workflow-template.yml) for OSD plugin or [this workflow](https://github.com/opensearch-project/opensearch-dashboards-functional-test/blob/main/.github/workflows/cypress-workflow-vanilla-snapshot-based.yml) for OSD Core. This workflow is to run the OSD from artifact. You could enable your experimental feature through either `./bin/opensearch-dashboards --vis_builder.enabled` or through modifying the content of the yml file. (In order to run the tests from the source code repo of the feature, you can set up workflows to check out the source code and use `yarn` to start OSD.)

4. Run tests from `opensearch-build`

To make the build repo enable your experimental feature when spinning up OSD service, make sure that you update [this file](https://github.com/opensearch-project/opensearch-build/blob/main/src/test_workflow/integ_test/service_opensearch_dashboards.py) You could either modify the start command or the yml file. To avoid a potentially long start command, it is preferred to modify the yml file to turn on the feature.
