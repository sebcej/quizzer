import React from 'react';

import api from "../../tools/api";
import {registerEvent, sendEvent, unregisterEvent} from "../../tools/socket";

export default class Admin extends React.Component {
    constructor () {

    }

    componentDidMount () {
        registerEvent("responseToQuestion", this.responseToQuestion)
    }

    componentWillUnmount () {
        unregisterEvent("responseToQuestion", this.responseToQuestion)
    }

    responseToQuestion () {
        
    }

    render () {
        return (
            <div>
                Das good
            </div>
        )
    }
}