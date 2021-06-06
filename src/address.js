
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


export function readSigningKey(raw) {
  return Cardano.Bip32PrivateKey.from_bytes(
    Buffer.from(raw, "hex")
  ).to_raw_key()
}


export function makeVerificationKey(signingKey) {
  return signingKey.to_public()
}
