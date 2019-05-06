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
    const isProducer = await isMyRound(random.data);

    if (!isProducer) {
        console.log('I AM NO PRODUCER');
        return;
    }

    console.log('I AM PRODUCER %s %s', random.data, me.hexAddress);

    // Drain a pool and create new block
    const parentBlock  = await chaindata.getLatest();
    const transactions = await pool.drain().catch(console.error);
    const block        = me.produceBlock(parentBlock, transactions);

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

/**
 * Get current state.
 *
 * QUESTION Which scenario to choose?
 *
 * Scenario 1.
 * We take FRN and take its percent from the total number of certificates
 * and select one certificate at the same percentage from an array of certificates
 * of online BPs.
 *
 * Cons:
 * If list of BP changes dynamically this algorithm cannot be considered stable.
 *
 * Scenario 2.
 * FRN is being generated in the range of certificates from the
 * previous block. FRN generation occurs until selected
 * certificate corresponds to one of online BPs.
 *
 * Cons:
 * Many iterations. This works good when network is active or iterations
 * happen frequently.
 *
 * @param  {Number}           frn Final Random Number.
 * @return {Promise<Boolean>}     Whether current account is a BP in current block or not.
 */
async function isMyRound(frn) {
    const block     = await chaindata.getLatest();
    const state     = parseState(block.state);
    const producers = state.blockProducers;

    const index    = math.findCertificateIndex(frn, producers.length);
    const chosenBp = producers[index];

    return (chosenBp === me.hexAddress);
}
