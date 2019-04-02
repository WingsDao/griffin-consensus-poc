/**
 * Event names used in transportation and messaging system
 *
 * @module lib/events
 */

'use strict';

/* Blockchain layer events */

exports.NEW_TRANSACTION = 'NewTransaction';
exports.NEW_BLOCK       = 'NewBlock';
exports.RANDOM_NUMBER   = 'RandomNumber';

exports.RND_EVENT   = 'RandomNumberBrotha';
exports.FRND_EVENT  = 'HereGoesFinalFinally';
exports.I_AM_HERE   = 'IamDelegate';
exports.HELLO_DUDE  = 'HelloThereDude!';
exports.START_ROUND = 'StartRoundGuys';
exports.BP_CATCH_IT = 'GoCatchItBoy';


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
