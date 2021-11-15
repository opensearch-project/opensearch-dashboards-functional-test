import { LoginPage } from '@opensearch-dashboards-test/opensearch-dashboards-test-library'

const loginPage = new LoginPage(cy);

describe('login into security enabled cluster', () => {
    beforeEach(() => {
        cy.visit('/');
    })

    it('type user name and password to login', () => {
        loginPage.enterUserName(Cypress.env('userName'))

        loginPage.enterPassword(Cypress.env('password'))

        loginPage.submit()

        cy.url().should('include', '/app/home#/')
    })
})
