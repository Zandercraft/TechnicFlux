const debug = require('debug')('technicflux:server')
const mongoose = require('mongoose')
const { SchemaTypes } = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

// --- Schemas ---
const userSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  display_name: String,
  password: String,
  created_on: Date,
  login_history: [{ timestamp: Date, userAgent: String }]
})

const apiKeySchema = new Schema({
  owner: { type: SchemaTypes.ObjectId, ref: 'technicflux_users' },
  key: String,
  name: String,
  created_at: Date
})

const modpackSchema = new Schema({
  name: String,
  display_name: String,
  url: String,
  recommended: String,
  latest: String,
  builds: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_builds' }],
  owners: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_users' }],
  contributors: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_users' }]
})

const modSchema = new Schema({
  mod_id: Number,
  name: String,
  pretty_name: String,
  version: String,
  mc_version: String,
  type: String, // Can be forgemod, neoforgemod, fabricmod, quiltmod, <modloadernamemod>, or modloader(handled separately)
  md5: String,
  author: String,
  description: String,
  link: String,
  donate: String,
  url: String,
  filesize: Number
})

const buildSchema = new Schema({
  modpack: { type: SchemaTypes.ObjectId, ref: 'technicflux_modpacks' },
  version: String,
  minecraft: String,
  java: String,
  memory: Number,
  forge: String,
  mods: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_mods' }]
})

// --- Models ---
const User = mongoose.model('technicflux_users', userSchema)
const APIKey = mongoose.model('technicflux_keys', apiKeySchema)
const Modpack = mongoose.model('technicflux_modpacks', modpackSchema)
const Mod = mongoose.model('technicflux_mods', modSchema)
const Build = mongoose.model('technicflux_builds', buildSchema)

// --- Functions ---

exports.connectToDB = (connectionString) => {
  debug('Connecting to MongoDB database...')
  mongoose.connect(connectionString)
  debug('Connected to database.')
}

// --- User-Related Functions ---

/*
 * Creates a new user with the given information.
*/
exports.createUser = (uUsername, uDisplayName, uPassword) => {
  // Encrypt the password using bcrypt and save user
  return bcrypt.genSalt(10).then((Salt) => {
    return bcrypt.hash(uPassword, Salt).then((hash) => {
      // Create a user object
      const newUser = new User({
        username: uUsername,
        display_name: uDisplayName,
        password: hash
      })

      // Commit it to the database
      return newUser.save().then((user) => {
        process.stdout.write(`Successfully added new user ${user.username}\n`)
        return user
      }).catch((reason) => {
        process.stdout.write(`ERROR (when saving new user): ${reason}\n`)
        return false
      })
    }).catch((err) => {
      // Issue creating hashed password
      process.stdout.write(`ERROR (while hashing password): ${err}`)
      return false
    })
  }).catch((err) => {
    // Issue creating hashed object salt
    process.stdout.write(`ERROR (while generating password salt): ${err}`)
    return false
  })
}

/*
 * Gets the user with the provided id.
*/
exports.getUserById = (uId) => {
  // Fetch information about the user with the given id
  return User.findOne({ _id: uId }).exec().then((user) => {
    // User found.
    return user
  }).catch((reason) => {
    // No user found with this id.
    console.log(reason)
    return false
  })
}

/*
 * Gets the user with the provided username.
*/
exports.getUserByUsername = (uUsername) => {
  // Fetch information about the user with the given username
  return User.findOne({ username: uUsername }).exec().then((user) => {
    // User found.
    return user
  }).catch((reason) => {
    // No user found with this username.
    console.log(reason)
    return false
  })
}

/*
 * Gets an array of all existing users.
*/
exports.getAllUsers = () => {
  // Fetch an array of all users
  return User.find({ }).exec().then((users) => {
    // Users found.
    return users
  }).catch((reason) => {
    console.log(reason)
    // Error retrieving users.
    return false
  })
}

