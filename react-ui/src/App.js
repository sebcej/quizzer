import React from 'react';
import './App.scss';

import Admin from "./Panels/Game/Admin";
import User from "./Panels/Game/User";
import Login from "./Panels/Login/Login";

import {registerEvent, unregisterEvent} from "./tools/socket";

import Container from '@material-ui/core/Container';
import Alert from '@material-ui/lab/Alert';
import WarningIcon from '@material-ui/icons/Warning';


export default class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            userId: false,
            loggedAs: false,
            isAdmin: false,
            connectionError: false,
            errors: []
        }

        this.userUpdate = this.userUpdate.bind(this);
    }

    componentDidMount () {
        registerEvent("userStatusUpdate", (data) => {
            this.userUpdate(data);
        });

        registerEvent("disconnect", (data)  => {
            this.setState({
                ...this.state,
                connectionError: true
            })
        });

        registerEvent("connect", (data)  => {
            this.setState({
                ...this.state,
                connectionError: false
            })
        });

        registerEvent("connect_error", () => {
            this.setState({
                ...this.state,
                connectionError: true
            })
        })

        registerEvent("error", (data)  => {
            // console.error("Socket error", data);
            if (data.text)
                this.showError(data.text)
       })
    }

    showError (errorText) {
        let updateState = () => {
            this.setState({
                ...this.state,
                errors
            })
        }

        let errors = this.state.errors;

        errors.push(errorText);

        updateState();

        setTimeout(() => {
            errors.pop();
            updateState()
        }, 5000)
    }

    componentWillUnmount () {
        unregisterEvent("userStatusUpdate", this.userUpdate);
        unregisterEvent("disconnect");
        unregisterEvent("connect");
        unregisterEvent("connect_error");
    }

    userUpdate (data) {
        this.setState({
            ...this.state,
            ...data
        });
    }

    pageMode () {
        if (this.state.loggedAs !== false && this.state.isAdmin === true)
            return <Admin userName={this.state.loggedAs} userId={this.state.userId}/>;
        else if (this.state.loggedAs !== false && this.state.isAdmin === false)
            return <User userName={this.state.loggedAs} userId={this.state.userId}/>;
        else if (this.state.loggedAs === false)
            return <Login/>;
        else
            return (<div class="text-center">Error during page load. Please retry</div>)
    }

    mainErrors () {
        return (
            <div>
                {this.state.errors.map((text) => <Alert severity="error">{text}</Alert>)}
            </div>
        )
    }
    
    noConnection () {
        return (
            <div id="connectionError">
                <WarningIcon style={{ fontSize: 100, color: "red" }}/>
                <div>
                    <b>Connection error</b>
                    <p>Reload page or check connection</p>
                </div>
            </div>
        )
    }

    mainPage () {
        return (
            <Container fixed>
                {this.mainErrors()}
                <div>
                    {this.pageMode()}
                </div>
            </Container>
        )
    }

    render() {
        return (
            <div className="App">
                {this.state.connectionError?this.noConnection():this.mainPage()}
            </div>
        );;
    }
}
