
import {Buffer} from '../node_modules/buffer-es6/index.js'

import * as Cardano from "../node_modules/@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.js"


let magic = Cardano.NetworkInfo.testnet(1097911063).network_id()

export function useMainnet() {
  magic = Cardano.NetworkInfo.mainnet().network_id()
}

export function useTestnet(i = 1097911063) {
  magic = Cardano.NetworkInfo.testnet(i).network_id()
}


export const from_bech32 = Cardano.Address.from_bech32


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
