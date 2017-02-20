'use strict';

const Transformer = require('./Transformer');
const Server = require('./Server');
const VPlan = require('vplanparser');
const wordpress = require('wordpress');
const moment = require('moment');

const config = require('../config.json');


class Main {
  constructor(port = 6767) {
    this.server = new Server(port);
    this.transformer = new Transformer();
    this.wpClient = wordpress.createClient({
      url: config.wpURL,
      username: config.wpUsername,
      password: config.wpPassword,
    });

    this.server.once('ready', this.onReady.bind(this));
    this.server.on('newPlan', this.onNewPlan.bind(this));

    moment.locale('de');
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

    const wpHTML = this.transformer.convertToHTML(vplan);

    log.info(`New substitution plan: ${date.format('LLLL')}`);
    // Instantly syncs new plan, TODO: Cron this
    this.editVPlanPost(wpHTML);
  }
}

module.exports = Main;
