/**
 * @module bp
 */

'use strict';

const wait      = require('util').promisify(setTimeout);
const Account   = require('core/account');
const transport = require('core/transport');
const pool      = require('core/pool');
const genesis   = require('core/genesis');

/**
 * Block producing timeout.
 *
 * @type {Number}
 */
const TIMEOUT = 1000;

const producer = Account();

console.log('producer address', '0x' + producer.address.toString('hex'));
console.log('producer public key', '0x' + producer.publicKey.toString('hex'));

(async function main(parentBlock) {

    const transactions = await pool.getAll();
    await pool.drain();

    const block = producer.produceBlock(parentBlock, transactions);

    // console.log('block', block);

    transport.send(block);

    return wait(TIMEOUT).then(() => main(block));

})(genesis);


(async function txGenerator() {

    const target       = Account();
    const serializedTx = producer.tx('0x' + target.address.toString('hex'), '0xff');

    return pool.add(serializedTx)
        .then(() => wait(TIMEOUT / 4))
        .then(() => txGenerator());

})();
