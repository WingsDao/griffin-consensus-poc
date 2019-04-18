/**
 * @module core/db
 */

'use strict';

const path      = require('path');
const util      = require('util');
const stream    = require('stream');
const levelup   = require('levelup');
const leveldown = require('leveldown');
const genesis   = require(process.env.GENESIS_PATH || 'genesis.json');

/**
 * Data directory for client
 *
 * ENV: datadir
 * @default 'data'
 * @type {String}
 */
const DATADIR = process.env.DATADIR || 'data';

const CHAIN  = 'chain';
const POOL   = 'pool';

/**
 * @desc Base class for DataBases
 */
class DB {

    /**
     * @param {String} name Name of the database (also name of the folder in DATADIR)
     */
    constructor(name) {
        const db = levelup(leveldown(path.join(DATADIR, name)));

        Object.defineProperty(this, 'name', {value: name});
        Object.defineProperty(this, 'db',   {value: db});
    }

    /**
     * Get values stream
     *
     * @return {stream.Readable}
     */
    createReadStream() {
        return this.db.createValueStream();
    }

    /**
     * Destroy database by it's name
     *
     * @param  {String}  name Name of the database to destroy
     * @return {Promise}      Promise that's resolved on destruction end
     */
    destroy() {
        return this.db
            .close()
            .then(() => util.promisify(leveldown.destroy.bind(leveldown))(path.join(DATADIR, this.name)))
            .then(() => this.db.open());
    }
}

/**
 * @desc Pool logic class
 */
class Pool extends DB {

    /**
     * Add transaction to the pool
     *
     * @param {String} tx Transaction to store
     */
    add(tx) {
        return this.db.put(tx, tx);
    }

    /**
     * Get all transactions from pool
     *
     * @return {Promise.<String[]>} Array of transactions in Promise
     */
    getAll() {
        const stream = this.db.createValueStream();
        return new Promise((resolve, reject) => {
            const res = [];
            stream.on('data',  (tx) => res.push(tx.toString()));
            stream.on('end',   ()   => resolve(res));
            stream.on('error', reject);
        });
    }

    /**
     * Get all transactions and destroy pool
     *
     * @return {Promise} Promise with all the transactions
     */
    async drain() {
        const txs = await this.getAll();
        await this.destroy();
        return txs;
    }

    /**
     * Create stream to write data into pool
     *
     * @return {stream.Writable} Writable stream
     */
    createWriteStream() {
        const writeStream = new stream.Writable({
            write(chunk, encoding, cb) {
                const tx = chunk.toString();
                return this.db.put(tx, tx).then(() => cb(null, tx));
            }
        });

        return writeStream;
    }
}

/**
 * @desc Chain logic class
 */
class Chain extends DB {

    /**
     * Add new block into chaindata
     *
     * @param {Number} number Number of the block
     * @param {String} block  Block to store
     */
    add(number, block) {
        return this.db.put(number, block);
    }

    /**
     * Get block by it's number
     *
     * @param  {Number}  number Number of the block to get
     * @return {Promise}        Promise with parsed block
     */
    getBlock(number) {
        return (number === 0)
            && Promise.resolve(genesis)
            || getOrNull(this.db, number);
    }

    /**
     * Get latest block stored.
     * Implementation is tricky, so be careful with this method.
     *
     * @return {Promise} Promise with latest block or genesis
     */
    getLatest() {
        return new Promise((resolve, reject) => {
            return this.db
                .iterator({reverse: true, limit: 1})
                .next((err, key, value) => {
                    return (err)
                        && reject(err)
                        || resolve(value && JSON.parse(value.toString()) || genesis);
                });
        });
    }

    /**
     * Create a stream to write data into chain.
     *
     * @return {stream.Writable} Writable stream
     */
    createWriteStream() {
        const writeStream = new stream.Writable({
            write(chunk, encoding, cb) {
                const string = chunk.toString();
                const number = JSON.parse(string).number;

                return this.db.put(number, string).then(() => cb(null, string));
            }
        });

        return writeStream;
    }
}

// Export storages
exports.chain = new Chain(CHAIN);
exports.pool  = new Pool(POOL);

// Export classes
exports.Chain = Chain;
exports.Pool  = Pool;
exports.DB    = DB;

/**
 * Get value from database and parse it or return null
 *
 * @param  {Object}            db  Leveldb instance
 * @param  {String}            key Key to get from database
 * @return {Promise.<?Object>}     Parsed JSON or null when no value
 */
async function getOrNull(db, key) {
    return db.get(key).then((res) => JSON.parse(res.toString())).catch(() => null);
}
