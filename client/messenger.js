/**
 * @module client/messenger
 */

'use strict';

const transport = require('core/transport');

exports.waitFor    = waitFor;
exports.waitForAll = waitForAll;

async function waitForAll(evt, count = 1, wait = 1000) {
    const result = [];

    return new Promise((resolve) => {

        const success = () => { transport.removeListener(evt, listener); resolve(result); };

        function listener(data, msg, meta) {
            (result.push({data, msg, meta}) === count) && success;
        }

        transport.on(evt, listener);
        setTimeout(success, wait);
    });
}

async function waitFor(evt, wait = 1000) {
    return new Promise((resolve, reject) => {
        transport.once(evt, function (data, msg, meta) {
            resolve({data, msg, meta});
        });

        setTimeout(reject, wait);
    });
}
