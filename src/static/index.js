/*
   This file is part of Astarte.

   Copyright 2017 Ispirata Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import ReactDOM from 'react-dom';
import { createBrowserHistory } from 'history';
import AstarteClient from 'astarte-client';

import getReactApp from '../react/App';
import SessionManager from '../react/SessionManager';

require('./styles/main.scss');

const $ = require('jquery');

// eslint-disable-next-line import/no-unresolved
const elmApp = require('../elm/Main').Elm.Main;

let reactHistory = null;
let dashboardConfig = null;
let app;
let astarteClient = null;
let sessionManager = null;

function sendErrorMessage(errorMessage) {
  app.ports.onDeviceEventReceived.send({
    message: errorMessage,
    level: 'error',
    timestamp: Date.now(),
  });
}

function sendInfoMessage(infoMessage) {
  app.ports.onDeviceEventReceived.send({
    message: infoMessage,
    level: 'info',
    timestamp: Date.now(),
  });
}

function noMatchFallback(url) {
  app.ports.onPageRequested.send(url);
}

function watchDeviceEvents(params) {
  const { deviceId } = params;
  const salt = Math.floor(Math.random() * 10000);
  const roomName = `dashboard_${deviceId}_${salt}`;
  astarteClient
    .joinRoom(roomName)
    .then(() => {
      sendInfoMessage(`Joined room for device ${params.deviceId}`);

      astarteClient.listenForEvents(roomName, (payload) => {
        app.ports.onDeviceEventReceived.send(payload);
      });

      const connectionTriggerPayload = {
        name: `connectiontrigger-${deviceId}`,
        device_id: deviceId,
        simple_trigger: {
          type: 'device_trigger',
          on: 'device_connected',
          device_id: deviceId,
        },
      };

      const disconnectionTriggerPayload = {
        name: `disconnectiontrigger-${deviceId}`,
        device_id: deviceId,
        simple_trigger: {
          type: 'device_trigger',
          on: 'device_disconnected',
          device_id: deviceId,
        },
      };

      const errorTriggerPayload = {
        name: `errortrigger-${deviceId}`,
        device_id: deviceId,
        simple_trigger: {
          type: 'device_trigger',
          on: 'device_error',
          device_id: deviceId,
        },
      };

      const dataTriggerPayload = {
        name: `datatrigger-${deviceId}`,
        device_id: deviceId,
        simple_trigger: {
          type: 'data_trigger',
          on: 'incoming_data',
          interface_name: '*',
          value_match_operator: '*',
          match_path: '/*',
        },
      };

      astarteClient
        .registerVolatileTrigger(roomName, connectionTriggerPayload)
        .then(() => {
          sendInfoMessage('Watching for device connection events');
        })
        .catch(() => {
          sendErrorMessage("Coulnd't watch for device connection events");
        });

      astarteClient
        .registerVolatileTrigger(roomName, disconnectionTriggerPayload)
        .then(() => {
          sendInfoMessage('Watching for device disconnection events');
        })
        .catch(() => {
          sendErrorMessage("Coulnd't watch for device disconnection events");
        });

      astarteClient
        .registerVolatileTrigger(roomName, errorTriggerPayload)
        .then(() => {
          sendInfoMessage('Watching for device error events');
        })
        .catch(() => {
          sendErrorMessage("Coulnd't watch for device error events");
        });

      astarteClient
        .registerVolatileTrigger(roomName, dataTriggerPayload)
        .then(() => {
          sendInfoMessage('Watching for device data events');
        })
        .catch(() => {
          sendErrorMessage("Coulnd't watch for device data events");
        });
    })
    .catch(() => {
      sendErrorMessage(`Couldn't join device ${deviceId} room`);
    });
}

function leaveDeviceRoom() {
  astarteClient.joinedRooms.forEach((room) => {
    astarteClient.leaveRoom(room);
  });
}

function loadPage(page) {
  const elem = document.getElementById('react-page');
  if (elem) {
    reactHistory.push({ pathname: page.url });
    return;
  }

  const pageNode = document.getElementById('inner-page');

  if (!pageNode) {
    setTimeout(() => {
      loadPage(page);
    }, 100);
    return;
  }

  const node = document.createElement('div');
  node.id = 'react-page';
  pageNode.appendChild(node);

  reactHistory = createBrowserHistory();

  const reactApp = getReactApp(
    reactHistory,
    astarteClient,
    sessionManager,
    dashboardConfig,
    noMatchFallback,
  );
  ReactDOM.render(reactApp, document.getElementById('react-page'));
}

function clearReact() {
  const elem = document.getElementById('react-page');
  if (elem) {
    elem.remove();
  }
}

$.getJSON('/user-config/config.json', (result) => {
  dashboardConfig = result;
}).always(() => {
  sessionManager = new SessionManager(dashboardConfig);

  const parameters = {
    config: dashboardConfig,
    previousSession: JSON.stringify(sessionManager.getSession()),
  };

  // init app
  app = elmApp.init({ flags: parameters });

  const conf = sessionManager.getConfig();
  astarteClient = new AstarteClient({
    realmManagementUrl: conf.realmManagementApiUrl,
    appengineUrl: conf.appEngineApiUrl,
    pairingUrl: conf.pairingApiUrl,
    flowUrl: conf.flowApiUrl,
    enableFlowPreview: conf.enableFlowPreview,
    onSocketError: () => {
      sendErrorMessage('Astarte channels communication error');
    },
    onSocketClose: () => {
      sendErrorMessage('Lost connection with the Astarte channel');
    },
  });

  if (sessionManager.isUserLoggedIn) {
    astarteClient.setCredentials(sessionManager.getCredentials());
  }

  // TODO use TargetEvent API or custom
  // events library
  sessionManager.onSessionChange = (newSession) => {
    app.ports.onSessionChange.send(newSession);

    astarteClient.setCredentials({
      token: newSession ? newSession.api_config.token : '',
      realm: newSession ? newSession.api_config.realm : '',
    });
  };

  /* begin Elm ports */
  app.ports.loadReactPage.subscribe(loadPage);
  app.ports.unloadReactPage.subscribe(clearReact);
  app.ports.leaveDeviceRoom.subscribe(leaveDeviceRoom);

  app.ports.listenToDeviceEvents.subscribe(watchDeviceEvents);

  app.ports.isoDateToLocalizedString.subscribe((taggedDate) => {
    if (taggedDate.date) {
      const convertedDate = new Date(taggedDate.date);
      app.ports.onDateConverted.send({
        name: taggedDate.name,
        date: convertedDate.toLocaleString(),
      });
    }
  });
  /* end Elm ports */
});
