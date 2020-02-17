const apiPath = "../../plugins/apiLoader";

const proxyquire = require("proxyquire").noCallThru(),
      chai = require("chai"),
      sinon = require("sinon"),
      fs = require("fs-extra");

// Stub require in order to return an arbitrary object
let apiLoaderStub = {
    "/api/login.js": {
        onCall: sinon.fake()
    },
    "/api/nested/test.js": {
        onCall: sinon.fake()
    }
};
const apiLoader = proxyquire(apiPath, apiLoaderStub);

describe("plugins", () => {

    afterEach(async () => {
        sinon.restore();
        return sinon.resetBehavior();
    });

    context("@apiLoader", () => {
        it("Should do nothing as no routes are loaded", async () => {
            const fastifyStub = {
                get:  sinon.fake(),
                post: sinon.fake()
            }

            // Stub filesystem apis
            sinon.replace(fs, "readdir", sinon.fake.returns([]))

            let apiSession = await apiLoader(fastifyStub, {});

            chai.expect(fastifyStub.get.called).to.equal(false)
            chai.expect(fastifyStub.post.called).to.equal(false)
            chai.expect(fs.readdir.called).to.equal(true)
        })

        it("Should load one file in directory root and call it", async () => {
            const fastifyStub = {
                get:  sinon.fake(),
                post: sinon.fake(),
                log: {
                    debug: () => {}
                }
            }

            // Stub filesystem apis
            let statIsFileFake = sinon.fake.returns(true)
            sinon.replace(fs, "readdir", sinon.fake.returns(["login.js"]))
            sinon.replace(fs, "stat", sinon.fake.returns({
                isFile: statIsFileFake
            }));

            let apiSession = await apiLoader(fastifyStub, {});

            chai.expect(fastifyStub.get.called).to.equal(false)
            chai.expect(fastifyStub.post.called).to.equal(true)
            chai.expect(fs.readdir.called).to.equal(true)
            chai.expect(statIsFileFake.called).to.equal(true)
        })
    });
});