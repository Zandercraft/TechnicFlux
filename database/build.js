const debug = require('debug')('technicflux:server')
const mongoose = require('mongoose')
const { SchemaTypes } = require('mongoose')
const Schema = mongoose.Schema

// --- Schema ---
const buildSchema = new Schema({
  modpack: { type: SchemaTypes.ObjectId, ref: 'technicflux_modpacks' },
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
