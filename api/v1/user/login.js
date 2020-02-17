const quizzer = require(`${global.paths.plugins}/quizzer`);

module.exports = {
    method: "POST",
    onRequest (req, res) {
        var response = quizzer.loginUser(req.body.username)
        
        if (!response.error)
            req.session.username = req.body.username

       return response
    }
}