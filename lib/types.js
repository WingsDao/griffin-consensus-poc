'use strict';

/* block */
exports.block = {
    number:       'string',
    hash:         'string',
    parentHash:   'string',
    timestamp:    'string',
    producer:     'string',
    stateRoot:    'string',
    txRoot:       'string',
    receiptsRoot: 'string',
    state:        'object[]',
    transactions: 'object[]',
    receipts:     'object[]'
};

/* tx */
exports.tx = {
    from:  'string',
    to:    'string',
    nonce: 'string',
    value: 'string',
    data:  'string'
};

/* tx receipt */
exports.receipt = {
    blockHash:        'string',
    blockNumber:      'number',
    transactionHash:  'string',
    transactionIndex: 'number',
    from:             'string',
    to:               'string'
};

/* regular account */
exports.account = {
    secretKey:    'string',
    publicKey:    'string',
    address:      'string',
    nonce:        'number',
    balance:      'number',
    rating:       'number',
    certificates: 'string[]',
    votes:        'string[]' // each entry is delegate address
};
