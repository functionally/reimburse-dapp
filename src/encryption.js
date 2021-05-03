
import {Buffer} from '../lib/buffer-es6/index.js'

import * as Cardano from "../lib/cardano-serialization-lib-asmjs/cardano_serialization_lib.js"


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


export function encryptString(key, message) {
  const salt = randomHex(SALT_SIZE)
  const nonce = randomHex(NONCE_SIZE)
  const plaintext = encodeHex(message)
  return Cardano.encrypt_with_password(key, salt, nonce, plaintext)
}

export function decryptString(key, ciphertext) {
  const plaintext = Cardano.decrypt_with_password(key, ciphertext)
  return decodeHex(plaintext)
}


export function encryptJson(key, json) {
  return encryptString(key, JSON.stringify(json))
}

export function decryptJson(key, ciphertext) {
  return JSON.parse(decryptString(key, ciphertext))
}


export function encryptMetadatum(key, json) {
  const ciphertext = Buffer.from(encryptJson(key, json), "hex")
  return Cardano.encode_arbitrary_bytes_as_metadatum(ciphertext)
}

export function decryptMetadatum(key, metadatum) {
  const ciphertext = Cardano.decode_arbitrary_bytes_from_metadatum(metadatum)
  return decryptJson(key, Buffer.from(ciphertext).toString("hex"))
}
