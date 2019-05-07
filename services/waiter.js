/**
 * @module network/waiter
 */

'use strict';

const msg  = require('core/transport');
const wait = require('util').promisify(setTimeout);

exports.wait        = wait;
exports.collect     = collect;
exports.waitFor     = waitFor;
exports.waitForAll  = waitForAll;
exports.waitForCond = waitForCond;

/**
 * Collect as many events as possible in 'wait' amount of time.
 *
 * @param  {String}  evt         Name of the event to collect.
 * @param  {Number}  [wait=1000] Number of milliseconds to collect
 * @return {Promise}             Promise with collected data
 */
async function collect(evt, wait = 1000) {
    const result = [];

    return new Promise((resolve) => {

        msg.on(evt, listener);

        setTimeout(function success() {
            msg.off(evt, listener);
            resolve(result);
        }, wait);

        function listener(data, msg, meta) {
            result.push({data, msg, meta});
        }
    });
}

/**
 * Listen to specific event and apply callback to it.
 * When cb(data, msg, meta) returns 'truthy value' resolve Promise with that data.
 *
 * @param  {String}   evt         Event to listen to and whose results to filter
 * @param  {Function} cb          Callback to check results
 * @param  {Number}   [wait=1000] Number of milliseconds to wait
 * @return {Promise}              Promise with result when cb returned true or null when timeout reached
 */
async function waitForCond(evt, cb, wait = 1000) {
    return new Promise(async function (resolve) {

        msg.on(evt, listener);
        setTimeout(() => msg.off(evt, listener) && resolve(null), wait);

        function listener(data, message, meta) {
            if (cb(data, message, meta)) {
                msg.off(evt, listener);
                resolve({data, msg: message, meta});
            }
        }
    });
}

/**
 * Wait for N number of emitted events or for K milliseconds.
 * This method helps collecting all emitted events in application
 *
 * @param  {String}  evt         Name of the event to await in transport
 * @param  {Number}  [count=1]   Minimal suffisient number of responses to resolve Promise
 * @param  {Number}  [wait=1000] Number of milliseconds after which Promise will also be resolved
 * @return {Promise}             Array of objects within Promise
 */
async function waitForAll(evt, count = 1, wait = 1000) {
    const result = [];
    const finite = (wait !== Infinity);

    return new Promise((resolve) => {
        const success = () => { msg.off(evt, listener); resolve(result); };

        function listener(data, msg, meta) {
            (result.push({data, msg, meta}) === count) && success();
        }

        msg.on(evt, listener);
        finite && setTimeout(success, wait);
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
    const finite = (wait !== Infinity);

    return new Promise((resolve) => {
        msg.once(evt, function (data, msg, meta) {
            resolve({data, msg, meta});
        });

        finite && setTimeout(resolve.bind(null, null), wait);
    });
}
