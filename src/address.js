
import {Buffer} from '../lib/buffer-es6/index.js'


let magic = null

export function useMainnet() {
  magic = Cardano.NetworkInfo.mainnet().network_id()
}

export function useTestnet(i = 1097911063) {
  magic = Cardano.NetworkInfo.testnet(i).network_id()
}


export function from_bech32(x) {
  return Cardano.Address.from_bech32(x)
}


export function readSigningKey(bech32) {
  return Cardano.PrivateKey.from_extended_bytes(
    Buffer.from(bech32, "hex")
  )
}


export function makeVerificationKey(signingKey) {
  return signingKey.to_public()
}


export function makeAddress(verificationKey) {
  return Cardano.EnterpriseAddress.new(
    magic,
    Cardano.StakeCredential.from_keyhash(verificationKey.hash())
  ).to_address()
}
