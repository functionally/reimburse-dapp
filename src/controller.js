
const Address    = require("./address.js"   )
const Blockfrost = require("./blockfrost.js")
const Secrets    = require("./secrets.js"   )

require("buffer")


Blockfrost.setKey(Secrets.blockfrostKey)


const theVerificationKey = Address.makeVerificationKey(Secrets.theSigningKey)

const theAddress = Address.makeAddress(theVerificationKey)


module.exports = {

  Address     : require("./address.js"    )
, Blockfrost  : require("./blockfrost.js" )
, Encryption  : require("./encryption.js" )
, Transaction : require("./transaction.js")

, Buffer  : Buffer
, Cardano : require("@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.js")

, thePassword        : Secrets.thePassword
, outputAddress      : Secrets.outputAddress
, theSigningKey      : Secrets.theSigningKey
, theVerificationKey : theVerificationKey
, theAddress         : theAddress
}
