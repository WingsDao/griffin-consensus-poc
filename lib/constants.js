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
exports.VOTE_METHOD_SIG  = 'vote(address,uint256)';
exports.STAKE_METHOD_SIG = 'stake(uint256)';

/**
 * Certificate price.
 *
 * @type {Number}
 */
exports.CERTIFICATE_PRICE = 100;
