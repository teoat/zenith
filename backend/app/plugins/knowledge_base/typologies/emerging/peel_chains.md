# Emerging Typology: Peel Chains (Crypto Laundering)

## Definition
A "Peel Chain" is a money laundering technique used to obscure the source of large amounts of cryptocurrency. A large wallet balance is laundered by peeling off small amounts through a long series of transactions.

## Mechanism
1.  Wallet A has 100 BTC.
2.  Transaction 1: Sends 1 BTC to Exchange (to cash out) and 99 BTC to Wallet B (Change address).
3.  Transaction 2: Wallet B sends 1 BTC to Mixer and 98 BTC to Wallet C.
4.  ... Repeats hundreds of times.

## Indicators & Red Flags

- **High Velocity**: Rapid succession of transactions.
- **Fixed Output**: Small, consistent amounts "peeled" off at each hop.
- **Change Addresses**: Large remaining balance constantly moving to new addresses.

## Detection Logic

- **Graph Analysis**: Visualizing the "chain" structure (long single path vs star topology).
- **Entity Scoring**: Use blockchain analytics (Chainalysis/TRM) to identify if the "peels" land at High Risk Exchanges or Darknet Markets.

## Response
- Mark the entire cluster of addresses as High Risk.
- File SAR including all known addresses in the chain.
