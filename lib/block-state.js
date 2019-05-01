/**
 * Important to note:
 *
 * - voting power: sum of balances of voters
 *
 * @module core/state-parser
 */

'use strict';

const config = require('lib/constants');
const utils  = require('lib/helpers');

/**
 * Local import of CERTIFICATE_PRICE variable
 * @type {Number}
 */
const CERT_PRICE = config.CERTIFICATE_PRICE;

/**
 * This module can be either used as set of exported functions or as a wrapper for
 * one block's state.
 *
 * @param  {State}  state Block state to wrap
 * @return {Object}       Wrapped state with same methods as others
 */
module.exports = exports = function parser(state) {
    const wrapper = {};

    Object.keys(exports).forEach((key) => {

        wrapper[key] = exports[key].bind(null, state);

        if (key.slice(0, 3) === 'get' && exports[key].length === 1) {
            Object.defineProperty(wrapper, key.replace(/get([A-Z])/, (m, l) => l.toLowerCase()), {
                get: exports[key].bind(null, state)
            });
        }
    });

    return wrapper;
};

exports.getAccount      = getAccount;
exports.getVotesMap     = getVotesMap;
exports.getProducersMap = getProducersMap;

/**
 * Get balance of address from current state. 0 if acccount does not exist.
 *
 * @param  {State}  [state=[]] Block state to parse
 * @param  {Strgin} address    Address to get balance of
 * @return {NUmber}            Balance of account or 0
 */
exports.getBalance = function getBalance(state, address) {
    return getAccount(state, address).balance;
};

/**
 * Get array of delegates addresses (even those who didn't choose themselves).
 *
 * @param  {State}    [state=[]] Block state to parse
 * @return {String[]}            Array of addresses of delegates
 */
exports.getDelegates = function getDelegates(state) {
    return Array.from(getVotesMap(state).keys());
};

/**
 * Get amount of voting power a delegate has.
 *
 * @param  {State}  [state=[]] Block state to parse
 * @param  {Strgin} address    Address to get power of
 * @return {Number}            Amount of voting power
 */
exports.getVotesFor = function getVotesFor(state, address) {
    return getVotesMap(state).get(address) || 0;
};

/**
 * Check whether address is delegate (i.e. has any votes).
 *
 * @param  {State}   [state=[]] Block state to parse
 * @param  {String}  address    Address to check
 * @return {Boolean}            Whether someone voted
 */
exports.isDelegate = function isDelegate(state, address) {
    return getVotesMap(state).has(address);
};

/**
 * Get array of delegates addresses (even those who didn't choose themselves).
 *
 * @param  {State}    [state=[]] Block state to parse
 * @return {String[]}            Array of addresses of delegates
 */
exports.getBlockProducers = function getBlockProducers(state) {
    return Array.from(getProducersMap(state).keys());
};

/**
 * Get number of certificates of account.
 *
 * @param  {State}  [state=[]] Block state to parse
 * @param  {String} address    Address to check
 * @return {Number}            Number of certificates account has
 */
exports.getCertificatesCount = function getCertificatesCount(state, address) {
    return Math.floor(getAccount(state, address).locked / CERT_PRICE);
};

/**
 * Check whether address is delegate (i.e. has at least 1 certificate).
 *
 * @param  {State}   [state=[]] Block state to parse
 * @param  {String}  address    Address to check
 * @return {Boolean}            Whether account is block producer or not
 */
exports.isBlockProducer = function isBlockProducer(state, address) {
    return getAccount(state, address).locked > CERT_PRICE;
};

/**
 * Get account from blockchain state or create empty when there's no.
 *
 * @param  {State}  state   Block state to parse
 * @param  {String} address Address to access account
 * @return {Object}         State record for account
 */
function getAccount(state, address) {
    return Object.assign(utils.emptyAccount(), state.find((account) => (address === account.address)));
}

/**
 * Build Map: address -> number of certificates address has from his locked funds.
 *
 * @param  {State} state Block state to parse
 * @return {Map}         Map with certificates by address
 */
function getProducersMap(state) {
    const producers = new Map();

    for (let account of state) {
        producers.set(account.balance, Math.floor(account.locked / CERT_PRICE));
    }

    return producers;
}

/**
 * Build Map: address -> sum of the balances of voters for this address.
 *
 * @param  {State} state Block state to parse
 * @return {Map}         Map with each delegate's votes
 */
function getVotesMap(state) {
    const delegates = new Map();

    for (let account of state) {
        account.votes.forEach((voteFor) => {
            delegates.has(voteFor)
                && delegates.set(voteFor, delegates.get(voteFor) + account.balance)
                || delegates.set(voteFor, account.balance);
        });
    }

    return delegates;
}
