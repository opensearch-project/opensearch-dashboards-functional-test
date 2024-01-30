/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const http = require('http');
const agentFrameworkJson = require('../fixtures/plugins/dashboards-assistant/agent-framework-response.json');
const suggestionJson = require('../fixtures/plugins/dashboards-assistant/suggestion-response.json');

const MATCH_AGENT_FRAMEWORK_PROMPT =
  'Assistant is designed to be able to assist with a wide range of tasks';
const MATCH_SUGGESTION_PROMPT = 'You are an AI that only speaks JSON';

const server = http.createServer((req, res) => {
  // Set the content type to JSON
  res.setHeader('Content-Type', 'application/json');

  let requestBody = '';

  // Listen for data events to capture the request body
  req.on('data', (chunk) => {
    requestBody += chunk;
  });

  // Listen for the end of the request
  req.on('end', () => {
    try {
      // Why add a delay here? reference: https://github.com/opensearch-project/ml-commons/issues/1894
      setTimeout(() => {
        if (requestBody.includes(MATCH_AGENT_FRAMEWORK_PROMPT)) {
          return res.end(JSON.stringify(agentFrameworkJson));
        } else if (requestBody.includes(MATCH_SUGGESTION_PROMPT)) {
          return res.end(JSON.stringify(suggestionJson));
        }

        res.end('');
      }, 100);
    } catch (error) {
      // Handle JSON parsing errors
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON in the request body' }));
    }
  });
});

// Listen on port 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