/*
 * Checks if the corresponding password matches that of the provided username.
*/
exports.authUser = (uUsername, uPassword, logHistory = false, uAgent = 'Unknown') => {
  // Fetch information about the user with the given username
  return User.findOne({ username: uUsername }).exec().then((user) => {
    // User found. Check password.
    return bcrypt.compare(uPassword, user.password).then(async (isMatch) => {
      // Check if it is a match
      if (isMatch) {
        // Update the user's login history.
        if (logHistory) {
          const newLogin = { timestamp: new Date(), userAgent: String(uAgent) }

          // Add the new login to the user's login history
          return await User.updateOne(
            { username: uUsername },
            { $push: { login_history: newLogin } }
          ).exec().then(() => {
            // Auth was successful and login history updated.
            user.login_history.push(newLogin)
            return [true, user]
          }).catch((reason) => {
            user.login_history.push(newLogin)
            // Auth was successful, but failed to update the user's login history.
            process.stdout.write(`ERROR (while updating user's login history): ${reason}\n`)
            return [true, user]
          })
        } else {
          // Auth was successful. Return user without logging to user's history.
          return [true, user]
        }
      } else {
        // User's authentication was invalid.
        return [false, undefined]
      }
    })
  }).catch((reason) => {
    console.log(reason)
    // No user found with this username.
    return [false]
  })
}

/*
 * Updates the user with the given username.
*/
exports.updateUser = (uUsername, object) => {
  return bcrypt.genSalt(10).then((Salt) => {
    return bcrypt.hash(object.password, Salt).then((hash) => {
      if (object.password.length > 0) {
        object.password = hash
      } else {
        object.password = object.old_password
      }
      delete object.old_password

      // Update User
      return User.updateOne(
        { username: uUsername },
        { $set: object }
      ).exec().then(() => {
        // Updated user successfully
        return true
      }).catch((reason) => {
        // Failed to update the user
        process.stdout.write(`ERROR (while updating user): ${reason}\n`)
        return false
      })
    }).catch((err) => {
      // Issue creating hashed password
      process.stdout.write(`ERROR (while hashing password): ${err}`)
      return false
    })
  }).catch((err) => {
    // Issue creating hashed object salt
    process.stdout.write(`ERROR (while generating password salt): ${err}`)
    return false
  })
}

// --- API-Key-Related Functions

