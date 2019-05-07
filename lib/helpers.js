/**
 * @module lib/helpers
 */

'use strict';

const rb            = require('crypto').randomBytes;
const secp256k1     = require('secp256k1');
const rlp           = require('rlp');
const keccak256     = require('keccak256');
const MerkleTree    = require('merkletreejs');
const ethUtil       = require('ethereumjs-util');
const ethereumAbi   = require('ethereumjs-abi');
const ethereumTx    = require('ethereumjs-tx');

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

    let tx = {
        nonce:    stringArray[0],
        gasPrice: stringArray[1],
        gasLimit: stringArray[2],
        to:       stringArray[3],
        value:    stringArray[4],
        data:     stringArray[5],
        v,
        r,
        s
    };

    const publicKey = new ethereumTx(tx).getSenderPublicKey();

    tx.from = '0x' + keccak256(publicKey).slice(12).toString('hex');

    return tx;
};

/**
 * Freshly created account.
 *
 * @param  {String} address Name which links thee to this world of blockchain.
 * @return {Object}         Empty account.
 */
exports.emptyAccount = function emptyAccount(address) {
    return {
        address,
        balance: 0,
        locked:  0,
        nonce:   0,
        rating:  0,
        certificates: [],
        votes:       []
    };
};

/**
 * Generate merkle tree root.
 *
 * @param  {String[]} rawLeaves
 * @return {String}             Tree root.
 */
exports.merkleRoot = function merkleRoot(rawLeaves) {
    const leaves = rawLeaves.map(rawLeaf => keccak256(rawLeaf));
    const tree   = new MerkleTree(leaves, keccak256);

    return '0x' + tree.getRoot().toString('hex');
};

/**
 * Get random item from array.
 *
 * @param  {Object[]} array
 * @return {Object}
 */
exports.getRandomFromArray = function getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generate random secret key.
 *
 * @return {Buffer} Secret key.
 */
exports.generateSecretKey = function generateSecretKey() {
    let secretKey;

    while (!secretKey || !secp256k1.privateKeyVerify(secretKey)) {
        secretKey = rb(32);
    }

    return secretKey;
};
