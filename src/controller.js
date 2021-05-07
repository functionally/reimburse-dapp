
import * as Address     from "./address.js"
import * as Blockfrost  from "./blockfrost.js"
import * as Encryption  from "./encryption/webapi.js"
import * as Secrets     from "./secrets.js"
import * as Transaction from "./transaction.js"



export let theAddress = null


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

  Address.useTestnet()

  let secrets = localStorage.getItem("secrets")
  if (!secrets || secrets == "null") {
    secrets = prompt("Secrets:", "")
    localStorage.setItem("secrets", secrets)
  }

  const password = prompt("Password:", "")

  Secrets.initialize(secrets, password).then(() => {
    Blockfrost.setKey(Secrets.blockfrostKey)
    const theVerificationKey = Address.makeVerificationKey(Secrets.theSigningKey)
    theAddress = Address.makeAddress(theVerificationKey)
    linkAddress(thisAddress, theAddress.to_bech32())
    linkAddress(thatAddress, Secrets.outputAddress.to_bech32())
  })

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

export function refresh(address, element, button) {
  element.innerHTML = ""
  button.disabled = true
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
      button.disabled = false
    }).catch(e => {
      theResult.innerText = e
      button.disabled = false
    })
  }).catch(e => {
    theResult.innerText = e
    button.disabled = false
  })
}


window.checkInput        = checkInput
window.refreshRequests   = () => refresh(Secrets.outputAddress, outstandingRequests , refreshRequestsButton )
window.refreshResponses  = () => refresh(theAddress           , outstandingResponses, refreshResponsesButton)
window.setup             = setup
window.submitTransaction = submit
