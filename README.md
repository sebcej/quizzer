<p align="center">
<img width="150" height="auto" src="react-ui/public/logo.png">
</p>
<h1 align="center">Quizzer</h1>

**Mini quizzer app developed in react and fastify**

The master repository is directly linked to heroku app for automatic deployment right after CI testing.

See it in action [here](https://quizzer-testing.herokuapp.com/)

## Game Instructions

The game allows a group of users to respond to an admin/master questions. The master can enter to the control panel by logging in as admin account. The master types on the field and sends the question. All the other users will receive it and can book the answer. The response will then be forwarded to the master that will review it.

All steps are timed. When timeout occurs the question will be discarded or the user banned.

## Server Management

``` bash

# Install dependencies
npm install

# Run server
npm start

# Perform tests
npm test

# Perform unit testing in real time during development
npm run qa
```

## Client Management

``` bash

# Go into react-ui folder
cd react-ui

# Install dependencies
npm install

# Run development server with automatic recompilation
npm start

# Run production build
npm run build
```
