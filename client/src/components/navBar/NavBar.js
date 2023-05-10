import React from 'react'
import logo from './logo.png';
import "./Navbar.css";
import { Link } from "react-router-dom";

const NavBar = () => {
    return (
        <div className="NavBar">
            <Link to="/react">
                <img href="/" id="logo" src={logo} alt='Logo' />
                <div href="/" id="party_game">Party Game</div>
            </Link>
        </div>
    )
}

export default NavBar
