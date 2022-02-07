/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_AD_DASHBOARDS_PATH } from "../../../utils/constants";

// Contains basic sanity tests on AD Dashboards page
describe("AD Dashboard page", () => {
  // start a server so that server responses can be mocked via fixtures
  // in all of the below test cases
  before(() => {
    cy.server();
  });

  it("empty - no detector index", () => {
    cy.mockGetDetectorOnAction("no_detector_index_response.json", () => {
      cy.visit(BASE_AD_DASHBOARDS_PATH);
    });
    cy.contains("h2", "You have no detectors");
  });

  it("empty - empty detector index", () => {
    cy.mockGetDetectorOnAction("empty_detector_index_response.json", () => {
      cy.visit(BASE_AD_DASHBOARDS_PATH);
    });
    cy.contains("h2", "You have no detectors");
  });

  it("non-empty - single running detector", () => {
    cy.mockGetDetectorOnAction("single_running_detector_response.json", () => {
      cy.visit(BASE_AD_DASHBOARDS_PATH);
    });

    cy.contains("h3", "Live anomalies");
    cy.contains("a", "running-detector");
  });

  it("redirect to create detector page", () => {
    cy.mockGetDetectorOnAction("no_detector_index_response.json", () => {
      cy.visit(BASE_AD_DASHBOARDS_PATH);
    });

    cy.mockSearchIndexOnAction("search_index_response.json", () => {
      cy.get('a[data-test-subj="createDetectorButton"]').click({
        force: true,
      });
    });

    cy.contains("span", "Create detector");
  });

  it("filter by detector", () => {
    cy.mockGetDetectorOnAction("multiple_detectors_response.json", () => {
      cy.visit(BASE_AD_DASHBOARDS_PATH);
    });

    cy.contains("stopped-detector");
    cy.contains("running-detector");

    cy.get("[data-test-subj=comboBoxToggleListButton]")
      .first()
      .click({ force: true });
    cy.get(".euiFilterSelectItem").first().click({ force: true });
    cy.get(".euiPageSideBar").click({ force: true });

    cy.contains("feature-required-detector"); // first one in the list returned by multiple_detectors_response.json
    cy.contains("stopped-detector").should("not.be.visible");
    cy.contains("running-detector").should("not.be.visible");
  });

  it("filter by detector state", () => {
    cy.mockGetDetectorOnAction("multiple_detectors_response.json", () => {
      cy.visit(BASE_AD_DASHBOARDS_PATH);
    });

    cy.contains("stopped-detector");
    cy.contains("running-detector");

    cy.get("[data-test-subj=comboBoxToggleListButton]")
      .eq(1)
      .click({ force: true });
    cy.get(".euiFilterSelectItem").first().click({ force: true });
    cy.get(".euiPageSideBar").click({ force: true });

    cy.contains("stopped-detector"); // because stopped is the first item in the detector state dropdown
    cy.contains("running-detector").should("not.be.visible");
  });
});
