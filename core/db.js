/**
 * @module core/db
 */

'use strict';

const path      = require('path');
const util      = require('util');
const stream    = require('stream');
const levelup   = require('levelup');
const leveldown = require('leveldown');

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

exports.chain = spawnChainDB();
exports.pool  = spawnPoolDB();

function spawnPoolDB() {
    const db = spawnDatabase(POOL);

    return {
        add(tx) {
            return db.put(tx, tx);
        },

        getAll() {
            const stream = db.createValueStream();
            return new Promise((resolve, reject) => {
                const res = [];
                stream.on('data',  (tx) => res.push(tx.toString()));
                stream.on('end',   ()   => resolve(res));
                stream.on('error', reject);
            });
        },

        async drain() {
            const txs = await this.getAll();
            await this.destroy();
            return txs;
        },

        createReadableStream() {
            return db.createValueStream();
        },

        createWritableStream() {
            const writeStream = new stream.Writable({
                write(chunk, encoding, cb) {
                    const tx = chunk.toString();
                    return db.put(tx, tx).then(() => cb(null, tx));
                }
            });

            return writeStream;
        },

        destroy() {
            return db.close().then(() => destroyDatabase(POOL)).then(() => db.open());
        }
    };
}

/**
 * @return {Object} leveldb instance
 */
function spawnChainDB() {
    const db      = spawnDatabase(CHAIN);
    const genesis = require(process.env.GENESIS_PATH || 'genesis.json');

    return {
        add(number, block) {
            return db.put(number, block);
        },

        getBlock(number) {
            return (number === 0)
                && Promise.resolve(genesis)
                || getOrNull(db, number);
        },

        getLatest() {
            return new Promise((resolve, reject) => {
                return db
                    .iterator({reverse: true, limit: 1})
                    .next((err, key, value) => {
                        return (err)
                            && reject(err)
                            || resolve(value && JSON.parse(value.toString()) || genesis);
                    });
            });
        },

        createReadableStream() {
            return db
                .createValueStream()
                .pipe(new stream.Transform({
                    transform(obj, enc, cb) {
                        cb(null, obj.toString());
                    }
                }));
        },

        createWritableStream() {
            const writeStream = new stream.Writable({
                write(chunk, encoding, cb) {
                    const string = chunk.toString();
                    const number = JSON.parse(string).number;

                    return db.put(number, string).then(() => cb(null, string));
                }
            });

            return writeStream;
        },

        destroy() {
            return db.close().then(() => destroyDatabase(CHAIN)).then(() => db.open());
        }
    };
}


/**
 * Create instance of database to work with
 *
 * @param  {String} name Name of the future database
 * @return {Object}      Levelup database
 */
function spawnDatabase(name) {
    return levelup(leveldown(path.join(DATADIR, name)));
}

/**
 * Destroy database by it's name
 *
 * @param  {String}  name Name of the database to destroy
 * @return {Promise}      Promise that's resolved on destruction end
 */
function destroyDatabase(name) {
    return util.promisify(leveldown.destroy.bind(leveldown))(path.join(DATADIR, name));
}

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
