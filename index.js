/**
 * PoC Blockchain client with REPL
 *
 * @module griffin
 */

'use strict';

process.stdin.resume();

const events = require('lib/events');
const tp     = require('core/transport');
const peer   = require('core/file-peer');
const chain  = require('core/chaindata');
const pool   = require('core/pool');

const waiter = require('services/waiter');
const wait   = require('util').promisify(setTimeout);

(async function initServices() {

    await wait(3500);

    console.log('Node info:');
    console.log(' - chain filename is %s', chain.FILENAME);
    console.log(' - pool  filename is %s', pool.FILENAME);

    // More than one node in network
    if (tp.knownNodes.size > 1) {

        await Promise.all([
            syncChain(),
            syncPool()
        ]);

        console.log('Node is synced and ready to receive new blocks');

    }

})().then(function runClient() {

    console.log('Starting observer');

    require('services/observer');
});


/**
 * Max event wait time in syncs
 * @type {Number}
 */
const WAIT_FOR = 3000;

/**
 * @return {Promise}
 */
async function syncPool() {

    tp.send(events.REQUEST_POOL);

    const nodes  = await waiter.waitForAll(events.SHARE_POOL, 10, WAIT_FOR);
    const myNode = nodes.sort((a, b) => a.data - b.data)[0];

    tp.send(events.CREATE_POOL_SERVER, null, myNode.msg.sender);

    const peerData = await waiter.waitFor(events.POOL_SERVER_CREATED, WAIT_FOR);
    const peerPort = peerData.data;

    console.log('Pool port is %d', peerPort);

    if (peerPort !== null) {
        await peer.pull('localhost', peerPort, pool.createWritableStream(false)).catch(console.error);
    } else {
        console.log('No pool peer was created in %d ms time', WAIT_FOR);
    }

}

/**
 * @return {Promise}
 */
async function syncChain() {

    tp.send(events.REQUEST_CHAIN, null, '*');

    const responses  = await waiter.waitForAll(events.SHARE_CHAIN, 10, 3000);
    const oneAndOnly = responses[0];

    tp.send(events.CREATE_CHAINDATA_SERVER, null, oneAndOnly.msg.sender);

    const peerData = await waiter.waitFor(events.CHAINDATA_SERVER_CREATED, WAIT_FOR);
    const peerPort = peerData.data;

    if (peerPort !== null) {
        await peer.pull('localhost', peerPort, chain.createWritableStream(false)).catch(console.error);
    } else {
        console.log('No chaindata peer was created in %d ms time', WAIT_FOR);
    }
}
