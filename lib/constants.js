/**
 * Constants.
 *
 * @module lib/constants
 */

'use strict';

/**
 * Zero address (20 zero bytes with 0x prefix).
 *
 * @type {String}
 */
exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Method signatures.
 */
exports.VOTE_METHOD_SIG  = 'vote(address)';
exports.STAKE_METHOD_SIG = 'stake(uint256)';

/**
 * Certificate price.
 *
 * @type {Number}
 */
exports.CERTIFICATE_PRICE = 100;

/**
 * Active delegates amount.
 *
 * @type {number}
 */
exports.ACTIVE_DELEGATES_COUNT = 31;

/**
 *  Successor delegates amount.
 *
 * @type {number}
 */
exports.SUCCESSOR_DELEGATES_COUNT = 31;
