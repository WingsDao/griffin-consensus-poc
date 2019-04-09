/**
 * @module core/account
 */

'use strict';

const MerkleTree    = require('merkletreejs');
const {randomBytes} = require('crypto');
const secp256k1     = require('secp256k1');
const keccak256     = require('keccak256');
const helpers       = require('lib/helpers');
const ethereumTx    = require('ethereumjs-tx');
const ethRpc        = require('eth-json-rpc')('http://localhost:8545');

module.exports = Account;

/**
 * Zero address (20 zero bytes with 0x prefix).
 *
 * @type {String}
 */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const VOTE_METHOD_SIG  = 'vote(address,uint256)';
const STAKE_METHOD_SIG = 'stake(uint256)';

/**
 * Certificate price.
 *
 * @type {Number}
 */
const CERTIFICATE_PRICE = 100;

/**
 * General account @class.
 */
function Account(secretKey) {
    if (!new.target) {
        return new Account(secretKey);
    }

    while (!secretKey || !secp256k1.privateKeyVerify(secretKey)) {
        secretKey = randomBytes(32);
    }

    const publicKey = secp256k1.publicKeyCreate(Buffer.from(secretKey, 'hex'), false).slice(1);
    const address   = keccak256(publicKey).slice(12);

    Object.defineProperties(this, {
        secretKey:    {value: secretKey},
        publicKey:    {value: publicKey},
        address:      {value: address},
        nonce:        {value: 0},
        balance:      {value: 0},
        rating:       {value: 0},
        certificates: {value: []},
        votes:        {value: []}
    });
}

/**
 * Creates new serialized signed transaction.
 *
 * @example
 * const signedTx = {
 *   nonce: '0x00',
 *   gasPrice: '0x09184e72a000',
 *   gasLimit: '0x2710',
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: '0x00',
 *   data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
 *   v: '0x1c',
 *   r: '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
 *   s: '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13'
 * };
 * const serializedTx = '0xf8a280808094000000000000000000000000000000000000000064b8445f74bbde00000000000000000000000023e109eefb680fa623dde2e878f40e3f47b23c4a00000000000000000000000000000000000000000000000000000000000000641ba0933354095cea00453b7d5e589a6c416d500271fcdb2b703553fbedd2e670c720a013ec04710f3a51e5b98b8e1ac5d62fae0bfc35a6c79fa0f940faf5963ac70a99';
 *
 * @param  {String} to    Receiver of transaction.
 * @param  {String} value Value to send.
 * @param  {String} data  Data to send.
 * @return {String}       Serialized signed transaction.
 */
Account.prototype.tx = function tx(to, value, data='0x00') {
    const tx = new ethereumTx({nonce: this.nonce, to, value, data});
    tx.sign(this.secretKey);

    return '0x' + tx.serialize().toString('hex');
};

/**
 * Get address of account as hex string.
 *
 * @returns {string} Address as hex string.
 */
Account.prototype.getHexAddress = function getHexAddress() {
    return '0x' + this.address.toString('hex');
};

/**
 * Vote for delegate.
 *
 * @param  {String} address Address of delegate.
 * @param  {Number} amount  Amount to coins to use for vote.
 * @return {String}         Serialized signed transaction.
 */
Account.prototype.vote = function vote(address, amount) {
    const data = helpers.encodeTxData(VOTE_METHOD_SIG, [address, amount]);

    return this.tx(ZERO_ADDRESS, amount, data);
};

/**
 * Perform a stake
 * (lock coins and get certificates).
 *
 * @param  {Number} amount Amount of coins to stake.
 * @return {String}        Serialized signed transaction.
 */
Account.prototype.stake = function stake(amount) {
    const data = helpers.encodeTxData(STAKE_METHOD_SIG, [amount]);

    return this.tx(ZERO_ADDRESS, amount, data);
};

