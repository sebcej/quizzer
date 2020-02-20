import React from 'react';

import logo from "../logo.png";

export default class MainIcon extends React.Component {
    constructor (props) {
        super(props)
    }

    render () {
        return (
            <div className={`mainLogo ${this.props.small ? "small" : ""}`}>
               <img src={logo} alt="logo"></img>
            </div>
        )
    }
}