/**
 * @module core/pool
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const prom = require('util').promisify;

/**
 * Directory where local/chain data is stored
 * ENV: DATADIR
 *
 * @default data
 * @type {String}
 */
const DATADIR = process.env.DATADIR || 'data';

/**
 * Name of the file where pool is stored
 * ENV: POOL_FILENAME
 *
 * @type {String}
 */
const FILENAME = process.env.POOL_FILENAME || 'pool';

/**
 * Full path (joined DIRNAME and FILENAME)
 *
 * @type {String}
 */
const PATH = path.join(DATADIR, FILENAME);

/**
 * File descriptor for open pool
 *
 * @type {Number}
 */
const fd = fs.openSync(PATH, 'a+');

/**
 * Append data to file
 *
 * @param  {String|Buffer} data TX to append
 * @return {Promise}
 */
exports.add = function add(data) {
    return prom(fs.write)(fd, data.toString() + '\n');
};

/**
 * Remove transactions from pool
 *
 * @param  {Array}   [toRem=[]] Array of transactions to remove
 * @return {Promise}
 */
exports.remove = function remove(toRem = []) {
    if (toRem.constructor !== Array) {
        toRem = [toRem];
    }

    return exports.getAll()
        .then((txs) => new Set(txs))
        .then((set) => toRem.map((e) => set.delete(e)) && Array.from(set))
        .then((res) => prom(fs.writeFile)(PATH, res.join('\n')));
};

/**
 * Get all the transactions in pool
 *
 * @return {Promise<Array>}
 */
exports.getAll = function getAll() {
    return prom(fs.readFile)(PATH).then((data) => data.toString().split('\n').slice(0, -1));
};

/**
 * Empty pool. Clear file contents
 *
 * @return {Promise}
 */
exports.drain = function drainPool() {
    return prom(fs.truncate)(PATH);
};

/**
 * Stat pool file. Null returned when there's no file
 *
 * @return {Promise<?fs.Stat>} File stats
 */
exports.stat = function stat() {
    return prom(fs.stat)(path.join(DATADIR, FILENAME))
        .catch((err) => {
            if (err.code === 'ENOENT') { return null; }
            throw err;
        });
};
