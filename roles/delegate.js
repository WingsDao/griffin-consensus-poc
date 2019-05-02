/**
 * Delegate client.
 *
 * @module core/delegate
 */

'use strict';

const keccak256  = require('keccak256');
const math       = require('lib/math');
const events     = require('lib/events');
const Account    = require('core/account');
const tp         = require('core/transport');
const chain      = require('core/db').chain;
const waiter     = require('services/waiter');
const peer       = require('core/file-peer');
const parseState = require('lib/block-state');
const me         = require('services/wallet');

const conf = require('lib/constants');

// NOTE Random number distribution.
//
// 1. When random number is generated
// it must be sent as an object and it must
// have a signature of delegate who generated it.
//
// 2. Each delegate receiving random number from
// other fellow delegate must verify a signature.
//
// 3. Each delegate must verify that no more than
// one random number is generated by each delegate.
//
// 4. Random number must be generated only once in a round.

/**
 * Delegates multicast channel. Currently it's all.
 *
 * @todo separate delegates communication channel.
 * @type {String}
 */
const DELEGATES  = '*';

// /**
//  * Total number of responses to await.
//  * @type {Number}
//  */
// const DELEGATES_COUNT = conf.ACTIVE_DELEGATES_COUNT + conf.ACTIVE_SUCCESSOR_DELEGATES_COUNT - 1;

/**
 * Number of ms to wait to receive other delegates' randoms.
 * @type {Number}
 */
const WAIT_TIME = conf.DELEGATE_WAIT_TIME || 3000;

/**
 * Attach event listeners to current transport.
 */
exports.attach = function attach() {

    tp.on(events.START_ROUND,  exchangeRandoms);
    tp.on(events.VERIFY_BLOCK, blockVerification);
};

/**
 * Detach event listeners from current transport.
 */
exports.detach = function detach() {

    tp.off(events.START_ROUND,  exchangeRandoms);
    tp.off(events.VERIFY_BLOCK, blockVerification);
};

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

    const currentBlock = await chain.getLatest();
    const state        = parseState(currentBlock.state);

    // Get list of delegates from state
    const delegates    = state.delegates;

    // Let's use this variable as if it existed
    const numDelegates = 1 || 33;
    const myRandomNum  = math.random().toString(10);

    // sign message
    const messageWithRandom = {
        random:    myRandomNum,
        publicKey: me.publicKey.toString('hex'),
        signature: me.signMessage(myRandomNum).toString('hex')
    };

    tp.send(events.RND_EVENT, messageWithRandom, DELEGATES);

    console.log('SENDING MY RANDOM', myRandomNum);

    const responses        = await waiter.collect(events.RND_EVENT, WAIT_TIME);
    const responseMessages = responses.map((r) => r.data);

    responseMessages.forEach((msg) => console.log(Account.publicKeyToAddress(msg.publicKey)));

    const verifiedMessages = responseMessages
        .filter((msg) => delegates.includes(Account.publicKeyToAddress(msg.publicKey)))
        .filter((msg) => Account.verifyMessage(msg.random, Buffer.from(msg.publicKey, 'hex'), Buffer.from(msg.signature, 'hex')));

    const randomNumbers    = verifiedMessages.map((msg) => +msg.random);

    const finalRandomNum   = math.finalRandom(randomNumbers);

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
        console.log('ROUND SUCCESSFUL, SENDING VALUE TO BP: %s', mostCommon.value);
        return tp.send(events.BP_CATCH_IT, mostCommon.value, '*');
    }

    console.log('ROUND UNSUCCESSFUL: ', mostCommon.count, parseInt(numDelegates / 2));

    // QUESTION: what should we do programmatically when round is unsucceful?
    // I mean should we restart everything? Or only this function? Consensus to re-roll
    // has to be reached somehow. Think about it

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
async function blockVerification({port, block: short}, msg, meta) {

    console.log('VERIFYING BLOCK: %s', JSON.stringify(short));

    const rawData = await peer.pullString(meta.address, port).catch(console.error);
    const block   = JSON.parse(rawData);

    if (block && await isValidBlock(block) && isValidBlockProducer(block)) {
        console.log('streaming block over network');
        return streamBlock(block);
    }

    console.log(!!block, await isValidBlock(block), isValidBlockProducer(block));

    console.log('block is invalid');

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
    const signature   = me.signMessage(hashedBlock).toString('hex');

    tp.send(events.BLOCK_EVENT, {
        port,
        hashedBlock,
        publicKey: me.publicKey.toString('hex'),
        signature
    }, DELEGATES);

    const numDelegates     = 1 || 33;
    const responses        = await waiter.waitForAll(events.BLOCK_EVENT, numDelegates, Infinity);
    const responseMessages = responses.map((r) => r.data);
    const verifiedMessages = responseMessages.filter(msg => Account.verifyMessage(msg.hashedBlock, Buffer.from(msg.publicKey, 'hex'), Buffer.from(msg.signature, 'hex')));
    const verifiedBlocks   = verifiedMessages.map(msg => msg.hashedBlock);

    console.log('Verified blocks:', verifiedBlocks);

    if (verifiedBlocks.length < numDelegates) {
        // TODO Case when not enough delegates verified block.
        console.log('VERIFIED < NUMBER OF DELEGATES');
    }

    tp.send(events.NEW_BLOCK, {
        port,
        block: {
            number:     block.number,
            hash:       block.hash,
            parentHash: block.parentHash,
            random:     block.randomNumber,
            producer:   block.producer
        },
        publicKey: me.publicKey.toString('hex'),
        signature
    });

    return promise;
}


/**
 * Validate block producer.
 *
 * TODO Implement this function.
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
    const parentBlock = await chain.getLatest();
    const block       = me.produceBlock(parentBlock, producedBlock.transactions);

    return producedBlock.stateRoot === block.stateRoot
        && producedBlock.receiptsRoot === block.receiptsRoot;
}
