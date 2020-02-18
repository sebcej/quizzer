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
        quizzerInstance.users.setConnection({
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
                let response = quizzerInstance.users.loginUser("tester"),
                    userId = response.getId();
    
                chai.expect(quizzerInstance.users.getUser(userId).getDetails()).to.be.an("object")
                chai.expect(quizzerInstance.users.getUserByName("nonexistant")).to.equal(false)
                chai.expect(quizzerInstance.users.getUser(userId).getDetails()).to.have.property("isAdmin", false)
                chai.expect(response).to.be.an("object")
            })
    
            it("Should throw error as user is empty", () => {
                chai.expect(() => quizzerInstance.users.loginUser()).to.Throw("NO_USERNAME")
            })
    
            it("Should return error the second time as user is already logged", () => {
                let response = quizzerInstance.users.loginUser("tester")

                chai.expect(response.getDetails()).to.have.property("userName", "tester")
                chai.expect(() => quizzerInstance.users.loginUser("tester")).to.Throw("USER_ALREADY_LOGGED")
            })
    
            it("Should login admin", () => {
                let response = quizzerInstance.users.loginUser("admin");
    
                chai.expect(response.getDetails()).to.have.property("userName", "admin")
                chai.expect(quizzerInstance.users.getUserByName("admin").getDetails()).to.have.property("isAdmin", true)
            })
        })

        context("setAdminConnection()", () => {
            it("Should add connection to admin object", () => {
                let response = quizzerInstance.users.loginUser("admin"),
                    userId = response.getId()

                quizzerInstance.users.setConnection({}, userId)

                chai.expect(response.getDetails()).to.have.property("userName", "admin")
                chai.expect(quizzerInstance.users.getUserByName("admin").getDetails()).to.have.property("connection")
            })

            it("Should fail as no admin is present", () => {
                let response = quizzerInstance.users.loginUser("tester");

                chai.expect(() => quizzerInstance.users.setConnection({}, "admin")).to.Throw("NO_USER")
            })
        })

        context("banUser()", () => {
            it("Should not ban a not present user", () => {
                chai.expect(() => quizzerInstance.users.banUser("tester")).to.Throw("NO_USER")
                chai.expect(quizzerInstance.users.getBannedUsersList()).to.be.an('array').lengthOf(0)
            })

            it("Should ban an user and put it in banned array", () => {
                let response = quizzerInstance.users.loginUser("tester"),
                    userId = response.getId()

                let banResponse = quizzerInstance.users.banUser(userId)

                chai.expect(response.getDetails()).to.have.property("userName", "tester")
                chai.expect(quizzerInstance.users.getBannedUsersList()).to.be.an('array').that.does.include(userId)
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