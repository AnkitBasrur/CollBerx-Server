const mongoose = require('mongoose');
const express = require('express');
const User = require('../schema/User')
const Room = require('../schema/Room')
const app = express();

app.post('/signup', async (req, res) => {
    const {name, email, password} = req.body;

    try{
        const user = new User({ name, email, password });
        await user.save();
        res.status(200).json({ message: "Success"});
    }
    catch(err){
        res.status(200).json({ message: "Email already exists"});
    }
})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({ email });
    if(!user)
        res.status(200).send({message:"No email found"});
    else{
        if(password === user.password)
            res.status(200).json({message: "Success", name: user.name})
        else
            res.status(200).json({message: "Incorrect Password"});
    }
})

app.post('/addData', async(req, res) => {
    if(req.body.type === 'Pending'){
      await Room.updateOne({ roomID: req.body.roomID }, 
        {
        $push: {
          pending: { 
            taskID: req.body.taskID,
            name: req.body.name,
            createdAt: req.body.createdAt,
            createdBy: req.body.createdBy
          }}}
        )
      const data = await Room.findOne({ roomID: req.body.roomID });
      res.send({ data })
    }
    else if(req.body.type === 'Active'){
      await Room.updateOne({ roomID: req.body.roomID }, 
        {
        $push: {
          ongoing: { 
            taskID: req.body.taskID,
            name: req.body.name,
            createdAt: req.body.createdAt,
            createdBy: req.body.createdBy
          }}}
        )
      const data = await Room.findOne({ roomID: req.body.roomID });
      res.send({ data })
    }
    else{
      await Room.updateOne({ roomID: req.body.roomID }, 
        {
        $push: {
          finsished: { 
            taskID: req.body.taskID,
            name: req.body.name,
            createdAt: req.body.createdAt,
            createdBy: req.body.createdBy,
            completedAt: req.body.completedAt
          }}}
        )
      const data = await Room.findOne({ roomID: req.body.roomID });
      res.send({ data })
    }
  })
  
  app.get('/getPendingData/:id/:email', async (req, res) => {
    const data = await Room.findOne({ roomID: req.params.id }).lean();
    const user = await data.members.filter((member) => member.id === req.params.email)
    data.authLevel = user.authLevel
    res.send({ data, authLevel: user[0].authLevel})
  })
  
  app.post('/removeData', async (req, res) => {
    if(req.body.type === "Pending"){
      await Room.updateOne({ roomID: req.body.id }, {
        $pull: {
          pending: {
            taskID : req.body.taskID
          }
        }
      })
    }
    else if (req.body.type === "Active"){
      await Room.updateOne({ roomID: req.body.id }, {
        $pull: {
          ongoing: {
            taskID : req.body.taskID
          }
        }
      })
    }
    else{
      await Room.updateOne({ roomID: req.body.id }, {
        $pull: {
          finsished: {
            taskID : req.body.taskID
          }
        }
      })
    }
  
    res.send();
  })
  
  app.post('/nextLevel', async (req, res) => {
    if(req.body.type === "Pending"){
      await Room.updateOne({ roomID: req.body.id }, {
        $pull: {
          pending: {
            taskID : req.body.taskID
          }
        },
        $push: {
          ongoing: {
            taskID: req.body.taskID,
            name: req.body.name,
            createdAt: req.body.createdAt,
            createdBy: req.body.createdBy
          }
        }
      })
      
    }
    else if(req.body.type === "Active"){
      await Room.updateOne({ roomID: req.body.id }, {
        $pull: {
          ongoing: {
            taskID : req.body.taskID
          }
        },
        $push: {
          finsished: {
            taskID: req.body.taskID,
            name: req.body.name,
            createdAt: req.body.createdAt,
            createdBy: req.body.createdBy,
            completedAt: req.body.completedAt
          }
        }
      })
      
    }
    res.send()
  })
  
  app.post('/addChat', async (req, res) => {
    await Room.updateOne({ roomID: req.body.id }, { 
      $push: { 
        chat: req.body
      }
    })
    res.send();
  })
  
  app.get('/getProjects/:email', async (req, res) => {
    const user = await User.findOne({ email: req.params.email })
    var arr = [];
  
    for(var i=0; i<user.rooms.length;i++){
      arr[i] = user.rooms[i].roomID
    }
    const room = await Room.find({ roomID: arr }).lean();
  
    for(var i=0; i<room.length; i++){
      room[i].data = await room[i].members.filter((user) => user.id === req.params.email)[0]
    }
  
    res.send({room })
  })
  
  app.post('/changeAuth', async(req, res) => {
    await Room.updateOne({ roomID: req.body.id, "members.id": req.body.user }, {
      $set: {
        "members.$.authLevel": req.body.level
      }
    })
    res.send();
  })
  
module.exports = app;
