import { selectRandomTopic, chooseTwoValues } from './helpers/helpers.js';
import express from 'express';
import cors from "cors";
import bp from 'body-parser'
import RoomRepository from './repositories/room.js';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from "socket.io";


config()

const app = express();
const http = createServer(app);
const io = new Server(http, {
    allowEIO3: true,
    cors: {
        origin: process.env.origin,
        methods: ["GET", "POST"],
        credentials: true,
    }
})
const corsOptions = {
    origin: process.env.origin,
    credentials: true,
}
app.use(cors(corsOptions));

var jsonParser = bp.json()

let RoomRepo = new RoomRepository();

//post request to join room
app.post('/join_room', jsonParser, async (req, res) => {
    //check if the room which this exist or not
    /** @var {string} room_id */
    const room_id = req.body.room_id;
    const curr_room = RoomRepo.findById(room_id)
    if (curr_room) {
        res.status(200).json({ doc: curr_room });
    } else {
        res.status(200).json({ err: "Enter Valid Room ID" })
    }
})

app.get('/create_room', (_, res) => {
    let room = RoomRepo.create()
    res.json(room.uid);
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
        let room = RoomRepo.addPlayer(room_id, player)
        io.to(room_id).emit('playersChange', room.users);
    })

    socket.on('playerRemoved', async (room_id, player) => {
        let room = RoomRepo.removePlayer(room_id, player)
        io.to(room_id).emit('playersChange', room.users);
    })

    socket.on('roundWordSet', (room) => {
        io.to(room).emit('newWord', selectRandomTopic("topics.json"));
    }) // respond to a random word being set for a round

    socket.on('roundPlayersSet', async (room_id) => {
        let players;
        const room = RoomRepo.findById(room_id)
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
        const room = RoomRepo.findById(room_id)
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
                RoomRepo.updatePlayerScore(room_id, player_1, newScore);
            } catch (error) {
                console.error(error);
            }
        } else if (players.player_1.votes < players.player_2.votes) {
            io.to(room_id).emit('winner', players.player_2, players.player_1);
            try {
                const newScore = players.player_2.score + 100
                RoomRepo.updatePlayerScore(room_id, player_2, newScore);
            } catch (error) {
                console.error(error);
            }
        } else {
            try {
                const newScore = players.player_1.score + 50
                RoomRepo.updatePlayerScore(room_id, player_1, newScore);
            } catch (error) {
                console.error(error);
            }
            try {
                const newScore = players.player_2.score + 50
                RoomRepo.updatePlayerScore(room_id, player_2, newScore);
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

export default app;
