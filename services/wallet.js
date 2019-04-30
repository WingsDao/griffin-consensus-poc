/**
 * Single point of access to process's account.
 * Initializes account from ENV, provides access to it.
 *
 * QUESTION: shall we wrap it into something more usable later? MB add few features for it.
 *
 * @module services/wallet
 */

'use strict';

const Account = require('core/account');
const chain   = require('core/db').chain;
const state   = require('lib/block-state');

/**
 * Secret key parsed from ENV when provided.
 * ENV: SECRET_KEY
 * @default null
 * @type {?Buffer}
 */
const SECRET_KEY = process.env.SECRET_KEY && Buffer.from(process.env.SECRET_KEY, 'hex') || null;

const me = module.exports = exports = new Account(SECRET_KEY);

/**
 * Check whether me (process account) is delegate
 *
 * @return {Promise<Boolean>} Whether account is delegate
 */
exports.isDelegate = function () {
    return chain.getLatest().then((block) => console.log(block.state) || state.isDelegate(block.state, me.hexAddress));
};

/**
 * Check whether me (process account) is delegate
 *
 * @return {Promise<Boolean>} Whether account is block producer
 */
exports.isProducer = function () {
    return chain.getLatest().then((block) => console.log(block.state) || state.isBlockProducer(block.state, me.hexAddress));
};
