import { HomePage } from '@opensearch-dashboards-test/opensearch-dashboards-test-library'

Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
});

const homePage = new HomePage(cy);

describe('search amazon on google', () => {
    beforeEach(() => {
        homePage.open('https://www.google.com/');
    })

    it('type and search', () => {
        homePage.clickSearchBox();

        homePage.typeInSearchBox("amazon");

        homePage.submitSearchQuery()
    })
})
