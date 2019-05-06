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

const roles = {
    delegate: require('roles/delegate'),
    producer: require('roles/block-producer')
};

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

    await defineRoles();

    tp.on(evt.NEW_BLOCK_RECEIVED, defineRoles);

    console.log('Starting prompt...');

    const tty = repl.start('> ');

    Object.assign(tty.context, {tp, evt, me});
});

async function defineRoles(block) {

    roles.delegate.detach();
    roles.producer.detach();

    const isDelegate = await me.isDelegate(block);
    const isProducer = await me.isProducer(block);

    console.log('Delegate: %s', isDelegate);
    console.log('Producer: %s', isProducer);

    isDelegate && roles.delegate.attach();
    isProducer && roles.producer.attach();
}
