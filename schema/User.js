const mongoose = require('mongoose');

const MemberSchema = mongoose.Schema({
    name: { 
        type: 'string'
    },
    id: {
        type: 'string'
    },
    authLevel: { type: 'string'}
}, {_id: false})

const RoomSchema = mongoose.Schema({
    roomID: {
        type: String,
        required: true
    },
    name: { type: String, required: true},
    designation: { type: String, required: true},
    members: [MemberSchema]
}, {_id: false })

const UserSchema = mongoose.Schema({
    email: {
        type: 'string',
        required: true,
        unique: true
    },
    name: {
        type: 'string',
        required: true
    },
    password: {
        type: 'string',
        required: true
    },
    rooms: [RoomSchema]
})

module.exports = mongoose.model('User', UserSchema);