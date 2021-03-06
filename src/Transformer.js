'use strict';

const fs = require('fs');

const moment = require('moment');

/**
 * Parses JSON data and transforms it to readable xml
 *
 * @class Transformer
 */
class Transformer {
	constructor() {
		this.unimportantColumns = ['fach', 'raum', 'vertreter'];
		this.styleSheet = fs.readFileSync('./src/util/style.css', { encoding: 'UTF-8' });
		this.additionalHTML = fs.readFileSync('./src/util/additionalHTML.html', { encoding: 'UTF-8' });

		this.style = {
			headerCount: 7,
		};
	}

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
		const headers = this.extractHeaders(table);
		const subs = this.extractSubs(table);

		date.locale('de');
		lastEdited.locale('de');

		let style = '<style type="text/css">';
		// Dynamically adjust width of table headers
		style += this.styleSheet.replace('_headerCount_', '' + (1 / this.style.headerCount) + '%')
		.replace('__headerCount__', '' + (1 / (this.style.headerCount - this.unimportantColumns.length)) + '%');
		style += '</style>';


		let html = `${style}<h2 style="text-align: center; margin-top: 5px">${date.format('dddd, D. MMMM YYYY')}</h2>`;
		html += this.additionalHTML;

		html += '<table class="vplan"><tbody><tr>';

		html += headers;
		html += subs;

		html += '</tr></tbody></table><br><br>';
		html += `<p>Zuletzt geändert: ${lastEdited.format('LLLL')}</p>`;

		this.style = {
			headerCount: 7,
		};
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
		this.style.headerCount = headers.length;

		for (let header of headers) {
			const attributes = [
				this.unimportantColumns.includes(header.toLowerCase()) ? 'class="unimportant"' : '',
			];

			output += `<th ${attributes.join(' ')}>${header}</th>`;
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
				const attributes = [this.unimportantColumns.includes(content) ? 'class="unimportant"' : ''];

				output += `<td ${attributes.join(' ')}>${text}</th>`;
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
