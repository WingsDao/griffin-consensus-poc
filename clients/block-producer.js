/**
 * Block Producer client.
 *
 * @module core/block-producer
 */

'use strict';

const events        = require('lib/events');
const pool          = require('core/pool');
const BlockProducer = require('core/account');
const tp            = require('core/transport');
const chaindata     = require('core/chaindata');
const sync          = require('services/sync');
const waiter        = require('services/waiter');
const peer          = require('core/file-peer');


// QUESTION how are first blocks after genesis produced?

/**
 * Secret key of this exact node. Passed via env as SECRET_KEY.
 *
 * ENV: SECRET_KEY
 * @default ''
 * @type {String}
 */
const secretKey = process.env.SECRET_KEY || '';

const blockProducer = BlockProducer(secretKey);

/**
 * Number of Delegates in network to wait for
 * @type {Number}
 */
const DELEGATES = +process.env.DELEGATES || 33;

(async function init() {

    // Sync with other nodes if there are
    if (tp.knownNodes.size > 1) {
        await Promise.all([sync.pool(), sync.chain()]);
    }

})().then(async function main() {

    // Start observing network events
    require('services/observer');

    // Attach block producer event listener
    tp.on(events.START_ROUND, waitAndProduce);
});


/**
 * This function is a generic listener for START_ROUND event from
 * the side of block producer.
 *
 * @emits events.NEW_BLOCK
 *
 * @async
 * @listens events.START_ROUND
 */
async function waitAndProduce() {

    // On each round every block producer checks whether he should produce this block.
    // We may want every bp to produce block every round.
    // TODO: remember about backup block producer, as he have to produce as well in order to get block reward.
    const isProducer = await isMyRound();

    if (!isProducer) {
        return;
    }

    // This event can take forever.
    // TODO: think of time limitation for this part.
    const randoms = await waiter.waitForAll(events.BP_CATCH_IT, DELEGATES, Infinity);

    // Drain a pool and create new block
    const parentBlock  = await chaindata.getLatest();
    const transactions = await pool.drain();
    const block        = blockProducer.produceBlock(parentBlock, transactions);

    block.randomNumber = randoms[0].data;

    // Share block with delegates
    // TODO: think of verification: do it in UDP short block or HTTP or both
    const {port} = peer.peerString(block, DELEGATES);

    // Send event so delegates know where to get block
    tp.send(events.VERIFY_BLOCK, {
        port, block: {
            number:     block.number,
            hash:       block.hash,
            parentHash: block.parentHash,
            random:     block.randomNumber
        }
    });
}

/**
 * Get current state.
 *
 * @TODO: implement this function according to PoC or LP.
 *
 * @param  {Number} certificateNumber Selected certificate number.
 * @return {Boolean}                  Whether current account was chosen as a BP or not.
 */
function isMyRound(certificateNumber) {

    certificateNumber; // to not cause linter error while keeping function signature

    // const block = await chaindata.getLatest();
    // return this.address === blockchain.getBlockProducer(block, certificateNumber);

    return true;
}
