const express =  require('express')
const httpServer = require("http").createServer();
const app = express();
const io = require("socket.io")(5000);

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.listen(4000, () => {
  console.log(`Example app listening on port 3000!`)
});

io.on("connection", (socket) => {
  socket.on("join room", (arg1, arg2, callback) => {
    callback({
      status: "Success"
    });
  });

  socket.on("hi", (arg1, callback) => {
    callback({
      status: generateString(7)
    });
  });
  socket.on('join', (room, callback) =>  {
    socket.join(room);
    io.to(room).emit('Hey',{msg:`${room} has joined`});
  });
  socket.on('leave', function(room) {
    socket.leave(room);
    io.to(room).emit('Hey',{msg:`${room} hasleft`})
  })
});

// io.on("disconnect", (socket) => {
//   console.log(socket.id, "diss");

// });

