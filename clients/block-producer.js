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
const tp            = require('core/transport');
const chaindata     = require('core/chaindata');
const blockchain    = require('core/blockchain');
const sync          = require('services/sync');
const waiter        = require('services/waiter');

const peer          = require('core/file-peer');


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
    if (tp.knownNodes.size > 1) {
        await Promise.all([sync.pool(), sync.chain()]);
    }

    console.log('Data synced');

})().then(async function main() {

    // Start observing network events
    require('services/observer');

    console.log('Started observer');

});

const DELEGATES = +process.env.DELEGATES || 33;

tp.on(events.START_ROUND, async function waitAndProduce() {

    console.log('Waiting for ya\'ll');

    const randoms = await waiter.waitForAll(events.BP_CATCH_IT, DELEGATES, Infinity);

    console.log('Received random numbers!', randoms.map((r) => r.data).join());

    const [parentBlock, transactions] = await Promise.all([chaindata.getLatest(), pool.drain()]);
    const block                       = blockProducer.produceBlock(parentBlock, transactions);

    block.randomNumber = randoms[0].data;

    await streamBlock(block);
});


async function streamBlock(block) {
    const nodesCount = tp.knownNodes.size - 1;

    if (nodesCount === 0) {
        return null;
    }

    console.log('streaming new block(%d) to %d nodes', block.number, nodesCount);

    const port = peer.peerString(block, nodesCount);
    tp.send(events.VERIFY_BLOCK, {
        port, block: {
            number:     block.number,
            hash:       block.hash,
            parentHash: block.parentHash,
            random:     block.randomNumber
        }
    });
}


// tp.send(events.RANDOM_NUMBER, {randomNumber: 20});
// tp.send(events.RANDOM_NUMBER, {randomNumber: 10});

// tp.on(events.RANDOM_NUMBER, async (msg) => {
//     // TODO verify sender
//
//     randomNumbers.push(msg.randomNumber);
//
//     if (randomNumbers.length >= N_RANDOM_NUMBERS) {
//         const finalRandomNumber = helpers.getRandomFromArray(randomNumbers);
//
//         if (await blockProducer.isMyRound(finalRandomNumber)) {
//             const parentBlock  = await chaindata.getLatest();
//             const transactions = await pool.getAll();
//
//             const block = blockProducer.produceBlock(parentBlock, transactions);
//
//             tp.send({type: events.NEW_BLOCK, data: JSON.stringify(block)}, DELEGATES_GROUP);
//         }
//     }
// });

/**
 * Get current state.
 *
 * @param  {Number} certificateNumber Selected certificate number.
 * @return {Boolean}                  Whether current account was chosen as a BP or not.
 */
// BlockProducer.prototype.isMyRound = async function isMyRound(certificateNumber) {
//     const block = await chaindata.getLatest();
//     return this.address === blockchain.getBlockProducer(block, certificateNumber);
// };
