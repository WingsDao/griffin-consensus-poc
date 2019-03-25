/**
 * Delegate client.
 *
 * @module core/delegate
 */

'use strict';

const wait = require('util').promisify(setTimeout);

/**
 * Block fetch timeout.
 *
 * @type {Number}
 */
const TIMEOUT = 1000;

// XXX START XXX
// get latest block
// generate random number
// cast random number to next delegate

/**
 * Get new produced block.
 *
 * NOTE this can be done as event listener.
 */
(function main() {

    // TODO
    // get block from block producer
    // validate block
    // broadcast block
    // generate random number
    // cast random number to next delegate

    return wait(TIMEOUT).then(main);

})();
