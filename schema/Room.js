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
    },
    priority: {
        type: "string"
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

const logSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    from: {
        type: String
    },
    date: {
        type: 'string'
    }
}, {_id: false})

const BlockedUserSchema = mongoose.Schema({
    userID: {
        type: String,
        required: true
    }
}, {_id: false })

const RoomSchema = mongoose.Schema({
    roomID: {
        type: String,
        required: true
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
    isGitRepo: {
        type: Boolean
    },
    members: [MemberSchema],
    blockedUser: [BlockedUserSchema],
    pending: [TaskSchema],
    ongoing: [TaskSchema],
    finsished: [CompletedTaskSchema],
    chat : [ChatSchema],
    logs: [logSchema]
})

module.exports = mongoose.model('Room', RoomSchema)