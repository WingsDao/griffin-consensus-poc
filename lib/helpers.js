/**
 * @module lib/helpers
 */

'use strict';

const rlp       = require('rlp');
const secp256k1 = require('secp256k1');
const keccak256 = require('keccak256');
const ethUtil   = require('ethereumjs-util');

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

/**
 * Sign transaction.
 *
 * @param  {String} secretKey
 * @param  {Object} tx
 * @param  {String} chainId
 * @return {Object}
 */
exports.sign = function sign(secretKey, tx, chainId) {
    const encodedData = rlp.encode(JSON.stringify(tx));
    const msgHash = keccak256(encodedData);
    const sig = secp256k1.sign(msgHash, secretKey);
    const recovery = sig.recovery;

    const signature = {
        r: sig.signature.slice(0, 32),
        s: sig.signature.slice(32, 64),
        v: chainId ? recovery + (chainId * 2 + 35) : recovery + 27
    };

    return Object.assign(tx, signature);
};
