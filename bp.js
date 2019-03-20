/**
 * @module bp
 */

'use strict';

const wait      = require('util').promisify(setTimeout);
const Account   = require('core/account');
const transport = require('core/transport');
const pool      = require('core/pool');
const chaindata = require('core/chaindata');
const events    = require('lib/events');

/**
 * Block producing timeout.
 *
 * @type {Number}
 */
const TIMEOUT = 1000;

const producer = Account();

console.log('producer', {address: '0x' + producer.address.toString('hex'), publicKey: '0x' + producer.publicKey.toString('hex')});

require('client/observer');

(async function newBlock() {

    const parentBlock  = await chaindata.getLatest();
    const transactions = await pool.getAll();

    await pool.drain();

    const block = producer.produceBlock(parentBlock, transactions);

    await chaindata.add(block);

    console.log('new block', block);

    transport.send(events.NEW_BLOCK, block);

    return wait(TIMEOUT).then(newBlock);

})();


(async function newTx() {

    const target       = Account();
    const serializedTx = producer.tx('0x' + target.address.toString('hex'), '0xff');

    await transport.send(events.NEW_TRANSACTION, serializedTx);

    return wait(TIMEOUT / 4).then(newTx);
})();
