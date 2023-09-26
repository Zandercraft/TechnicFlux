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
  login_history: [{timestamp: Date, userAgent: String}]
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

/*
 * Gets the user with the provided id.
*/
exports.getUserById = (u_Id) => {
  // Fetch information about the user with the given id
  return User.findOne({ _id: u_Id }).exec().then((user) => {
    // User found.
    return user
  }).catch((reason) => {
    // No user found with this id.
    console.log(reason)
    return false
  })
}

/*
 * Gets the user with the provided email.
*/
exports.getUserByUsername = (u_username) => {
  // Fetch information about the user with the given username
  return User.findOne({ username: u_username }).exec().then((user) => {
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
exports.authUser = (u_username, u_password, log_history = false, u_agent="Unknown") => {
  // Fetch information about the user with the given username
  return User.findOne({ username: u_username }).exec().then((user) => {
    // User found. Check password.
    return bcrypt.compare(u_password, user.password).then((isMatch) => {
      // Check if it is a match
      if (isMatch) {
        // Update the user's login history.
        if (log_history) {
          let newLogin = {timestamp: new Date(), userAgent: String(u_agent)}

          // Add the new login to the user's login history
          return User.updateOne(
            { username: u_username },
            { $push: {login_history: newLogin} }
          ).exec().then(()=>{
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
exports.updateUser = (u_username, object) => {
  return bcrypt.genSalt(10).then((Salt) => {
    return bcrypt.hash(object.password, Salt).then((hash) => {
      if (object.password.length > 0) {
        object.password = hash;
      } else {
        object.password = object.old_password
      }
      delete object.old_password

      // Update User
      return User.updateOne(
        { username: u_username },
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

// --- Modpack-Related Functions ---


// --- Mod-Related Functions ---


// --- Build-Related Functions ---

