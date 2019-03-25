/**
 * Block Producer client.
 *
 * @module core/block-producer
 */

'use strict';

const wait = require('util').promisify(setTimeout);

/**
 * Block fetch timeout.
 *
 * @type {Number}
 */
const TIMEOUT = 1000;

(function main() {

    // TODO
    // get certificate hash from delegate(s)
    // check whether it hash correspands to one of owned certificates
    // produce block
    // multicast to delegates

    return wait(TIMEOUT).then(main);

})();
