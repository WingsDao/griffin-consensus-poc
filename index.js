/**
 * PoC Blockchain client with REPL
 *
 * @module griffin
 */

'use strict';

process.stdin.resume();

const wait = require('util').promisify(setTimeout);
const tp   = require('core/transport');
const sync = require('services/sync');

(async function initServices() {

    await wait(3500);

    // More than one node in network
    if (tp.knownNodes.size > 1) {

        await Promise.all([
            // sync.chain(),
            sync.pool()
        ]).catch(console.error);

        console.log('Synced');
    }

})().then(async function runClient() {

    console.log('Starting observer');

    require('services/observer');
});
