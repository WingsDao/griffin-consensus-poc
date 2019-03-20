/**
 * PoC Blockchain client with REPL
 *
 * @module griffin
 */

'use strict';

process.stdin.resume();

const transport = require('core/tranport');
const events    = require('lib/events');

(async function initServices() {

    // Run every service
    // After that run REPL

})();


async function syncPool() {
    const {data, msg} = waitFor(events.SHARE_POOL);
}

async function waitFor(evt, wait = 1000) {
    return new Promise((resolve, reject) => {
        transport.once(evt, function (data, msg, meta) {
            resolve({data, msg, meta});
        });

        setTimeout(reject, wait);
    });
}

async function waitForAll(evt, count = 1, wait = 1000) {
    const result = [];


}
