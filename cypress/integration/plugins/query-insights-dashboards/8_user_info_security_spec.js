/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QUERY_INSIGHTS_ADMIN_AUTH as ADMIN_AUTH } from '../../../utils/plugins/query-insights-dashboards/constants';

// End-to-end coverage for the user-info columns (Username / User Roles / Backend Roles)
// and the X-Opaque-Id column on the Top N table, running against a REAL security-enabled
// cluster. The supported block seeds its own labeled queries at test time and asserts on
// that real data.
//
// The columns are version-gated (rendered only when the cluster version is >= 3.5). The
// real cluster is a single fixed version, so the "not supported" (< 3.5) case is exercised
// by stubbing only /api/cluster/version to a below-gate value — a real downgrade is not
// possible within one job. That block intentionally does NOT stub /api/top_queries.
//
// This repo runs every spec both with and without security, and user info only exists on a
// security-enabled cluster, so the whole spec is gated on SECURITY_ENABLED.
if (Cypress.env('SECURITY_ENABLED')) {
  describe('User Info Columns with Security Enabled', () => {
    const osUrl = Cypress.env('openSearchUrl') || 'https://localhost:9200';
    const TEST_INDEX = 'user-info-e2e';

    const req = (options) =>
      cy.request({ auth: ADMIN_AUTH, failOnStatusCode: false, ...options });

    describe('when the cluster supports user info (real cluster, version >= 3.5)', () => {
      before(() => {
        // Enable top-N latency collection with a short window. This repo runs this spec on
        // the same cluster after specs 1-6, whose grouping helpers persist
        // exporter.type=none and may leave grouping on. Restore the fresh-cluster defaults
        // (local_index exporter, no grouping) that upstream relies on, so the seeded
        // individual queries stay readable after their window rotates out of memory.
        req({
          method: 'PUT',
          url: `${osUrl}/_cluster/settings`,
          body: {
            persistent: {
              'search.insights.top_queries.latency.enabled': true,
              'search.insights.top_queries.latency.window_size': '1m',
              'search.insights.top_queries.latency.top_n_size': 100,
              'search.insights.top_queries.exporter.type': 'local_index',
              'search.insights.top_queries.grouping.group_by': 'none',
            },
          },
        })
          .its('status')
          .should('eq', 200);
        // Seed a document, then run labeled searches as admin so the top-N store captures the
        // username, roles and X-Opaque-Id in the current window.
        req({
          method: 'POST',
          url: `${osUrl}/${TEST_INDEX}/_doc`,
          headers: { 'Content-Type': 'application/json' },
          body: { name: 'e2e', value: 1 },
        });
        req({ method: 'POST', url: `${osUrl}/${TEST_INDEX}/_refresh` });
        const seedLabeledSearches = () => {
          for (let i = 0; i < 5; i++) {
            req({
              method: 'POST',
              url: `${osUrl}/${TEST_INDEX}/_search`,
              headers: {
                'Content-Type': 'application/json',
                'X-Opaque-Id': 'admin-console',
              },
              body: { query: { match_all: {} } },
            });
          }
        };
        // Instead of upstream's fixed cy.wait(65000), poll until a queue drain (every 5s)
        // puts a seeded record in the in-memory top-N snapshot, and fail loudly if it never
        // appears. Latency was disabled by earlier specs, so its window start is stale when
        // re-enabled here, and the first drain's window rotation can discard a batch consumed
        // in that same drain. Re-seed on each retry so a dropped batch is replaced.
        const waitForSeededQuery = (retries) => {
          req({
            method: 'GET',
            url: `${osUrl}/_insights/top_queries`,
            qs: { type: 'latency' },
          }).then((response) => {
            const queries = (response.body && response.body.top_queries) || [];
            const seeded = queries.some(
              (q) => q.labels && q.labels['X-Opaque-Id'] === 'admin-console'
            );
            if (seeded) return;
            if (retries <= 0) {
              throw new Error(
                'Seeded admin-console query never surfaced in top-N queries'
              );
            }
            seedLabeledSearches();
            cy.wait(5000);
            waitForSeededQuery(retries - 1);
          });
        };
        seedLabeledSearches();
        cy.wait(5000);
        waitForSeededQuery(24);
      });

      after(() => {
        req({ method: 'DELETE', url: `${osUrl}/${TEST_INDEX}` });
      });

      beforeEach(() => {
        // No stubs: hit the real security-enabled cluster.
        cy.waitForQueryInsightsPlugin();
        // Force reload because testIsolation is disabled in this repo's cypress.config —
        // without it, cy.visit() to the same URL is a no-op and the Top N data (and the
        // cluster version, which is cached per page load) would not be refetched.
        cy.reload();
        cy.get('.euiBasicTable', { timeout: 120000 }).should('exist');
      });

      it('shows the user-info and X-Opaque-Id column headers', () => {
        cy.get('.euiBasicTable')
          .last()
          .within(() => {
            cy.contains('Username').should('exist');
            cy.contains('User Roles').should('exist');
            cy.contains('Backend Roles').should('exist');
            cy.contains('X-Opaque-Id').should('exist');
          });
      });

      it('displays the seeded username', () => {
        cy.get('.euiBasicTable')
          .last()
          .find('tbody')
          .should('contain.text', 'admin');
      });

      it('displays user roles for the seeded user', () => {
        // The admin user is mapped to all_access on the demo security config.
        cy.get('.euiBasicTable')
          .last()
          .find('tbody')
          .should('contain.text', 'all_access');
      });

      it('displays the seeded X-Opaque-Id label value', () => {
        cy.get('.euiBasicTable')
          .last()
          .find('tbody')
          .should('contain.text', 'admin-console');
      });
    });

    describe('when the cluster does not support user info (version < 3.5)', () => {
      beforeEach(() => {
        // Only the version is stubbed (a real old cluster can't be booted in-job); the top-N
        // data still comes from the real cluster.
        cy.intercept('GET', '**/api/cluster/version', {
          statusCode: 200,
          body: { version: '3.4.0' },
        }).as('clusterVersion');

        cy.waitForQueryInsightsPlugin();
        // Force reload because testIsolation is disabled in this repo's cypress.config —
        // the cluster version is cached per page load, so without a fresh load the page
        // keeps the real (>= 3.5) version from the previous block and the stub never applies.
        cy.reload();
        cy.wait('@clusterVersion', { timeout: 60000 });
        cy.get('.euiBasicTable', { timeout: 120000 }).should('exist');
      });

      it('hides the user-info columns', () => {
        cy.get('.euiBasicTable')
          .last()
          .within(() => {
            cy.contains('Username').should('not.exist');
            cy.contains('User Roles').should('not.exist');
            cy.contains('Backend Roles').should('not.exist');
          });
      });

      it('still shows the X-Opaque-Id column (not user-info gated)', () => {
        cy.get('.euiBasicTable').last().should('contain.text', 'X-Opaque-Id');
      });
    });
  });
}
