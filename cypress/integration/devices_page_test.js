describe('Devices page tests', () => {
  context('no access before login', () => {
    it('redirects to login', function () {
      cy.visit('/devices');
      cy.location('pathname').should('eq', '/login');
    });
  });

  context('authenticated', () => {
    beforeEach(() => {
      cy.fixture('devices_detailed').as('devices');
      cy.fixture('devices_stats').as('devicesStats');
      cy.server();
      cy.route('GET', '/appengine/v1/*/stats/devices', '@devicesStats');
      cy.route('GET', '/appengine/v1/*/devices*details=true*', '@devices');
      cy.login();
      cy.visit('/devices');
    });

    it('successfully loads Devices page', () => {
      cy.location('pathname').should('eq', '/devices');
      cy.get('h2').contains('Devices');
    });

    it('displays devices list correctly', function () {
      cy.get('.main-content').within(() => {
        cy.get('table tbody').find('tr').should('have.length', this.devices.data.length);
        this.devices.data.forEach((device, index) => {
          cy.get(`table tbody tr:nth-child(${index + 1})`).within(() => {
            cy.contains(device.aliases.name || device.id);
            cy.contains(device.last_connection ? 'Connected on' : 'Never connected');
          });
        });
      });
    });

    it('clicking a Device ID redirects to its page', function () {
      cy.get('.main-content').within(() => {
        const device = this.devices.data[0];
        cy.get('table tbody')
          .contains(device.aliases.name || device.id)
          .click();
        cy.location('pathname').should('eq', `/devices/${device.id}/edit`);
      });
    });

    it('has a button to register a new device', () => {
      cy.get('.main-content').within(() => {
        cy.contains('Register a new device').click();
      });
      cy.location('pathname').should('eq', '/devices/register');
    });

    it('correctly filters by connection status', () => {
      cy.get('#checkbox-connected').check();
      cy.get('#checkbox-disconnected').uncheck();
      cy.get('#checkbox-never-connected').uncheck();
      cy.get('table tbody tr i')
        .should('have.length', 1)
        .each(($icon) => {
          expect($icon).to.have.class('icon-connected');
        });
    });

    it('correctly filters by device handle', function () {
      const deviceName = this.devices.data[0].aliases.name;
      const filter = deviceName.substring(2, 7);
      cy.get('#filterId').type(filter);
      cy.get('table tbody tr').should('have.length', 1);
      cy.get('table tbody tr td:nth-child(2)').should('contain', deviceName);
    });

    it('correctly filters by metadata key', function () {
      const metadata = this.devices.data[0].metadata
      const key = Object.keys(metadata)[0];

      cy.get('#filterMetadataKey').type(key);
      cy.get('table tbody tr').should('have.length', 1);
      cy.get('table tbody tr td:nth-child(2)').should('contain', key);
    });

    it('correctly filters by metadata value', function () {
      const metadata = this.devices.data[0].metadata
      const value = Object.values(metadata)[0];

      cy.get('#filterMetadataValue').type(value);
      cy.get('table tbody tr').should('have.length', 1);
      cy.get('table tbody tr td:nth-child(2)').should('contain', value);
    });

    it('correctly filters by both metadata key and value', function () {
      const metadata = this.devices.data[0].metadata
      const key = Object.keys(metadata)[0];
      const value = metadata[key];

      cy.get('#filterMetadataKey').type(key);
      cy.get('table tbody tr').should('have.length', 1);
      cy.get('table tbody tr td:nth-child(2)').should('contain', key);

      cy.get('#filterMetadataValue').type(value);
      cy.get('table tbody tr').should('have.length', 1);
      cy.get('table tbody tr td:nth-child(2)').should('contain', value);
    });

    it('correctly filters by last device activity', function () {
      const disconnectedDevice = this.devices.data.find((device) => device.last_connection != null);
      const activeSinceDate = new Date(disconnectedDevice.last_connection);
      const activeDevices = this.devices.data.filter(
        (device) =>
          !!device.connected ||
          (device.lastDisconnection != null && device.lastDisconnection >= activeSinceDate),
      );
      cy.get('table tbody tr').should('have.length', this.devices.data.length);
      cy.get('#filterActiveSince').type(activeSinceDate.toISOString().slice(0, 10));
      cy.get('#filterActiveSince').type('{enter}');
      cy.get('table tbody tr').should('have.length', activeDevices.length);
      activeDevices.forEach((activeDevice) => {
        cy.get('table tbody').should('contain', activeDevice?.aliases?.name || activeDevice.id);
      });
    });
  });
});
