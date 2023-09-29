const debug = require('debug')('technicflux:server')
const database = require('./database')
const mongoose = require('mongoose')
const { SchemaTypes } = require('mongoose')
const Schema = mongoose.Schema

// --- Schema ---
const buildSchema = new Schema({
  version: String,
  minecraft: String,
  java: String,
  memory: Number,
  forge: String,
  mods: [{ type: SchemaTypes.ObjectId, ref: 'technicflux_mods' }]
})

// --- Model ---
exports.Build = mongoose.model('technicflux_builds', buildSchema)

// --- Related Functions ---

exports.createBuild = (bVersion, bMinecraft, bJava, bMemory, bForge) => {
  // Create a build object
  const newBuild = new exports.Build({
    version: bVersion,
    minecraft: bMinecraft,
    java: bJava,
    memory: bMemory,
    forge: bForge,
    mods: []
  })

  // Commit it to the database
  return newBuild.save().then((build) => {
    // Build successfully created
    debug(`Successfully added new build ${build.version}.\n`)
    return build
  }).catch((reason) => {
    // Build  failed to create
    debug(`ERROR (DB: when saving new build): ${reason}\n`)
    return false
  })
}

exports.getAllModpackBuilds = (mSlug) => {
  return database.modpack.getModpackBySlug(`${mSlug}`).populate('builds').exec().then((modpack) => {
    return modpack.builds
  }).catch((reason) => {
    // Failed to fetch the modpack's builds
    debug(`ERROR (DB): Couldn't fetch modpack because of: ${reason}\n`)
    return undefined
  })
}

exports.getModpackBuild = (mSlug, bVersion) => {
  return database.modpack.getModpackBySlug(`${mSlug}`).then((modpack) => {
    // Find the build.
    const mBuild = modpack.builds.find(build => build.version === bVersion)

    // The reason why we search separately is to prevent populating the mods of every modpack build.
    return exports.Build.findOne({ _id: mBuild._id }).populate('mods').exec().then((build) => {
      return build
    }).catch((reason) => {
      // Failed to fetch the build
      debug(`ERROR (DB): Couldn't fetch the build (${mSlug}: ${bVersion}) because of: ${reason}\n`)
      return undefined
    })
  }).catch((reason) => {
    // Failed to fetch the modpack's builds
    debug(`ERROR (DB): Couldn't fetch modpack because of: ${reason}\n`)
    return undefined
  })
}

exports.deleteBuild = (mId) => {
  return exports.Build.deleteOne({ name: mId }).exec().then(() => {
    // Successfully deleted this build
    return true
  }).catch((reason) => {
    // Failed to delete the build
    debug(`ERROR (DB): Failed to delete build '${mId}' because of: ${reason}`)
    return false
  })
}
