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
    console.log(sockets.adapter.rooms.get(roomID)) 
    io.to(roomID).emit('Hey',{msg:`${sockets.adapter.rooms.get(roomID).size} members there`});
  });

  socket.on('join', async(roomID, password ) =>  {
    console.log(roomID, password)
    const room = await Room.findOne({ roomID });
    if(!room)
      io.emit("Hey", {msg: "Incorrect room code"})
    else if(password !== room.password)
      io.emit('Hey', {msg: "Incorrect password"})
    else{
      await socket.join(roomID);
      var sockets = io.in(roomID);   
      console.log(sockets.adapter.rooms.get(roomID))
      io.to(roomID).emit('Hey',{msg: "Success"});
    }
  });

  socket.on('getData', async(roomID) => {
    console.log(roomID)
    var sockets = io.in(room);   
    console.log(sockets.adapter.rooms.get(roomID))
    io.emit("Hey", {msg: "Incorrect room code"})
  })
  socket.on('leave', async(room) => {
    await socket.leave(room);
    var sockets = io.in(room);   
    io.to(room).emit('Hey',{msg: "Success"});
  })
});

app.post('/login', userFunc)
app.post('/signup', userFunc)
