const debug = require('debug')('technicflux:server')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

// --- Schema ---
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

// --- Model ---
exports.User = mongoose.model('technicflux_users', userSchema)

// --- Related Functions ---

/*
 * Creates a new user with the given information.
*/
exports.createUser = (uUsername, uDisplayName, uPassword) => {
  // Encrypt the password using bcrypt and save user
  return bcrypt.genSalt(10).then((Salt) => {
    return bcrypt.hash(uPassword, Salt).then((hash) => {
      // Create a user object
      const newUser = new exports.User({
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
  return exports.User.findOne({ _id: uId }).exec().then((user) => {
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
  return exports.User.findOne({ username: uUsername }).exec().then((user) => {
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
  return exports.User.find({ }).exec().then((users) => {
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
  return exports.User.findOne({ username: uUsername }).exec().then((user) => {
    // User found. Check password.
    return bcrypt.compare(uPassword, user.password).then(async (isMatch) => {
      // Check if it is a match
      if (isMatch) {
        // Update the user's login history.
        if (logHistory) {
          const newLogin = { timestamp: new Date(), userAgent: String(uAgent) }

          // Add the new login to the user's login history
          return await exports.User.updateOne(
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
      return exports.User.updateOne(
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

exports.deleteUser = (uId) => {
  return exports.User.deleteOne({ _id: uId }).exec().then(() => {
    // Successfully deleted this user.
    return true
  }).catch((reason) => {
    // Failed to delete the user
    debug(`ERROR (DB): Failed to delete user '${uId}' because of: ${reason}`)
    return false
  })
}
