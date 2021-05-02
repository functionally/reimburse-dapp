
const Address     = require("./address.js"   )
const Blockfrost  = require("./blockfrost.js")
const Secrets     = require("./secrets.js"   )
const Transaction = require("./transaction.js")

require("buffer")


Blockfrost.setKey(Secrets.blockfrostKey)


const theVerificationKey = Address.makeVerificationKey(Secrets.theSigningKey)

const theAddress = Address.makeAddress(theVerificationKey)


function linkAddress(src, address) {
  const a = document.createElement("A")
  a.target = "_cser"
  a.href = "https://explorer.cardano-testnet.iohkdev.io/en/address?address=" + address
  a.innerText = address.slice(0, 20) + "..." + address.slice(-20)
  src.innerHTML = ""
  src.appendChild(a)
}


function linkTxId(src, txid) {
  const a = document.createElement("A")
  a.target = "_cser"
  a.href = "https://explorer.cardano-testnet.iohkdev.io/en/transaction?id=" + txid
  a.innerText = "TxId: " + txid
  src.innerHTML = ""
  src.appendChild(a)
}


function setup() {

  linkAddress(thisAddress, theAddress.to_bech32())
  linkAddress(thatAddress, Secrets.outputAddress.to_bech32())

}


function submit() {

  const metadataJson = {
    amount  : theAmount.value
  , purpose : thePurpose.value
  }

  Transaction.submitMetadata(
    Secrets.theSigningKey
  , Secrets.outputAddress
  , metadataJson
  ).then(txid => {
    linkTxId(theResult, txid)
  }).catch(e => {
    theResult.innerText = e
  })
}


module.exports = {

  Address     : require("./address.js"    )
, Blockfrost  : require("./blockfrost.js" )
, Encryption  : require("./encryption.js" )
, Transaction : require("./transaction.js")

, Buffer  : Buffer
, Cardano : require("@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.js")

, thePassword        : Secrets.thePassword
, outputAddress      : Secrets.outputAddress
, theSigningKey      : Secrets.theSigningKey
, theVerificationKey : theVerificationKey
, theAddress         : theAddress

, setup  : setup
, submit : submit

}
