/**
 * Dummy-account with a lot of funds in it to share them with others and make txs and
 * make interactive voting/tx-sending from future REPL
 *
 * This one requires ENV setting with SECRET_KEY to have funds to send
 *
 * @module clients/bank
 */

'use strict';

const evt  = require('lib/events');
const tp   = require('core/transport');
const sync = require('services/sync');
const acc  = require('services/wallet');

/**
 * Amount to send when requested
 * @type {Number}
 */
const AMOUNT = '0x64'; // 100

(async function init() {

    // Sync with other nodes if there are
    if (tp.knownNodes.size > 1) {
        await Promise.all([sync.pool(), sync.chain()]);
    }

})().then(async function startListening() {

    // Start listening to network events right after
    require('services/observer');

    tp.on(evt.GIMME_COINS, listenAndSend);
});

/**
 * Simply listen to GIMME_COINS event and send TX with 100 coins in response
 *
 * @listens events.GIMME_COINS
 * @emits   events.NEW_TRANSACTION
 *
 * @param  {String} addr 0x-prefixed address to send coins to
 */
function listenAndSend(addr) {
    tp.send(evt.NEW_TRANSACTION, acc.tx(addr, AMOUNT));
}
