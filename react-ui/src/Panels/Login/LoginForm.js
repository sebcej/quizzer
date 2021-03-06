import React from 'react';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import Header from "../Header";


const mainStyle = theme => ({
    paper: {
      marginTop: theme.spacing(8),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    avatar: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.main,
    },
    form: {
      width: '100%', // Fix IE 11 issue.
      marginTop: theme.spacing(1),
    },
    submit: {
      margin: theme.spacing(3, 0, 2),
    },
    error: {
      color: "red"
    }
})

class LoginForm extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
        username: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({username: event.target.value});
  }

  handleSubmit(event) {
    this.props.onSubmit(this.state.username)
    event.preventDefault();
  }

  showErrors () {
    const { classes } = this.props;

    if (this.props.error)
      return (<p className={classes.error}>{this.props.error}</p>)
    return null;
  }


  render () {
    const { classes } = this.props;
    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Header className={classes.avatar}/>
            <div className={classes.paper}>
                <Typography component="h1" variant="h4">
                  Quizzer
                </Typography>
                <div>{this.showErrors()}</div>
                <form className={classes.form} noValidate onSubmit={this.handleSubmit}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        onChange={this.handleChange}
                        id="username"
                        label="Username"
                        name="username"
                        autoFocus
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                    Let's start!
                    </Button>
                </form>
            </div>
        </Container>
    );
  }
}

export default withStyles(mainStyle)(LoginForm)