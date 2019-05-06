/**
 * Block Producer client.
 *
 * @module core/block-producer
 */

'use strict';

const math       = require('lib/math');
const events     = require('lib/events');
const pool       = require('core/db').pool;
const tp         = require('core/transport');
const chaindata  = require('core/db').chain;
const peer       = require('core/file-peer');
const waiter     = require('services/waiter');
const parseState = require('lib/block-state');
const me         = require('services/wallet');

exports.attach = function attach() {

    tp.on(events.START_ROUND, waitAndProduce);
};

exports.detach = function detach() {

    tp.off(events.START_ROUND, waitAndProduce);
};

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

    // Get current block first
    const currentBlock = await chaindata.getLatest();
    const state        = parseState(currentBlock.state);

    // This event can take forever.
    // TODO: think of time limitation for this part.
    // In async architecture it's also possible that BP will catch same events from different
    // delegates (i.e. not enough delegates - repeat, same message from same D caught)
    //
    // QUESTION: Should we do a check somewhere for round definition or smth. Number of retries mb?
    // We want to let BP know whether round has been restarted so he can drop this listener
    const random = await waiter.waitFor(events.BP_CATCH_IT, Infinity);

    // On each round every block producer checks whether he should produce this block.
    // We may want every bp to produce block every round.
    // TODO: remember about backup block producer, as he have to produce as well in order to get block reward.
    // FIXME Supply real FRN.
    const isProducer = me.hexAddress === math.findProducer(random.data, state.blockProducers);

    if (!isProducer) {
        console.log('I AM NO PRODUCER');
        return;
    }

    console.log('I AM PRODUCER %s %s', random.data, me.hexAddress);

    // Drain a pool and create new block
    const transactions = await pool.drain().catch(console.error);
    const block        = me.produceBlock(currentBlock, transactions);

    // Assign random number to newly produced block
    block.randomNumber = random.data;

    // Share block with delegates
    // TODO: think of verification: do it in UDP short block or HTTP or both
    const {port, promise} = peer.peerString(block, tp.knownNodes, 5000);

    // Send event so delegates know where to get block
    tp.send(events.VERIFY_BLOCK, {
        port,
        block: {
            number:     block.number,
            hash:       block.hash,
            parentHash: block.parentHash,
            random:     block.randomNumber,
            producer:   block.producer
        }
    });

    return promise;
}
