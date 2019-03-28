/**
 * Event names used in transportation and messaging system
 *
 * @module lib/events
 */

'use strict';

/* Blockchain layer events */

exports.NEW_TRANSACTION = 'NewTransaction';
exports.NEW_BLOCK       = 'NewBlock';

/* Infrastructure layer events */

exports.NODE_ONLINE = 'NodeOnline';
exports.HANDSHAKE   = 'HandshakeWithNewbie';
exports.PING        = 'PingDude';

/* Syncronisation handshakes */

exports.REQUEST_POOL  = 'RequestPoolData';
exports.REQUEST_CHAIN = 'RequestChainData';
exports.SHARE_POOL    = 'SharePool';
exports.SHARE_CHAIN   = 'ShareChain';

exports.POOL_SERVER_CREATED      = 'PoolServerCreated';
exports.CHAINDATA_SERVER_CREATED = 'CHaindataServerCreated';
exports.CREATE_CHAINDATA_SERVER  = 'CreateCbaindataServer';
exports.CREATE_POOL_SERVER       = 'CreatePoolServer';
