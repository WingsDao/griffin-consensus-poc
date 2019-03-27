/**
 * Block state parser.
 *
 * @module lib/parser
 */

'use strict';

/**
 * Retrieve map of delegates from block state.
 *
 * @param  {Object} state
 * @return {Map}
 */
exports.getDelegates = function getDelegates(state) {
    let delegates = new Map();

    state.forEach(({votes}) => {
        votes.forEach(({delegate, amount}) => {
            amount = +amount;

            const existingDelegate = delegates.get(delegate);

            if (existingDelegate) {
                delegates.set(delegate, existingDelegate + amount);
            } else {
                delegates.set(delegate, amount);
            }
        });
    });

    return delegates;
};

/**
 * Get number of all certificates.
 *
 * @param  {Object} state
 * @return {Number}
 */
exports.getCertificatesAmount = function getCertificatesAmount(state) {
    let amount = 0;

    state.forEach(({certificates}) => {
        amount += certificates.length;
    });

    return amount;
};
