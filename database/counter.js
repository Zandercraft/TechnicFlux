const mongoose = require('mongoose')
const Schema = mongoose.Schema

// --- Incremental Counter ---
// Used for tracking the value of fields
const CounterSchema = Schema({
  _id: {type: String, required: true},
  seq: { type: Number, default: 0 }
});

exports.Counter = mongoose.model('technicflux_modcounter', CounterSchema);
