## Core functionality test scenario

Actors:
- Alice - delegator
- Bob - delegator
- Clare - delegate
- Damir - delegate
- Elliot - block producer
- Fenrir - block producer

### Actions

#### 1. Send transaction

Alice sends `n` coins to Bob.

#### 2. Vote

Alice votes with `n` coins for Clare. Bob votes with `m` coins for Damir.

#### 3. Stake

Elliot and Fenrir stake their coins.

#### 4. Delegates generate random number

Random certificate is being chosen. Owner of the chosen certificate is the next block producer.

#### 5. Produce block

Selected block producer produces block.

#### 6. Validate block

Clare and Damir validate produced block.

#### 7. Network participants receive block

New block was added. Actors receive it and verify that their transactions were included.
