/**
 * PoC Blockchain client with REPL
 *
 * @module griffin
 */

'use strict';

process.stdin.resume();

const messenger = require('client/messenger');
const events    = require('lib/events');
const tp        = require('core/transport');
const peer      = require('core/file-peer');
const chain     = require('core/chaindata');
const pool      = require('core/pool');

const waiter    = require('client/messenger');

const wait = require('util').promisify(setTimeout);

require('client/observer');

(async function initServices() {

    await wait(3500);

    // More than one node in network
    if (tp.knownNodes.size > 1) {

        await Promise.all([
            syncChain(),
            syncPool()
        ]);


    } else {



    }

})();


async function syncPool() {

    tp.send(events.REQUEST_POOL);

    const nodes  = await waiter.waitForAll(events.SHARE_POOL, 10, 3000);
    const myNode = nodes.sort((a, b) => a.data - b.data)[0];

    tp.send(events.CREATE_POOL_SERVER, null, myNode.msg.sender);

    console.log('pool synced');
}


async function syncChain() {

    tp.send(events.REQUEST_CHAIN, null, '*');

    const nodes  = await waiter.waitForAll(events.SHARE_CHAIN, 10, 3000);
    const myNode = nodes[0];

    if (!myNode) {
        return;
    }

    tp.send(events.CREATE_CHAINDATA_SERVER, null, myNode.msg.sender);

    console.log('chain synced');
}

// (function () {
//
//     if (nodesInNetwork) {
//         //
//     }
//
//     emit('Request pool');
//     waitFor('I can');
//     emit('Okay, you do it');
//     waitFor('Here are your server details');
//
//     pullDataFromPeer();
//
//     if (failed && few_nodes_around) {
//         repeat();
//     }
// })();

// sync handshake mechanics
//
// 1. Request pool data
// 2. Find perfect candidate (SIMPLE SOLUTION FIRST)
// 3. Send him request
// 4. Receive confirmation with peer data
// 5. Pool data from peer
// 6. On pool end peer closed, connection ended

// exports.syncPool = async function syncPool() {
//
//     setImmediate(() => console.log('message sent') || msg.send(evts.REQUEST_POOL));
//
//     await pool.drain();
//
//     const promise = console.log('awaiting') || waitForAll(evts.SHARE_POOL);
//     const results = await promise;
//
//     console.log('received', results);
//
// };
