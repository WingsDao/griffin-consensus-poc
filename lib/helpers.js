/**
 * @module lib/helpers
 */

'use strict';

const keccak256   = require('keccak256');
const ethUtil     = require('ethereumjs-util');
const ethereumAbi = require('ethereumjs-abi');

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
 * Generate method signature and pack it with encoded data.
 *
 * @param  {String}   method Method ABI to get signature from.
 * @param  {Object[]} values Values to encode.
 * @return {String}          Hexadecimal tx data string with method signature and encoded values.
 */
exports.encodeTxData = function encodeTxData(method, values) {
    return values.length === 0
        && '0x' + keccak256(method).toString('hex').slice(0, 8)
        || '0x' + ethereumAbi.simpleEncode.apply(ethereumAbi, [method].concat(values)).toString('hex');
};

/**
 * Format decoded transaction to transaction object.
 *
 * @param  {Buffer[]} bufferArray Decoded transaction.
 * @return {Object}
 */
exports.toTxObject = function toTxObject(bufferArray) {
    const stringArray = bufferArray.map(buffer => '0x' + buffer.toString('hex'));
    return {
        nonce:    stringArray[0],
        gasPrice: stringArray[1],
        gasLimit: stringArray[2],
        to:       stringArray[3],
        value:    stringArray[4],
        data:     stringArray[5],
        v:        stringArray[6],
        r:        stringArray[7],
        s:        stringArray[8]
    };
};
