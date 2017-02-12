'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const EventEmitter = require('events');

const config = require('../config.json');


class Server extends EventEmitter {
  constructor(port) {
    super();
    this.app = express();
    this.port = port;

    this.setup();
  }

  setup() {
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());

    this.initRoutes();

    this.app.listen(this.port, () => {
      this.emit('ready');
    });
  }

  initRoutes() {
    this.app.post('/vplan', (req, res) => {
      if (!req.body) return res.sendStatus(400);
      // Implement more secure auth in the future, this is just here for testing purposes
      if (!req.body.auth || req.body.auth !== config.auth) return res.sendStatus(403);

      this.emit('newPlan', req.body.vplan);
      return res.sendStatus(200);
    });
  }
}

module.exports = Server;
