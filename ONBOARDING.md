## Onboarding

To onboard your release tests (Dashboards plugins) onto this repo test function, you can follow the next steps.

0. Create a name to identify your plugin, e.g `plugin-name`

The dir name shall be descriptive to identify your plugin. You can use the same name defined in build repo https://github.com/opensearch-project/opensearch-build/tree/main/scripts/components

1. Place test files under `cypress/e2e/plugins/<plugin-name>`

2. Place fixtures under `cypress/fixtures/plugins/<plugin-name>`

3. Place custom commands under `cypress/utils/plugins/<plugin-name>`, if it's a general command that could be reused by other plugins, place it under `cypress/utils/commands.js`

4. Place custom constants under `cypress/utils/plugins/<plugin-name>`, reuse the constants in `cypress/utils/base_constants.js`

5. Run tests

Start OpenSearch and OpenSearch Dashboards. Then refer to the [test execution file](/integtest.sh).

E.g if you want to run all plugin tests with security enabled.

```
npx cypress run --env SECURITY_ENABLED=true --spec "cypress/e2e/plugins/*/*"
```

E.g if you want to run AD plugin tests with security enabled.

```
npx cypress run --env SECURITY_ENABLED=true --spec "cypress/e2e/plugins/anomaly-detection-dashboards-plugin"
```

For the complete ways to run Cypress, you can refer to the Cypress official site https://docs.cypress.io/guides/getting-started/.installing-cypress#Opening-Cypress.

The env parameters are defined in https://github.com/opensearch-project/opensearch-dashboards-functional-test/blob/main/cypress.json where you can look for or add the desired parameters. You can refer to the Cypress official site https://docs.cypress.io/guides/guides/environment-variables#Setting.

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