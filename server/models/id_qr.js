const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let idSchema = new Schema({
    id: {
        type: String
    }
});

module.exports = mongoose.model('ID_UnidadCentral', idSchema);