/**
 * Single point of access to process's account.
 * Initializes account from ENV, provides access to it.
 *
 * QUESTION: shall we wrap it into something more usable later? MB add few features for it.
 *
 * @module services/wallet
 */

'use strict';

const Account    = require('core/account');
const blockchain = require('core/blockchain');

/**
 * Secret key parsed from ENV when provided.
 * ENV: SECRET_KEY
 * @default null
 * @type {?Buffer}
 */
const SECRET_KEY = process.env.SECRET_KEY && Buffer.from(process.env.SECRET_KEY, 'hex') || null;

const me = module.exports = exports = new Account(SECRET_KEY);

/**
 * Check whether me (account i)
 * @return {[type]} [description]
 */
exports.isDelegate = function () {
    return blockchain.isDelegate(me.address.toString('hex'));
};

exports.isProducer = function () {

};
