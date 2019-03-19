'use strict';

/* block */
exports.block = {
    number:     'number',
    hash:       'string',
    parentHash: 'string',
    timestamp:  'number',
    producer:   'string',
    stateRoot:  'string',
    txRoot:     'string',
    logsRoot:   'string'
};

/* tx */
exports.tx = {
    from:  'string',
    to:    'number',
    nonce: 'number',
    value: 'number',
    data:  'string'
};

/* tx receipt */
exports.receipt = {
    blockHash:        'string',
    blockNumber:      'number',
    transactionHash:  'string',
    transactionIndex: 'number',
    from:             'string',
    to:               'number'
};

/* regular account */
exports.account = {
    secretKey:    'string',
    publicKey:    'string',
    address:      'string',
    nonce:        'string',
    balance:      'string',
    rating:       'string',
    certificates: 'string[]',
    votes:        'object[]'
};

/* vote for a delegate */
exports.vote = {
    delegate: 'string',
    amount:   'number'
};
