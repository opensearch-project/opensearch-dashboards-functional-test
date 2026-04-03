#!/bin/bash
set -e
for spec in cypress/integration/plugins/query-insights-dashboards/*_spec.js; do
  env CYPRESS_NO_COMMAND_LOG=1 yarn cypress:run-with-security --browser chromium --spec "$spec"
done
