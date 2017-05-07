'use strict';

const Raven = require('raven');

let config;
try {
	config = require('./config.json');
} catch (err) {
	throw new Error("Couldn't find the configuration file. Please edit config.json according to config.json.example");
}

Raven.config(config.sentryDNS).install();

global.log = require('./src/util/Logger');

new (require('./src/Main'))(config.port);
