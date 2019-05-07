/**
 * @module network/observer
 */

'use strict';

const pool      = require('core/db').pool;
const events    = require('lib/events');
const peer      = require('core/file-peer');
const chaindata = require('core/db').chain;
const wallet    = require('services/wallet');
const tp        = require('core/transport');

exports.observe = () => tp

    /**
     * We don't want one to receive 33 new blocks from delegates so for now we stick
     * to this this solution: only one block received for one round
     *
     * @listens events.START_ROUND
     */
    .on(events.START_ROUND, function startRoundAttachListener() {
        this.once(events.NEW_BLOCK, async function newBlock({port, block}, msg, meta) {
            const lastBlock = await chaindata.getLatest();

            console.log('New block received', block);

            if (lastBlock.number >= block.number) { return; }

            const newBlock = await peer.pullString(meta.address, port);

            await chaindata.add(block.number, newBlock);

            tp.emit(events.NEW_BLOCK_RECEIVED, JSON.parse(newBlock));

            // QUESTION: should definition of role happen here? Or we could use same
            // event in another module/service to attach/detach listeners?
        });
    })

    .on(events.NEW_TRANSACTION, function newTx(tx) {
        // QUESTION: should there be some sort of filter of txs in PoC?
        // QUESTION: how do we get tx hash and should it be extracted and written into pool here?
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
            const {port} = peer.peer(pool.createReadStream());
            this.send(events.POOL_SERVER_CREATED, port, msg.sender);
        }
    })

    .on(events.CREATE_CHAINDATA_SERVER, function createServer(data, msg) {
        if (msg.sender !== this.transportId) {
            const {port} = peer.peer(chaindata.createReadStream());
            this.send(events.CHAINDATA_SERVER_CREATED, port, msg.sender);
        }
    })

    .on(events.PING, function areYouLookingForMe(data, msg) {
        // QUESTION: okay, we have PING event, what's next? How should it be used?

        const addr = wallet.hexAddress;

        if (data === addr) {
            this.send(events.PONG, addr, msg.sender);
        }
    })
;
