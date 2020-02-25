import React from "react"
import api from "../../tools/api"

import LoginForm from "./LoginForm"
import {sendEvent, registerUser} from "../../tools/socket";

import {errorMessages} from "../messages"

export default class Login extends React.Component {
    constructor (props) {
        super(props)

        this.state = {
            visible: false,
            error: false
        }

        this.timeoutState = false

        this.loggingUser = this.loggingUser.bind(this)
    }

    componentDidMount () {
        let storage = window.sessionStorage;

        // Login users if already logged in with localstorage
        if (storage.userId && storage.token){
            registerUser(storage.userId, storage.token);
            this.linkSocket(storage.userId, storage.token);

            // Only a fallback in case something went wrong with autologin response
            this.timeoutState = setTimeout(() => {
                this.setState({
                    ...this.state,
                    visible: true
                });
            }, 200)
        } else {
            this.setState({
                ...this.state,
                visible: true
            });
        }
    }

    componentWillUnmount () {
        clearTimeout(this.timeoutState)
    }

    linkSocket (userId, token) {
        sendEvent("user.linkSocket", {
            userId,
            token
        });
    }

    async loggingUser (user) {
        let data = await api("user/login", {
            username: user
        });

        if (data.success) {
            registerUser(data.userId, data.token)
            sendEvent("user.linkSocket", {
                userId: data.userId,
                token: data.token
            });

            window.sessionStorage.userId = data.userId
            window.sessionStorage.token = data.token

            this.setState({
                ...this.state,
                error: ""
            })
        } else if(data.error){
            this.setState({
                ...this.state,
                error: data.error
            })
        }
    }
    
    render () {
        if (this.state.visible)
            return (
                <LoginForm onSubmit={this.loggingUser} error={this.state.error?errorMessages[this.state.error]:false}/>
            );
        return null;
    }
}