
import * as Address     from "./address.js"
import * as Blockfrost  from "./blockfrost.js"
import * as Encryption  from "./encryption/webapi.js"
import * as Secrets     from "./secrets.js"
import * as Transaction from "./transaction.js"


Blockfrost.setKey(Secrets.blockfrostKey)


export const theVerificationKey = Address.makeVerificationKey(Secrets.theSigningKey)

export const theAddress = Address.makeAddress(theVerificationKey)


function linkAddress(src, address) {
  const a = document.createElement("A")
  a.target = "_reimburse"
  a.href = "https://explorer.cardano-testnet.iohkdev.io/en/address?address=" + address
  a.innerText = address.slice(0, 20) + "…" + address.slice(-20)
  src.innerHTML = ""
  src.appendChild(a)
}


function linkTxId(src, txid) {
  const a = document.createElement("A")
  a.target = "_reimburse"
  a.href = "https://explorer.cardano-testnet.iohkdev.io/en/transaction?id=" + txid
  a.innerText = txid.slice(0, 20) + "…" + txid.slice(-20)
  src.innerHTML = ""
  src.appendChild(a)
}


export function setup() {
  linkAddress(thisAddress, theAddress.to_bech32())
  linkAddress(thatAddress, Secrets.outputAddress.to_bech32())
}


export function checkInput() {
  submitButton.disabled = theDate == "" || parseFloat(theAmount.value) <= 0 || thePurpose.value == ""
  theResult.innerText = ""
}


export function submit() {

  modal.style.display = "unset"

  theResult.innerText = "Submitting . . ."

  const password = encryptButton.checked ? Secrets.thePassword : null

  const metadataJson = {
    date    : theDate.value
  , amount  : theAmount.value
  , purpose : thePurpose.value
  }

  Transaction.submitMetadata(
    Secrets.theSigningKey
  , Secrets.outputAddress
  , metadataJson
  , password
  ).then(txid => {
    linkTxId(theResult, txid)
    theDate.value = ""
    theAmount.value = ""
    thePurpose.value = ""
    modal.style.display = "none"
  }).catch(e => {
    theResult.innerText = e
    modal.style.display = "none"
  })
}


let seen = {}

export function refresh(address, element) {
  element.innerHTML = ""
  refreshRequestsButton.disabled = true
  refreshResponsesButton.disabled = true
  Blockfrost.queryUtxo(address).then(utxos => {
    Promise.all(
      utxos.map(utxo => {
        const txid = utxo.tx_hash
        if (utxo.tx_index == 0) {
          const tr = document.createElement("TR")
          const tdTxid = document.createElement("TD")
          linkTxId(tdTxid, txid)
          tr.appendChild(tdTxid)
          const tdDate = document.createElement("TD")
          tr.appendChild(tdDate)
          const tdAmount = document.createElement("TD")
          tdAmount.className = "number"
          tr.appendChild(tdAmount)
          const tdPurpose = document.createElement("TD")
          tr.appendChild(tdPurpose)
          if (txid in seen) {
            const json = seen[txid]
            if (json) {
              tdDate.innerText = json.date
              tdAmount.innerText = parseFloat(json.amount).toFixed(2)
              tdPurpose.innerText = json.purpose
              element.appendChild(tr)
            }
          } else
            return Blockfrost.fetchMetadata(txid).then(metadatas => {
              seen[txid] = null
              Promise.all(metadatas.map(metadata => {
                Transaction.extractMetadata(metadata, Secrets.thePassword).then(json => {
                  if (json) {
                    tdDate.innerText = json.date
                    tdAmount.innerText = parseFloat(json.amount).toFixed(2)
                    tdPurpose.innerText = json.purpose
                    element.appendChild(tr)
                    seen[txid] = json
                  }
                })
              }))
            })
        }
      })
    ).then(() => {
      refreshRequestsButton.disabled = false
      refreshResponsesButton.disabled = false
    }).catch(e => {
      theResult.innerText = e
      refreshRequestsButton.disabled = false
      refreshResponsesButton.disabled = false
    })
  }).catch(e => {
    theResult.innerText = e
    refreshRequestsButton.disabled = false
    refreshResponsesButton.disabled = false
  })
}


window.checkInput        = checkInput
window.refreshRequests   = () => refresh(Secrets.outputAddress, outstandingRequests )
window.refreshResponses  = () => refresh(theAddress           , outstandingResponses)
window.setup             = setup
window.submitTransaction = submit
