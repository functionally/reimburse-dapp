
import * as Address    from "./address.js"
import * as Encryption from "./encryption/webapi.js"

import {Buffer} from '../lib/buffer-es6/index.js'


export let blockfrostKey = null
export let outputAddress = null
export let theSigningKey = null
export let thePassword   = null

export function readSecrets(secrets) {
  blockfrostKey = secrets.blockfrostKey
  outputAddress = Address.from_bech32(secrets.outputAddress)
  theSigningKey = Address.readSigningKey(secrets.signingKey)
  return Encryption.importKey(secrets.password).then(key => {thePassword = key})
}


export function encryptSecrets(key, plaintext) {
  return Encryption.encryptJson(key, plaintext).then(ciphertext =>
    Buffer.from(ciphertext).toString("base64")
  )
}

export function decryptSecrets(key, ciphertext) {
  return Encryption.decryptJson(key, Buffer.from(ciphertext, "base64"))
}


export async function initialize(encryptedSecrets, password) {
  return Encryption.importKey(password).then(key =>
    decryptSecrets(key, encryptedSecrets).then(readSecrets)
  )
}
