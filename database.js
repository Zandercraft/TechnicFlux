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
  password: String
})

const modpackSchema = new Schema({
  name: String,
  display_name: String,
  url: String,
  recommended: String,
  latest: String,
  builds: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_builds' }],
  owners: [{ type:SchemaTypes.ObjectId, ref: 'technicflux_users' }],
  contributors: [{ type:SchemaTypes.ObjectId, ref: 'technicflux_users' }]
})

const modSchema = new Schema({
  name: String,
  pretty_name: String,
  version: String,
  mc_version: String,
  type: String,
  md5: String,
  author: String,
  description: String,
  link: String,
  donate: String
})

const buildSchema = new Schema({
  minecraft: String,
  java: String,
  memory: Number,
  forge: String,
  mods: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_mods' }]
})

// --- Models ---
const User = mongoose.model('technicflux_users', userSchema)
const Modpack = mongoose.model('technicflux_modpacks', modpackSchema)
const Mod = mongoose.model('technicflux_mods', modSchema)
const Build = mongoose.model('technicflux_builds', buildSchema)

// --- Functions ---

exports.connectToDB = (connectionString) => {
  mongoose.connect(connectionString)
}

// --- User-Related Functions ---

/*
 * Creates a new user with the given information.
*/
exports.createUser = (u_username, u_display_name, u_password) => {
  // Encrypt the password using bcrypt and save user
  return bcrypt.genSalt(10).then((Salt) => {
    return bcrypt.hash(u_password, Salt).then((hash) => {
      // Create a user object
      const newUser = new User({
        username: u_username,
        display_name: u_display_name,
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

// --- Modpack-Related Functions ---


// --- Mod-Related Functions ---


// --- Build-Related Functions ---

