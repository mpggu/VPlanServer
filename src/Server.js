'use strict';

const EventEmitter = require('events');

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const rfs = require('rotating-file-stream');

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
		const logDir = path.join(__dirname, '../logs/access');

		return rfs('access.log', {
			interval: '1d',
			path: logDir,
		});
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
		this.app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
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
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
			res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Access-Token,X-Key');
			res.header('Access-Control-Allow-Credentials', 'true');

			const referrer = req.headers.referer || req.headers.referrer;
			if (referrer.includes('yandex') return res.sendStatus(403);

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

		this.app.get('/api/v1/vplan/today/:course', (req, res) => {
			const today = this.main.plans.today;
			const course = req.params.course;

			if (!today) {
				return res.json(null);
			}

			if (!course || (course && req.params.course.length > 4)) {
				return res.sendStatus(400);
			}

			res.json({
				data: today.search('klasse', course),
				date: today.date.format('X'),
				lastEdited: today.lastEdited.format('X'),
			});
		});

		this.app.get('/api/v1/vplan/tomorrow/:course', (req, res) => {
			const tomorrow = this.main.plans.tomorrow;
			const course = req.params.course;

			if (!tomorrow) {
				return res.json(null);
			}

			if (!course || (course && req.params.course.length > 4)) {
				return res.sendStatus(400);
			}

			res.json({
				data: tomorrow.search('klasse', course),
				date: tomorrow.date.format('X'),
				lastEdited: tomorrow.lastEdited.format('X'),
			});
		});
	}
}

module.exports = Server;
