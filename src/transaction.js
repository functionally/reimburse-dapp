
import * as Address    from "./address.js"
import * as Blockfrost from "./blockfrost.js"
import * as Cardano    from "../lib/cardano-serialization-lib-asmjs/cardano_serialization_lib.js"
import * as Encryption from "./encryption/webapi.js"

import {Buffer} from '../lib/buffer-es6/index.js'


async function packageMetadata(label, metadataJson, key) {
  function wrap(metadatum) {
    const general = Cardano.GeneralTransactionMetadata.new()
    general.insert(
      Cardano.BigNum.from_str(String(label)),
      metadatum
    )
    return Cardano.TransactionMetadata.new(general)
  }
  if (metadataJson) {
    if (key)
      return Encryption.encryptMetadatum(key, metadataJson).then(wrap)
    else {
      const metadatum = Cardano.encode_json_str_to_metadatum(
        JSON.stringify(metadataJson),
        Cardano.MetadataJsonSchema.NoConversions
      )
      return wrap(metadatum)
    }
    return null
  }
}


export async function buildTransaction(
  utxos,
  signingKey,
  outputAddress,
  metadataJson = null,
  key = null,
  label = 247424,
  outputValue = 1500000
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

  return packageMetadata(label, metadataJson, key).then(metadata => {

    if (metadata)
      txBuilder.set_metadata(metadata)

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

  })

}


export async function submitMetadata(
  signingKey,
  outputAddress,
  metadataJson = null,
  key = null,
  label = 247424,
  outputValue = 1000000
) {
  const verificationKey = Address.makeVerificationKey(signingKey)
  const address = Address.makeAddress(verificationKey)
  return Blockfrost.queryUtxo(address).then(utxos =>
    buildTransaction(
      utxos,
      signingKey,
      outputAddress,
      metadataJson,
      key,
      label,
      outputValue
    ).then(Blockfrost.submitTransaction)
  )
}


export async function extractMetadata(metadata, password = null, label = 247424) {
  if ("label" in metadata && metadata.label == String(label)) {
    const json = metadata.json_metadata 
    if (Array.isArray(json)) {
        const ciphertext = Buffer.from(json.map(x => x.slice(2)).join(""), "hex")
        return Encryption.decryptJson(password, ciphertext).then(json1 =>
          {
            if ("date" in json1 && "amount" in json1 && "purpose" in json1 && parseFloat(json1.amount) > 0)
              return json1
          }
        ).catch(e => null)
    }
    if ("date" in json && "amount" in json && "purpose" in json && parseFloat(json.amount) > 0)
      return json
  }
  return null
}
