const express =  require('express')
const httpServer = require("http").createServer();
const app = express();
const io = require("socket.io")(5000);
const userFunc = require('./functions/user')
const Room = require('./schema/Room')
require('dotenv').config();


var cors = require('cors');
app.use(express.json());
app.use(cors());

const mongoose = require('mongoose');

const uri = process.env.MONGO_URL
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random()*charactersLength));
    }
    return result;
}

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.listen(4000, () => {
  console.log(`Example app listening on port 4000!`)
});

io.on("connection", (socket) => {

  socket.on("create room", async(password, owner ) => {
    const roomID = generateString(9)
    const room = new Room({ roomID, password, owner })
    await room.save();
    await socket.join(roomID);
    var sockets = io.in(roomID);  
    io.emit("Hey", {msg: "Success", activeUsers: 1, roomID })
  });

  socket.on('join', async(roomID, password ) =>  {
    const room = await Room.findOne({ roomID });
    if(!room)
      io.emit("Hey", {msg: "Incorrect room code"})
    else if(password !== room.password)
      io.emit('Hey', {msg: "Incorrect password"})
    else{
      await socket.join(roomID);
      var sockets = io.in(roomID);   
      const activeUsers = sockets.adapter.rooms.get(roomID).size
      io.emit("Hey", {msg: "Success", activeUsers, roomID})
    }
  });

  socket.on('getData', async(roomID) => {
    if(roomID){
      var sockets = io.in(roomID);   
      const activeUsers = sockets.adapter.rooms.get(roomID).size
      io.emit("Hey", {msg: "Success", activeUsers})
    }
    else
      io.emit("Hey", { activeUsers: "error"})
  })
  socket.on('leave', async(room) => {
    await socket.leave(room);
    var sockets = io.in(room);   
    const activeUsers = sockets.adapter.rooms.get(room).size
    io.emit("Hey", {msg: "Success", activeUsers})
  })
});

app.post('/login', userFunc)
app.post('/signup', userFunc)

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

app.get('/getPendingData/:id', async (req, res) => {
  const data = await Room.findOne({ roomID: req.params.id });
  res.send({ data })
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
