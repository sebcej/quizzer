import React from 'react';

import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';

import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

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
    },
    submitSecondary: {
        margin: theme.spacing(3, 0, 2),
        "margin-left": "15px"      
    },
    paper: {
        padding: theme.spacing(3)
    }
})

class Admin extends React.Component {
    constructor (props) {
        super(props);

        this.insertQuestion = this.insertQuestion.bind(this);

        this.state= {
            gameStatus: false,
            question: "",
            responseToQuestion: {
                text: "",
                questionId: false
            }
        }

        this.showGameStatus = this.showGameStatus.bind(this);
        this.responseToQuestion = this.responseToQuestion.bind(this);
        this.statusViewer = this.statusViewer.bind(this);
    }

    componentDidMount () {
        registerEvent("responseFromUser", this.responseToQuestion)
        registerEvent("questionStatus", this.showGameStatus)
    }

    componentWillUnmount () {
        unregisterEvent("responseFromUser", this.responseToQuestion)
        registerEvent("questionStatus", this.showGameStatus)
    }

    showGameStatus (data) {
        // Reset to initial state
        if (data.step === "WAITING_QUESTION")
            this.setState({
                ...this.state,
                question: "",
                responseToQuestion: {
                    text: "",
                    questionId: false
                }
            })

        this.setState({
            ...this.state,
            gameStatus: data
        })
    }

    responseToQuestion (data) {
        this.setState({
            ...this.state,
            responseToQuestion: {
                questionId: data.questionId,
                text: data.responseText
            }
        });
    }

    reboot() {
        sendEvent("admin.adminRestartsGame", {});
    }

    adminDecision (flag) {
        sendEvent("admin.adminDecided", {
            questionId: this.state.responseToQuestion.questionId,
            response: flag
        });
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
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper className={classes.paper}>
                        <form noValidate className={classes.form} autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                            <FormControl fullWidth className={classes.margin} variant="filled">
                                <TextField 
                                    id="standard-basic" 
                                    label="Insert question here"
                                    multiline
                                    value={this.state.question}
                                    disabled={!!this.state.responseToQuestion.text}
                                    onChange={event => this.setState({...this.state, question: event.target.value})}
                                    rows="4"
                                />
                            </FormControl>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={!!this.state.responseToQuestion.text}
                                onClick={this.insertQuestion}
                                className={classes.submit}
                            >
                            Send question
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                onClick={this.reboot}
                                className={classes.submitSecondary}
                            >
                            Restart game
                            </Button>
                        </form>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper className={classes.paper}>
                        <form noValidate className={classes.form} autoComplete="off" onSubmit={(e) => {e.preventDefault()}}>
                            <FormControl fullWidth className={classes.margin} variant="filled">
                                <TextField 
                                    id="standard-basic" 
                                    label="Response to question"
                                    multiline
                                    disabled
                                    value={this.state.responseToQuestion.text}
                                    rows="4"
                                />
                            </FormControl>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={!this.state.responseToQuestion.text}
                                onClick={() => this.adminDecision(true)}
                                className={classes.submit}
                            >
                            Accept
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                disabled={!this.state.responseToQuestion.text}
                                onClick={() => this.adminDecision(false)}
                                className={classes.submitSecondary}
                            >
                            Refuse
                            </Button>
                        </form>
                    </Paper>
                </Grid>
            </Grid>
        )
    }

    statusViewer () {
        let classes = this.props.classes,
            gameStatus = this.state.gameStatus;

        if (gameStatus)
            return (
                <Paper className={classes.paper}>
                    <h3>Situation:</h3>
                    <hr/>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <b>Step</b> - {gameStatus.step}
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <b>Timer</b> - {gameStatus.timer?gameStatus.timer:"None"}
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <b>Reserved user</b> - {gameStatus.reservedUser?gameStatus.reservedUser.userName:"None"}
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <b>Banned users</b> - {gameStatus.bannedUsers.length}
                        </Grid>
                    </Grid>
                </Paper>
            )
        return null;
    }

    render () {
        return (
            <div>
                <header>
                    <Header small/>
                </header>

                {this.questionEditor()}
                <br/>
                {this.statusViewer()}
            </div>
        )
    }
}

export default withStyles(mainStyle)(Admin)