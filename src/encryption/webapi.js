
import {Buffer} from '../../lib/buffer-es6/index.js'


const IV_SIZE = 12

const KEY_SIZE = 128


function randomBytes(size) {
  return crypto.getRandomValues(new Uint8Array(size))
}


export async function makeKey() {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: KEY_SIZE
    },
    true,
    ["encrypt", "decrypt"]
  )
}


export async function exportKey(key) {
  return window.crypto.subtle.exportKey("raw", key).then(raw =>
    Buffer.from(raw).toString("base64")
  )
}

export async function importKey(raw) {
  return window.crypto.subtle.importKey("raw", Buffer.from(raw, "base64"), "AES-GCM", true, ["encrypt", "decrypt"])
}


const encoder = new TextEncoder()


export async function encryptString(key, message) {
  const plaintext = encoder.encode(message)
  const iv = randomBytes(IV_SIZE)
  return window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    plaintext
  ).then(ciphertext => {
    const result = new Uint8Array(IV_SIZE + ciphertext.byteLength)
    result.set(iv, 0)
    result.set(new Uint8Array(ciphertext), IV_SIZE)
    return result
  })
}


const decoder = new TextDecoder()


export async function decryptString(key, ciphertext) {
  return window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ciphertext.slice(0, IV_SIZE)
    },
    key,
    ciphertext.slice(IV_SIZE)
  ).then(plaintext => {
    return decoder.decode(plaintext)
  })
}


export async function encryptJson(key, json) {
  return encryptString(key, JSON.stringify(json))
}

export async function decryptJson(key, ciphertext) {
  return decryptString(key, ciphertext).then(JSON.parse)
}


export async function encryptMetadatum(key, json) {
  return encryptJson(key, json).then(ciphertext =>
    Cardano.encode_arbitrary_bytes_as_metadatum(ciphertext)
  )
}

export async function decryptMetadatum(key, metadatum) {
  const ciphertext = Cardano.decode_arbitrary_bytes_from_metadatum(metadatum)
  return decryptJson(key, ciphertext)
}
