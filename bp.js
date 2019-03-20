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

require('client/observer');

(async function newBlock() {

    const parentBlock  = await chaindata.getLatest();
    const transactions = await pool.getAll();

    await pool.drain();

    const block = producer.produceBlock(parentBlock, transactions);

    await chaindata.add(block);

    transport.send({type: events.NEW_BLOCK, data: JSON.stringify(block)});

    return wait(TIMEOUT).then(newBlock);

})();


(async function newTx() {

    const target       = Account();
    const serializedTx = producer.tx('0x' + target.address.toString('hex'), '0xff');

    console.log('sender', '0x' + producer.address.toString('hex'));
    console.log('receiver', '0x' + target.address.toString('hex'));

    await transport.send({type: events.NEW_TRANSACTION, data: serializedTx});

    return wait(TIMEOUT / 4).then(newTx);

})();
