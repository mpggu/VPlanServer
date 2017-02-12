'use strict';

const Transformer = require('./Transformer');
const Server = require('./Server');
const VPlanParser = require('../../VPlanParser/src/VPlanParser');
const wordpress = require('wordpress');

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
  }

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

  onReady() {
  }

  onNewPlan(vplan) {
    const parsedObject = new VPlanParser(vplan).table;
    const wpHTML = this.transformer.convertToHTML(parsedObject);

    // Instantly syncs new plan, TODO: Cron this
    this.editVPlanPost(wpHTML);
  }
}

module.exports = Main;
