'use strict';

let config;
try {
	config = require('./config.json');
} catch(err) {
	throw new Error("Couldn't find the configuration file. Please edit config.json according to config.json.example");
}

global.log = require('./src/util/Logger');

new (require('./src/Main'))(config.port);
