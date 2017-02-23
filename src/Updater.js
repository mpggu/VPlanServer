'use strict';

const moment = require('moment');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');

class Updater {

  /**
   * Creates an instance of Updater.
   * The updater handles timed updating of the substitution plan.
   * @param {Object} main A reference to the main class
   *
   * @prop {Object} main The reference to the main class
   * @memberOf Updater
   */
  constructor(main) {
    this.main = main;

    schedule.scheduleJob('* * 0 * * *', this.swapPlans.bind(this));
    this.tomorrowSchedule = null;
  }

  /**
   * Updates the internal plan references at 12am
   *
   * @private
   * @memberOf Updater
   */
  swapPlans() {
    log.debug('Swapping plans..');
    this.main.plans.today = this.main.plans.tomorrow;
    this.main.plans.tomorrow = null;
  }

  /**
   * Adds a new substitution plan to the queue.
   * Can be of either today or tomorrow.
   *
   * @param {Object} vplan The substitution plan to add to the queue
   * @returns {void}
   *
   * @memberOf Updater
   */
  addNewPlan(vplan) {
    const date = moment();
    const vplanDate = moment(vplan.date);

    if (vplanDate.date() === date.date()) {
      return this.handleToday(vplan, date);
    }

    if (vplanDate.date() >= date.date()) {
      return this.handleTomorrow(vplan, date);
    }

    log.warn(`VPlan is older than today: ${vplan.date}`);
  }

  /**
   * Creates a backup of the most recent substitution plans
   * today and tomorrow.
   *
   * @param {string} rawHTML The raw XML content of the original file
   * @param {string} day Either 'today' or 'tommorow'
   * @returns {Promise} Resolves on success
   *
   * @private
   * @memberOf Updater
   */
  backupPlan(rawHTML, day) {
    return new Promise((res, rej) => {
      fs.writeFile(path.join(__dirname, `../plans/${day}.html`), rawHTML, err => {
        if (err) {
          rej(err);
        }
        log.debug(`Backed up VPlan (${day})`);
        res();
      });
    });
  }

  /**
   * Uploads a plan directly to WordPress
   *
   * @param {Object} vplan The substitution plan object to upload to WordPress
   *
   * @private
   * @memberOf Updater
   */
  uploadPlan(vplan) {
    const wpHTML = this.main.transformer.convertToHTML(vplan);
    this.main.editVPlanPost(wpHTML)
    .then(() => log.info(`Uploaded new plan: ${vplan.date}`))
    .catch(log.error);
  }

  /**
   * Handles the vplan if it's from today.
   * Backs up the plan and uploads it
   * if the clock didn't strike config.scheduledUploads.
   *
   * @param {Object} vplan The substitution plan to handle
   * @param {Date} date The current date
   * @returns {void}
   *
   * @private
   * @memberOf Updater
   */
  handleToday(vplan, date) {
    this.backupPlan(vplan.raw, 'today')
    .catch(log.error);
    this.main.plans.today = vplan;
    if (date.hour() >= this.config.scheduledUploads) {
      return;
    }
    this.uploadPlan(vplan);
  }

  /**
   * Handles the vplan if it's from tomorrow.
   * Backs up the plan and puts it in the upload queue.
   * Uploads instantly if the clock stroke 3pm.
   *
   * @param {Object} vplan The substitution plan to handle
   * @param {Date} date The current date
   * @returns {void}
   *
   * @private
   * @memberOf Updater
   */
  handleTomorrow(vplan, date) {
    this.backupPlan(vplan.raw, 'tomorrow')
    .catch(log.error);
    this.main.plans.tomorrow = vplan;

    if (this.tomorrowSchedule) {
      clearTimeout(this.tomorrowSchedule);
      this.tomorrowSchedule = null;
    }

    if (date.hour() >= this.config.scheduledUploads) {
      return this.uploadPlan(vplan);
    }

    const timeToUpload = new Date();
    timeToUpload.setHours(this.config.scheduledUploads);

    this.tomorrowSchedule = setTimeout(() => {
      this.uploadPlan(vplan);
    }, timeToUpload - (new Date()));
  }
}

module.exports = Updater;
