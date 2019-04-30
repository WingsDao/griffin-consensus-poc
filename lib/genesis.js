/**
 * Configurable genesis.
 *
 * @module lib/genesis
 */

'use strict';

const fs      = require('fs');
const helpers = require('lib/helpers');

module.exports = Genesis;

/**
 * Default path where to save genesis file.
 *
 * @type {String}
 */
const DEFAULT_PATH = 'genesis.json';

/**
 * The first block in blockchain.
 *
 * @class Genesis
 */
function Genesis() {
    if (!new.target) {
        return new Genesis();
    }

    Object.defineProperties(this, {
        number: {value: 0, writable: true, enumerable: true},
        hash: {value: '0x0000000000000000000000000000000000000000000000000000000000000000', writable: true, enumerable: true},
        parentHash: {value: '0x0000000000000000000000000000000000000000000000000000000000000000', writable: true, enumerable: true},
        timestamp: {value: '0x00', writable: true, enumerable: true},
        producer: {value: '0x0000000000000000000000000000000000000000', writable: true, enumerable: true},
        alloc: {value: [], writable: true, enumerable: true}
    });
}

/**
 * Generate state for genesis block.
 *
 * @param   {Object} genesis Process genesis block allocation data and generate initial state.
 * @returns {Object}         Genesis block with state.
 */
Genesis.genesisToBlock = function genesisToBlock(genesis) {
    genesis.state = [];

    for (const allocObject of genesis.alloc) {
        const address          = Object.keys(allocObject)[0];
        const allocatedAccount = allocObject[address];

        const account = helpers.emptyAccount(address);

        Object.assign(account, {
            locked:       allocatedAccount.locked  || 0,  
            balance:      allocatedAccount.balance || 0,
            votes:        allocatedAccount.votes   || []
        });

        genesis.state.push(account);
    }

    return genesis;
};

/**
 * Add account with allocated certificates.
 *
 * @param {String} address       Account address.
 * @param {Number} nCertificates Number of certificates to generate.
 */
Genesis.prototype.addProducer = function addProducer(address, locked) {
    return this.writeOrExtend(address, {
        [address]: {
            locked,
            balance: locked
            // certificates: Array.apply(null, {length: nCertificates}).map(() => '0x' + rb(32).toString('hex')),
            // balance: 0 // TODO: find out whether this line is required
        }
    });
};

/**
 * Add account with allocated votes.
 *
 * @param {String} address Account address.
 * @param {Number} balance Balance (i.e. voting power).
 */
Genesis.prototype.addDelegate = function addDelegate(address, balance) {
    return this.writeOrExtend(address, {
        [address]: {votes: [address], balance}
    });
};

/**
 * Add account with balance.
 *
 * @param {String} address Account address.
 * @param {Number} balance Amount of coins to allocate.
 */
Genesis.prototype.addAccount = function addAccount(address, balance) {
    return this.writeOrExtend(address, {[address]: {balance}});
};

/**
 * Save genesis to file.
 *
 * @param {String} [path=DEFAULT_PATH] Where to save the file.
 */
Genesis.prototype.writeToFile = function writeToFile(path = DEFAULT_PATH) {
    fs.writeFileSync(path, JSON.stringify(this, null, 4));
};

/**
 * Extend existing record with new data or write new record.
 *
 * @param  {String} address     Address to work with
 * @param  {Object} allocObject Object to write or extend with
 * @return {Object}             This instance
 */
Genesis.prototype.writeOrExtend = function extend(address, allocObject) {
    const existing = this.alloc.find((el) => Object.keys(el).includes(address)) || null;

    return (existing === null)
        && this.alloc.push(allocObject)
        || Object.assign(existing[address], allocObject[address]);
};
