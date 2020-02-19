import React from 'react';
import './App.scss';

import Admin from "./Panels/Game/Admin";
import User from "./Panels/Game/User";
import Login from "./Panels/Login/Login";

import {registerEvent, unregisterEvent} from "./tools/socket";

import Container from '@material-ui/core/Container';
import Alert from '@material-ui/lab/Alert';


export default class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            id: false,
            loggedAs: false,
            isAdmin: false,
            errors: []
        }
    }

    componentDidMount () {
        registerEvent("userStatusUpdate", (data) => {
            this.userUpdate(data);
        });

        registerEvent("disconnect", (data)  => {
             console.log("Disconnected!")
             this.showError("Disconnected")
        })

        registerEvent("error", (data)  => {
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
    }

    userUpdate (data) {
        this.setState({
            ...this.state,
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

    render() {
        return (
            <div className="App">
                <Container fixed>
                    {this.mainErrors()}
                    <div>
                        {this.pageMode()}
                    </div>
                </Container>
            </div>
        );;
    }
}
