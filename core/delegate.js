/**
 * Delegate client.
 *
 * @module core/delegate
 */

'use strict';

const Delegate  = require('core/account');
const transport = require('core/transport');
const events    = require('lib/events');
const helpers   = require('lib/helpers');

// QUESTION store validator signatures in new block?

/**
 * Delegates group name.
 *
 * @type {String}
 */
const DELEGATES_GROUP = 'delegates';

const delegate = Delegate(secretKey);

const randomNumber = Math.random();

// TODO store random numbers of current round to be able to verify
// next block producer.

// TODO sign message with validators private key.
transport.send({type: events.RANDOM_NUMBER, data: randomNumber}, DELEGATES_GROUP);

(async function main() {

    // TODO
    // 1. get block from block producer
    // 2. validate block producer

    const block = {};

    if (isValidBlock(block)) {
        transport.send({type: events.NEW_BLOCK, data: JSON.stringify(block)});

        const randomNumber = Math.random();

        transport.send({type: events.RANDOM_NUMBER, data: randomNumber}, DELEGATES_GROUP);
    } else {
        // TODO case when the block is malformed
    }

})();

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
