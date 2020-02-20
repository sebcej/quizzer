import React from 'react';
import "./user.scss";

import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';

import { withStyles } from '@material-ui/core/styles';

import {registerEvent, sendEvent, unregisterEvent} from "../../tools/socket";

import Header from "../Header"

const mainStyle = theme => ({
    paper: {
        padding: theme.spacing(3),
        "background-color": "#A9E5E0",
        "text-align": "center"
    }
});

class User extends React.Component {
    constructor (props) {
        super(props)
        
        this.state = {
            question: false,
            reservedByMe: false,
            response: ""
        }

        this.questionStatus = this.questionStatus.bind(this);
        this.reservationAccepted = this.reservationAccepted.bind(this);
        this.getQuestion = this.getQuestion.bind(this);
    }

    componentDidMount () {
        registerEvent("questionStatus", this.questionStatus)
        registerEvent("reservationAccepted", this.reservationAccepted)
    }

    componentWillUnmount () {
        unregisterEvent("questionStatus", this.questionStatus)
        unregisterEvent("reservationAccepted", this.reservationAccepted)
    }

    questionStatus (data) {
        console.log("Question received", data);
        this.setState({
            ...this.state,
            question: data
        })
    }

    reservationAccepted (data) {
        if (this.state.question.id === data.questionId)
            this.setState({
                ...this.state,
                reservedByMe: true
            });
    }

    getQuestion () {
        sendEvent("user.reserveResponse", {
            questionId: this.state.question.id
        })
    }

    viewsRouter () {
        if (!this.state.question)
            return (this.stepWaitingQuestion())
        switch(this.state.question.step) {
            case "WAITING_QUESTION": 
                return (this.stepWaitingQuestion())
            case "ASKING": 
                return (this.stepAsking())
            case "RESERVED": 
                if (this.state.reservedByMe === true)
                    return (this.stepAsking(true))
                else
                    return (this.stepReserved())
        }
    }

    stepReserved () {
        let classes = this.props.classes;

        return (
            <div>
                <div className="pointsCounter">
                    {this.state.question?(this.state.question.points[this.props.userId] || 0):0}
                </div>
                <Paper className={classes.paper}>
                    <div className="waitingQuestion">
                        <Typography component="h1" variant="h4">
                            Response reserved by {this.state.question.userName}
                        </Typography>
                    </div>
                </Paper>
            </div>
        )
    }

    stepReserved () {
        return (
            "Test"
        )
    }

    stepWaitingQuestion () {
        let classes = this.props.classes;
        
        return (
            <div>
                <div className="pointsCounter">
                    {this.state.question?(this.state.question.points[this.props.userId] || 0):0}
                </div>
                <Paper className={classes.paper}>
                    <div className="waitingQuestion">
                        <Typography component="h1" variant="h4">
                            Waiting for a question
                        </Typography>
                        <p>The master is crafting it for you</p>
                    </div>
                </Paper>
            </div>
        )
    }

    stepAsking (includeResponse) {
        let classes = this.props.classes;

        const fieldArea = (
            <TextField 
                id="standard-basic" 
                label="Enter response"
                multiline
                onChange={event => this.setState({...this.state, response: event.target.value})}
                rows="4"
            />
        )

        const getItArea = (
            <div className="magicSubmitContainer">
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className="magicSubmit"
                    onClick={this.getQuestion}
                >
                    GET IT!
                </Button>
            </div>
        )
        
        return (
            <div className="magicQuestionContainer">
                <div>
                    {this.state.question.timer}
                </div>
                <Paper className={classes.paper}>
                    <p className="questionNumber">Question n. {this.state.question.id + 1}</p>
                    <Typography component="h1" variant="h5" className="questionText">
                        {this.state.question.text}
                    </Typography>
                </Paper>

                
                {includeResponse?fieldArea:getItArea}
            </div>
        )
    }


    render () {
        let classes = this.props.classes;

        return (
            <div>
                <header>
                    <Header small/>
                </header>
                <div>
                    {this.viewsRouter()}
                </div>
            </div>
        )
    }
}

export default withStyles(mainStyle)(User)