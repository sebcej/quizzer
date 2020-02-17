const quizzer = require(`${global.paths.plugins}/quizzer`)(),
      config = require(global.paths.config);

module.exports = {
    method: "POST",
    onRequest (req, res) {
        var response = quizzer.loginUser(req.body.username)

        if (!response.error) {
            req.session.username = req.body.username
            req.session.isAdmin = req.body.username === config.adminUserName
        }

        req.emit()

       return response
    }
}