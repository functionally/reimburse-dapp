
let blockfrostUrl = null

export function setNetwork(mainnet) {
  if (mainnet)
    blockfrostUrl = "https://cardano-mainnet.blockfrost.io/api/v0/"
  else
    blockfrostUrl = "https://cardano-testnet.blockfrost.io/api/v0/"
}


let blockfrostKey = null

export function setKey(key) {
  blockfrostKey = key
}


export function callApi(path, payload = null) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open(payload == null ? "GET" : "POST", blockfrostUrl + path)
    xhr.setRequestHeader("project_id", blockfrostKey)
    if (payload != null)
      xhr.setRequestHeader("Content-Type", "application/cbor")
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        })
      }
    }
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      })
    }
    xhr.send(payload)
  })
}


export function queryUtxo(address) {
  return callApi("addresses/" + address.to_bech32() + "/utxos")
}


export function submitTransaction(tx) {
  return callApi("tx/submit", tx.to_bytes())
}


export function fetchMetadata(txid) {
  return callApi("txs/" + txid + "/metadata")
}
