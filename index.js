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
const User = require('./schema/User');

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

  socket.on("create room", async(password, owner, name ) => {
    const roomID = generateString(9)
    const room = new Room({ roomID, password, owner, name })
    await User.updateOne({ email: owner }, { 
      $push: {
        rooms: { 
          designation: "Level X",
          roomID, 
          name
        }
      }
    })
    await User.updateOne({ email: owner, "rooms.roomID": roomID }, { 
      $push: {
        "rooms.$.members": { 
          authLevel: "Level X",
          id: owner, 
          name: owner
        }
      }
    })
    await room.save();
    await Room.updateOne({ roomID }, { 
      $push: {
        members: { 
          authLevel: "Level X",
          id: owner, 
          name: owner
        }
      }
    })
    await socket.join(roomID);
    io.emit("Hey", {msg: "Success", activeUsers: 1, roomID })
  });

  socket.on('join', async(roomID, password, email ) =>  {
    const room = await Room.findOne({ roomID });

    if(!room)
      io.emit("Hey", {msg: "Incorrect room code"})
    else if(password !== room.password)
      io.emit('Hey', {msg: "Incorrect password"})
    else{
      const isObjectPresent = room.members.find((member) => member.id === email);
      if(!isObjectPresent){
        await Room.updateOne({ roomID: roomID }, {
          $push: {
            members: {
              name: email, 
              id: email, 
              authLevel: "Level Z"
            }
          }
        })
        await socket.join(roomID);
        var sockets = io.in(roomID);
        await User.updateOne({email }, {
          $push: {
            rooms: {
              roomID, 
              name: room.name,
              designation: "Member"
            },
            members: {
              name: email,
              id: email,
              authLevel: "Level Z"
            }
          }
        })   
        const activeUsers = sockets.adapter.rooms.get(roomID).size
        io.emit("Hey", {msg: "Success", activeUsers, roomID})
      }
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

  socket.on("new data", async(data) => {
    io.emit("new data from server", { data })
  })
});

app.post('/login', userFunc)
app.post('/signup', userFunc)

app.post('/addData', userFunc)

app.get('/getPendingData/:id/:email', userFunc)

app.post('/nextLevel', userFunc)

app.post('/addChat', userFunc)

app.get('/getProjects/:email', userFunc)

app.post('/changeAuth', userFunc)