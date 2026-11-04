#!/bin/bash
set -e
# Match the cluster that release-e2e-workflow-template.yml started. The template exports
# SECURITY_ENABLED=true|false to the job environment. Default to with-security when unset.
if [ "${SECURITY_ENABLED:-true}" = "false" ]; then
  TEST_MODE=run-without-security
else
  TEST_MODE=run-with-security
fi
for spec in cypress/integration/plugins/query-insights-dashboards/*_spec.js; do
  env CYPRESS_NO_COMMAND_LOG=1 yarn cypress:$TEST_MODE --browser chromium --spec "$spec"
done
