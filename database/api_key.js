const debug = require('debug')('technicflux:server')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { SchemaTypes } = require('mongoose')
const Schema = mongoose.Schema

// --- Schema ---
const apiKeySchema = new Schema({
  owner: { type: SchemaTypes.ObjectId, ref: 'technicflux_users' },
  key: String,
  name: String,
  created_at: Date
})

// --- Model ---
exports.APIKey = mongoose.model('technicflux_keys', apiKeySchema)

// --- Related Functions ---

/*
 * Creates a new api key with the given information.
*/
exports.createAPIKey = (kOwner, kKey, kName) => {
  // Encrypt the password using bcrypt and save user
  return bcrypt.genSalt(10).then((Salt) => {
    return bcrypt.hash(kKey, Salt).then((hash) => {
      // Create an APIKey object
      const newKey = new exports.APIKey({
        owner: kOwner,
        key: hash,
        name: kName,
        created_at: new Date()
      })

      // Commit it to the database
      return newKey.save().then((key) => {
        process.stdout.write(`Successfully added new API key '${kName}' for ${kOwner}\n`)
        return key
      }).catch((reason) => {
        process.stdout.write(`ERROR (when saving new API key): ${reason}\n`)
        return false
      })
    }).catch((err) => {
      // Issue creating hashed api key
      process.stdout.write(`ERROR (while hashing key): ${err}`)
      return false
    })
  }).catch((err) => {
    // Issue creating hashed object salt
    process.stdout.write(`ERROR (while generating api key salt): ${err}`)
    return false
  })
}

/*
 * Checks if the corresponding password matches that of the provided username.
*/
exports.authAPIKey = (uKey) => {
  // Fetch information about the user with the given username
  return exports.APIKey.find({ }).exec().then(async (keys) => {
    // Check if any of the keys match.
    let valid = [false, undefined]
    for (const key of keys) {
      await bcrypt.compare(uKey, key.key).then((isMatch) => {
        // Check if it is a match
        if (isMatch) {
          // The key matched.
          valid = [true, key]
        }
      })
    }
    return valid
  }).catch((reason) => {
    console.log(reason)
    // DB error
    debug('ERROR (DB): Could not fetch API keys.')
    return [false, undefined]
  })
}

exports.getAPIKeysByOwner = (mOwner) => {
  return exports.APIKey.find({ owner: mOwner }).populate('owner').exec().then((keys) => {
    // API Keys found.
    return keys
  }).catch((reason) => {
    // No API keys found for this owner.
    debug(`ERROR (DB): Failed to find any API keys with this owner because of: ${reason}`)
    return false
  })
}

exports.deleteAPIKey = (kId) => {
  return exports.APIKey.deleteOne({ _id: kId }).exec().then(() => {
    // Successfully deleted this api key
    return true
  }).catch((reason) => {
    // Failed to delete the api key
    debug(`ERROR (DB): Failed to delete API Key '${kId}' because of: ${reason}`)
    return false
  })
}
