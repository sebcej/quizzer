import React from "react"
import api from "../../tools/api"

import LoginForm from "./LoginForm"

export default class Admin extends React.Component {
    loggingUser (user) {
        console.log("Submitting user", user)

        api("user/login", {
            username: user
        })
    }
    
    render () {
        return (
            <LoginForm onSubmit={this.loggingUser}/>
        );
    }
}