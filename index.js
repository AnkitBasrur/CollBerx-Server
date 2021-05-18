const express =  require('express')
const app = express()
const axios = require('axios');
app.use(express.json());
var cors = require('cors');
const nodemailer = require('nodemailer');
app.use(cors({origin: '*'}));
const server = require('http').Server(app)
const Room = require('./schema/Room')
const httpServer = require("http").createServer();
require('dotenv').config();
const { Octokit } = require("@octokit/core");

const client_id = "d38bd993581d49e7499c";
const secret_key = "5d52ad86353cb742c4a945a7e7b3599ddcf77eac";

const io = require('socket.io')(server)

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started: http://localhost:3000`)
})
const mongoose = require('mongoose');
const User = require('./schema/User');

const uri = "mongodb+srv://Ankit:ankit007@cluster0.nrn9d.mongodb.net/Task?authSource=admin&replicaSet=atlas-d7vrff-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true"
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var access_token = "";

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random()*charactersLength));
    }
    return result;
}

app.get('/', async(req, res) => { 
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${client_id}`);
})

app.get('/check', async(req, res) => {
  const data = await axios.get(`https://api.github.com/rate_limit`, { headers: { authorization: `token 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`}})
  res.json({ data: data.data });
})

app.get('/get-repos/:username/:name', async(req, res) => {
  var finalData = [];
  const username = req.params.username;
  const user = new User({ username, name: req.params.name, isGitUser: true });
  await user.save();

  const data = await axios.get(`https://api.github.com/users/${username}/repos`, { headers: { authorization: `token ${access_token}`}})

  var repos = [];
  repos = data.data.map(curr => ({
      name: curr.name,
      isForked: curr.fork,
      id: curr.id
  }))

  for(var i=0;i<repos.length;i++){
    const authorsData = await axios.get(`https://api.github.com/repos/${username}/${repos[i].name}/stats/contributors?anon=1`, { headers: { authorization: `token ${access_token}`}})
    var sourceID = repos[i].id;
    
    if(repos[i].isForked === true){
      const fork = await axios.get(`https://api.github.com/repos/${username}/${repos[i].name}`, { headers: { authorization: `token ${access_token}`}})
      sourceID = fork.data.source.id

      const room = await Room.findOne({ roomID: sourceID });
      if(room){
        await User.updateOne({ username }, { 
          $push: {
            rooms: { 
              designation: "Level Z",
              roomID: sourceID, 
              name: repos[i].name
            }
          }
        })
        var dt = new Date();
        var date = dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
        await Room.updateOne({ roomID: sourceID }, { 
          $push: {
            members: { 
              authLevel: "Level Z",
              id: username, 
              name: req.params.name
            },
            logs: {
              name: `${username} joined the room`,
              date,
              from: username
            }
          }
        })
      }
      else{
        const roomID = sourceID
        const room = new Room({ roomID, password: `${fork.data.source.owner.login}123`, owner: fork.data.source.owner.login, name: repos[i].name })
        await User.updateOne({ username }, { 
          $push: {
            rooms: { 
              designation: "Level Y",
              roomID, 
              name: repos[i].name
            }
          }
        })
        await room.save();
        var dt = new Date();
        var date = dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
        await Room.updateOne({ roomID }, { 
          $push: {
            members: { 
              authLevel: "Level Y",
              id: username, 
              name: req.params.name
            },
            logs: {
              name: `Created Room by ${username}`,
              date,
              from: username
            }
          }
        })
      }
    }
    else{
      const roomID = sourceID
      const room = await Room.findOne({ roomID });
      if(room){
        await User.updateOne({ username }, { 
          $push: {
            rooms: { 
              designation: "Level X",
              roomID, 
              name: repos[i].name
            }
          }
        })
        var dt = new Date();
        var date = dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
        await Room.updateOne({ roomID }, { 
          $push: {
            members: { 
              authLevel: "Level X",
              id: username, 
              name: req.params.name
            },
            logs: {
              name: `${username} joined the room`,
              date,
              from: username
            }
          }
        })
      }
      else{
        const room = new Room({ roomID, password: `${username}123`, owner: username, name: repos[i].name })
        await User.updateOne({ username }, { 
          $push: {
            rooms: { 
              designation: "Level X",
              roomID, 
              name: repos[i].name
            }
          }
        })
        await room.save();
        var dt = new Date();
        var date = dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
        await Room.updateOne({ roomID }, { 
          $push: {
            members: { 
              authLevel: "Level X",
              id: username, 
              name: req.params.name
            },
            logs: {
              name: `Created Room by ${username}`,
              date,
              from: username
            }
          }
        })
      }
    }
    var authors = [];

    if(authorsData.data.length > 0){
      authors.push(authorsData.data.map((curr) => curr.author.login));
      finalData.push({authors: authors[0], repoName: repos[i].name, sourceID })
    }
    else{
      finalData.push({repoName: repos[i].name })
    }
  }
  res.json({ finalData })
})

