const apiPath = "../../../plugins/quizzer/Quizzer";

const proxyquire = require("proxyquire").noCallThru(),
      chai = require("chai"),
      sinon = require("sinon")
      
      config = require("../../../config.json"),
      quizzer = require(apiPath);

describe("plugins", () => {
    let quizzerInstance = null,
        sentMessages = [],
        broadcastedMessages = [],
        timers = false,
        socketConnection = {
            emit: function (event, data, callback) {
                sentMessages.push({
                    event,
                    data
                })
                callback()
            },
            sockets: {
                emit: function (event, data) {
                    broadcastedMessages.push({
                        event, 
                        data
                    })
                }
            }
        }

    // Reinitialize quizzer instance in order to have a clean environment before each test
    beforeEach(() => {
        sentMessages = [];
        broadcastedMessages = []
        quizzerInstance = quizzer(config, true);
        quizzerInstance.users.setConnection(socketConnection);

        timers = sinon.useFakeTimers();
    })

    afterEach(() => {
        timers.restore()
        timers = false;
    })

    context("@quizzer-Quizzer", () => {
        async function prepare(alternateText, blockQuestionInsertion) {
            const text = alternateText?alternateText:"What time is it?";

            const admin = quizzerInstance.users.loginUser(config.adminUserName),
                  user = quizzerInstance.users.loginUser("tester"),
                  user2 = quizzerInstance.users.loginUser("tester2");

            admin.setConnection(socketConnection);
            user.setConnection(socketConnection);
            user2.setConnection(socketConnection);

            if (!blockQuestionInsertion)
                await quizzerInstance.insertQuestion(1, text);

            return {
                admin,
                user,
                user2,
                text
            }
        }

        context("insertQuestion()", () => {
            it("Should init new question and broadcast it to all users", async () => {
                let {user, user2, text} = await prepare();

                chai.expect(broadcastedMessages).to.be.lengthOf(4);
                chai.expect(sentMessages).to.be.lengthOf(0);

                const broadcasted = broadcastedMessages[3];

                chai.expect(broadcasted).to.have.property("event", "questionStatus");
                chai.expect(broadcasted).to.have.nested.property("data.step", "ASKING");
                chai.expect(broadcasted).to.have.nested.property("data.id", 0); // AS is first question we know that id is 0
                chai.expect(broadcasted).to.have.nested.property("data.text", text);

                chai.expect(broadcasted).to.have.nested.property("data.timer", config.timeouts.question);
            });

            it("Should fail as no text provided", async () => {
                let {user, user2, text} = await prepare(false, true);

                try {
                    await quizzerInstance.insertQuestion(1, "")
                } catch (e) {
                    chai.expect(e).to.have.property("message", "NO_TEXT");
                    return;
                }

                chai.assert.fail("No error happened");
            });

            it("Should fail as only spaces provided", async () => {
                let {user, user2, text} = await prepare(false, true);

                try {
                    await quizzerInstance.insertQuestion(1, " ")
                } catch (e) {
                    chai.expect(e).to.have.property("message", "NO_TEXT");
                    return;
                }

                chai.assert.fail("No error happened");
            });

            it("Should timeout and return to first step", async () => {
                let {user, user2, text} = await prepare();

                chai.expect(broadcastedMessages).to.be.lengthOf(4);
                chai.expect(sentMessages).to.be.lengthOf(0);

                // Pass n seconds
                for (let i = 0; i < config.timeouts.question; i++) {
                    timers.next()
                }

                chai.expect(broadcastedMessages).to.be.lengthOf(config.timeouts.question + 4);

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "QUESTION_FAILED");
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.timer", false);
                chai.expect(broadcastedMessages[3]).to.have.nested.property("data.step", "ASKING");
                chai.expect(broadcastedMessages[3]).to.have.nested.property("data.timer", config.timeouts.question);

                // Return back
                timers.next()

                chai.expect(broadcastedMessages).to.be.lengthOf(config.timeouts.question + 5);
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "WAITING_QUESTION");
            });
        });

        context("reserveResponse()", () => {
            it("Should allow reservation and notify all partecipants", async () => {
                let {user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next()

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user.getId());

                chai.expect(broadcastedMessages).to.be.lengthOf(6); // Sent block message to all users
                chai.expect(sentMessages).to.be.lengthOf(1); // Sent reservation confirmation to the lucky user

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "RESERVED");
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.timer", config.timeouts.respond);

                chai.expect(sentMessages[0]).to.have.property("event", "reservationAccepted");
                chai.expect(sentMessages[0]).to.have.nested.property("data.questionId", questionId);
            });

            it("Should reserve and then return to first step after banning user due to timeout", async () => {
                let {user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next()
                
                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user.getId());

                // Pass n seconds
                for (let i = 0; i < config.timeouts.respond; i++) {
                    timers.next()
                }

                chai.expect(broadcastedMessages).to.be.lengthOf(config.timeouts.respond + 6); // Sent block message to all users
                chai.expect(sentMessages).to.be.lengthOf(1); // Sent reservation confirmation to the lucky user

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "USER_FAILED");
                chai.expect(quizzerInstance.users.getBannedUsersList()).to.be.lengthOf(1);
                chai.expect(quizzerInstance.users.getBannedUsersList()[0]).to.equal(user.getId());

                // Return to first step
                timers.next();

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "ASKING");
            });

            it("Should fail as the flow has jumped by two steps instead of one", async () => {
                let {user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                let throwed = false;
                
                try {
                    await quizzerInstance.sendResponseToAdmin(user.getId(), 0, "Test");
                } catch (e) {
                    chai.expect(e.message).to.equal("BROKEN_FLOW");
                    throwed = true;
                }

                chai.expect(throwed).to.equal(true);
            });
        })

        context("sendResponseToAdmin()", () => {
            it("Should accept response and send it to admin", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user.getId()); 
                await quizzerInstance.sendResponseToAdmin(questionId, user.getId(), "Response text");
                
                chai.expect(sentMessages).to.be.lengthOf(2);

                chai.expect(sentMessages[0]).to.have.property("event", "reservationAccepted");

                chai.expect(sentMessages[sentMessages.length - 1]).to.have.nested.property("data.userId", user.getId())
                chai.expect(sentMessages[sentMessages.length - 1]).to.have.property("event", "responseFromUser")
            });

            it("Should fail as response is empty", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user.getId()); 
                
                try {
                    await quizzerInstance.sendResponseToAdmin(questionId, user.getId(), "");
                } catch (e) {
                    chai.expect(e.message).to.equal("NO_RESPONSE");
                    return;
                }

                chai.assert.fail("No error happened")
            });

            it("Should fail as questionId is incorrect", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user.getId()); 
                
                try {
                    await quizzerInstance.sendResponseToAdmin(999, user.getId(), "TEST");
                } catch (e) {
                    chai.expect(e.message).to.equal("QUESTION_ID_MISMATCH");
                    return;
                }

                chai.assert.fail("No error happened")
            });

            it("Should fail as user is not present", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user.getId()); 

                user2.setBanned(true);
                
                try {
                    await quizzerInstance.sendResponseToAdmin(questionId, 999, "Test");
                } catch (e) {
                    chai.expect(e.message).to.equal("USER_MISMATCH");
                    return;
                }

                chai.assert.fail("Instance must throw error")
            });

            it("Should fail as user is banned", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                user2.setBanned(true);
                
                try {
                    await quizzerInstance.sendResponseToAdmin(questionId, user2.getId(), "Test");
                } catch (e) {
                    chai.expect(e.message).to.equal("USER_BANNED");
                    return
                }

                chai.assert.fail("Instance must throw error")
            });
        })

        context("adminDecided()", () => {
            it("Should accept question as admin accepted it", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                await quizzerInstance.sendResponseToAdmin(questionId, user2.getId(), "Test");

                await quizzerInstance.adminDecided(questionId, admin.getId(), true);

                chai.expect(broadcastedMessages).to.have.lengthOf(8)
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "QUESTION_RESPONSE_SUCCESS");
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.reservedUser.id", user2.getId())
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.points."+ user2.getId(), 1);
            });

            it("Should reject question as admin rejected it and ban user", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                await quizzerInstance.sendResponseToAdmin(questionId, user2.getId(), "Test");

                await quizzerInstance.adminDecided(questionId, admin.getId(), false);

                chai.expect(broadcastedMessages).to.have.lengthOf(8);
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "QUESTION_RESPONSE_FAILED");
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.reservedUser.id", user2.getId());
            
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1].data.points).to.be.deep.equal({})
            });

            it("Should fail as status is not correct", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                try {
                    await quizzerInstance.adminDecided(questionId, admin.getId(), false)
                } catch (e) {
                    chai.expect(e).to.have.property("message", "BROKEN_FLOW")
                    return;
                }

                chai.assert.fail("No error happened")
            });

            it("Should win", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                for (let runs = 0; runs < config.pointsToWin; runs ++) {
                    if (runs !== 0)
                        await quizzerInstance.insertQuestion(1, "Test");

                    const questionId = runs;

                    await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                    await quizzerInstance.sendResponseToAdmin(questionId, user2.getId(), "Test");

                    await quizzerInstance.adminDecided(questionId, admin.getId(), true);
                }

                chai.expect(user2.getPoints()).to.equal(5);
                chai.expect(broadcastedMessages.length).to.equal(24);

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "GAME_FINISH");
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.points." + user2.getId(), config.pointsToWin);
            });
        })


        context("adminRestartsGame()", () => {
            it("Should restart game in reserveResponse status", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next()
                
                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user.getId());

                await quizzerInstance.adminRestartsGame(admin.getId());

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "WAITING_QUESTION");
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.not.have.nested.property("data.text");
            })

            it("Should restart game in game finished status", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next()

                for (let runs = 0; runs < config.pointsToWin; runs ++) {
                    if (runs !== 0)
                        await quizzerInstance.insertQuestion(1, "Test");

                    const questionId = runs;

                    await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                    await quizzerInstance.sendResponseToAdmin(questionId, user2.getId(), "Test");

                    await quizzerInstance.adminDecided(questionId, admin.getId(), true);
                }

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "GAME_FINISH");

                quizzerInstance.adminRestartsGame(admin.getId());

                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.have.nested.property("data.step", "WAITING_QUESTION");
                chai.expect(broadcastedMessages[broadcastedMessages.length - 1]).to.not.have.nested.property("data.text");
            });
        })

        context("recoverAdminStatus", () => {
            it("Should save and recover admin status", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                await quizzerInstance.sendResponseToAdmin(questionId, user2.getId(), "Test");

                chai.expect(sentMessages).to.be.lengthOf(2);

                await quizzerInstance.recoverAdminStatus(admin);

                timers.next(); // Run timer for response

                chai.expect(sentMessages).to.be.lengthOf(3);

                // Check if message has been resent
                chai.expect(sentMessages[sentMessages.length - 1]).to.have.nested.property("data.userId", user2.getId())
                
            });

            it("Should fail as is not admin", async () => {
                let {admin, user, user2, text} = await prepare();

                // Pass timer 1x
                timers.next();

                const questionId = broadcastedMessages[3].data.id;

                await quizzerInstance.reserveResponse(questionId, user2.getId()); 

                await quizzerInstance.sendResponseToAdmin(questionId, user2.getId(), "Test");

                chai.expect(sentMessages).to.be.lengthOf(2);

                await quizzerInstance.recoverAdminStatus(user);

                chai.expect(sentMessages).to.be.lengthOf(2);                
            });
        })
    })
})