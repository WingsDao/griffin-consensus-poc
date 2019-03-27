/**
 * @module network/observer
 */

'use strict';

const pool      = require('core/pool');
const events    = require('lib/events');
const peer      = require('core/file-peer');
const chaindata = require('core/chaindata');


require('core/transport')

    .on(events.NEW_BLOCK, async function newBlock({port}, msg) {
        if (msg.sender !== this.transportId) {
            const stream = chaindata.createWritableStream();
            stream.write('\n');
            await peer.pull('localhost', port, stream).catch(console.error);
        }
    })

    .on(events.NEW_TRANSACTION, function newTx(tx) {
        pool.add(tx);
    })

    .on(events.REQUEST_POOL, async function poolRequested(data, msg) {
        if (msg.sender !== this.transportId) {
            const txs = await pool.getAll();
            this.send(events.SHARE_POOL, txs.length, msg.sender);
        }
    })

    .on(events.REQUEST_CHAIN, async function chainRequested(data, msg) {
        if (msg.sender !== this.transportId) {
            const lastBlock = await chaindata.getLatest();
            this.send(events.SHARE_CHAIN, lastBlock.number, msg.sender);
        }
    })

    .on(events.CREATE_POOL_SERVER, function createServer(data, msg) {
        if (msg.sender !== this.transportId) {
            const port = peer.peer(pool.createReadableStream());
            this.send(events.POOL_SERVER_CREATED, port, msg.sender);
        }
    })

    .on(events.CREATE_CHAINDATA_SERVER, function createServer(data, msg) {
        if (msg.sender !== this.transportId) {
            const port = peer.peer(chaindata.createReadableStream());
            this.send(events.CHAINDATA_SERVER_CREATED, port, msg.sender);
        }
    })
;
