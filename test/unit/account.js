/**
 * @module test/unit/account
 */

'use strict';

require('chai').should();

const Account = require('core/account');
const helpers = require('lib/helpers');
const Genesis = require('lib/genesis');


/**
 * Secret key used for testing.
 *
 * @type {String}
 */
const SECRET_KEY  = Buffer.from('557dce58018cf502a32b9b7723024805399350d006a4f71c3b9f489f7085cb50', 'hex');

/**
 * Path to genesis block.
 *
 * @default 'genesis.json'
 * @type {Strig}
 */
const genesisPath = process.env.GENESIS_PATH || 'genesis.json';

describe('Accounts', () => {
    let account = {};
    let target  = {};
    let block   = {};
    let signature = null;

    /**
     * Initial account balance.
     * @see genesis.json
     *
     * @type {Number}
     */
    const INITIAL_AMOUNT = 100000000;
    const AMOUNT_TO_SEND = 100;
    const AMOUNT_TO_VOTE = 100;
    const MESSAGE = 'hello, this is some message';

    let transactions = [];

    before('create', () => {
        account = Account(SECRET_KEY);
        target  = Account();
    });

    it('correct secret key format', () => {
        const {secretKey} = account;

        secretKey.length.should.be.equal(32);
        (secretKey.constructor === Buffer).should.be.true;
    });

    it('correct public key format', () => {
        const {publicKey} = account;

        publicKey.length.should.be.equal(64);
        (publicKey.constructor === Buffer).should.be.true;
    });

    it('correct address format', () => {
        const {address} = account;

        address.length.should.be.equal(20);
        (address.constructor === Buffer).should.be.true;
    });

    it('standard tx', () => {
        const toAddress    = target.getHexAddress();
        const serializedTx = account.tx(toAddress, AMOUNT_TO_SEND);

        transactions.push(serializedTx);

        const tx = helpers.toTxObject(serializedTx);

        tx.from.should.be.equal(account.getHexAddress());
        tx.to.should.be.equal(toAddress);
    });

    it('vote tx', () => {
        const serializedTx = account.vote(target.getHexAddress());

        transactions.push(serializedTx);
    });

    it('stake tx', () => {
        const serializedTx = account.stake(AMOUNT_TO_VOTE);

        transactions.push(serializedTx);
    });

    it('produce first block and verify state', () => {
        const genesisBlock = Genesis.loadFromFile(genesisPath).getBlock();
        block = account.produceBlock(genesisBlock, transactions);

        const accountState = block.state[0];

        const currentAmount = INITIAL_AMOUNT - AMOUNT_TO_SEND - AMOUNT_TO_VOTE;

        accountState.balance.should.be.equal(currentAmount);
        accountState.votes.includes('0x' + target.address.toString('hex')).should.be.true;
        accountState.certificates.length.should.be.equal(1);
    });

    it('sign message with account secret key', () => {
        signature = account.signMessage(MESSAGE);

        signature.length.should.be.equal(64);
    });

    it('verify signed message', () => {
        const verified = Account.verifyMessage(MESSAGE, account.publicKey, signature);
        verified.should.be.true;
    });

    it('verify signed message with wrong message', () => {
        const verified = Account.verifyMessage('not that message', account.publicKey, signature);
        verified.should.be.false;
    });

    it('verify signed message with wrong public key', () => {
        const verified = Account.verifyMessage(MESSAGE, target.publicKey, signature);
        verified.should.be.false;
    });

    xit('produce second block', () => {

    });
});
