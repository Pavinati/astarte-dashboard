import websocketMock from './websocket';

// This hook runs before each test of every test suite
// So this query will be already mocked in every test
beforeEach(() => {
  // unless overwritten, test expecting https connections
  cy.fixture('config/https').then((userConfig) => {
    cy.server();
    cy.route('/user-config/config.json', userConfig);
  });
});

Cypress.Commands.add('login', (params = {}) => {
  const { secure = true } = params;
  const configFixture = secure ? 'config/https' : 'config/http';
  cy.fixture(configFixture).then((userConfig) => {
    cy.fixture('realm').then((realm) => {
      const apiUrl = new URL(userConfig.astarte_api_url).hostname;
      const session = {
        login_type: 'TokenLogin',
        api_config: {
          secure_connection: secure,
          realm_management_url: `${apiUrl}/realmmanagement`,
          appengine_url: `${apiUrl}/appengine`,
          pairing_url: `${apiUrl}/pairing`,
          flow_url: `${apiUrl}/flow`,
          realm: realm.name,
          token: realm.infinite_token,
          enable_flow_preview: userConfig.enable_flow_preview,
        },
      };
      localStorage.session = JSON.stringify(session);
    });
  });
});

Cypress.Commands.add('dragOnto', { prevSubject: 'element' }, (subject, targetSelector) => {
  const dataTransfer = new DataTransfer();
  cy.wrap(subject.get(0)).trigger('dragstart', { dataTransfer });
  cy.get(targetSelector).trigger('drop', { dataTransfer, force: true });
});

Cypress.Commands.add('moveTo', { prevSubject: 'element' }, (subject, diffX, diffY) => {
  return cy
    .wrap(subject.get(0))
    .trigger('mousedown', { button: 0 }, { force: true })
    .trigger('mousemove', diffX, diffY, { force: true })
    .trigger('mouseup', { force: true });
});

Cypress.Commands.add('moveOnto', { prevSubject: 'element' }, (subject, targetSelector) => {
  cy.get(targetSelector).then((target) => {
    const targetRect = target.get(0).getBoundingClientRect();
    const subjectRect = subject.get(0).getBoundingClientRect();
    const diffX = targetRect.left - subjectRect.left;
    const diffY = targetRect.top - subjectRect.top;
    cy.wrap(subject.get(0))
      .trigger('mousedown', { button: 0 }, { force: true })
      .trigger('mousemove', diffX, diffY, { force: true });
    cy.wrap(target.get(0)).trigger('mouseup', { force: true });
  });
});

Cypress.Commands.add('mockWebSocket', ({ url }) => {
  cy.on('window:before:load', (win) => {
    websocketMock.injectMock(win, url);
  });
});

Cypress.Commands.add('sendWebSocketDeviceConnected', ({ deviceId, deviceIpAddress }) => {
  cy.window().then((win) => {
    websocketMock.sendDeviceConnected(win, { deviceId, deviceIpAddress });
  });
});

Cypress.Commands.add('sendWebSocketDeviceDisconnected', ({ deviceId }) => {
  cy.window().then((win) => {
    websocketMock.sendDeviceDisconnected(win, { deviceId });
  });
});

Cypress.Commands.add('sendWebSocketDeviceEvent', ({ deviceId, event }) => {
  cy.window().then((win) => {
    websocketMock.sendDeviceEvent(win, { deviceId, event });
  });
});
