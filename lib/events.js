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

exports.NODE_ONLINE  = 'NodeOnline';
exports.HANDSHAKE    = 'HandshakeWithNewbie';
exports.REQUEST_POOL = 'RequestPoolData';
exports.SHARE_POOL   = 'SharePool';
