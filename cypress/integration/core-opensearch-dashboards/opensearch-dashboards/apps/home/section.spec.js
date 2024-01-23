/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('home sections', { scrollBehavior: false }, () => {
  before(() => {
    // Go to the home page
    miscUtils.visitPage('app/home#');
  });

  it('should all appear expanded', function () {
    cy.getElementsByTestIds('homepageSection').each((element) => {
      const $content = element.find(
        '[data-test-subj="homepageSectionContent"]'
      );
      expect($content).to.have.length(1);
    });
  });

  it('should toggle correctly', function () {
    cy.getElementsByTestIds('homepageSection').each((element) => {
      const $button = element.find('button').first();

      const $preClick1 = element.find(
        '[data-test-subj="homepageSectionContent"]'
      );
      expect($preClick1).to.have.length(1);

      $button.trigger('click');

      const $postClick1 = element.find(
        '[data-test-subj="homepageSectionContent"]'
      );
      expect($postClick1).to.have.length(0);

      $button.trigger('click');

      const $postClick2 = element.find(
        '[data-test-subj="homepageSectionContent"]'
      );
      expect($postClick2).to.have.length(1);
    });
  });
});
