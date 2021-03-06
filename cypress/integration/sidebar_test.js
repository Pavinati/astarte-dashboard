describe('Sidebar tests', () => {
  context('unauthenticated', () => {
    it('does not show the sidebar', () => {
      cy.visit('/');
      cy.location('pathname').should('eq', '/login');
      cy.get('.nav').should('exist').should('not.be.visible');
    });
  });

  context('authenticated', () => {
    beforeEach(() => {
      cy.fixture('realm').as('realm');
      cy.login();
      cy.visit('/');
    });

    it('correctly renders sidebar elements', function () {
      cy.server();
      cy.route('GET', '/appengine/health', '');
      cy.route('GET', '/realmmanagement/health', '');
      cy.route('GET', '/pairing/health', '');
      cy.route('GET', '/flow/health', '');
      cy.get('.nav-col .nav').within(() => {
        cy.get('.nav-brand')
          .as('brand')
          .next('.nav-link')
          .as('home')
          .next('.nav-item')
          .next('.nav-link')
          .as('interfaces')
          .next('.nav-link')
          .as('triggers')
          .next('.nav-item')
          .next('.nav-link')
          .as('devices')
          .next('.nav-link')
          .as('groups')
          .next('.nav-item')
          .next('.nav-link')
          .as('flows')
          .next('.nav-link')
          .as('pipelines')
          .next('.nav-link')
          .as('blocks')
          .next('.nav-item')
          .next('.nav-link')
          .as('realmSettings')
          .next('.nav-item')
          .next('.nav-status')
          .as('realmStatus')
          .next('.nav-item')
          .next('.nav-link')
          .as('logout');
        cy.get('@brand').should('have.attr', 'href', '/');
        cy.get('@home').should('have.attr', 'href', '/').contains('Home');
        cy.get('@interfaces').should('have.attr', 'href', '/interfaces').contains('Interfaces');
        cy.get('@triggers').should('have.attr', 'href', '/triggers').contains('Triggers');
        cy.get('@devices').should('have.attr', 'href', '/devices').contains('Devices');
        cy.get('@groups').should('have.attr', 'href', '/groups').contains('Groups');
        cy.get('@flows').should('have.attr', 'href', '/flows').contains('Flows');
        cy.get('@pipelines').should('have.attr', 'href', '/pipelines').contains('Pipelines');
        cy.get('@blocks').should('have.attr', 'href', '/blocks').contains('Blocks');
        cy.get('@realmSettings')
          .should('have.attr', 'href', '/settings')
          .contains('Realm settings');
        cy.get('@realmStatus').within(() => {
          cy.contains('Realm');
          cy.contains(this.realm.name);
          cy.contains('API Status');
          cy.contains('Up and running');
        });
        cy.get('@logout').should('have.attr', 'href', '/logout').contains('Logout');
      });
    });

    it('correctly reports realm status when unhealthy', () => {
      cy.server();
      cy.route({ method: 'GET', url: '/appengine/health', status: 200, response: '' });
      cy.route({ method: 'GET', url: '/realmmanagement/health', status: 200, response: '' });
      cy.route({ method: 'GET', url: '/pairing/health', status: 200, response: '' });
      cy.route({ method: 'GET', url: '/flow/health', status: 500, response: '' });
      cy.get('.nav-col .nav .nav-status').contains('Degraded');
    });
  });
});
