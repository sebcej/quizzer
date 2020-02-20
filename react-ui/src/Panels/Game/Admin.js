import React from 'react';

import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';

import { withStyles } from '@material-ui/core/styles';

import Header from "../Header"

import {registerEvent, sendEvent, unregisterEvent} from "../../tools/socket";

const mainStyle = theme => ({
    form: {
      width: '100%', // Fix IE 11 issue.
      marginTop: theme.spacing(1),
      "text-align": "center"
    },
    submit: {
      margin: theme.spacing(3, 0, 2)
    }
})

class Admin extends React.Component {
    constructor (props) {
        super(props);

        this.insertQuestion = this.insertQuestion.bind(this);

        this.state= {
            question: ""
        }
    }

    componentDidMount () {
        registerEvent("responseToQuestion", this.responseToQuestion)
    }

    componentWillUnmount () {
        unregisterEvent("responseToQuestion", this.responseToQuestion)
    }

    responseToQuestion () {
        
    }

    insertQuestion (e) {
        e.preventDefault();
        console.log("Inserting question")
        sendEvent("admin.insertQuestion", {
            question: this.state.question
        });
    }


    questionEditor () {
        let classes = this.props.classes;

        return (
            <form noValidate className={classes.form} autoComplete="off" onSubmit={this.insertQuestion}>
                <FormControl fullWidth className={classes.margin} variant="filled">
                    <TextField 
                        id="standard-basic" 
                        label="Insert question here"
                        multiline
                        onChange={event => this.setState({...this.state, question: event.target.value})}
                        rows="4"
                    />
                </FormControl>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                >
                Send question
                </Button>
            </form>
        )
    }

    render () {
        return (
            <div>
                <header>
                    <Header small/>
                </header>
                {this.questionEditor()}
            </div>
        )
    }
}

export default withStyles(mainStyle)(Admin)