'use strict';

const moment = require('moment');

/**
 * Parses JSON data and transforms it to readable xml
 *
 * @class Transformer
 */
class Transformer {
  /**
   * Converts the untis data to WordPress-ready html.
   *
   * @param {Object} data The table to transform, generated by 'VPlanParser'
   * @returns {string} Wordpress-ready transformed html
   *
   * @memberOf Transformer
   */
  convertToHTML(data) {
    const table = data.table;
    const date = moment(data.date);
    const lastEdited = moment(data.lastEdited);
    date.locale('de');
    lastEdited.locale('de');

    let html = `<h2 style="text-align: center; margin-top: 5px">${date.format('dddd, D. MMMM YYYY')}</h2>`;
    html += '<table class="vplan"><tbody><tr>';

    html += this.extractHeaders(table);
    html += this.extractSubs(table);

    html += '</tr></tbody></table><br><br>';
    html += `<p>Zuletzt geändert: ${lastEdited.format('LLLL')}</p>`;

    return html;
  }

  /**
   * Extracts the headers out of the parsed table object and
   * returns a WordPress-ready html
   *
   * @param {Object} table The parsed object table
   * @returns {string} The html for the headers
   *
   * @memberOf Transformer
   */
  extractHeaders(table) {
    const headers = Object.keys(table[0]).map(header => header[0].toUpperCase() + header.slice(1));

    let output = '';

    for (let header of headers) {
      output += `<th style="text-align: left; width: ${1 / headers.length}%">${header}</th>`;
    }

    output += '</tr>';
    return output;
  }

  /**
   * Extracts all of the substitutions out of the parsed table object and
   * returns a WordPress-ready html
   *
   * @param {Object} table The parsed object table
   * @returns {string} The html for the substitutions
   *
   * @memberOf Transformer
   */
  extractSubs(table) {
    let output = '';

    for (let i = 0; i < table.length; i++) {
      const sub = table[i];

      // Add border to separate years
      output += `<tr${this.isNextClass(sub, table[i + 1]) ? ' style="border-bottom: 2px solid #adadad"' : ''}>`;
      for (let content in sub) {
        // Bolden 'EVA' & 'fällt aus'
        const text = ['EVA', 'fällt aus'].includes(sub[content]) ? `<b>${sub[content]}</b>` : sub[content];
        output += `<td style="text-align: left">${text}</th>`;
      }

      output += '</tr>';
    }

    return output;
  }

  /**
   * Determines whether the next class in the table is a different grade
   *
   * @param {Object} class1 The current class in the table
   * @param {Object} class2 The next class in the table
   * @returns {boolean} Whether the next class in the table is different or not
   *
   * @memberOf Transformer
   */
  isNextClass(class1, class2) {
    if (!class2) return false;
    class1 = class1.klasse;
    class2 = class2.klasse;

    if (class1[0] === 'Q' && class1[1] !== class2[1]) {
      return true;
    }

    return class1[0] !== class2[0];
  }
}

module.exports = Transformer;
