/**
 * Configurable genesis.
 *
 * @module
 */

'use strict';

const rb = require('crypto').randomBytes;

module.exports = Genesis;

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
        number: {value: 0, writable: true},
        hash: {value: '0x0000000000000000000000000000000000000000000000000000000000000000', writable: true},
        parentHash: {value: '0x0000000000000000000000000000000000000000000000000000000000000000', writable: true},
        timestamp: {value: '0x00', writable: true},
        producer: {value: '0x0000000000000000000000000000000000000000', writable: true},
        alloc: {value: [], writable: true}
    });
}

/**
 * Add account with allocated certificates.
 *
 * @param {String} address       Account address.
 * @param {Number} nCertificates Number of certificates to generate.
 */
Genesis.prototype.addProducer = function addProducer(address, nCertificates) {
    const allocObject = {};

    allocObject[address] = {
        certificates: Array.apply(null, {length: nCertificates}).map(() => '0x' + rb(32).toString('hex')),
        balance: 0
    };

    this.alloc.push(allocObject);
};

/**
 * Add account with allocated votes.
 *
 * @param {String} address Account address.
 * @param {Number} balance Balance (i.e. voting power).
 */
Genesis.prototype.addDelegate = function addDelegate(address, balance) {
    const allocObject = {};

    allocObject[address] = {
        votes: [address],
        balance
    };

    this.alloc.push(allocObject);
};

/**
 * Add account with balance.
 *
 * @param {String} address Account address.
 * @param {Number} balance Amount of coins to allocate.
 */
Genesis.prototype.addAccount = function addAccount(address, balance) {
    const allocObject = {};

    allocObject[address] = {balance};

    this.alloc.push(allocObject);
};
