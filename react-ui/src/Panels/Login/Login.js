import React from "react"
import api from "../../tools/api"

import LoginForm from "./LoginForm"
import {registerEvent, sendEvent, unregisterEvent, registerUser} from "../../tools/socket";

export default class Login extends React.Component {
    componentDidMount () {
        let storage = window.localStorage;

        // Login users if already logged in with localstorage
        if (storage.userId && storage.token){
            registerUser(storage.userId, storage.token)
            this.linkSocket(storage.userId, storage.token)
        }
        
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

        console.log(this.linkSocket)

        if (data.success) {
            registerUser(data.userId, data.token)
            sendEvent("user.linkSocket", {
                userId: data.userId,
                token: data.token
            });

            window.localStorage.userId = data.userId
            window.localStorage.token = data.token
        }
    }
    
    render () {
        return (
            <LoginForm onSubmit={this.loggingUser}/>
        );
    }
}