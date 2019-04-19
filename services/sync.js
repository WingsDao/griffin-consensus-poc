/**
 * This service handles sync functionality and provides hooks for syncing
 * pool and chaindata from other nodes.
 *
 * Peer-choosing logic should be somewhere in here.
 * To be discussed.
 *
 * @module network/sync
 */

'use strict';

// consts, core, service - order suggestion
const events = require('lib/events');
const pool   = require('core/db').pool;
const chain  = require('core/db').chain;
const peer   = require('core/file-peer');
const tp     = require('core/transport');
const waiter = require('services/waiter');

/**
 * Number of ms to wait for another node to send response
 * @type {Number}
 */
const WAIT_FOR = exports.SYNC_TIMEOUT = 3000;

/**
 * Sync pool from peer
 *
 * @return {Promise}
 */
exports.pool = async function syncPool() {

    tp.send(events.REQUEST_POOL);

    const nodes  = await waiter.waitForAll(events.SHARE_POOL, 10, WAIT_FOR);
    const myNode = nodes.sort((a, b) => a.data - b.data)[0];

    tp.send(events.CREATE_POOL_SERVER, null, myNode.msg.sender);

    const peerData = await waiter.waitFor(events.POOL_SERVER_CREATED, WAIT_FOR);
    const peerPort = peerData.data;

    // Clean up before syncing
    await pool.drain();

    return (peerPort !== null)
        && peer.pull('localhost', peerPort, pool.createWriteStream(false)).catch(console.error)
        || null;
};

/**
 * Sync chain from peer
 *
 * @return {Promise}
 */
exports.chain = async function syncChain() {

    tp.send(events.REQUEST_CHAIN, null, '*');

    const responses  = await waiter.waitForAll(events.SHARE_CHAIN, 10, 3000);
    const oneAndOnly = responses[0];

    tp.send(events.CREATE_CHAINDATA_SERVER, null, oneAndOnly.msg.sender);

    const peerData = await waiter.waitFor(events.CHAINDATA_SERVER_CREATED, WAIT_FOR);
    const peerPort = peerData.data;

    // Clean up before syncing
    await chain.destroy();

    return (peerPort !== null)
        && peer.pull('localhost', peerPort, chain.createWriteStream(false)).catch(console.error)
        || null;
};
