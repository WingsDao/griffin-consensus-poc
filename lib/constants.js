/**
 * Application-level constants.
 * In PoC variable and changeable with ENV.
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

/* Vote and stake method signatures */
exports.VOTE_METHOD_SIG  = 'vote(address)';
exports.STAKE_METHOD_SIG = 'stake(uint256)';

/**
 * Certificate price. In PoC we hardcode this value, whereas in Blockchain it will
 * be dynamic and will be recalculated on every block.
 *
 * ENV: CERTIFICATE_PRICE
 * @default 10
 * @type {Number}
 */
exports.CERTIFICATE_PRICE = process.env.CERTIFICATE_PRICE || 10;

/**
 * Active delegates count.
 * Total number of delegates equals this + number of 'active successor' delegates.
 *
 * ENV: ACTIVE_DELEGATES_COUNT
 * @default 31
 * @type {Number}
 */
exports.ACTIVE_DELEGATES_COUNT = process.env.ACTIVE_DELEGATES_COUNT || 31;

/**
 * Number of successor delegates to participate in consensus.
 * Total number of delegates equals this + number of active delegates.
 *
 * ENV: ACTIVE_SUCCESSOR_DELEGATES_COUNT
 * @default 2
 * @type {Number}
 */
exports.ACTIVE_SUCCESSOR_DELEGATES_COUNT = process.env.ACTIVE_SUCCESSOR_DELEGATES_COUNT || 2;
