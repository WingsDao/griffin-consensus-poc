/**
 * Delegate client.
 *
 * @module core/delegate
 */

'use strict';

const keccak256  = require('keccak256');
const math       = require('lib/math');
const events     = require('lib/events');
const Delegate   = require('core/account');
const tp         = require('core/transport');
const chaindata  = require('core/chaindata');
const waiter     = require('services/waiter');
const sync       = require('services/sync');
const peer       = require('core/file-peer');
const delegate   = require('services/wallet');

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

/**
 * Delegates multicast channel. Currently it's all.
 *
 * @todo separate delegates communication channel.
 * @type {String}
 */
const DELEGATES  = '*';

/**
 * Initialize pool and chain on first client start.
 * @todo We may want to move this logic elsewhere as it's the same in bp, index and here.
 */
(async function init() {

    // Sync with other nodes if there are
    if (tp.knownNodes.size > 1) {
        await Promise.all([sync.pool(), sync.chain()]);
    }

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

}).then(async function startClient() {

    require('services/observer');

    tp.on(events.START_ROUND,  exchangeRandoms);
    tp.on(events.VERIFY_BLOCK, blockVerification);
});

/**
 * Do generate final random number and broadcast it to network using following steps:
 *
 * - send random number to DELEGATES group
 * - wait for 32 random numbers from other delegates
 * - calculate final random number using all 33 randoms
 * - send final random to DELEGATES group
 * - wait for 32 final randoms from other delegates
 * - broadcast final random value to network when at least 17 delegates agree on final random
 * - when consensus has not been reached - repeat these steps again after timeout
 *
 * @listens events.START_ROUND
 *
 * @emits events.RND_EVENT
 * @emits events.FRND_EVENT
 * @emits events.BP_CATCH_IT
 *
 * @return {Promise}
 */
async function exchangeRandoms() {

    // Let's use this variable as if it existed
    const numDelegates   = tp.knownDelegates || 33;
    const myRandomNum    = math.random().toString(10);

    // sign message
    const messageWithRandom = {
        random:    myRandomNum,
        publicKey: delegate.publicKey.toString('hex'),
        signature: delegate.signMessage(myRandomNum).toString('hex')
    };

    tp.send(events.RND_EVENT, messageWithRandom, DELEGATES);

    const responses        = await waiter.waitForAll(events.RND_EVENT, numDelegates, Infinity);
    const responseMessages = responses.map((r) => r.data);
    const verifiedMessages = responseMessages.filter(msg => Delegate.verifyMessage(msg.random, Buffer.from(msg.publicKey, 'hex'), Buffer.from(msg.signature, 'hex')));
    const randomNumbers    = verifiedMessages.map(msg => +msg.random);

    const finalRandomNum = math.finalRandom(randomNumbers);

    console.log('RANDOMS: ', randomNumbers);
    console.log('MY FINAL RANDOM IS: ', finalRandomNum);

    tp.send(events.FRND_EVENT, finalRandomNum, DELEGATES);

    const finalResponses = await waiter.waitForAll(events.FRND_EVENT, numDelegates, Infinity);
    const resolution     = math.votingResults(finalResponses.map((r) => r.data));

    // Most frequent final random number from delegates
    const mostCommon = resolution[0];

    console.log('FINAL RANDOMS: ',  resolution);
    console.log('MOST COMMON IS: ', mostCommon);

    if (mostCommon.count > (numDelegates / 2)) {
        return tp.send(events.BP_CATCH_IT, mostCommon.value, '*');
    }

    console.log('ROUND UNSUCCESSFUL: ', mostCommon.count, parseInt(numDelegates / 2));

    return waiter.wait(2000).then(exchangeRandoms);
}

/**
 * Verify block validity.
 *
 * This implies verification of:
 * - state calculation
 * - state root
 * - receipts root
 *
 * @listens events.VERIFY_BLOCK
 *
 * @param  {Number}  port UDP port.
 * @param  {Object}  msg  Message description.
 * @param  {Object}  meta UDP information.
 * @return {Promise}
 */
async function blockVerification({port}, msg, meta) {
    const rawData = await peer.pullString(meta.address, port).catch(console.error);
    const block   = JSON.parse(rawData);

    if (block && await isValidBlock(block) && isValidBlockProducer(block)) {
        return streamBlock(block);
    }

    // TODO Case when block is invalid.
    return null;
}

/**
 * Stream verified block over network using HTTP-peering.
 *
 * @todo create Block type definition somewhere
 *
 * @emits events.NEW_BLOCK
 *
 * @param  {Block}   block Block to stream over network.
 * @return {Promise}       Promise that ends with peering result or null when 0 nodes were online.
 */
async function streamBlock(block) {
    const nodesCount = tp.knownNodes.size - 1;

    // If there's no one to share - why bother?
    if (nodesCount === 0) {
        return null;
    }

    const {port, promise} = peer.peerString(block, nodesCount);

    const hashedBlock = keccak256(JSON.stringify(block)).toString('hex');
    const signature   = delegate.signMessage(hashedBlock).toString('hex');

    tp.send(events.BLOCK_EVENT, {
        port,
        hashedBlock,
        publicKey: delegate.publicKey.toString('hex'),
        signature
    }, DELEGATES);

    const numDelegates     = tp.knownDelegates || 33;
    const responses        = await waiter.waitForAll(events.BLOCK_EVENT, numDelegates, Infinity);
    const responseMessages = responses.map((r) => r.data);
    const verifiedMessages = responseMessages.filter(msg => Delegate.verifyMessage(msg.hashedBlock, Buffer.from(msg.publicKey, 'hex'), Buffer.from(msg.signature, 'hex')));
    const verifiedBlocks   = verifiedMessages.map(msg => msg.hashedBlock);

    console.log('Verified blocks:', verifiedBlocks);

    if (verifiedBlocks.length < numDelegates) {
        // TODO Case when not enough delegates verified block.
    }

    tp.send(events.NEW_BLOCK, {
        port,
        block: {
            number:     block.number,
            hash:       block.hash,
            parentHash: block.parentHash,
            random:     block.randomNumber
        },
        publicKey: delegate.publicKey.toString('hex'),
        signature
    });

    return promise;
}


/**
 * Validate block producer.
 *
 * NOTE this can be done much more gracefully.
 *
 * @todo implement this function
 *
 * @param  {Object}  block             Block produced by BP.
 * @param  {Number}  finalRandomNumber Final random number of current round.
 * @return {Boolean}                   Whether block producer is a valid next BP or not.
 */
function isValidBlockProducer(block, finalRandomNumber) {
    // return (block.producer === blockchain.getBlockProducer(block, finalRandomNumber));

    finalRandomNumber;
    block;

    return true;
}

/**
 * Validate block.
 *
 * @param  {Object}           producedBlock Block produced by BP.
 * @return {Promise<Boolean>}               Whether block is valid or not.
 */
async function isValidBlock(producedBlock) {
    const parentBlock = await chaindata.getLatest();
    const block       = delegate.produceBlock(parentBlock, producedBlock.transactions);

    return producedBlock.stateRoot === block.stateRoot
        && producedBlock.receiptsRoot === block.receiptsRoot;
}
