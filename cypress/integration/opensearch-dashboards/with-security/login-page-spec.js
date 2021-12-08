import { LoginPage } from '@opensearch-dashboards-test/opensearch-dashboards-test-library'
import { dashboardSanityTests } from '../../common/dashboard_sample_data_spec.js'

const loginPage = new LoginPage(cy);

describe('login into security enabled cluster', () => {
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('security_authentication')
    })

    it('type user name and password to login', () => {
        cy.visit('/');

        loginPage.enterUserName(Cypress.env('userName'))

        loginPage.enterPassword(Cypress.env('password'))

        loginPage.submit()

        cy.url().should('include', '/app/home#/')
    })

    dashboardSanityTests()
})
