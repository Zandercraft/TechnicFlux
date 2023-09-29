const debug = require('debug')('technicflux:server')
const mongoose = require('mongoose')
const database = require('./database')
const Schema = mongoose.Schema

// --- Schema ---
const modSchema = new Schema({
  mod_id: {
    type: Number,
    default: 0
  },
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

// Handle incremental updates of the mod_id
modSchema.pre('save', (next) => {
  let doc = this;
  database.counter.Counter.findByIdAndUpdate({_id: 'modId'}, {$inc: { seq: 1 }}, (error, counter) => {
    if (error) {
      return next(error)
    }
    doc.mod_id = counter.seq
    next()
  })
})

// --- Model ---
exports.Mod = mongoose.model('technicflux_mods', modSchema)

// --- Related Functions ---

exports.getModBySlug = (mSlug) => {
  return exports.Mod.find({ name: mSlug }).exec().then((mods) => {
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
  return exports.Mod.findOne({ name: mSlug, version: mVersion }).exec().then((mod) => {
    // Mod found
    return mod
  }).catch((reason) => {
    // No mod found with this slug and version
    debug(`ERROR (DB): Failed to find a mod '${mSlug}:${mVersion}' because of: ${reason}`)
    return false
  })
}

exports.getModsByType = (mType) => {
  return exports.Mod.find({ type: mType }).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found with this modloader
    debug(`ERROR (DB): Failed to find a mod with modloader '${mType}' because of: ${reason}`)
    return false
  })
}

exports.getModsByMinecraftVersion = (mVersion) => {
  return exports.Mod.find({ mc_version: mVersion }).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found with this Minecraft version.
    debug(`ERROR (DB): Failed to find a mod with Minecraft version '${mVersion}' because of: ${reason}`)
    return false
  })
}

exports.getModsByMinecraftAndLoaderVersion = (mVersion, mType) => {
  return exports.Mod.find({ mc_version: mVersion, type: mType }).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found with this Minecraft and modloader version.
    debug(`ERROR (DB): Failed to find a mod with Minecraft version '${mVersion}' and modloader version '${mType}' because of: ${reason}`)
    return false
  })
}

exports.getAllMods = () => {
  return exports.Mod.find({}).exec().then((mods) => {
    // Mods found
    return mods
  }).catch((reason) => {
    // No mods found
    debug(`ERROR (DB): Failed to find any mods because of: ${reason}`)
    return false
  })
}

exports.updateMod = (mSlug, mObject) => {
  return exports.Mod.updateOne(
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

exports.deleteMod = (mSlug) => {
  return exports.Mod.deleteOne({ name: mSlug }).exec().then(() => {
    // Successfully deleted this mod
    return true
  }).catch((reason) => {
    // Failed to delete the mod
    debug(`ERROR (DB): Failed to delete mod '${mSlug}' because of: ${reason}`)
    return false
  })
}
