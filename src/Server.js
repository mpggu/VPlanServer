'use strict';

const EventEmitter = require('events');

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const config = require('../config.json');


class Server extends EventEmitter {
  constructor(port) {
    super();
    this.app = express();
    this.port = port;

    this.setup();
  }

  setup() {
    this.app.use(morgan('dev'));
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());

    this.initServer();

    this.app.listen(this.port, () => {
      this.emit('ready');
    });
  }

  initServer() {
    this.app.all('/*', (req, res, next) => {
      // CORS headers
      res.header('Access-Control-Allow-Origin', req.get('Origin'));
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Access-Token,X-Key');
      res.header('Access-Control-Allow-Credentials', 'true');

      next();
    });

    this.app.post('/api/v1/vplan', (req, res) => {
      if (!req.body) return res.sendStatus(400);
      // Implement more secure auth if api made public
      if (req.headers.authorization !== config.auth) return res.sendStatus(403);

      this.emit('newPlan', req.body.vplan);
      return res.sendStatus(200);
    });
  }
}

module.exports = Server;
