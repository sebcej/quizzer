import React from "react"
import api from "../../tools/api"

import LoginForm from "./LoginForm"
import {registerEvent, sendEvent, unregisterEvent} from "../../tools/socket";

export default class Login extends React.Component {
    async loggingUser (user) {
        console.log("Submitting user", user)

        let data = await api("user/login", {
            username: user
        });

        if (data.success)
            sendEvent("user.linkSocket", {
                userId: data.userId
            });
    }
    
    render () {
        return (
            <LoginForm onSubmit={this.loggingUser}/>
        );
    }
}