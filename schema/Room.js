const mongoose = require('mongoose');

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
    password: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    pending: [TaskSchema],
    ongoing: [TaskSchema],
    finsished: [CompletedTaskSchema]
})

module.exports = mongoose.model('Room', RoomSchema)