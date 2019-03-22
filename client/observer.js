/**
 * @module services/observer
 */

'use strict';

const pool      = require('core/pool');
const events    = require('lib/events');
const chaindata = require('core/chaindata');

require('core/transport')

    .on(events.NEW_BLOCK, function newBlock(block) {
        block = JSON.parse(block);
        chaindata.add(block);
        pool.remove(block.tx);
    })

    .on(events.NEW_TRANSACTION, function newTx(tx) {
        pool.add(tx);
    })
;
