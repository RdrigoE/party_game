const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    room_id: String,
    users: [{
        id: String,
        name: String,
        score: Number
    }]
});


const Room = mongoose.model('Room', RoomSchema);
module.exports = Room;
