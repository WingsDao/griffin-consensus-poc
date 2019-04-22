/**
 * PoC Blockchain client with REPL
 *
 * @module griffin
 */

'use strict';

process.stdin.resume();

const tp   = require('core/transport');
const sync = require('services/sync');
const evt  = require('lib/events');
const me   = require('services/wallet');
const repl = require('repl');

(async function initServices() {

    // More than one node in network
    if (tp.knownNodes.size > 1) {

        await Promise.all([
            // sync.chain(),
            sync.pool()
        ]).catch(console.error);
    }

})().then(async function runClient() {

    console.log('Starting observer');

    require('services/observer');

    // Attach both roles by default
    require('roles/block-producer').attach();
    require('roles/delegate').attach();

    console.log('Starting prompt...');

    const tty = repl.start('> ');

    Object.assign(tty.context, {tp, evt, me});
});

// QUESTION
//     ON START ROUND EVENT
//         AM I DELEGATE?
//             ATTACH LISTENERS FOR DELEGATE FOR 1 ROUND
//         AM I PRODUCER?
//             ATTACH LISTENERS FOR PRODUCER FOR 1 ROUND
//
//     ON ROUND END REMOVE ALL LISTENERS AND LIVE FREE
