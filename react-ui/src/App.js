import React from 'react';
import './App.scss';

import Admin from "./Panels/Game/Admin";
import User from "./Panels/Game/User";
import Login from "./Panels/Login/Login";

import {registerEvent, sendEvent, unregisterEvent} from "./tools/socket";


export default class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            id: false,
            loggedAs: false,
            isAdmin: false
        }
    }

    componentDidMount () {
        registerEvent("userStatusUpdate", (data) => {
            console.log("Updating status", data)
            this.userUpdate(data);
        });
    }

    componentWillUnmount () {
        unregisterEvent("userStatusUpdate", this.userUpdate);
    }

    userUpdate (data) {
        this.setState({
            ...data
        });
    }

    pageMode () {
        if (this.state.loggedAs !== false && this.state.isAdmin === true)
            return <Admin username={this.state.loggedAs} userid={this.state.id}/>;
        else if (this.state.loggedAs !== false && this.state.isAdmin === false)
            return <User username={this.state.loggedAs} userid={this.state.id}/>;
        else if (this.state.loggedAs === false)
            return <Login />;
    }

    render() {
        return (
        <div className="App">
            <header className="App-header">
            {this.pageMode()}
            </header>
        </div>
        );;
    }
}
