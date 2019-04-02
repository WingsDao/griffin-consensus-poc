/**
 * @module test/unit/account
 */

'use strict';

require('chai').should();

const Account = require('core/account');
const helpers = require('lib/helpers');
const genesis = require('genesis');
const parser  = require('lib/parser');

/**
 * Secret key used for testing.
 *
 * @type {String}
 */
const SECRET_KEY = Buffer.from('557dce58018cf502a32b9b7723024805399350d006a4f71c3b9f489f7085cb50', 'hex');

describe('Accounts', () => {
    let account = {};
    let target  = {};
    let block   = {};
    let signature = null;

    const AMOUNT_TO_VOTE  = 100;
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
        const toAddress    = '0x' + target.address.toString('hex');
        const serializedTx = account.tx(toAddress, '0xff');

        transactions.push(serializedTx);

        const tx = helpers.toTxObject(serializedTx);

        tx.from.should.be.equal('0x' + account.address.toString('hex'));
        tx.to.should.be.equal(toAddress);
    });

    it('vote tx', () => {
        const serializedTx = account.vote('0x' + target.address.toString('hex'));

        transactions.push(serializedTx);
    });

    it('stake tx', () => {
        const serializedTx = account.stake(AMOUNT_TO_VOTE);

        transactions.push(serializedTx);
    });

    it('produce first block and get list of delegates', () => {
        block = account.produceBlock(genesis, transactions);

        console.log('New block:', block.state[0]);

        // TODO Check state for:
        // - change in balance after transfer
        // - vote
        // - certificate
    });

    it('parse block state', () => {
        const normalizedState = parser(block.state);

        console.log('Delegates:', normalizedState.delegates);
        console.log('Amount of certificates:', normalizedState.totalCertificates);
    });

    it('sign message with account secret key', () => {
        signature = account.signMessage(MESSAGE);

        signature.length.should.be.equal(64);
        console.log('Signature: ', signature);
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
