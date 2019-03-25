/**
 * Block state parser.
 *
 * @module lib/parser
 */

'use strict';

exports.getDelegates = getDelegates;

/**
 * Retrieve map of delegates from block state.
 *
 * @param  {Object} state
 * @return {Map}
 */
function getDelegates(state) {
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
}
