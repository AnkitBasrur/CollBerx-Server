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

const ChatSchema = mongoose.Schema({
    chatID: {
        type: 'string',
        required: true
    },
    text: {
        type: 'string',
        required: true
    },
    from: {
        type: 'string',
        required: true
    }
}, { _id: false })
const TaskSchema = mongoose.Schema({
    taskID: {
        type: 'string',
        required: true
    },
    name: {
        type: 'string',
        required: true
    },
    createdAt: {
        type: String
    },
    createdBy: {
        type: 'string'
    }
}, {_id: false})

const CompletedTaskSchema = mongoose.Schema({
    taskID: {
        type: 'string',
        required: true
    },
    name: {
        type: 'string',
        required: true
    },
    createdAt: {
        type: String
    },
    createdBy: {
        type: 'string'
    },
    completedAt: {
        type: String
    }
}, {_id: false})

const RoomSchema = mongoose.Schema({
    roomID: {
        type: String,
        required: true,
        unique: true
    },
    name: { 
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    members: [MemberSchema],
    pending: [TaskSchema],
    ongoing: [TaskSchema],
    finsished: [CompletedTaskSchema],
    chat : [ChatSchema]
})

module.exports = mongoose.model('Room', RoomSchema)