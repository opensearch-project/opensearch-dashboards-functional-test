/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const http = require('http');

/**
 * This dummy LLM server simulates an LLM for PER (Plan-Execute-Reflect) agent testing.
 *
 * Investigation Flow:
 * 1. Dashboard calls POST /_plugins/_ml/agents/{agentId}/_execute?async=true
 * 2. PER agent calls this dummy LLM server for planning (returns steps)
 * 3. PER agent executes each step using executor agent (ReAct agent)
 *    - ReAct agent calls this server for tool selection (action/action_input)
 *    - ReAct agent executes tools and gets results
 *    - ReAct may call LLM multiple times until final_answer
 * 4. After each step, PER agent calls this server for reflection
 * 5. When all steps are done, server returns final result
 * 6. PER agent writes result to working memory
 * 7. Dashboard polls working memory until result appears
 *
 * Two response formats:
 * 1. PER agent (planner): { "response": "{\"steps\": [...], \"result\": \"\"}" }
 * 2. ReAct agent (executor): { "response": "{\"thought\": \"...\", \"action\": \"...\", \"action_input\": \"...\"}" }
 *    or { "response": "{\"thought\": \"Now I know the final answer\", \"final_answer\": \"...\"}" }
 */

// Mock investigation result - matches PERAgentInvestigationResponse schema
const investigationResult = {
  findings: [
    {
      id: 'F1',
      description: 'High HTTP error rate detected in service logs',
      importance: 90,
      evidence:
        'Analysis of opensearch_dashboards_sample_data_logs index shows error rate increased from 0.1% to 5.2% over the investigation time period. HTTP 404 errors account for 35%, 500 errors for 45%, and 503 errors for 20%.',
    },
    {
      id: 'F2',
      description: 'Database connection pool exhaustion identified',
      importance: 85,
      evidence:
        'Connection pool utilization reached 100% capacity based on system metrics correlation. Connection timeout errors represent 45% of all error patterns.',
    },
    {
      id: 'F3',
      description: 'Error spike correlates with peak traffic hours',
      importance: 70,
      evidence:
        'Timestamp analysis shows 78% of errors occurred between 14:00-18:00 UTC, coinciding with peak user traffic periods.',
    },
  ],
  hypotheses: [
    {
      id: 'H1',
      title: 'Database Connection Pool Exhaustion',
      description:
        'The database connection pool reached maximum capacity during peak traffic hours, causing cascading failures that manifested as HTTP 500 and 503 errors. This explains both the error rate spike and the connection timeout patterns observed.',
      likelihood: 85,
      supporting_findings: ['F1', 'F2', 'F3'],
    },
    {
      id: 'H2',
      title: 'CDN Cache Invalidation Issue',
      description:
        'A recent CDN cache invalidation event caused a surge of requests to hit the origin servers directly, overwhelming backend services. This is supported by the correlation between error timestamps and the cache purge schedule.',
      likelihood: 65,
      supporting_findings: ['F1', 'F3'],
    },
  ],
  topologies: [],
  investigationName: 'HTTP Error Rate Investigation',
};

// Track ReAct agent iteration count per session
const reactIterations = {};

/**
 * Count completed steps by looking for <step-N> tags in the request body.
 * PER agent formats completed steps as: <step-1>...</step-1><step-1-result>...</step-1-result>
 */
function countCompletedSteps(body) {
  const stepMatches = body.match(/<step-\d+>/g);
  return stepMatches ? stepMatches.length : 0;
}

/**
 * Check if this is a ReAct agent request (executor agent for step execution)
 * ReAct requests typically include scratchpad and tool information in a specific format
 */
function isReActRequest(body) {
  // ReAct agent uses these specific patterns in its prompt
  return (
    body.includes('TOOL RESPONSE') ||
    body.includes('Observation:') ||
    body.includes('${parameters.scratchpad}') ||
    body.includes('"scratchpad"') ||
    (body.includes('Assistant is designed') && body.includes('TOOLS')) ||
    body.includes('"action"') ||
    body.includes('"action_input"')
  );
}

/**
 * Check if this is a PER agent request (planner)
 * PER requests include specific fields like planner_prompt, steps, completed_steps
 */
function isPERRequest(body) {
  return (
    body.includes('AVAILABLE TOOLS') ||
    body.includes('planner_prompt') ||
    body.includes('completed_steps') ||
    body.includes('create your plan') ||
    body.includes('step-by-step plan') ||
    body.includes('plan-execute-reflect') ||
    body.includes('PLANNING GUIDANCE') ||
    body.includes('"steps":') ||
    body.includes('"result":')
  );
}

/**
 * Check if this is a summary/max-steps request
 */
function isSummaryRequest(body) {
  return body.includes('MAX_STEP_SUMMARY') || body.includes('Summary Agent');
}

/**
 * Extract memory_id or session_id from request for tracking
 */
