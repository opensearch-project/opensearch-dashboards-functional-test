<p align="center"><img src="https://opensearch.org/assets/brand/SVG/Logo/opensearch_dashboards_logo_darkmode.svg" height="64px"/></p>
<h1 align="center">Functional Test Developer Guide</h1>

This guide applies to all development within the OpenSearch Dashboards Functional Test.

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [opensearch-dashboards-test-library](#opensearch-dashboards-test-library)
  - [Run Tests](#run-tests)
- [Writing tests](#writing-tests)
  - [Tests for OpenSearch Dashboards](#tests-for-opensearch-dashboards)
  - [Tests for OpenSearch Dashboard Plugins](#tests-for-opensearch-dashboard-plugins)
  - [Experimental Features](#experimental-features)
- [General](#general)
  - [Formatting](#formatting)
- [Orchestrator Remote Test Workflow](#orchestrator-remote-test-workflow)

## Getting Started

If you would like to install and develop OpenSearch Dashboards or its plugins, please see the [OpenSearch Dashboards Developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md). The content in this guide outlines how to develop and run functional tests for OpenSearch Dashboards and it plugins.

### Prerequisites

You should have a running instance of OpenSearch Dashboards to run these tests against them. Refer to the [OpenSearch Dashboards Developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md) for details on how to do that.

- Node v16.20.0

### Installation

To install the dependencies run

```
npm install
```

also install yarn globally

```sh
npm install -g yarn
```

#### opensearch-dashboards-test-library

opensearch-dashboards-test-library is the test utility library used by this project, it is already a published package in NPM. You can optionally import the lastest version by installing from NPM registry

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

To start the Cypress UI run:

```
yarn cypress:open
```

All the available test in the repo should be available there.

You can also run the cypress tests by cli. There are some handy scripts in [package.json](package.json) to run the tests with some pre-set configurations.

To run tests against a local cluster

without security:

```
$ yarn cypress:run-without-security --spec "cypress/integration/core-opensearch-dashboards/opensearch-dashboards/*.js"
```

with security:

```
$ yarn cypress:run-with-security --spec "cypress/integration/core-opensearch-dashboards/opensearch-dashboards/*.js"
```

These tests run in headless mode by default.

And you can override certain [cypress config or environment variable](cypress.json) by applying additional cli arguments, for example to override the baseUrl and openSearchUrl to test a remote OpenSearch endpoint:

```
$ yarn cypress run --spec "cypress/integration/core-opensearch-dashboards/opensearch-dashboards/*.js" --config "baseUrl=https://<endpoint>/_dashboards" --env "openSearchUrl=https://<endpoint>,SECURITY_ENABLED=true,username=admin,password=xxxxxxxx,ENDPOINT_WITH_PROXY=true"
```

`SECURITY_ENABLED`: if true, the `username` and `password` passing in are used as basic authentication credentials during `cy.visit` and `cy.request`. Also, please notice security enabled endpoint normally uses https protocol, so you may want to pass in different urls.

`ENDPOINT_WITH_PROXY`: for an OpenSearch endpoint wrapped with a proxy that redirects the visiting url to the login url, even with auth option provided in `cy.visit`, the redirection to the login url still happens. So a login request before tests and cache the security cookie are needed and can be switched on by this argument.

`MANAGED_SERVICE_ENDPOINT`: set to true if tests are running against managed service domains.

## Writing tests

The testing library uses [Cypress](https://www.cypress.io/) as its testing framework and follow its high level folder structure. All tests are written under the `./cypress/integration` folder.

### Tests for OpenSearch Dashboards

Tests for core features specific to [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards) can be written under

```
/cypress
    /integration
        /core-opensearch-dashboards
            /opensearch-dashboards
```

### Tests for OpenSearch Dashboard Plugins

Tests for plugins that are not a part of the [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards) repository but released as a part of its release process

```
/cypress
    /integration
        /plugins
            /<YOUR_PLUGIN_NAME>
```

### Tests for Multiple Datasources

Tests surrounding the multiple datasources feature can use the start-opensearch action that lives in this repo. 

Example usage: 
```
- uses: ./.github/actions/start-opensearch
        with:
          opensearch-version: 3.0.0
          security-enabled: false
          port: 9201
```
This will spin up an OpenSearch backend with version 3.0.0 on port 9201 within the same github runner. This OpenSearch can then be added as an datasource. 

The DataSourceManagement Plugin exposes a helper function to create a helper function on this port:
```
const id = cy.createDataSourceNoAuth();

# Add tests that make calls to resp.body.id
```

### Experimental Features

When writing tests for experimental features, please follow these steps.

1. Figure out the folder location to put the tests

Similar to the regular tests, OSD Core tests go to the [folder](integration/core-opensearch-dashboards/opensearch-dashboards/) and OSD plugin tests go to the [folder](cypress/integration/plugins/).

2. Develop tests with a flag to turn on and off

Add an environment variable (e.g boolean) to only run tests for the experiemental feature when it is true. (Define such in [cypress configuration](cypress.json). Refer to `SECURITY_ENABLED` as an example) This is to ensure backward compatibility when integrating with [opensearch-build repo](https://github.com/opensearch-project/opensearch-build/blob/main/src/test_workflow/integ_test/service_opensearch_dashboards.py) whose OpenSearch Dashboards execution command or yml configuration may not be updated to support the experimental feature yet.

3. Set up Github action to run the tests inside the current repo

Create a new workflow by referring to [this template](https://github.com/opensearch-project/opensearch-dashboards-functional-test/blob/main/.github/workflows/release-e2e-workflow-template.yml) for OSD plugin or [this workflow](https://github.com/opensearch-project/opensearch-dashboards-functional-test/blob/main/.github/workflows/cypress-workflow-vanilla-snapshot-based.yml) for OSD Core. This workflow is to run the OSD from artifact. You could enable your experimental feature through either `./bin/opensearch-dashboards --vis_builder.enabled` or through modifying the content of the yml file. (In order to run the tests from the source code repo of the feature, you can set up workflows to check out the source code and use `yarn` to start OSD.)

4. Run tests from `opensearch-build`

To make the build repo enable your experimental feature when spinning up OSD service, make sure that you update [this file](https://github.com/opensearch-project/opensearch-build/blob/main/src/test_workflow/integ_test/service_opensearch_dashboards.py) You could either modify the start command or the yml file. To avoid a potentially long start command, it is preferred to modify the yml file to turn on the feature.

## General

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

## Orchestrator Remote Test Workflow

### Remote Cypress Test Runner - remoteCypress.sh

`remoteCypress.sh` is a shell script that triggers GitHub workflow runners within a specified repository which runs Cypress integration tests on a remote OpenSearch/Dashboards cluster.

#### Usage

`./remoteCypress.sh -r REPO -w GITHUB_WORKFLOW_NAME -o OS_URL -d OSD_URL -b BRANCH_REF -i BUILD_ID`

#### Arguments

* -r REPO: Name of the repository in {owner}/{repository} format.
* -w GITHUB_WORKFLOW_NAME: Name of the GitHub workflow file with .yml extension that contains the job that run Cypress tests in the component repository. For example, main.yaml.
* -o OS_URL: Release artifact of the OpenSearch.
* -d OSD_URL: Release artifact of the OpenSearch Dashboards.
* -b BRANCH_REF: Test Branch name or commit reference id.
* -i BUILD_ID: Release-specific build id for reference.

#### How it works

The script first parses the command-line arguments and checks if all required arguments are provided. If not, it prints a usage message and exits.

If all required arguments are provided, it generates a unique workflow ID using uuidgen and constructs a payload for the GitHub API. It then triggers the remote GitHub workflow using curl and the Github auth token which has repo level access.

The script then checks the status code of the API response. If the status code is between 200 and 300, it means the remote workflow was triggered successfully. It then sources the `poll_remote_workflow.sh` script to poll the status of the remote workflow and logs the return code and status message to a log file.

If the status code is not between 200 and 300, it means the remote workflow failed to trigger. It logs an error message and exits.

#### Log Files

The script logs the status of the remote workflow to a log file located at `/tmp/logfiles/{REPO}/logfile.txt`. The log file contains the return code and status message of the remote workflow.

#### Dependencies

* curl: Used to make HTTP requests to the GitHub API.
* uuidgen: Used to generate a unique workflow ID.

### Remote Cypress Test Runner - remote_cypress_manifest.json

`remote_cypress_manifest.json` is a configuration file used by the `remoteCypress.sh` script to run Cypress integration tests on a remote OpenSearch/Dashboards cluster.

#### Structure

The JSON file contains an array of objects, each representing a different repository and its associated configuration. Here's an example of what an object in the array might look like:
```
{
  "repo": "opensearch-project/opensearch-dashboards",
  "workflow-name": "main.yml",
  "operating-system": "linux",
  "arch": "x64",
  "ref": "main"
}
```

#### Fields

* repo: Name of the repository in {owner}/{repository} format.
* workflow-name: Name of the GitHub workflow file name with .yml extension that contain jobs that run Cypress tests in the component repository. For example, main.yaml.
* operating-system: Operating system on which tests will be executed. Example: "linux".
* arch: Architecture of the system. Example: "x64".
* ref: Test Branch name or commit reference id.
* build_id: Release-specific build id for reference.
* integ-test: Integration test configuration for the component.
  * test-configs: Configurations for different test scenarios. Example: ["with-security", "without-security"].
  * additional-cluster-configs: Additional configurations specific to the test environment. Example: {"vis_builder.enabled": true, "data_source.enabled": true}.

#### Usage

The `remoteCypress.sh` script reads this JSON file to get the configuration for each repository. It then triggers the GitHub workflow runners for each repository with the specified configuration.

### Integration Test Runner - integtest.sh with Remote Cypress Execution

`integtest.sh` is a shell script that sets up the environment and runs integration tests for a specific component of the OpenSearch project. In addition to running integration tests, it can also execute Cypress tests remotely on a specified plugin/Dashboards component.

#### Usage

`./integtest.sh [args]`

#### Arguments

* -b BIND_ADDRESS: (Optional) Specifies the bind address for the remote OpenSearch/Dashboards cluster. Defaults to localhost or 127.0.0.1.
* -p BIND_PORT: (Optional) Specifies the bind port for the remote OpenSearch/Dashboards cluster. Defaults to 9200 or 5601 depending on OpenSearch or Dashboards.
* -s SECURITY_ENABLED: (Optional) Specifies whether security is enabled on the OpenSearch/Dashboards cluster. Can be set to true or false. Defaults to true.
* -c CREDENTIAL: (Optional) Specifies the credentials for accessing the secured cluster. Format: username:password.
* -t TEST_COMPONENTS: (Optional) Specifies the components to be tested. Separate multiple components with spaces. If not specified, tests all components.
* -v VERSION: (Optional) Specifies the OpenSearch version to test.
* -o OPTION: (Optional) Determines the test type value among default or manifest in test_finder.sh.
* -r REMOTE_CYPRESS_ENABLED: (Optional) Specifies whether remote Cypress orchestrator runs are enabled. Defaults to true.

#### How it works

The script begins by parsing command-line arguments using the getopts function. These arguments allow users to customize various aspects of the testing environment, such as bind address, bind port, security settings, test components, OpenSearch version, and more.

After parsing arguments, the script sets default values for certain parameters if they are not provided by the user. For example, it defaults to localhost for the bind address, 9200 or 5601 for the bind port, true for security enabled, and true for remote Cypress orchestrator runs.

If remote Cypress orchestrator runs are enabled (`REMOTE_CYPRESS_ENABLED=true`), the script iterates over components specified in the manifest file (`remote_cypress_manifest.json`). For each component, it extracts relevant information such as repository, workflow name, operating system, and branch reference. Then, it triggers the remote GitHub workflow using the `remoteCypress.sh` script with the extracted parameters.

The script runs `remoteCypress.sh` as a background process for each component, allowing multiple tests to be executed concurrently. It stores the process IDs (PIDs) in a PID file (process_ids.txt) to monitor their execution status. After triggering all remote workflows, the script waits for all background processes to finish using the wait command.

Once all tests are completed, the script reads log files generated during the tests, outputs their content to the console, and then deletes the temporary log files and folder.

Cypress Test Execution: Finally, the script executes Cypress tests based on the security settings (`SECURITY_ENABLED`). It determines whether to run security-enabled tests or security-disabled tests and executes them accordingly using the appropriate Cypress commands (`yarn cypress:run-with-security` or `yarn cypress:run-without-security`).

#### Dependencies

* curl: Used to download the OpenSearch bundle.
* gradlew: Used to run the integration tests.
* jq: Used to parse JSON files.
* docker: Used to set up the testing environment.
* remoteCypress.sh: Used to trigger the remote Cypress tests.

