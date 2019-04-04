/**
 * Delegate client.
 *
 * @module core/delegate
 */

'use strict';

const math       = require('lib/math');
const events     = require('lib/events');
const helpers    = require('lib/helpers');
const Delegate   = require('core/account');
const tp         = require('core/transport');
const blockchain = require('core/blockchain');
const waiter     = require('services/waiter');
const sync       = require('services/sync');
const peer       = require('core/file-peer');

// QUESTION store validator signatures in new block?

// NOTE Random number distribution.
//
// 1. When random number is generated by
// it should be sent as object and it must
// have a signature of delegate who generated it.
//
// 2. Each delegate receiving random number from
// other fellow delegate must verify the signature.
//
// 3. Each delegate must verify that no more than
// one random number is generated by each delegate.
//
// 4. Random number must be generated only once in a round.
//
// TODO sign message with validators private key.

const secretKey = process.env.SECRET_KEY && Buffer.from(process.env.SECRET_KEY, 'hex') || null;
const delegate  = Delegate(secretKey);



/**
 * Validate block producer.
 *
 * NOTE this can be done much more gracefully.
 *
 * @param  {Object}  block             Block produced by BP.
 * @param  {Number}  finalRandomNumber Final random number of current round.
 * @return {Boolean}                   Whether block producer is a valid next BP or not.
 */
function isValidBlockProducer(block, finalRandomNumber) {
    return (block.producer === blockchain.getBlockProducer(block, finalRandomNumber));
}

/**
 * Validate block.
 *
 * @param  {Object}  producedBlock Block produced by BP.
 * @return {Boolean}               Whether block is valid or not.
 */
function isValidBlock(producedBlock) {
    const block = delegate.produceBlock();

    return producedBlock.stateRoot === helpers.merkleRoot(producedBlock.transactions)
        && producedBlock.stateRoot === block.stateRoot
        && producedBlock.receiptsRoot === block.receiptsRoot;
}

const DELEGATES  = '*';

// Starts on 'PRODUCE NEW BLOCK EVENT' for example
// Done by delegate.

(async function init() {

    // Sync with other nodes if there are
    if (tp.knownNodes.size > 1) {
        await Promise.all([sync.pool(), sync.chain()]);
    }

    console.log('Data synced');

})().then(async function waitForDelegates() {

    tp.groups.add(DELEGATES);

    tp.delegates = new Map();
    Object.defineProperty(tp, 'knownDelegates', {get: () => tp.delegates.size});

    tp.on(events.HELLO_DUDE, (data, msg, meta) => tp.delegates.set(msg.sender, meta));
    tp.on(events.I_AM_HERE,  (data, msg, meta) => {
        tp.delegates.set(msg.sender, meta);
        tp.send(events.HELLO_DUDE, null, msg.sender);
    });

    tp.send(events.I_AM_HERE);

    while (tp.knownDelegates < +process.env.DELEGATES) {
        await waiter.wait(500);
    }

    console.log('ALL %d DELEGATES ARE PRESENT', process.env.DELEGATES);
});

tp.on(events.START_ROUND, async function firstStage() {

    console.log('FIRST STAGE');

    console.log(tp.knownDelegates);

    // Let's use this variable as if it existed
    const numDelegates   = tp.knownDelegates || 33;
    const myRandomNum    = math.random();

    tp.send(events.RND_EVENT, myRandomNum, DELEGATES);

    const responses      = await waiter.waitForAll(events.RND_EVENT, numDelegates, Infinity);
    const randomNumbers  = responses.map((r) => r.data);
    const finalRandomNum = math.finalRandom(randomNumbers);

    console.log('RANDOMS: ', responses.map((r) => r.data));
    console.log('MY FINAL RANDOM IS: ', finalRandomNum);

    tp.send(events.FRND_EVENT, finalRandomNum, DELEGATES);

    const finalResponses = await waiter.waitForAll(events.FRND_EVENT, numDelegates, Infinity);
    const resolution     = math.votingResults(finalResponses.map((r) => r.data));

    // Most frequent final random number from delegates
    const mostCommon = resolution[0];

    console.log('FINAL RANDOMS: ',  resolution);
    console.log('MOST COMMON IS: ', mostCommon);

    if (mostCommon.count > (numDelegates / 2)) {
        console.log('ROUND SUCCESSFUL!');
        return tp.send(events.BP_CATCH_IT, mostCommon.value, '*');
    }

    console.log('ROUND UNSUCCESSFUL: ', mostCommon.count, parseInt(numDelegates / 2));

    return waiter.wait(2000).then(firstStage);
});

tp.on(events.VERIFY_BLOCK, async function blockVerification({port, block}, msg, meta) {

    console.log('REQUIRES VERIFICATION', block, port, msg, meta);

    const rawData   = await peer.pullString(meta.address, port).catch(console.error);

    console.log(rawData);

    const blockData = await Promise.resolve(rawData).then(JSON.parse).catch(console.error);

    // TODO: VERIFY BLOCK
    if (blockData) {
        await streamBlock(blockData);
    }

    console.log('BLOCK STREAMED AND SHARED OVER NETWORK');
});

async function streamBlock(block) {
    const nodesCount = tp.knownNodes.size - 1;

    if (nodesCount === 0) {
        return null;
    }

    console.log('streaming new block %d to %d nodes', block.number, nodesCount);

    const port = peer.peerString(block, nodesCount);
    tp.send(events.NEW_BLOCK, {
        port, block: {
            number:     block.number,
            hash:       block.hash,
            parentHash: block.parentHash,
            random:     block.randomNumber
        }
    });
}
