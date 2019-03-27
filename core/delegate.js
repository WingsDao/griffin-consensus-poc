/**
 * Delegate client.
 *
 * @module core/delegate
 */

'use strict';

const Delegate   = require('core/account');
const transport  = require('core/transport');
const blockchain = require('core/blockchain');
const events     = require('lib/events');
const helpers    = require('lib/helpers');

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

/**
 * Delegates group name.
 *
 * @type {String}
 */
const DELEGATES_GROUP = 'delegates';

const secretKey = '';
const delegate  = Delegate(secretKey);

// random number generated in current round
let randomNumber = Math.random();

// random numbers of current round
let randomNumbers = [];

// TODO sign message with validators private key.
transport.send({type: events.RANDOM_NUMBER, data: randomNumber}, DELEGATES_GROUP);

(async function main() {

    // TODO get block from block producer
    const block = {};

    const finalRandomNumber = helpers.getRandomFromArray(randomNumbers);

    if (isValidBlockProducer(block, finalRandomNumber) && isValidBlock(block)) {
        transport.send({type: events.NEW_BLOCK, data: JSON.stringify(block)});
    } else {
        // in case when block is malformed we start round again
        randomNumbers = [];
    }

    randomNumber = Math.random();

    transport.send({type: events.RANDOM_NUMBER, data: randomNumber}, DELEGATES_GROUP);

})();

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
    return block.producer === blockchain.getBlockProducer(block, finalRandomNumber);
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
