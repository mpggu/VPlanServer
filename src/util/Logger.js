'use strict';

const moment = require('moment');
const chalk = new (require('chalk')).constructor({ enabled: true });
const fs = require('fs');
const path = require('path');

const Colors = {
  cyan: chalk.bold.cyan,
  green: chalk.bold.green,
  error: chalk.bgRed.black,
  blue: chalk.bold.blue,
  warn: chalk.bgYellow.black,
  magenta: chalk.bold.magenta,
  red: chalk.bold.red,
};

module.exports = new (class Logger {
  /**
   * Creates an instance of Logger.
   * @param {boolean} debug Whether to display warnings
   */
  constructor(debug = false) {
    this.shouldDebug = debug;
  }

  /**
   * Formats the current date
   *
   * @readonly
   * @private
   */
  get date() {
    return `[${moment().format('DD.MM HH:mm:ss')}]`;
  }

  /**
   * Checks, whether a file exists or not and creates it if it doesn't
   *
   * @param {string} filePath The file to check for
   */
  createFileIfInexistend(filePath) {
    try {
      fs.accessSync(filePath);
    } catch (err) {
      fs.openSync(filePath, 'wx');
    }
  }

  /**
   * Writes the log to a file and STDOUT
   *
   * @param {string} type Either 'info', 'error', 'warn' or 'debug'
   * @param {string} message What to log (formatted)
   * @param {string} raw What to log (raw)
   * @private
   */
  log(type, message, raw) {
    message = `${this.date} ${message}`;
    raw = `${this.date} ${raw}\n`;

    if (!['debug', 'warn'].includes(type) || this.shouldDebug) {
      // eslint-disable-next-line no-console
      console.log(message);
    }

    const filePath = path.join(__dirname, `../../logs/console/${moment().format('YYYY_MM_DD')}.log`);
    this.createFileIfInexistend(filePath);
    fs.appendFileSync(filePath, raw);
  }

  /**
   * Logs a message of type 'info'
   *
   * @param {string} message What to log
   */
  info(message) {
    this.log('info', Colors.green(message), message);
  }

  /**
   * Logs a message of type 'debug'
   *
   * @param {string} message What to log
   */
  debug(message) {
    this.log('debug', Colors.cyan(message), message);
  }

  /**
   * Logs a message of type 'error'
   *
   * @param {string} message What to log
   */
  error(message) {
    this.log('error', Colors.error(message), message);
  }

  /**
   * Logs a message of type 'warn'
   *
   * @param {string} message What to log
   */
  warn(message) {
    this.log('warn', Colors.warn(message), message);
  }
})();