function extractSessionId(body) {
  const match = body.match(/"(?:memory_id|session_id)"\s*:\s*"([^"]+)"/);
  return match ? match[1] : 'default';
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk) => (body += chunk));

  req.on('end', () => {
    const url = req.url || '/predict';
    console.log(`[DummyLLM] ${req.method} ${url}`);
    console.log(`[DummyLLM] Body preview: ${body.substring(0, 400)}...`);

    try {
      const isReAct = isReActRequest(body);
      const isPER = isPERRequest(body);
      const isSummary = isSummaryRequest(body);
      const completedStepsCount = countCompletedSteps(body);
      const sessionId = extractSessionId(body);

      console.log(
        `[DummyLLM] Detection: isReAct=${isReAct}, isPER=${isPER}, isSummary=${isSummary}, completedSteps=${completedStepsCount}`
      );

      let response;
      let delay = 200;

      // Handle ReAct agent requests (executor for step execution)
      if (isReAct && !isPER) {
        // Get or initialize iteration count for this session
        let iteration = reactIterations.get(sessionId) || 0;
        iteration++;
        reactIterations.set(sessionId, iteration);

        console.log(
          `[DummyLLM] ReAct agent iteration ${iteration} for session ${sessionId}`
        );

        // Simulate ReAct loop: first call does tool use, second call returns final answer
        if (iteration % 2 === 1) {
          // Tool use response - ReAct agent expects action format
          response = {
            response: JSON.stringify({
              thought:
                'I need to analyze the logs to identify error patterns and their distribution.',
              action: 'PPLTool',
              action_input:
                'source=opensearch_dashboards_sample_data_logs | stats count() by response | where response >= 400',
            }),
          };
          console.log('[DummyLLM] ReAct: Returning tool use action');
        } else {
          // Final answer after tool execution
          response = {
            response: JSON.stringify({
              thought: 'Now I know the final answer',
              final_answer:
                'Analyzed logs and found 1234 error entries in the specified time range. ' +
                'Top error patterns: Connection timeout (45%), HTTP 500 (30%), HTTP 503 (25%). ' +
                'Geographic distribution: US-West (40%), EU (35%), APAC (25%). ' +
                'Peak error times: 14:00-18:00 UTC.',
            }),
          };
          // Reset iteration count after completing
          reactIterations.delete(sessionId);
          console.log('[DummyLLM] ReAct: Returning final answer');
        }
        delay = 300;
      }
      // Handle summary request (when max steps reached)
      else if (isSummary) {
        response = {
          response:
            'Investigation Summary: Analyzed HTTP error patterns across the opensearch_dashboards_sample_data_logs index. ' +
            'Identified database connection pool exhaustion as the primary root cause affecting service availability during peak hours. ' +
            'Recommended actions: Increase connection pool size, implement connection pooling optimizations, and add circuit breakers.',
        };
        console.log('[DummyLLM] Phase: Summary request');
        delay = 400;
      }
      // Handle PER agent requests (planner/reflect)
      else if (isPER || completedStepsCount === 0) {
        if (completedStepsCount === 0) {
          // Initial planning phase - no steps completed yet
          response = {
            response: JSON.stringify({
              steps: [
                'Use PPLTool to query opensearch_dashboards_sample_data_logs index and retrieve recent error logs to identify error patterns and distribution',
                'Analyze the HTTP response code distribution to identify anomalies in 4xx and 5xx error rates',
                'Correlate error timestamps with system metrics to identify potential infrastructure issues and peak error periods',
              ],
              result: '',
            }),
          };
          console.log('[DummyLLM] PER: Initial planning - returning 3 steps');
          delay = 500;
        } else if (completedStepsCount === 1) {
          // After first step - reflect and add more steps
          response = {
            response: JSON.stringify({
              steps: [
                'Investigate geographic distribution of errors to determine if issues are region-specific',
                'Analyze user agent patterns to determine if errors are browser or client-specific',
              ],
              result: '',
            }),
          };
          console.log(
            '[DummyLLM] PER: Reflection after step 1 - returning 2 more steps'
          );
          delay = 400;
        } else if (completedStepsCount === 2) {
          // After second step - continue investigation
          response = {
            response: JSON.stringify({
              steps: [
                'Cross-reference error patterns with deployment timeline and generate final hypothesis with supporting evidence',
              ],
              result: '',
            }),
          };
          console.log(
            '[DummyLLM] PER: Reflection after step 2 - returning 1 more step'
          );
          delay = 400;
        } else {
          // After 3+ steps - return final investigation result
          response = {
            response: JSON.stringify({
              steps: [],
              result: JSON.stringify(investigationResult),
            }),
          };
          console.log(
            `[DummyLLM] PER: Final result after ${completedStepsCount} completed steps`
          );
          delay = 600;
        }
      }
      // Fallback - treat as ReAct final answer
      else {
        response = {
          response: JSON.stringify({
            thought: 'Now I know the final answer',
            final_answer:
              'Analysis complete. Found patterns in the data that indicate service degradation during peak hours.',
          }),
        };
        console.log('[DummyLLM] Fallback: Returning generic final answer');
        delay = 300;
      }

      setTimeout(() => {
        console.log('[DummyLLM] Sending response');
        res.end(JSON.stringify(response));
      }, delay);
    } catch (error) {
      console.error('[DummyLLM] Error:', error);
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid request' }));
    }
  });
});

const PORT = process.env.DUMMY_LLM_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Investigation dummy LLM server listening on port ${PORT}`);
  console.log(
    `Expected usage: Configure ML connector to point to http://localhost:${PORT}`
  );
  console.log(
    'Handles both PER agent (planner) and ReAct agent (executor) requests'
  );
});
