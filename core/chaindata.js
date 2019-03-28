/**
 * @module core/chaindata
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const prom    = require('util').promisify;
const genesis = require('genesis.json');

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
 * ENV: CHAINDATA_FILENAME
 *
 * @type {String}
 */
const FILENAME = exports.FILENAME = process.env.CHAINDATA_FILENAME || 'chain_' + require('crypto').randomBytes(2).toString('hex');

/**
 * Full path (joined DIRNAME and FILENAME)
 *
 * @type {String}
 */
const PATH = path.resolve(path.join(DATADIR, FILENAME));

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
    if (data.constructor === Object) {
        data = JSON.stringify(data);
    }

    return prom(fs.write)(fd, data.toString() + '\n');
};

/**
 * Get all the transactions in pool
 *
 * @return {Promise<Array>}
 */
exports.getAll = function getAll() {
    return prom(fs.readFile)(PATH).then((data) => [genesis].concat(data.toString().split('\n').slice(0, -1).map(JSON.parse)));
};

/**
 * Get block by number
 *
 * @param  {Number}           number Number of block to get
 * @return {Promise<?Object>}        Requested block or null
 */
exports.getBlock = function getBlock(number) {
    return exports.getAll().then((blocks) => blocks[number]);
};

/**
 * Get latest block
 *
 * @return {Promise<?Object>} Latest block or null
 */
exports.getLatest = function getLatestBlock() {
    return exports.getAll().then((blocks) => blocks[blocks.length - 1]);
};

/**
 * Stat pool file. Null returned when there's no file
 *
 * @return {Promise<?fs.Stat>} File stats
 */
exports.stat = function stat() {
    return prom(fs.stat)(PATH)
        .catch((err) => {
            if (err.code === 'ENOENT') { return null; }
            throw err;
        });
};

/**
 * Create stream.Readable to chaindata
 *
 * @return {stream.Readable} Readable stream with file contents
 */
exports.createReadableStream = function createReadableStream() {
    return fs.createReadStream(PATH);
};

/**
 * Create stream.Writable to chaindata
 *
 * @param  {Boolean}         [append=true] Whether append-only mode (true) or to rewrite (false)
 * @return {stream.Writable}               Writable stream
 */
exports.createWritableStream = function createWritableStream(append = true) {
    return fs.createWriteStream(PATH, {flags: append && 'a+' || 'w'});
};
