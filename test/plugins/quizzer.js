const apiPath = "../../plugins/quizzer/Quizzer";

const proxyquire = require("proxyquire").noCallThru(),
      chai = require("chai"),
      sinon = require("sinon")
      
      config = require("../../config.json"),
      quizzer = require(apiPath);

describe("plugins", () => {
    let quizzerInstance = null,
        sentMessages = [],
        broadcastedMessages = []

    // Reinitialize quizzer instance in order to have a clean environment before each test
    beforeEach(() => {
        sentMessages = [];
        broadcastedMessages = []
        quizzerInstance = quizzer(config, true);
        quizzerInstance.setConnection({
            emit: function (event, data) {
                sentMessages.push({
                    event,
                    data
                })
            },
            broadcast: function (event, data) {
                broadcastedMessages.push({
                    event, 
                    data
                })
            }
        })
    })

    context("@quizzer", () => {
        context("login()", () => {
            it("Should login user and return it", () => {
                let response = quizzerInstance.loginUser("tester");
    
                chai.expect(quizzerInstance.getUser("tester").getDetails()).to.be.an("object")
                chai.expect(quizzerInstance.getUser("nonexistant")).to.equal(false)
                chai.expect(quizzerInstance.getUser("tester").getDetails()).to.have.property("isAdmin", false)
                chai.expect(response).to.be.an("object")
            })
    
            it("Should return error as user is empty string", () => {
                let response = quizzerInstance.loginUser("")
                
                chai.expect(response).to.have.property("success", false)
            })
    
            it("Should return error the second time as user is already logged", () => {
                let response = quizzerInstance.loginUser("tester");
                let response2 = quizzerInstance.loginUser("tester");

                chai.expect(response.getDetails()).to.have.property("userName", "tester")
                chai.expect(response2).to.have.property("error", "USER_ALREADY_LOGGED")
            })
    
            it("Should login admin", () => {
                let response = quizzerInstance.loginUser("admin");
    
                chai.expect(response.getDetails()).to.have.property("userName", "admin")
                chai.expect(quizzerInstance.getUser("admin").getDetails()).to.have.property("isAdmin", true)
            })
        })

        context("setAdminConnection()", () => {
            it("Should add connection to admin object", () => {
                let response = quizzerInstance.loginUser("admin");

                quizzerInstance.setConnection({}, "admin")

                chai.expect(response.getDetails()).to.have.property("userName", "admin")
                chai.expect(quizzerInstance.getUser("admin").getDetails()).to.have.property("connection")
            })

            it("Should fail as no admin is present", () => {
                let response = quizzerInstance.loginUser("tester");

                chai.expect(() => quizzerInstance.setConnection({}, "admin")).to.Throw("NO_USER")
            })
        })

        context("banUser()", () => {
            it("Should not ban a not present user", () => {
                let banResponse = quizzerInstance.banUser("tester")

                chai.expect(banResponse).to.have.property("success", false)
                chai.expect(quizzerInstance.getUsers().getBannedUsersList()).to.be.an('array').lengthOf(0)
            })

            it("Should ban an user and put it in banned array", () => {
                let response = quizzerInstance.loginUser("tester");

                let banResponse = quizzerInstance.banUser("tester")

                chai.expect(response.getDetails()).to.have.property("userName", "tester")
                chai.expect(banResponse).to.have.property("success", true)
                chai.expect(quizzerInstance.getUsers().getBannedUsersList()).to.be.an('array').that.does.include("tester")
            })
        })

        /*context("broadcastQuestion()", () => {
            it("Should send message to user directly by client side validation", () => {
                quizzerInstance.loginUser("tester");

                quizzerInstance.broadcastQuestion(false, "tester");

                chai.expect(broadcastedMessages).to.include({
                    event: "questionStatus",
                    data: {

                    }
                })
            })

            it("Should send message to user directly by server side direct connection", () => {
                quizzerInstance.loginUser("tester");

                quizzerInstance.broadcastQuestion("tester", {
                    test: true
                });

                chai.expect(sentMessages).to.include({
                    event: "questionStatus",
                    data: {
                        test: true
                    }
                })
            })
        });*/
    })
})