/**
* Produce the block.
*
* @param  {Object}   parentBlock  Parent block.
* @param  {String[]} transactions Array of transactions to include in new block.
* @return {Object}                Block.
*/
Account.prototype.produceBlock = function produceBlock(parentBlock, transactions) {
    let block = {};

    block.number     = parentBlock.number + 1;
    block.parentHash = parentBlock.hash;
    block.hash       = '0x' + keccak256(parentBlock.hash).toString('hex');
    block.producer   = this.getHexAddress();
    block.state      = parentBlock.state    || [];
    block.receipts   = parentBlock.receipts || [];
    block.txRoot     = merkleRoot(transactions);

    // genesis block state initiation
    if (parentBlock.alloc) {
        for (const allocObject of parentBlock.alloc) {
            const address = Object.keys(allocObject)[0];
            block.state.push(emptyAccount(address, allocObject[address].balance));
        }
    }

    for (let txIndex = 0; txIndex < transactions.length; txIndex++) {
        const serializedTx = transactions[txIndex];
        const tx           = helpers.toTxObject(serializedTx);
        const sender       = block.state.find(account => account.address === tx.from);

        if (!sender) { throw 'Sender account doesn\'t exist'; }

        switch (true) {
            case isVote(tx.data): {
                const [delegate, votes] = ethRpc.utils.decodeRawOutput(['address', 'uint256'], tx.data.slice(10));

                sender.balance -= votes;
                sender.locked  += votes;

                sender.votes.push({
                    delegate,
                    amount: votes
                });

                break;
            }
            case isStake(tx.data): {
                const amount = ethRpc.utils.decodeRawOutput(['uint256'], tx.data.slice(10));

                const nCertificates = Math.floor(amount / CERTIFICATE_PRICE);
                const totalPrice    = nCertificates * CERTIFICATE_PRICE;

                if (sender.balance < totalPrice) { throw 'Sender doesn\'t have enough coin in his purse.'; }

                sender.balance -= totalPrice;
                sender.locked  += totalPrice;

                for (let i = 0; i < nCertificates; i++) {
                    sender.certificates.push('0x' + randomBytes(32).toString('hex'));
                }

                break;
            }
            default: {
                // handle as normal tx

                let receiver = block.state.find(account => account.address === tx.to);
                const value  = parseInt(tx.value, 16);

                if (value < 0) { throw 'Invalid value.'; }

                if (sender.balance < value) { throw 'Sender doesn\'t have enough coin in his purse.'; }

                if (!receiver) {
                    receiver = emptyAccount(tx.to);
                    block.state.push(receiver);
                }

                sender.balance   -= value;
                receiver.balance += value;
            }
        }

        const receipt = {
            blockHash:        block.hash,
            blockNumber:      block.number,
            transactionHash:  '0x' + keccak256(serializedTx).toString('hex'),
            transactionIndex: txIndex,
            from:             tx.from,
            to:               tx.to
        };

        block.receipts.push(receipt);
    }

    block.stateRoot    = merkleRoot(block.state.map(account => JSON.stringify(account)));
    block.receiptsRoot = merkleRoot(block.receipts.map(receipt => JSON.stringify(receipt)));

    return block;
};

/**
 * Check whether tx action is vote.
 *
 * @param  {String}  data Transaction data.
 * @return {Boolean}
 */
function isVote(data) {
    return data.slice(0, 2 + helpers.METHOD_SIGNATURE_LENGTH) === helpers.encodeTxData(VOTE_METHOD_SIG);
}

/**
 * Check whether tx action is stake.
 *
 * @param  {String}  data Transaction data.
 * @return {Boolean}
 */
function isStake(data) {
    return data.slice(0, 2 + helpers.METHOD_SIGNATURE_LENGTH) === helpers.encodeTxData(STAKE_METHOD_SIG);
}

/**
 * Generate merkle tree root.
 *
 * @param  {String[]} rawLeaves
 * @return {String}             Tree root.
 */
function merkleRoot(rawLeaves) {
    const leaves = rawLeaves.map(rawLeaf => keccak256(rawLeaf));
    const tree   = new MerkleTree(leaves, keccak256);

    return '0x' + tree.getRoot().toString('hex');
}

/**
 * Freshly created account.
 *
 * @param  {String} address     Name which links thee to this world of blockchain.
 * @param  {Number} [balance=0] Initial balance (positive in case of genesis allocation).
 * @return {Object}             Empty account.
 */
function emptyAccount(address, balance=0) {
    return {
        address,
        balance,
        locked: 0,
        nonce:  0,
        rating: 0,
        certificates: [],
        votes:       []
    };
}
