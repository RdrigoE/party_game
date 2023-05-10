import React from 'react'
import './Game.css'
import { UserContext } from "../../UserContext"
import { useState, useEffect, useContext } from 'react'
import Chat from '../play/chat/Chat'

const Game = ({ socket, room_id, playerPool }) => {
    const { user, setUser } = useContext(UserContext);
    //to store in input FORM
    const [word, setWord] = useState('');
    //array to store message
    const [players, setPlayers] = useState({ player_1: '', player_2: '' })

    const [roundResult, setRoundResult] = useState()
    const [isDisabled, setIsDisabled] = useState(false)
    const [buttonColor, setButtonColor] = useState("green")
    const [againstColor, setAgainstColor] = useState("")
    const [favorColor, setFavorColor] = useState("")
    //function that sends message to server
    const winning_color = "#0bc804"
    const losing_color = "#900e0e"
    const tie_color = "#e09e00"
    const default_color = "#1a1b26"
    const setWord_Players = () => {
        if (playerPool.length < 2) {
            return
        }
        socket.emit('roundWordSet', room_id);
        socket.emit('roundPlayersSet', room_id);
    }

    const vote = (player) => {
        if (players === undefined) {
            return
        }
        setIsDisabled(true)

        if (player === 1) {
            players.player_1.votes += 1
        } else if (player === 2) {
            players.player_2.votes += 1
        }
        socket.emit('voteRegistered', room_id, players);
    }

    useEffect(() => {
        socket.on('votes', players => {
            setPlayers(players)
        });
    }, [])

    useEffect(() => {
        if (players.player_1.id === user.id || players.player_2.id === user.id) {
            setIsDisabled(true)
        }
    }, [players])

    useEffect(() => {
        socket.on('newWord', word => {
            setWord(word)
            setRoundResult()
            setIsDisabled(false)
            setFavorColor(default_color)
            setAgainstColor(default_color)
        });
    }, [])

    useEffect(() => {
        if (isDisabled) {
            setButtonColor("#2c332c")
        } else {
            setButtonColor("#81cc00")
        }
    }, [isDisabled])
    useEffect(() => {
        if (roundResult === undefined) {
            return
        }
        if (roundResult.winner.name === "tie") {
            //color yellow
            setFavorColor(tie_color)
            setAgainstColor(tie_color)

            return
        }
        if (roundResult.winner.id === players.player_1.id) {
            setFavorColor(winning_color)
            setAgainstColor(losing_color)
        } else {
            setFavorColor(losing_color)
            setAgainstColor(winning_color)
        }
    }, [roundResult])

    useEffect(() => {
        socket.on('newPlayers', (player_1, player_2) => {
            setPlayers(
                {
                    player_1: player_1,
                    player_2: player_2
                }
            );
        });
    }, [])

    useEffect(() => {
        socket.on('winner', (winner, loser) => {
            setRoundResult(
                {
                    winner: winner,
                    loser: loser
                }
            );
            socket.emit("updatePlayers", room_id)
        });
    }, [])
    const getVoteResult = () => {
        console.log(players, players.player_1.name)
        if (players.player_1.name === undefined){
            return
        }
        socket.emit('getRoundWinner', room_id, players);
    }

    return (
        <div className='background'>
            <div className='grid-container'>
                <div className='players-messages'>

                    <div className='player-container'>
                        <h1>Players </h1>
                        {playerPool.map(p => <div key={p.id}> {p.name} - {p.score} points </div>)}
                    </div>
                    <Chat socket={socket} room_id={room_id ? room_id : ''} />
                </div>

                <div className='game-loop'>
                    <div className='question_area'>
                        <h1> Question </h1>
                        <p>{word}</p>
                    </div>
                    <div className='player favor' style={{ backgroundColor: favorColor }}>
                        <h1> Favor </h1>
                        {players && <p> {players.player_1.name}</p>}
                        <button onClick={() => vote(1)} style={{ backgroundColor: buttonColor }} disabled={isDisabled}> Vote </button>
                    </div>
                    <div className='player against' style={{ backgroundColor: againstColor }} >
                        <h1> Against </h1>
                        {players && <p> {players.player_2.name}</p>}
                        <button onClick={() => vote(2)} style={{ backgroundColor: buttonColor }} disabled={isDisabled}> Vote </button>
                    </div>
                </div>
            </div >
            <div>
                <button onClick={setWord_Players}> New Word and Players </button>
                <button onClick={getVoteResult}> Get result </button>
                {roundResult ? <>
                    <div>Winner: {roundResult.winner.name} - {roundResult.winner.votes}</div>
                    <div>Loser: {roundResult.loser.name} - {roundResult.loser.votes}</div></> : ''
                }
            </div>
        </div>
    )
}

export default Game

