import React from 'react';

import api from "../../tools/api";
import {registerEvent, sendEvent, unregisterEvent} from "../../tools/socket";

export default class User extends React.Component {
    constructor () {

    }

    componentDidMount () {
        registerEvent("questionStatus", this.questionStatus)
    }

    componentWillUnmount () {
        unregisterEvent("questionStatus", this.questionStatus)
    }

    questionStatus () {
        
    }

    render () {
        return (
            <div>
                Das good
            </div>
        )
    }
}