/**
 * Delegate client.
 *
 * @module core/delegate
 */

'use strict';

const Delegate  = require('core/account');
const transport = require('core/transport');
const events    = require('lib/events');

// QUESTION store validator signatures in new block?
// QUESTION how to validate block producer?

/**
 * Delegates group name.
 *
 * @type {String}
 */
const DELEGATES_GROUP = 'delegates';

const randomNumber = Math.random();

transport.send({type: events.RANDOM_NUMBER, data: randomNumber}, DELEGATES_GROUP);

(async function main() {

    // TODO
    // 1. get block from block producer
    // 2. validate block producer

    const block = {};

    if (validate(block)) {
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
 * @param  {Object} block
 * @return {Boolean}
 */
function validate(block) {
    // TODO
    // 1. check state
    // 2. check tx root
    // 3. check receipts root

    return true;
}
