/**
 * PoC Blockchain client with REPL
 *
 * @module griffin
 */

'use strict';

process.stdin.resume();

const tp       = require('core/transport');
const sync     = require('services/sync');
const evt      = require('lib/events');
const me       = require('services/wallet');
const chain    = require('core/db').chain;
const repl     = require('repl');
const observer = require('services/observer');

(async function initServices() {

    // First of all sync data from existing node
    await Promise.all([
        sync.chain(),
        sync.pool()
    ]).catch(console.error);

})().then(async function runClient() {

    const lastBlock = await chain.getLatest();

    console.log('Last block is %d', lastBlock.number);
    console.log('My address is %s', me.hexAddress);

    observer.observe();

    // Attach both roles by default

    const isDelegate = await me.isDelegate();
    const isProducer = await me.isProducer();

    console.log('Delegate: %s', isDelegate);
    console.log('Producer: %s', isProducer);

    isDelegate && require('roles/delegate').attach();
    isProducer && require('roles/block-producer').attach();

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
