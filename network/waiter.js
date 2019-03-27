/**
 * @module network/waiter
 */

'use strict';

const msg = require('core/transport');

exports.waitFor    = waitFor;
exports.waitForAll = waitForAll;

/**
 * Wait for N number of emitted events or for K milliseconds.
 * This method helps collecting all emitted events in application
 *
 * @param  {String}  evt         Name of the event ro await in transport
 * @param  {Number}  [count=1]   Minimal suffisient number of responses to resolve Promise
 * @param  {Number}  [wait=1000] Number of milliseconds after which Promise will also be resolved
 * @return {Promise}             Array of objects within Promise
 */
async function waitForAll(evt, count = 1, wait = 1000) {
    const result = [];

    return new Promise((resolve) => {
        const success = () => { msg.removeListener(evt, listener); resolve(result); };

        function listener(data, msg, meta) {
            (result.push({data, msg, meta}) === count) && success;
        }

        msg.on(evt, listener);
        setTimeout(success, wait);
    });
}

/**
 * Fait for specific event and resolve Promise when event is emitted.
 * For safety timeout added. Promise will be rejected by timeout.
 *
 * @param  {String}  evt         Name of the event to wait for
 * @param  {Number}  [wait=1000] Max wait time after which Promise is rejected
 * @return {Promise}             Promise with event data when succeeded and with null when not
 */
async function waitFor(evt, wait = 1000) {
    return new Promise((resolve) => {
        msg.once(evt, function (data, msg, meta) {
            resolve({data, msg, meta});
        });

        setTimeout(resolve.bind(null, null), wait);
    });
}
