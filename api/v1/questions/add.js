const config = require(global.paths.config),
      quizzer = require(`${global.paths.plugins}/quizzer`)();

module.exports = {
    onRequest (req, res) {
        if (req.session.username && req.session.username === config.adminUserName) {
            quizzer.addQuestion(req.body.question);

            
        } else {
            res.code(401).send("Unauthorized")
        }
    }
}