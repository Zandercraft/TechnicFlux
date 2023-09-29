const debug = require('debug')('technicflux:server')
const mongoose = require('mongoose')

// --- Functions ---

exports.connectToDB = (connectionString) => {
  debug('Connecting to MongoDB database...')
  mongoose.connect(connectionString)
  debug('Connected to database.')
}

// Schema Modules
exports.counter = require('./counter')
exports.user = require('./user')
exports.apiKey = require('./api_key')
exports.modpack = require('./modpack')
exports.mod = require('./mod')
exports.build = require('./build')
