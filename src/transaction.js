
import * as Address    from "./address.js"
import * as Blockfrost from "./blockfrost.js"
import * as Cardano    from "../lib/cardano-serialization-lib-asmjs/cardano_serialization_lib.js"
import * as Encryption from "./encryption/emurgo.js"

import {Buffer} from '../lib/buffer-es6/index.js'



export function buildTransaction(
  utxos,
  signingKey,
  outputAddress,
  metadataJson = null,
  key = null,
  label = 247424,
  outputValue = 1000000
) {

  const verificationKey = Address.makeVerificationKey(signingKey)
  const address = Address.makeAddress(verificationKey)

  const txBuilder = Cardano.TransactionBuilder.new(
    Cardano.LinearFee.new(
      Cardano.BigNum.from_str('44'),
      Cardano.BigNum.from_str('155381')
    ),
    Cardano.BigNum.from_str('1000000'),
    Cardano.BigNum.from_str('500000000'),
    Cardano.BigNum.from_str('2000000')
  )

  utxos.forEach(function(utxo) {
    txBuilder.add_key_input(
        verificationKey.hash(),
        Cardano.TransactionInput.new(
            Cardano.TransactionHash.from_bytes(
                Buffer.from(utxo.tx_hash, "hex")
            ),
            utxo.tx_index,
        ),
        Cardano.Value.new(Cardano.BigNum.from_str(utxo.amount[0].quantity))
    )
  })

  txBuilder.add_output(
      Cardano.TransactionOutput.new(
      outputAddress,
      Cardano.Value.new(Cardano.BigNum.from_str(String(outputValue)))
      ),
  )

  let metadata = null
  if (metadataJson) {
    let metadatum = null
    if (key)
      metadatum = Encryption.encryptMetadatum(key, metadataJson)
    else
      metadatum = Cardano.encode_json_str_to_metadatum(
        JSON.stringify(metadataJson),
        Cardano.MetadataJsonSchema.NoConversions
      )
    const general = Cardano.GeneralTransactionMetadata.new()
    general.insert(
      Cardano.BigNum.from_str(String(label)),
      metadatum
    )
    metadata = Cardano.TransactionMetadata.new(general)
    txBuilder.set_metadata(metadata)
  }

  txBuilder.add_change_if_needed(address)

  const txBody = txBuilder.build()
  const txHash = Cardano.hash_transaction(txBody)
  const witnesses = Cardano.TransactionWitnessSet.new()

  const vkeyWitnesses = Cardano.Vkeywitnesses.new()
  const vkeyWitness = Cardano.make_vkey_witness(txHash, signingKey)
  vkeyWitnesses.add(vkeyWitness)
  witnesses.set_vkeys(vkeyWitnesses)

  const tx = Cardano.Transaction.new(
      txBody,
      witnesses,
      metadata
  )

  return tx
}


export function submitMetadata(
  signingKey,
  outputAddress,
  metadataJson = null,
  key = null,
  label = 247424,
  outputValue = 1000000
) {
  const verificationKey = Address.makeVerificationKey(signingKey)
  const address = Address.makeAddress(verificationKey)
  return Blockfrost.queryUtxo(address).then(function(utxos) {
    const tx = buildTransaction(
      utxos,
      signingKey,
      outputAddress,
      metadataJson,
      key,
      label,
      outputValue
    )
    return Blockfrost.submitTransaction(tx)
  })
}


export async function extractMetadata(metadata, password = null, label = 247424) {
  if ("label" in metadata && metadata.label == String(label)) {
    let json = metadata.json_metadata 
    if (Array.isArray(json)) {
      try {
        const ciphertext = json.map(x => x.slice(2)).join("")
        return Encryption.decryptString(password, ciphertext).then(plaintext =>
          {
            const json = JSON.parse(plaintext)
            if ("date" in json && "amount" in json && "purpose" in json && parseFloat(json.amount) > 0)
              return json
          })
      } catch (e) {
      }
    }
    if ("date" in json && "amount" in json && "purpose" in json && parseFloat(json.amount) > 0)
      return json
  }
  return null
}
