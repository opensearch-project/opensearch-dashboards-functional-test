/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const http = require('http');
const agentFrameworkJson = require('../fixtures/plugins/dashboards-assistant/agent-framework-response.json');
const agentFrameworkThoughtJson = require('../fixtures/plugins/dashboards-assistant/agent-framework-thought-response.json');
const suggestionJson = require('../fixtures/plugins/dashboards-assistant/suggestion-response.json');
const queryAssistPPLJson = require('../fixtures/plugins/dashboards-assistant/query-assist-ppl-response.json');
const text2vegaJson = require('../fixtures/plugins/dashboards-assistant/text2vega-response.json');
const text2vegaInstructionsJson = require('../fixtures/plugins/dashboards-assistant/text2vega-with-instructions-response.json');
const data2summaryJSON = require('../fixtures/plugins/dashboards-assistant/data2summary-response.json');
const suggestADJSON = require('../fixtures/plugins/dashboards-assistant/suggest-ad-response.json');
const summaryJSON = require('../fixtures/plugins/dashboards-assistant/summary-response.json');
const summaryWithLogPatternJSON = require('../fixtures/plugins/dashboards-assistant/summary-with-log-pattern-response.json');

const MATCH_AGENT_FRAMEWORK_PROMPT =
  'Assistant is designed to be able to assist with a wide range of tasks';
const MATCH_SUGGESTION_PROMPT = 'You are an AI that only speaks JSON';
const TOOL_RESPONSE = 'TOOL RESPONSE of ListIndexTool:';

const mockResponses = [
  {
    contents: [MATCH_AGENT_FRAMEWORK_PROMPT, TOOL_RESPONSE],
    responseJSON: agentFrameworkJson,
  },
  {
    contents: [MATCH_AGENT_FRAMEWORK_PROMPT],
    responseJSON: agentFrameworkThoughtJson,
  },
  {
    contents: [MATCH_SUGGESTION_PROMPT],
    responseJSON: suggestionJson,
  },
  {
    // Track: https://github.com/opensearch-project/skills/blob/d30e38df8669dcd25a6ac37426964047a64e3a2a/src/main/resources/org/opensearch/agent/tools/PPLDefaultPrompt.json#L3
    contents: ['Can you help me generate a PPL for that?'],
    responseJSON: queryAssistPPLJson,
  },
  {
    contents: ['t2v agent prompt'],
    responseJSON: text2vegaJson,
  },
  {
    contents: ['t2v instruction agent prompt'],
    responseJSON: text2vegaInstructionsJson,
  },
  {
    contents: ['data2summary instruction agent prompt'],
    responseJSON: data2summaryJSON,
  },
  {
    contents: ['suggest_ad instruction agent prompt'],
    responseJSON: suggestADJSON,
  },
  {
    contents: ['alert summary instruction agent prompt'],
    responseJSON: summaryJSON,
  },
  {
    contents: ['alert summary with log pattern instruction agent prompt'],
    responseJSON: summaryWithLogPatternJSON,
  },
];

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
        const mockResponse = mockResponses.find(({ contents }) =>
          contents.every((content) => requestBody.includes(content))
        );
        if (mockResponse) {
          return res.end(JSON.stringify(mockResponse.responseJSON));
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
