/*IMPORTS*/
import React, { useState, useContext, useEffect } from 'react'
import { useParams, Redirect } from "react-router-dom";
import Chat from './chat/Chat';
import io from 'socket.io-client'
import serverURL from "../../constant";
import { UserContext } from "../../UserContext"
import './play.css'
import Loading from './Loading/Loading'
import Game from './../game/Game';

let socket;
const Play = () => {

    const ENDPT = `http://${serverURL}/`
    //set global user
    const { user, setUser } = useContext(UserContext);
    //To Get Paramters from URL and display
    const { room_id } = useParams();

    const [socketHasBeenInitialized, setSocketHasBeenInitialized] = useState(false)
    const [playNow, setPlayNow] = useState(false);
    const [playerPool, setPlayerPool] = useState([]);

    useEffect(() => {
        socket = io(ENDPT);
        setSocketHasBeenInitialized(true);
        //return to if user doesn not exist means someone cam here from illegal way 
        if (!user) {
            return;
        }
        //emit join user event to server with below parmas 
        user.score = 0
        socket.emit('join', room_id, user);
        setPlayNow(true)
        const handleBeforeUnload = () => {
            // Perform function here
            socket.emit("playerRemoved", room_id, user)
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };

    }, [ENDPT])


    useEffect(() => {
        socket.on('playersChange', players => {
            setPlayerPool(players)
        })
    }, [])

    useEffect(() => {
        socket.on('players', players => {
            setPlayerPool(players)
        })
    }, [])


    //No point in going further if user does not exist
    if (!user) {
        return <Redirect to='/login' />;
    }
    return (playNow && socketHasBeenInitialized) ? (
        <div className='play'>
            <Game socket={socket} room_id={room_id ? room_id : ''} playerPool={playerPool} />
        </div>
    ) : (
        <div><Loading room_id={room_id} /></div>
    )
}

export default Play
