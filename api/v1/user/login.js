const quizzer = require(`${global.paths.plugins}/quizzer`);

module.exports = {
    method: "POST",
    onRequest (req, res) {
       var response = quizzer.loginUser(req.body.username)

       return response
    }
}