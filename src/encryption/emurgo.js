
import {Buffer} from '../../lib/buffer-es6/index.js'

import * as Cardano from "../../lib/cardano-serialization-lib-asmjs/cardano_serialization_lib.js"


const SALT_SIZE = 32

const NONCE_SIZE = 12

const KEY_SIZE = 32


function encodeHex(plain) {
  return Buffer.from(plain).toString("hex")
}

function decodeHex(hex) {
  return Buffer.from(hex, "hex").toString()
}

function randomBytes(size) {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(size)))
}

function randomHex(size) {
  return encodeHex(randomBytes(size))
}


export function makeKey() {
  return randomHex(KEY_SIZE)
}


export async function encryptString(key, message) {
  const salt = randomHex(SALT_SIZE)
  const nonce = randomHex(NONCE_SIZE)
  const plaintext = encodeHex(message)
  return Cardano.encrypt_with_password(key, salt, nonce, plaintext)
}

export async function decryptString(key, ciphertext) {
  const plaintext = Cardano.decrypt_with_password(key, ciphertext)
  return decodeHex(plaintext)
}


export async function encryptJson(key, json) {
  return encryptString(key, JSON.stringify(json))
}

export async function decryptJson(key, ciphertext) {
  return decryptString(key, ciphertext).then(JSON.parse)
}


export async function encryptMetadatum(key, json) {
  return encryptJson(key, json).then(ciphertext =>
    Cardano.encode_arbitrary_bytes_as_metadatum(Buffer.from(ciphertext, "hex"))
  )
}

export async function decryptMetadatum(key, metadatum) {
  const ciphertext = Cardano.decode_arbitrary_bytes_from_metadatum(metadatum)
  return decryptJson(key, Buffer.from(ciphertext).toString("hex"))
}
