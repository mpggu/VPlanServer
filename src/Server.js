'use strict';

const EventEmitter = require('events');

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const config = require('../config.json');


class Server extends EventEmitter {
  /**
   * Creates an instance of Server which will server a RESTful API to receive new plans or hand them out.
   * @param {number} port What port to run the server on.
   * @param {Object} main A reference to the main instance
   * @memberOf Server
   */
  constructor(port, main) {
    super();
    this.main = main;
    this.app = express();
    this.port = port;

    this.setup();
  }

  /**
   * Creates a write stream for morgan, the http request logger middleware, to use.
   *
   * @returns {fs.WriteStream} The created writable stream
   *
   * @memberOf Server
   */
  createWriteStream() {
    const filePath = path.join(__dirname, '../logs/access.log');

    try {
      fs.accessSync(filePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        fs.openSync(filePath, 'wx');
      } else {
        throw err;
      }
    }
    return fs.createWriteStream(filePath, { flags: 'a' });
  }

  /**
   * Sets up the middleware for the express server and starts it
   *
   *
   * @memberOf Server
   */
  setup() {
    const stream = this.createWriteStream();
    this.app.use(morgan('combined', { stream }));
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());

    this.initServer();

    this.app.listen(this.port, () => {
      this.emit('ready');
    });
  }

  /**
   * Initialises the routes of the server
   *
   *
   * @memberOf Server
   */
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

    this.app.get('/api/v1/vplan/today', (req, res) => {
      const today = this.main.plans.today;
      if (!today) {
        return res.json(null);
      }

      res.json({
        data: today.table,
        date: today.date.format('X'),
        lastEdited: today.lastEdited.format('X'),
      });
    });

    this.app.get('/api/v1/vplan/tomorrow', (req, res) => {
      const tomorrow = this.main.plans.tomorrow;
      if (!tomorrow) {
        return res.json(null);
      }

      res.json({
        data: tomorrow.table,
        date: tomorrow.date.format('X'),
        lastEdited: tomorrow.lastEdited.format('X'),
      });
    });
  }
}

module.exports = Server;
