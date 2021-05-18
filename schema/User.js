const mongoose = require('mongoose');

const RoomSchema = mongoose.Schema({
    roomID: {
        type: String,
        required: true
    },
    name: { type: String, required: true},
    designation: { type: String, required: true},
}, {_id: false })

const BlockedRoomsSchema = mongoose.Schema({
    roomID: {
        type: String,
        required: true
    }
}, {_id: false })

const UserSchema = mongoose.Schema({
    username: {
        type: 'string',
        required: true
    },  
    name: {
        type: 'string',
        required: true
    },
    password: {
        type: 'string'
    },
    isGitUser: { type: Boolean},
    rooms: [RoomSchema],
    blockedRooms: [BlockedRoomsSchema]
})

module.exports = mongoose.model('User', UserSchema);