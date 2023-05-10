const fs = require('fs');
require('dotenv').config()


function selectRandomTopic(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    const topics = JSON.parse(data).topics;
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
}

function chooseTwoValues(elemList) {
    let elem1;
    let elem2;
    const first_pos = Math.floor(Math.random() * elemList.length)
    elem1 = elemList[first_pos];
    do {
        const second_pos = Math.floor(Math.random() * elemList.length)
        elem2 = elemList[second_pos];
    } while (elem1 === elem2);
    return { first: elem1, second: elem2 }

}

const express = require('express')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    allowEIO3: true,
    cors: {
        origin: process.env.origin,
        methods: ["GET", "POST"],
        credentials: true,
    }
})

//Using CORS policy
const cors = require("cors");
const corsOptions = {
    origin: process.env.origin,
    credentials: true,
}
app.use(cors(corsOptions));

const bodyParser = require('body-parser');
var jsonParser = bodyParser.json()

// Using Node.js `require()`FOR mongoDB
const mongoose = require('mongoose');
// configure mongoDB
const mongoDB = process.env.mongoose_url
//connect local database 
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database Connected...'))
    .catch(err => console.log('Error connecting database', err));


const Room = require('./models/Room');


//post request to join room
app.post('/join_room', jsonParser, async (req, res) => {
    //check if the room which this exist or not
    const room_id = req.body.room_id;
    const curr_room = await Room.findOne({ room_id: room_id })
        .catch((err) => {
            console.log('error occured while checking room', err)
        });

    if (curr_room) {
        // check if room has less than 2 user
        const doc = await curr_room.save();
        res.status(200).json({ doc });
    } else {
        res.status(200).json({ err: "Enter Valid Room ID" })
    }
})

app.get('/create_room', (_, res) => {
    //Generating unique id for each room
    var alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g',
        'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u',
        'v', 'w', 'x', 'y', 'z'];

    let result = "";
    for (let index = 0; index < 5; index++) {
        result += alphabet[Math.floor(Math.random() * 10000) % 25];
    }
    //Saving newly creted roomt to database
    const room = new Room({ room_id: result, users: [] });
    room.save().then(() => {
        console.log('room created', result);
    }).catch((err) => {
        console.log('err creating room', err);
    })
    res.json(result);
})

//Sample Request
app.get("/", (_, res) => {
    res.send({ message: "We live!" });
});

//Open Socket io Connection
io.on('connection', (socket) => {
    let player_1;
    let player_2;
    // user join register room_id 
    socket.on('join', async (room_id, player) => {
        socket.join(room_id);
        let room;
        console.log(player)
        try {
            room = await Room.findOneAndUpdate(
                { room_id: room_id },
                { $push: { users: player } },
                { new: true }
            ).exec();
        } catch (err) {
            console.log(err);
        }
        console.log(room.users)
        if (room) {
            io.to(room_id).emit('playersChange', room.users);
        }
    })

    socket.on('playerRemoved', async (room_id, player) => {
        let room;
        try {
            room = await Room.findOneAndUpdate(
                { room_id: room_id },
                { $pull: { users: { id: player.id } } },
                { new: true }
            ).exec();
        } catch (err) {
            console.log(err);
        }
        console.log(room.users)
        io.to(room_id).emit('playersChange', room.users);
    }) // respond to a player being removed from a lobby
    // socket.on('gameStarted', { roundId, players, room }) // respond to a game starting



    socket.on('roundWordSet', (room) => {
        io.to(room).emit('newWord', selectRandomTopic("topics.json"));
    }) // respond to a random word being set for a round



    socket.on('roundPlayersSet', async (room_id) => {
        let players;
        const room = await Room.findOne({ room_id: room_id })
        const users = room.users;
        players = users.map(user => ({
            id: user.id,
            name: user.name,
            score: user.score
        }));

        if (players.length > 1) {
            const chosen = chooseTwoValues(players);
            player_1 = chosen.first;
            player_2 = chosen.second;
            player_1.votes = 0
            player_2.votes = 0
            io.to(room_id).emit('votes', { player_1: player_1, player_2: player_2 });
        } else {
            io.to(room_id).emit('votes', { name: "error" }, { name: `${players.length} player` });
        }
    }) // respond to a player being removed from a lobby

    socket.on('updatePlayers', async (room_id) => {
        let players;
        const room = await Room.findOne({ room_id: room_id })
        const users = room.users;
        players = users.map(user => ({
            id: user.id,
            name: user.name,
            score: user.score
        }));

        io.to(room_id).emit("players", players)
    })
    socket.on('voteRegistered', (room_id, players) => {
        // console.log(players)
        io.to(room_id).emit("votes", players)
    }) // respond to a vote being registered for a player

    socket.on('getRoundWinner', async (room_id, players) => {
        if (players.player_1.votes > players.player_2.votes) {
            io.to(room_id).emit('winner', players.player_1, players.player_2);
            try {
                const newScore = players.player_1.score + 100
                await Room.updateOne(
                    { room_id: room_id, 'users.id': players.player_1.id },
                    { $set: { 'users.$.score': newScore } }, { new: true }
                );
            } catch (error) {
                console.error(error);
            }
        } else if (players.player_1.votes < players.player_2.votes) {
            io.to(room_id).emit('winner', players.player_2, players.player_1);
            try {
                const newScore = players.player_2.score + 100
                await Room.updateOne(
                    { room_id: room_id, 'users.id': players.player_2.id },
                    { $set: { 'users.$.score': newScore } }, { new: true }
                );
            } catch (error) {
                console.error(error);
            }
        } else {
            try {
                const newScore = players.player_1.score + 50
                await Room.updateOne(
                    { room_id: room_id, 'users.id': players.player_1.id },
                    { $set: { 'users.$.score': newScore } }, { new: true }
                );
            } catch (error) {
                console.error(error);
            }
            try {
                const newScore = players.player_2.score + 50
                await Room.updateOne(
                    { room_id: room_id, 'users.id': players.player_2.id },
                    { $set: { 'users.$.score': newScore } }, { new: true }
                );
            } catch (error) {
                console.error(error);
            }
            io.to(room_id).emit('winner', { name: "tie" }, { name: players.player_1.votes });
        }
    }) // respond to a vote being registered for a player
    // socket.on('scores', { scores }) //respond to a request for scores



    //incoming message from chat.js
    socket.on('sendMessage', async ({ message, name, user_id, room_id }) => {
        const msgToStore = {
            name,
            user_id,
            room_id,
            text: message
        }

        io.to(room_id).emit('messageReceived', msgToStore);
    })


})


//Start Up Server 
const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
    console.log('Backend Server listing at PORT:', PORT);
})