app.get('/oauth-callback', async(req, res) => {
  const requestToken = req.query.code
  
  axios({
    method: 'post',
    url: `https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${secret_key}&code=${requestToken}`,
    // Set the content type header, so that we get the response in JSON
    headers: {
         accept: 'application/json'
    }
  }).then((response) => {
    access_token = response.data.access_token
    res.redirect('/success');
  })
});

app.get('/success', function(req, res) {
  axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      Authorization: 'token ' + access_token
    }
  }).then(async(response) => {
    var name = response.data.name;
    if(response.data.name == null)
      name = response.data.login
    res.redirect(`/get-repos/${response.data.login}/${name}`);
  })
});

io.on("connection", (socket) => {

  socket.on("create room", async(password, owner, name, username ) => {
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
    await room.save();
    var dt = new Date();
    var date = dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    await Room.updateOne({ roomID }, { 
      $push: {
        members: { 
          authLevel: "Level X",
          id: owner, 
          name: username
        },
        logs: {
          name: `Created Room by ${username}`,
          date,
          from: username
        }
      }
    })
    await socket.join(roomID);
    io.emit("Hey", {msg: "Success", activeUsers: 1, roomID })
  });

  socket.on('join', async(roomID, password, email, name ) =>  {
    const room = await Room.findOne({ roomID });
    if(!room)
      io.emit("Hey", {err: "Incorrect room code"})
    else if(password !== room.password)
      io.emit('Hey', {err: "Incorrect password"})
    else{
      const isBlockedUser = room.blockedUser.find((member) => member.userID === email);
      if(isBlockedUser){
        io.emit('Hey', {err: "You have been barred from entering this room."});
        return;
      }
      const isObjectPresent = room.members.find((member) => member.id === email);
      if(isObjectPresent){
        io.emit('Hey', {err: "You are a member of this room."});
        return;
      }
      
      var dt = new Date();
      var date = dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
      if(!isObjectPresent){
        await Room.updateOne({ roomID }, {
          $push: {
            members: {
              name, 
              id: email, 
              authLevel: "Level Z"
            },
            logs: {
              name: `${name} joined the Room`,
              date,
              from: name
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

app.post('/login', async (req, res) => {
  const {username, password} = req.body;

  const user = await User.findOne({ username });

  if(!user)
      res.status(200).send({message:"No username found"});
  else{
      if(password === user.password || password.length==0)
          res.status(200).json({message: "Success", name: user.name})
      else
          res.status(200).json({message: "Incorrect Password"});
  }
})

app.post('/signup', async (req, res) => {
  const {name, username, password} = req.body;

  try{
      const user = new User({ name, username, password });
      await user.save();
      res.status(200).json({ message: "Success"});
  }
  catch(err){
      res.status(200).json({ message: "Email already exists"});
  }
})

app.post('/addData', async(req, res) => {
  if(req.body.type === 'Pending'){
    await Room.updateOne({ roomID: req.body.roomID }, {
      $push: {
        pending: { 
          taskID: req.body.taskID,
          name: req.body.name,
          createdAt: req.body.createdAt,
          createdBy: req.body.createdBy
        },
        logs: {
          name: `Added task ${req.body.name} in Pending`,
          date: req.body.createdAt,
          from: req.body.createdBy
        }
      }
      }
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
        },
        logs: {
          name: `Added task ${req.body.name} in Active`,
          date: req.body.createdAt,
          from: req.body.createdBy
        }
      }
      }
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
        },
        logs: {
          name: `Added task ${req.body.name} in Completed`,
          date: req.body.createdAt,
          from: req.body.createdBy
        }
      }
      }
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
      },
      $push: {
        logs: {
          name: `Removed task ${req.body.name} from Pending`,
          date: req.body.date,
          from: req.body.userID
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
      },
      $push: {
        logs: {
          name: `Removed task ${req.body.name} from Active`,
          date: req.body.date,
          from: req.body.userID
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
      },
      $push: {
        logs: {
          name: `Removed task ${req.body.name} from Completed`,
          date: req.body.date,
          from: req.body.userID
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
        },
        logs: {
          name: `Moved ${req.body.name} from Pending to Active task`,
          date: req.body.createdAt,
          from: req.body.createdBy
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
        },
        logs: {
          name: `Moved ${req.body.name} from Active to Completed task`,
          date: req.body.createdAt,
          from: req.body.createdBy
        }
      }
    })
    
  }
  res.send()
})

app.post('/addChat', async (req, res) => {
  await Room.updateOne({ roomID: req.body.id }, { 
    $push: { 
      chat: {
        from: req.body.fromName,
        text: req.body.text,
        chatID: req.body.chat,
        priority: req.body.priority
      }
    }
  })
  if(req.body.priority === "High"){
    var emails = [];
    const room = await Room.findOne({ roomID: req.body.id });
    emails.push(room.members.map((member) => member.id ))
    emails = await emails[0].filter((member) => member !== req.body.fromEmail )
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    });
    let info = {
      from: process.env.EMAIL, 
      to: emails, 
      subject: `Received Important Message from ${req.body.fromName} in ${room.name}`, 
      text: "Hello world", 
      html: `<div><p><b>You have recieived high priority message in ${room.name}.</b></p>
      <div> <p><b>${req.body.fromName} : </b> ${req.body.text}</p>
      To view the message <a href="https://collberx.vercel.app/">Click Here!</a>
      </div>`, 
    };
    transporter.sendMail(info, (err,info) => {
      if(err)
        console.log(err);
      else
        res.status(200).send({ message: "success" })
    })
  }
  res.send();
})

app.get('/getProjects/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
  var arr = [];

  for(var i=0; i<user.rooms.length;i++){
    arr[i] = user.rooms[i].roomID
  }
  const room = await Room.find({ roomID: arr }).lean();

  for(var i=0; i<room.length; i++){
    room[i].data = await room[i].members.filter((user) => user.id === req.params.username)[0]
  }

  res.send({room })
})

app.post('/changeAuth', async(req, res) => {
  await Room.updateOne({ roomID: req.body.id, "members.id": req.body.user }, {
    $set: {
      "members.$.authLevel": req.body.level
    },
    $push: {
      logs: {
        name: `Changed Auth Level of ${req.body.user} to ${req.body.level}`,
        date: req.body.date,
        from: req.body.from
      }
    }
  })
  res.send();
})

app.post('/drag', async (req, res) => {

  if(req.body.source.droppableId === "Pending"){ 
    var data = await Room.findOneAndUpdate({ roomID: req.body.id }, {
      $pull: {
        pending: {
          taskID : req.body.draggableId
        }
      }
    })
    data = data.pending.filter((curr) => curr.taskID === req.body.draggableId)
  }
  else if(req.body.source.droppableId === "Active"){ 
    var data = await Room.findOneAndUpdate({ roomID: req.body.id }, {
      $pull: {
        ongoing: {
          taskID : req.body.draggableId
        }
      }
    })
    data = data.ongoing.filter((curr) => curr.taskID === req.body.draggableId)
  }
  else{
    var data = await Room.findOneAndUpdate({ roomID: req.body.id }, {
      $pull: {
        finsished: {
          taskID : req.body.draggableId
        }
      }
    })
    data = data.finsished.filter((curr) => curr.taskID === req.body.draggableId)
  }

if(req.body.destination.droppableId === "Pending"){
  await Room.updateOne({ roomID: req.body.id }, {
    $push: {
      pending:{
        $each: [data[0]],
        $position: req.body.destination.index
      },
      logs: {
        name: `Drag ${data[0].name} from ${req.body.source.droppableId} to ${req.body.destination.droppableId} task`,
        date: req.body.date,
        from: req.body.from
      }
    }
  })
}
else if(req.body.destination.droppableId === "Active"){
  await Room.updateOne({ roomID: req.body.id }, {
    $push: {
      ongoing:{
        $each: [data[0]],
        $position: req.body.destination.index
      },
      logs: {
        name: `Drag ${data[0].name} from ${req.body.source.droppableId} to ${req.body.destination.droppableId} task`,
        date: req.body.date,
        from: req.body.from
      }
    }
  })
}
else{
  await Room.updateOne({ roomID: req.body.id }, {
    $push: {
      finsished:{
        $each: [data[0]],
        $position: req.body.destination.index
      },
      logs: {
        name: `Drag ${data[0].name} from ${req.body.source.droppableId} to ${req.body.destination.droppableId} task`,
        date: req.body.date,
        from: req.body.from
      }
    }
  })
}
    res.send()
})

app.post('/blockUser/:userID/:roomID', async (req, res) => {
  await Room.updateOne({ roomID: req.params.roomID }, { 
    $push: {
      blockedUser: {
        userID: req.params.userID
      },
      logs: {
        name: `Blocked ${req.params.userID}`,
        date: req.body.date,
        from: req.body.from
      }
    },
    $pull: {
      members: {
        id: req.params.userID
      }
    }
  })

  await User.updateOne({email: req.params.userID}, {
    $pull: {
      rooms: {
        roomID: req.params.roomID
      }
    }
  })
  
  res.send();
})
app.post('/removeUser/:userID/:roomID', async (req, res) => {
  await Room.updateOne({ roomID: req.params.roomID }, { 
    $push: {
      logs: {
        name: `Removed ${req.params.userID}`,
        date: req.body.date,
        from: req.body.from
      }
    },
    $pull: {
      members: {
        id: req.params.userID
      }
    }
  })

  await User.updateOne({email: req.params.userID}, {
    $pull: {
      rooms: {
        roomID: req.params.roomID
      }
    }
  })
  res.send();
})
