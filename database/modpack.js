const debug = require('debug')('technicflux:server')
const mongoose = require('mongoose')
const database = require('./database')
const { SchemaTypes } = require('mongoose')
const Schema = mongoose.Schema

// --- Schema ---
const modpackSchema = new Schema({
  name: String,
  display_name: String,
  url: String,
  recommended: String,
  latest: String,
  builds: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_builds' }],
  owners: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_users' }],
  contributors: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_users' }],
  admin: Boolean // whether the pack is owned by the admin user.
})

// --- Model ---
exports.Modpack = mongoose.model('technicflux_modpacks', modpackSchema)

// --- Related Functions ---

exports.createModpack = (mSlug, mDisplayName, mOwner, mAdmin) => {
  // Create a modpack object
  const newModpack = new exports.Modpack({
    name: mSlug,
    display_name: mDisplayName,
    owners: [mOwner],
    admin: mAdmin
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
  return exports.Modpack.findOne({ name: mSlug }).populate('owners').populate('contributors').populate('builds').exec().then((modpack) => {
    // Modpack found
    return modpack
  }).catch((reason) => {
    // No modpack found with this slug
    debug(`ERROR (DB): Failed to find a modpack with this slug because of: ${reason}`)
    return false
  })
}

exports.getModpacksByOwner = (mOwner) => {
  return exports.Modpack.find({ owners: mOwner }).populate('owners').populate('contributors').populate('builds').exec().then((modpacks) => {
    // Modpacks found.
    return modpacks
  }).catch((reason) => {
    // No modpacks found for this owner.
    debug(`ERROR (DB): Failed to find any modpacks with this owner because of: ${reason}`)
    return false
  })
}

exports.getModpacksByContributor = (mContributor) => {
  return exports.Modpack.find({ contributors: mContributor }).populate('owners').populate('contributors').populate('builds').exec().then((modpacks) => {
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
  return exports.Modpack.find({}).populate('owners').populate('contributors').populate('builds').exec().then((modpacks) => {
    // Modpacks found
    return modpacks
  }).catch((reason) => {
    // Failed to get any modpacks.
    debug(`ERROR (DB): Failed to fetch any modpacks because of: ${reason}`)
    return false
  })
}

exports.updateModpack = (mSlug, mObject) => {
  return exports.Modpack.updateOne(
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
  return exports.Modpack.deleteOne({ name: mSlug }).exec().then(() => {
    // Successfully deleted this modpack
    return true
  }).catch((reason) => {
    // Failed to delete the modpack
    debug(`ERROR (DB): Failed to delete modpack '${mSlug}' because of: ${reason}`)
    return false
  })
}

exports.addModpackBuild = (mSlug, bVersion, bMinecraft, bJava, bMemory, bForge) => {
  return database.build.createBuild(bVersion, bMinecraft, bJava, bMemory, bForge).exec().then((build) => {
    exports.Modpack.updateOne(
      { name: mSlug },
      {
        $push: {
          builds: build._id
        }
      }
    )
  })
}
