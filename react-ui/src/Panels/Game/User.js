import React from 'react';
import "./user.scss";

import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';

import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import VisibilityIcon from '@material-ui/icons/Visibility';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import ClearIcon from '@material-ui/icons/Clear';
import AlarmIcon from '@material-ui/icons/Alarm';
import CheckIcon from '@material-ui/icons/Check';

import { withStyles } from '@material-ui/core/styles';

import {registerEvent, sendEvent, unregisterEvent} from "../../tools/socket";

import Header from "../Header"

const mainStyle = theme => ({
    margin: {
        marginTop: "10px"
    },
    paper: {
        padding: theme.spacing(3),
        backgroundColor: "#A9E5E0",
        textAlign: "center"
    },
    paperSuccess: {
        padding: theme.spacing(3),
        backgroundColor: "#DDEDAA",
        textAlign: "center"
    },
    paperWarn: {
        padding: theme.spacing(3),
        backgroundColor: "#FFD1BA",
        textAlign: "center"
    },
    paperError: {
        padding: theme.spacing(3),
        backgroundColor: "#BF7085",
        textAlign: "center"
    }
});

class User extends React.Component {
    constructor (props) {
        super(props)
        
        this.state = {
            question: false,
            reservedByMe: false,
            banned: false,
            response: ""
        }

        this.questionStatus = this.questionStatus.bind(this);
        this.reservationAccepted = this.reservationAccepted.bind(this);
        this.reserveResponse = this.reserveResponse.bind(this);
        this.respondQuestion = this.respondQuestion.bind(this);
        this.getStars = this.getStars.bind(this);
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
        console.log("Question data", data);
        let banned = false,
            reserved = this.state.reservedByMe;

        // Ban user when the answer is not provided or is wrong
        if (data.bannedUsers && data.bannedUsers.indexOf(parseInt(this.props.userId)) >= 0)
            banned = true;
        
        if (data.step === "WAITING_QUESTION")
            reserved = false;

        this.setState({
            ...this.state,
            question: data,
            banned,
            reservedByMe: reserved
        })
    }

    reservationAccepted (data) {
        if (this.state.question.id === data.questionId)
            this.setState({
                ...this.state,
                reservedByMe: true
            });
    }

    reserveResponse () {
        sendEvent("user.reserveResponse", {
            questionId: this.state.question.id
        })
    }

    respondQuestion () {
        sendEvent("user.sendResponseToAdmin", {
            questionId: this.state.question.id,
            question: this.state.response
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
                    return (this.genericTemplate({
                        paperClass: "paperWarn",
                        icon: <HourglassEmptyIcon/>,
                        title: `Response reserved by ${this.state.question.reservedUser.userName}`
                    }))
            case "WAIT_CONFIRM": 
                return (this.genericTemplate({
                    paperClass: "paper",
                    icon: <VisibilityIcon/>,
                    title: `The master is watching the answer`
                }))
            case "QUESTION_FAILED": 
                return (this.genericTemplate({
                    paperClass: "paperError",
                    icon: <AlarmIcon/>,
                    title: `No response from anyone`,
                    subtitle: "Was the question too hard?"
                }))
            case "GAME_FINISH": 
                return (this.genericTemplate({
                    paperClass: "paperSuccess",
                    icon: <AttachMoneyIcon/>,
                    title: `AND THE WINNER IS: ${this.state.question.reservedUser.userName}`
                }))
            case "USER_FAILED": 
                return (this.genericTemplate({
                    paperClass: "paperError",
                    icon: <HourglassEmptyIcon/>,
                    title: "No response from you",
                    subtitle: this.state.reservedByMe?"You are banned from this round":""
                }))
            case "QUESTION_RESPONSE_FAILED":
                return (this.genericTemplate({
                    paperClass: "paperError",
                    icon: <ClearIcon/>,
                    title: "Response not accepted",
                    subtitle: this.state.reservedByMe?"You are banned from this round":""
                }))
            case "QUESTION_RESPONSE_SUCCESS":
                return (this.genericTemplate({
                    paperClass: "paperSuccess",
                    icon: <CheckIcon/>,
                    title: "Response accepted",
                    subtitle: this.state.reservedByMe?"Well done!":""
                }))
        }
    }

    genericTemplate ({
        paperClass,
        icon,
        title,
        subtitle
    }) {
        let classes = this.props.classes;

        return (
            <div>
                <Paper className={classes[paperClass]}>
                    <div className="waitingQuestion">
                        {icon}
                        <Typography component="h1" variant="h5">
                            {title}
                        </Typography>
                        <p>{subtitle}</p>
                    </div>
                </Paper>
            </div>
        );
    }

    questionFailed () {
        let classes = this.props.classes;

        return (
            <div>
                <Paper className={classes.paperWarn}>
                    <div className="waitingQuestion">
                        <HourglassEmptyIcon/>
                        <Typography component="h1" variant="h5">
                            Response reserved by {this.state.question.reservedUser.userName}
                        </Typography>
                    </div>
                </Paper>
            </div>
        )
    }

    stepWaitingQuestion () {
        let classes = this.props.classes;
        
        return (
            <div>
                <Paper className={classes.paper}>
                    <div className="waitingQuestion">
                        <QuestionAnswerIcon/>
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
            <div>
                <FormControl fullWidth className={classes.margin} variant="filled">
                    <TextField 
                        id="standard-basic" 
                        label="Enter response"
                        multiline
                        onChange={event => this.setState({...this.state, response: event.target.value})}
                        rows="4"
                    />
                </FormControl>
                <div className="magicSubmitContainer">
                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        className="magicSubmit"
                        onClick={this.respondQuestion}
                    >
                        <div>REPLY!</div>
                        {this.state.question.timer}
                    </Button>
                </div>
            </div>
        )

        const getItArea = (
            <div className="magicSubmitContainer">
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className="magicSubmit"
                    disabled={this.state.banned}
                    onClick={this.reserveResponse}
                >
                    <div>GET IT!</div>
                    {this.state.question.timer}
                </Button>
            </div>
        )
        
        return (
            <div className="magicQuestionContainer">
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

    getStars () {
        let stars = []
        const points = this.state.question?(this.state.question.points[this.props.userId] || 0):0;

        if (!this.state.question.maxPoints)
            return;

        for (let i = 0; i < this.state.question.maxPoints; i++) {
            if (points <= i)
                stars.push(<StarBorderIcon key={i} style={{ fontSize: 30, color: "orange" }}/>);
            else
                stars.push(<StarIcon key={i} style={{ fontSize: 30, color: "orange" }}/>);
        }

        return stars;
    }


    render () {
        let classes = this.props.classes;

        return (
            <div>
                <header>
                    <Header small/>
                </header>
                <div className="text-center">
                    {this.getStars()}
                </div>
                <div>
                    {this.viewsRouter()}
                </div>
            </div>
        )
    }
}

export default withStyles(mainStyle)(User)