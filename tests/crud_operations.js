const Job = require("../models/Job")
const { factory, seed_db, testUserPassword } = require("../util/seed_db");
const get_chai = require("../util/get_chai");
const { app } = require("../app");

describe("CRUD operation", function () {
    before(async () => {
        const { expect, request } = await get_chai();
        this.test_user = await seed_db();
        let req = request.execute(app).get("/sessions/logon").send();
        let res = await req;
        const textNoLineEnd = res.text.replaceAll("\n", "");
        this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
        let cookies = res.headers["set-cookie"];
        this.csrfCookie = cookies.find((element) =>
          element.startsWith("csrfToken"),
        );
        const dataToPost = {
          email: this.test_user.email,
          password: testUserPassword,
          _csrf: this.csrfToken,
        };
        req = request
          .execute(app)
          .post("/sessions/logon")
          .set("Cookie", this.csrfCookie)
          .set("content-type", "application/x-www-form-urlencoded")
          .redirects(0)
          .send(dataToPost);
        res = await req;
        cookies = res.headers["set-cookie"];
        this.sessionCookie = cookies.find((element) =>
          element.startsWith("connect.sid"),
        );
        expect(this.csrfToken).to.not.be.undefined;
        expect(this.sessionCookie).to.not.be.undefined;
        expect(this.csrfCookie).to.not.be.undefined;
      });

      it('should get the job items page',  async () => {
        const { expect, request } = await get_chai();

        const req = request.execute(app)
        .get('/jobs')
        .set("Cookie", this.sessionCookie)
        .send()
        const res = await req;
        expect(res).to.have.status(200);
        expect(res).to.have.property('text');
        const pageParts = res.text.split("<tr>")
        expect(pageParts.length).to.equal(22)//jobs-table-header+20+for button "Create new job"
      });

      it('should add a job item', async () => {
            
        const { _doc: dataToPost } = await factory.build('job', { createdBy: this.test_user.id });
        delete dataToPost._id;
        dataToPost._csrf = this.csrfToken;
        
        const { expect, request } = await get_chai();
        const req = request.execute(app)
            .post('/jobs')
            .set("Cookie", [this.csrfCookie, this.sessionCookie]) 
            .set('content-type', 'application/x-www-form-urlencoded')
            .redirects(0)
            .send(dataToPost);

        const res = await req;
        expect(res).to.have.status(302); 

        const jobs = await Job.find({createdBy: this.test_user._id})      
        expect(jobs.length).to.equal(21);

        const addedJob = await Job.find({name: dataToPost.name});
        expect(addedJob).to.not.be.undefined; 
      });

})