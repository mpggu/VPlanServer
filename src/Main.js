'use strict';

const Transformer = require('./Transformer');
const Server = require('./Server');
const Updater = require('./Updater');

const VPlan = require('vplanparser');
const wordpress = require('wordpress');
const moment = require('moment');
const fs = require('fs');

const config = require('../config.json');


class Main {
  constructor(port = 6767) {
    this.server = new Server(port);
    this.transformer = new Transformer();
    this.updater = new Updater(this);
    this.config = config;
    this.wpClient = wordpress.createClient({
      url: config.wpURL,
      username: config.wpUsername,
      password: config.wpPassword,
    });

    this.plans = {
      today: null,
      tomorrow: null,
    };

    this.server.once('ready', this.onReady.bind(this));

    moment.locale('de');
  }

  /**
   * Restores the backup of an added plan and puts it back into the queue
   *
   * @returns {Promise} Resolves on success
   *
   * @memberOf Main
   */
  restoreBackup() {
    return new Promise((res, rej) => {
      fs.readFile('./plans/tomorrow.html', { encoding: 'UTF-8' }, (err, data) => {
        if (err) {
          return rej(err);
        }

        this.onNewPlan(data);
        return res();
      });
    });
  }

  /**
   * Gets the current content of the wordpress post containing the substitution plan
   *
   * @returns {Promise<string>} Resolves with the content
   *
   * @memberOf Main
   */
  getVPlanPost() {
    return new Promise((res, rej) => {
      this.wpClient.getPost(config.wpPageID, (err, post) => {
        if (err) {
          return rej(err);
        }
        return res(post);
      });
    });
  }

  /**
   * Edits the conrtent of the Wordpress post containing the substitution plan
   *
   * @param {string} content What to set the content of the post to
   * @returns {Promise} Resolved on success
   *
   * @memberOf Main
   */
  editVPlanPost(content) {
    return new Promise((res, rej) => {
      this.wpClient.editPost(config.wpPageID, { content }, (err) => {
        if (err) {
          log.error('Couldn\'t edit the WordPress post');
          return rej(err);
        }
        return res();
      });
    });
  }

  /**
   * Everything is ready!
   *
   * @memberOf Main
   */
  onReady() {
    log.info('Server ready!');

    this.restoreBackup();
    this.server.on('newPlan', this.onNewPlan.bind(this));
  }

  /**
   * What to do when a new substitution plan arrives
   *
   * @param {string} data The raw vplan xml string
   *
   * @memberOf Main
   */
  onNewPlan(data) {
    const vplan = new VPlan(data);
    const date = moment(vplan.date);
    date.locale('de');

    log.info(`New substitution plan POSTed: ${date.format('LLLL')}`);
    this.updater.addNewPlan(vplan);
  }
}

module.exports = Main;
