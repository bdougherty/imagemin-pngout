'use strict';

var isPng = require('is-png');
var spawn = require('child_process').spawn;
var through2 = require('through2');
var pngout = require('pngout-bin').path;

/**
 * pngout imagemin plugin
 *
 * @param {Object} opts
 * @api public
 */

module.exports = function (opts) {
	opts = opts || {};

	return through2.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
		}

		if (file.isStream()) {
			cb(new Error('Streaming is not supported'));
			return;
		}

		if (!isPng(file.contents)) {
			cb(null, file);
			return;
		}

		var size = file.contents.length;
		var args = ['-', '-', '-y', '-force'];
		var err = '';
		var ret = [];
		var len = 0;

		if (typeof opts.strategy === 'number') {
			args.push('-s', opts.strategy);
		}

		var cp = spawn(pngout, args);

		cp.stderr.on('error', function(err) {
			cb(err);
		});

		cp.stderr.setEncoding('utf8');
		cp.stderr.on('data', function (data) {
			err += data;
		});

		cp.stdout.on('data', function (data) {
			ret.push(data);
			len += data.length;
		});

		cp.on('close', function (code) {
			if (code) {
				cb(new Error(err));
				return;
			}

			if (len < size) {
				file.contents = Buffer.concat(ret, len);
			}

			cb(null, file);
		});

		cp.stdin.end(file.contents);
	});
};
