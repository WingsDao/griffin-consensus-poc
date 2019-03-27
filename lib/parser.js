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
 * @return {Object}
 */
module.exports = function parse(state) {
    let delegates = new Map();

    let totalCertificates = 0;

    state.forEach(({certificates, votes}) => {
        totalCertificates += certificates.length;

        votes.forEach(({delegate, amount}) => {
            const existingDelegate = delegates.get(delegate);

            if (existingDelegate) {
                delegates.set(delegate, existingDelegate + amount);
            } else {
                delegates.set(delegate, +amount);
            }
        });
    });

    return {
        delegates,
        totalCertificates
    };
};
