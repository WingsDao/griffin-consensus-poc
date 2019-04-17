/**
 * Block Producer client.
 *
 * @module core/block-producer
 */

'use strict';

const math          = require('lib/math');
const events        = require('lib/events');
const pool          = require('core/db').pool;
const tp            = require('core/transport');
const chaindata     = require('core/db').chain;
const peer          = require('core/file-peer');
const sync          = require('services/sync');
const waiter        = require('services/waiter');
const blockProducer = require('services/wallet');

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

    // This event can take forever.
    // TODO: think of time limitation for this part.
    // In async architecture it's also possible that BP will catch same events from different
    // delegates (i.e. not enough delegates - repeat, same message from same D caught)
    //
    // QUESTION: Should we do a check somewhere for round definition or smth. Number of retries mb?
    // We want to let BP know whether round has been restarted so he can drop this listener
    const randoms = await waiter.waitForAll(events.BP_CATCH_IT, DELEGATES, Infinity);

    // On each round every block producer checks whether he should produce this block.
    // We may want every bp to produce block every round.
    // TODO: remember about backup block producer, as he have to produce as well in order to get block reward.
    // FIXME Supply real FRN.
    const isProducer = await isMyRound(randoms[0].data);

    if (!isProducer) {
        console.log('I AM NO PRODUCER');
        return;
    }

    // Drain a pool and create new block
    const parentBlock  = await chaindata.getLatest();
    const transactions = await pool.drain().catch(console.error);
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
            random:     block.randomNumber,
            producer:   block.producer
        }
    });
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
 * @return {Promise<Boolean>}     Whether current account was chosen as a BP or not.
 */
async function isMyRound(frn) {
    // TODO Get real array of active block producers.
    const activeProducers     = [blockProducer.address.toString('hex')];
    const block               = await chaindata.getLatest();
    const orderedCertificates = [];

    if (block.number === 0) {
        // TODO First round scenario.
        // Next line causes EventEmitter memory leak.
        // Object.assign(block, blockchain.initiateGenesisState(block, {state: []}));
        return true;
    }

    console.log(block, typeof block);

    // get all certificates from latest block
    block.state.forEach((account) => {
        if (activeProducers.includes(account.address)) {
            orderedCertificates.push(...account.certificates);
        }
    });

    console.log(orderedCertificates);

    const index      = math.findCertificateIndex(frn, orderedCertificates.length);
    const chosenCert = orderedCertificates[index];
    const chosenBp   = block.state.find(el => el.certificates.includes(chosenCert));

    // console.log(index, chosenCert);

    console.log('PERC, FRN, TOTAL', index, frn, orderedCertificates.length);
    console.log('CHOSEN', chosenBp);
    console.log('MY IS', blockProducer.address.toString('hex'));

    return (chosenBp.address === blockProducer.address.toString('hex'));
}
