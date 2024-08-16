/**
 * @class RoomRepo
 * @description Manages rooms, each containing a list of users.
 * @property rooms
 */
class RoomRepository {
    /**
     * @typedef {Object} Player
     * @property {String} id - The unique identifier for the user.
     * @property {String} name - The name of the user.
     * @property {Number} score - The user's score.
     */


    /**
     * @typedef {Object} Room
     * @property {String} uid - The unique identifier for the user.
     * @property {Object.<string, Player[]>} users - The users.
     */

    constructor() {
        /**
         * @type {Room[]}
         */
        this.rooms = [];
    }

    /**
     * 
     * @returns {Room}
     */
    create() {
        //Generating unique id for each room
        var alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g',
            'h', 'i', 'j', 'k', 'l', 'm', 'n',
            'o', 'p', 'q', 'r', 's', 't', 'u',
            'v', 'w', 'x', 'y', 'z'];

        let room_uid = "";
        for (let index = 0; index < 5; index++) {
            room_uid += alphabet[Math.floor(Math.random() * 10000) % 25];
        }

        this.rooms[room_uid] = {
            uid: room_uid,
            users: []
        }
        return this.rooms[room_uid]
    }

    /**
     * 
     * @param { string } room_uid 
     */
    findById(room_uid) {
        return this.rooms[room_uid]
    }

    /**
     * 
     * @param {string} room_uid 
     * @param {Player} player 
     * @returns {Room}
     */
    addPlayer(room_uid, player) {
        this.rooms[room_uid].users.push(player)
        return this.rooms[room_uid]
    }

    /**
     * 
     * @param {string} room_uid 
     * @param {Player} player 
     * @returns {Room}
     */
    removePlayer(room_uid, player) {
        console.log(this.rooms[room_uid].users)
        this.rooms[room_uid].users = this.rooms[room_uid].users.filter(e => e.id != player.id)
        console.log(this.rooms[room_uid].users)
        return this.rooms[room_uid]
    }

    /**
     * 
     * @param {string} room_uid 
     * @param {Player} player 
     * @param {number} new_score 
     * @returns {Room}
     */
    updatePlayerScore(room_uid, player, new_score) {
        this.rooms[room_uid].users[player.id].score = new_score
        return this.rooms
    }
}


export default RoomRepository
