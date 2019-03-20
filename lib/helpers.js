/**
 * @module lib/helpers
 */

'use strict';

const rlp          = require('rlp');
const keccak256    = require('keccak256');
const ethUtil      = require('ethereumjs-util');
const ethereumAbi  = require('ethereumjs-abi');
const ethereumUtil = require('ethereumjs-util');

/**
 * Default method signature length.
 *
 * @type {Number}
 * @default 8
 */
const METHOD_SIGNATURE_LENGTH = exports.METHOD_SIGNATURE_LENGTH = 8;

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
exports.encodeTxData = function encodeTxData(method, values=[]) {
    return values.length === 0
        && '0x' + keccak256(method).toString('hex').slice(0, METHOD_SIGNATURE_LENGTH)
        || '0x' + ethereumAbi.simpleEncode.apply(ethereumAbi, [method].concat(values)).toString('hex');
};

/**
 * Decode and format transaction to transaction object.
 *
 * @param  {Strinig} serializedTx Serialized transaction.
 * @return {Object}
 */
exports.toTxObject = function toTxObject(serializedTx) {
    const bufferArray = rlp.decode(serializedTx);
    const stringArray = bufferArray.map(buffer => '0x' + buffer.toString('hex'));

    const v = stringArray[6];
    const r = stringArray[7];
    const s = stringArray[8];

    const publicKey = ethereumUtil.ecrecover(keccak256(Buffer.from(serializedTx.slice(2), 'hex')), parseInt(v, 16), Buffer.from(r.slice(2), 'hex'), Buffer.from(s.slice(2), 'hex'));

    const from = '0x' + keccak256(publicKey).slice(12).toString('hex');

    console.log('from publicKey', from, '0x' + publicKey.toString('hex'));
    console.log('to', stringArray[3]);

    return {
        nonce:    stringArray[0],
        gasPrice: stringArray[1],
        gasLimit: stringArray[2],
        to:       stringArray[3],
        value:    stringArray[4],
        data:     stringArray[5],
        v,
        r,
        s,
        from
    };
};
