/**
 * PoC Blockchain client with REPL
 *
 * @module griffin
 */

'use strict';

process.stdin.resume();

const tp   = require('core/transport');
const wait = require('util').promisify(setTimeout);

(async function initServices() {

    await wait(3500);

    // More than one node in network
    if (tp.knownNodes.size > 1) {
        console.log('Sync is currently unavailable');
    }

})().then(function runClient() {

    console.log('Starting observer');

    require('services/observer');
});