/*
 * Creates a new api key with the given information.
*/
exports.createAPIKey = (kOwner, kKey, kName) => {
  // Encrypt the password using bcrypt and save user
  return bcrypt.genSalt(10).then((Salt) => {
    return bcrypt.hash(kKey, Salt).then((hash) => {
      // Create an APIKey object
      const newKey = new APIKey({
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
  return APIKey.find({ }).exec().then(async (keys) => {
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
  return APIKey.find({ owner: mOwner }).populate('owner').exec().then((keys) => {
    // API Keys found.
    return keys
  }).catch((reason) => {
    // No API keys found for this owner.
    debug(`ERROR (DB): Failed to find any API keys with this owner because of: ${reason}`)
    return false
  })
}

exports.deleteAPIKey = (kId) => {
  return APIKey.deleteOne({ _id: kId }).exec().then(() => {
    // Successfully deleted this api key
    return true
  }).catch((reason) => {
    // Failed to delete the api key
    debug(`ERROR (DB): Failed to delete API Key '${kId}' because of: ${reason}`)
    return false
  })
}

// --- Modpack-Related Functions ---
exports.createModpack = (mSlug, mDisplayName, mOwner) => {
  // Create a modpack object
  const newModpack = new Modpack({
    name: mSlug,
    display_name: mDisplayName,
    owners: [mOwner]
  })

  // Commit it to the database
  return newModpack.save().then((modpack) => {
    // Modpack successfully created
    debug(`Successfully added new project ${modpack.display_name}: ${modpack.name}\n`)
    return modpack
  }).catch((reason) => {
    // Modpack failed to create
    debug(`ERROR (DB: when saving new modpack): ${reason}\n`)
    return false
  })
}

exports.getModpackBySlug = (mSlug) => {
  return Modpack.findOne({ name: mSlug }).populate('owners').populate('contributors').populate('builds').exec().then((modpack) => {
    // Modpack found
    return modpack
  }).catch((reason) => {
    // No modpack found with this slug
    debug(`ERROR (DB): Failed to find a modpack with this slug because of: ${reason}`)
    return false
  })
}

exports.getModpacksByOwner = (mOwner) => {
  return Modpack.find({ owners: mOwner }).populate('owners').populate('contributors').populate('builds').exec().then((modpacks) => {
    // Modpacks found.
    return modpacks
  }).catch((reason) => {
    // No modpacks found for this owner.
    debug(`ERROR (DB): Failed to find any modpacks with this owner because of: ${reason}`)
    return false
  })
}

exports.getModpacksByContributor = (mContributor) => {
  return Modpack.find({ contributors: mContributor }).populate('owners').populate('contributors').populate('builds').exec().then((modpacks) => {
    // Modpacks found.
    return modpacks
  }).catch((reason) => {
    // No modpacks found for this collaborator.
    debug(`ERROR (DB): Failed to find any modpacks with this contributor because of: ${reason}`)
    return false
  })
}

exports.getAllModpacks = () => {
  // Fetch an array of all modpacks
  return Modpack.find({}).populate('owners').populate('contributors').populate('builds').exec().then((modpacks) => {
    // Modpacks found
    return modpacks
  }).catch((reason) => {
    // Failed to get any modpacks.
    debug(`ERROR (DB): Failed to fetch any modpacks because of: ${reason}`)
    return false
  })
}

exports.updateModpack = (mSlug, mObject) => {
  return Modpack.updateOne(
    { name: mSlug },
    { $set: mObject }
  ).exec().then(() => {
    // Successfully updated the modpack
    return true
  }).catch((reason) => {
    // Failed to update the modpack
    debug(`ERROR (DB): Failed to update modpack '${mSlug}' because of: ${reason}`)
    return false
  })
}

exports.deleteModpack = (mSlug) => {
  return Modpack.deleteOne({ name: mSlug }).exec().then(() => {
    // Successfully deleted this modpack
    return true
  }).catch((reason) => {
    // Failed to delete the modpack
    debug(`ERROR (DB): Failed to delete modpack '${mSlug}' because of: ${reason}`)
    return false
  })
}

// --- Mod-Related Functions ---
exports.getModBySlug = (mSlug) => {
  return Mod.find({ name: mSlug }).exec().then((mods) => {
    if (mods === null || mods.length === 0) {
      // Mod not found
      return null
    } else {
      // Mod found
      return {
        id: mods[0].mod_id,
        name: mods[0].name,
        pretty_name: mods[0].pretty_name,
        author: mods[0].author,
        description: mods[0].description,
        link: mods[0].link,
        versions: mods.map((modVersion) => modVersion.version)
      }
    }
  }).catch((reason) => {
    // No mod found with this slug
    debug(`ERROR (DB): Failed to find a mod with slug '${mSlug}' because of: ${reason}`)
    return false
  })
}

exports.getModVersion = (mSlug, mVersion) => {
  return Mod.findOne({ name: mSlug, version: mVersion }).exec().then((mod) => {
    // Mod found
    return mod
  }).catch((reason) => {
    // No mod found with this slug and version
    debug(`ERROR (DB): Failed to find a mod '${mSlug}:${mVersion}' because of: ${reason}`)
    return false
  })
}

exports.getModsByType = (mType) => {
  return Mod.find({ type: mType }).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found with this modloader
    debug(`ERROR (DB): Failed to find a mod with modloader '${mType}' because of: ${reason}`)
    return false
  })
}

exports.getModsByMinecraftVersion = (mVersion) => {
  return Mod.find({ mc_version: mVersion }).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found with this Minecraft version.
    debug(`ERROR (DB): Failed to find a mod with Minecraft version '${mVersion}' because of: ${reason}`)
    return false
  })
}

exports.getModsByMinecraftAndLoaderVersion = (mVersion, mType) => {
  return Mod.find({ mc_version: mVersion, type: mType }).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found with this Minecraft and modloader version.
    debug(`ERROR (DB): Failed to find a mod with Minecraft version '${mVersion}' and modloader version '${mType}' because of: ${reason}`)
    return false
  })
}

exports.getAllMods = () => {
  return Mod.find({}).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found
    debug(`ERROR (DB): Failed to find any mods because of: ${reason}`)
    return false
  })
}

exports.updateMod = (mSlug, mObject) => {
  return Mod.updateOne(
    { name: mSlug },
    { $set: mObject }
  ).exec().then(() => {
    // Successfully updated the modpack
    return true
  }).catch((reason) => {
    // Failed to update the modpack
    debug(`ERROR (DB): Failed to update modpack '${mSlug}' because of: ${reason}`)
    return false
  })
}

exports.deleteModpack = (mSlug) => {
  return Modpack.deleteOne({ name: mSlug }).exec().then(() => {
    // Successfully deleted this modpack
    return true
  }).catch((reason) => {
    // Failed to delete the modpack
    debug(`ERROR (DB): Failed to delete modpack '${mSlug}' because of: ${reason}`)
    return false
  })
}

// --- Modloader-Related Functions ---

// --- Build-Related Functions ---
