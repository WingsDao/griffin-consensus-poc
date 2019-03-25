# Pool/Chain sync mechanics

To provide fast setup of new node in this PoC application while keeping decentralisation.

1. New node emits event **REQUEST_CHAIN**
2. All the nodes in network receive it and emit number of blocks (or txs count in pool case) using **SHARE_CHAIN** event
3. Newbie decides from which node to pull data and sends **CREATE_CHAINDATA_SERVER**
4. Node with info sets up one-time HTTP server and sends **CHAINDATA_SERVER_CREATED** directly to newbit
5. New node pulls Chain or Pool data via HTTP and is now good to go

Described sequence is the same with pool, but events named differently:

```
CHAINDATA                | POOL
-------------------------+----------------------
REQUEST_CHAIN            | REQUEST_POOL
SHARE_CHAIN              | SHARE_POOL
CREATE_CHAINDATA_SERVER  | CREATE_POOL_SERVER
CHAINDATA_SERVER_CREATED | POOL_SERVER_CREATED
```
