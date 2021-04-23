const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    taskID: {
        type: 'string',
        required: true,
        unique: true
    },
    name: {
        type: 'string',
        required: true
    },
    createdAt: {
        type: Date
    },
    createdBy: {
        type: 'string'
    }
})

const CompletedTaskSchema = mongoose.Schema({
    taskID: {
        type: 'string',
        required: true,
        unique: true
    },
    name: {
        type: 'string',
        required: true
    },
    createdAt: {
        type: Date
    },
    createdBy: {
        type: 'string'
    },
    completedAt: {
        type: Date
    }
})

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