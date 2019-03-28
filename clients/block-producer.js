/**
 * Block Producer client.
 *
 * @module core/block-producer
 */

'use strict';

const events        = require('lib/events');
const helpers       = require('lib/helpers');
const pool          = require('core/pool');
const BlockProducer = require('core/account');
const transport     = require('core/transport');
const chaindata     = require('core/chaindata');
const blockchain    = require('core/blockchain');
const sync          = require('services/sync');


// QUESTION how are first blocks after genesis produced?

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
const DELEGATES_GROUP = exports.DELEGATES_GROUP = 'delegates';

/**
 * Random numbers received from delegates.
 *
 * @type {Array}
 */
const randomNumbers = [];

const secretKey     = '';
const blockProducer = BlockProducer(secretKey);


(async function init() {

    // Sync with other nodes if there are
    if (transport.knownNodes.size > 1) {
        await Promise.all([sync.pool(), sync.chain()]);
    }

    console.log('Data synced');

})().then(async function main() {

    // Start observing network events
    require('services/observer');

});



// transport.send(events.RANDOM_NUMBER, {randomNumber: 20});
// transport.send(events.RANDOM_NUMBER, {randomNumber: 10});

transport.on(events.RANDOM_NUMBER, async (msg) => {
    // TODO verify sender

    randomNumbers.push(msg.randomNumber);

    if (randomNumbers.length >= N_RANDOM_NUMBERS) {
        const finalRandomNumber = helpers.getRandomFromArray(randomNumbers);

        if (await blockProducer.isMyRound(finalRandomNumber)) {
            const parentBlock  = await chaindata.getLatest();
            const transactions = await pool.getAll();

            const block = blockProducer.produceBlock(parentBlock, transactions);

            transport.send({type: events.NEW_BLOCK, data: JSON.stringify(block)}, DELEGATES_GROUP);
        }
    }
});

/**
 * Get current state.
 *
 * @param  {Number} certificateNumber Selected certificate number.
 * @return {Boolean}                  Whether current account was chosen as a BP or not.
 */
BlockProducer.prototype.isMyRound = async function isMyRound(certificateNumber) {
    const block = await chaindata.getLatest();
    return this.address === blockchain.getBlockProducer(block, certificateNumber);
};
