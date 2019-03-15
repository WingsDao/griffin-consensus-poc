/**
 * @module lib/helpers
 */

'use strict';

const ethUtil = require('ethereumjs-util');

/**
 * Generate v r s signature.
 *
 * @param  {Buffer} dataToSign Message to sign.
 * @param  {Buffer} secretKey  Secret key to sign message with.
 * @return {String}            Signature.
 */
exports.generateSignature = function generateSignature(dataToSign, secretKey) {
    const msg     = Buffer.from(dataToSign, 'hex');
    const msgHash = ethUtil.hashPersonalMessage(msg);
    const sig     = ethUtil.ecsign(msgHash, new Buffer(secretKey, 'hex'));

    return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
};
