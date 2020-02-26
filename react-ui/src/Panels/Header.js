import React from 'react';

import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import {sendEvent} from "../tools/socket";

import logo from "../logo.png";

export default class MainIcon extends React.Component {

    getLogoutLink () {
        return (<ExitToAppIcon onClick={() => sendEvent("user.logout", {})} title="Logout" className="logoutButton"/>);
    }

    render () {
        return (
            <header>
                <div className={`mainLogo ${this.props.small ? "small" : ""}`}>
                    <img src={logo} alt="logo"></img>
                </div>

                {this.props.small&&this.getLogoutLink()}
            </header>
        )
    }
}