import React from 'react';

import api from "../../tools/api";
import {registerEvent, sendEvent, unregisterEvent} from "../../tools/socket";

export default class User extends React.Component {
    constructor () {
        this.status = {
            question: false
        }
    }

    componentDidMount () {
        registerEvent("questionStatus", this.questionStatus)
    }

    componentWillUnmount () {
        unregisterEvent("questionStatus", this.questionStatus)
    }

    questionStatus (data) {
        console.log("Question received", data);
        this.setState({
            question: data
        })
    }

    render () {
        return (
            <div>
                Das good

                {this.status.question.text}
            </div>
        )
    }
}