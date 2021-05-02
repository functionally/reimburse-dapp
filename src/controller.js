
const Address     = require("./address.js"    )
const Blockfrost  = require("./blockfrost.js" )
const Encryption  = require("./encryption.js" )
const Secrets     = require("./secrets.js"    )
const Transaction = require("./transaction.js")

require("buffer")


const autoRefresh = false


Blockfrost.setKey(Secrets.blockfrostKey)


const theVerificationKey = Address.makeVerificationKey(Secrets.theSigningKey)

const theAddress = Address.makeAddress(theVerificationKey)


function doWaiting(waiting) {
  document.getElementById("theBody").style.cursor = waiting ? "wait" : "default"
}


function linkAddress(src, address) {
  const a = document.createElement("A")
  a.target = "_reimburse"
  a.href = "https://explorer.cardano-testnet.iohkdev.io/en/address?address=" + address
  a.innerText = address.slice(0, 20) + "..." + address.slice(-20)
  src.innerHTML = ""
  src.appendChild(a)
}


function linkTxId(src, txid) {
  const a = document.createElement("A")
  a.target = "_reimburse"
  a.href = "https://explorer.cardano-testnet.iohkdev.io/en/transaction?id=" + txid
  a.innerText = txid.slice(0, 20) + "..." + txid.slice(-20)
  src.innerHTML = ""
  src.appendChild(a)
}


function setup() {

  linkAddress(thisAddress, theAddress.to_bech32())
  linkAddress(thatAddress, Secrets.outputAddress.to_bech32())

  if (autoRefresh)
    setTimeout(refresh, 10000)

}


function checkInput() {
  document.getElementById("submit").disabled = parseFloat(theAmount.value) <= 0 || thePurpose.value == ""
  theResult.innerText = ""
}


function submit() {

  doWaiting(true)

  theResult.innerText = "Submitting . . ."

  const password = encrypt.checked ? Secrets.thePassword : null

  const metadataJson = {
    amount  : theAmount.value
  , purpose : thePurpose.value
  }

  Transaction.submitMetadata(
    Secrets.theSigningKey
  , Secrets.outputAddress
  , metadataJson
  , password
  ).then(txid => {
    linkTxId(theResult, txid)
    theAmount.value = 0
    thePurpose.value = ""
    doWaiting(false)
    if (autoRefresh)
      setTimeout(refresh, 10000)
  }).catch(e => {
    theResult.innerText = e
    doWaiting(false)
  })
}


function refresh() {
  theOutstanding.innerHTML = ""
  Blockfrost.queryUtxo(Secrets.outputAddress).then(utxos => {
    utxos.forEach(utxo => {
      const txid = utxo.tx_hash
      const tr = document.createElement("TR")
      const tdTxId = document.createElement("TD")
      linkTxId(tdTxId, txid)
      tr.appendChild(tdTxId)
      const tdAmount = document.createElement("TD")
      tdAmount.className = "number"
      tr.appendChild(tdAmount)
      const tdPurpose = document.createElement("TD")
      tr.appendChild(tdPurpose)
      Blockfrost.fetchMetadata(txid).then(metadatas => {
        metadatas.forEach(metadata => {
          json = Transaction.extractMetadata(metadata, Secrets.thePassword)
          if (json) {
            tdAmount.innerText = parseFloat(json.amount).toFixed(2)
            tdPurpose.innerText = json.purpose
            theOutstanding.appendChild(tr)
          }
        })
      })
    })
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

, setup      : setup
, submit     : submit
, checkInput : checkInput
, refresh    : refresh

}
