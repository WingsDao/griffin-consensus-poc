/**
 * Block Producer client.
 *
 * @module core/block-producer
 */

'use strict';

const BlockProducer = require('core/account');
const transport     = require('core/transport');
const pool          = require('core/pool');
const chaindata     = require('core/chaindata');
const events        = require('lib/events');

/**
 * Number of random number needed to get final random number.
 *
 * @type {Number}
 */
const N_RANDOM_NUMBERS = 2;

/**
 * Delegates group name.
 *
 * @type {String}
 */
const DELEGATES_GROUP = 'delegates';

/**
 * Random numbers received from delegates.
 *
 * @type {Array}
 */
const randomNumbers = [];

const secretKey     = '';
const blockProducer = BlockProducer(secretKey);

(async function test() {

    // get certain number of random numbers

    if (randomNumbers.length >= N_RANDOM_NUMBERS) {
        // get certificate hash from random number

        const parentBlock  = await chaindata.getLatest();

        // check whether its hash corresponds to one of owned certificates
        // QUESTION how to get certificate hash from number?

        const transactions = await pool.getAll();

        const block = blockProducer.produceBlock(parentBlock, transactions);

        transport.send({type: events.NEW_BLOCK, data: JSON.stringify(block)}, DELEGATES_GROUP);
    }

})();
