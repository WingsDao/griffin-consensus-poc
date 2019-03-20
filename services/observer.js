/**
 * @module services/observer
 */

'use strict';

const pool      = require('core/pool');
const chaindata = require('core/chaindata');

require('core/transport')

    .on('NewBlock', function newBlock(block) {
        block = JSON.parse(block);
        chaindata.add(block);
        pool.remove(block.tx);
    })

    .on('NewTransaction', function newTx(tx) {
        pool.add(tx);
    })
;
