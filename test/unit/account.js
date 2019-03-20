/**
 * @module test/unit/account
 */

'use strict';

require('chai').should();

const Account = require('core/account');
const helpers = require('lib/helpers');
const genesis = require('core/genesis');

describe('Accounts', () => {
    let account = {};
    let target  = {};

    const AMOUNT_TO_STAKE = 100;
    const AMOUNT_TO_VOTE  = 100;

    let transactions = [];

    before('create', () => {
        account = Account();
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
        const serializedTx = account.tx('0x' + target.address.toString('hex'), '0xff');

        console.log('Standard serialized tx:', serializedTx);

        transactions.push(serializedTx);

        const tx = helpers.toTxObject(serializedTx);

        console.log('tx object', tx);
    });

    it('vote tx', () => {
        const serializedTx = account.vote('0x' + target.address.toString('hex'), AMOUNT_TO_STAKE);

        console.log('Vote serialized tx:', serializedTx);

        transactions.push(serializedTx);
    });

    it('stake tx', () => {
        const serializedTx = account.stake(AMOUNT_TO_VOTE);

        console.log('Stake serialized tx:', serializedTx);

        transactions.push(serializedTx);
    });

    it('produce first block', () => {
        const block = account.produceBlock(genesis, transactions);

        console.log('New block:', block);
    });

    xit('produce second block', () => {

    });
});
