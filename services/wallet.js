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
 * @param  {Object}           [block=null] Optional: block to get info from
 * @return {Promise<Boolean>}              Whether account is delegate
 */
exports.isDelegate = function (block = null) {
    return (block === null)
        && chain.getLatest().then((block) => state.isDelegate(block.state, me.hexAddress))
        || Promise.resolve(state.isDelegate(block.state, me.hexAddress));
};

/**
 * Check whether me (process account) is delegate
 *
 * @param  {Object}           [block=null] Optional: block to get info from
 * @return {Promise<Boolean>}              Whether account is block producer
 */
exports.isProducer = function (block = null) {
    return (block === null)
        && chain.getLatest().then((block) => state.isBlockProducer(block.state, me.hexAddress))
        || Promise.resolve(state.isBlockProducer(block.state, me.hexAddress));
};
