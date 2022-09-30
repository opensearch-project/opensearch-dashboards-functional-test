<p align="center"><img src="https://opensearch.org/assets/brand/SVG/Logo/opensearch_dashboards_logo_darkmode.svg" height="64px"/></p>
<h1 align="center">OpenSearch Dashboards Functional Test Developer Guide</h1>

This guide applies to all development within the OpenSearch Dashboards Functional Test.

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running tests](#running-tests)
- [Writing tests](#writing-tests)
  - [Tests for OpenSearch Dashboards](#tests-for-opensearch-dashboards)
  - [Tests for OpenSearch Dashboard Plugins](#tests-for-opensearch-dashboard-plugins)

## Getting Started

If you would like to install and develop OpenSearch Dashboards or its plugins, please see the [OpenSearch Dashboards Developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md). The content in this guide outlines how to develop and run functional tests for OpenSearch Dashboards and it plugins.

### Prerequisites

You should have a running instance of OpenSearch Dashboards to run these tests against them. Refer to the [OpenSearch Dashboards Developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md) for details on how to do that.

### Installation

To install the dependencies run 

```
npm install
```

### Running tests

To start the test runner run:

```
npm run cypress:open
```

All the available test in the repo should be available there.

Additional run scripts are available under `scripts` in `./package.json`


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

