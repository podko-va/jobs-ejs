const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword, factory } = require("../util/seed_db");
const Job = require("../models/Job");

let testUser = null;

let page = null;
let browser = null;
describe("jobs-ejs puppeteer test", function () {
    before(async function () {
        this.timeout(10000);
        browser = await puppeteer.launch({ headless: false, slowMo: 100 });
        page = await browser.newPage();
        await page.goto("http://localhost:3000");
    });
    after(async function () {
        this.timeout(5000);
        await browser.close();
    });
    describe("got to site", function () {
        it("should have completed a connection", async function () {
            const { expect } = await import("chai");
            const response = await page.goto("http://localhost:3000");
            const status = response.status();
            expect(status).to.be.equal(304);

            const title = await page.title();
            expect(title).to.include("Jobs List");
        });
    });
    describe("index page test", function () {
        this.timeout(10000);
        it("finds the index page logon link", async () => {
            const { expect } = await import("chai");
            this.logonLink = await page.waitForSelector("a ::-p-text(Click this link to logon)");
            expect(this.logonLink).to.exist;
        });
        it("gets to the logon page", async () => {
            const { expect } = await import("chai");
            await this.logonLink.click();
            await page.waitForNavigation();
            const email = await page.waitForSelector('input[name="email"]');
            expect(email).to.exist;
        });
    });
    describe("logon page test", function () {
        this.timeout(20000);
        it("resolves all the fields", async () => {
            const { expect } = await import("chai");
            this.email = await page.waitForSelector('input[name="email"]');
            expect(this.email).to.exist;
            this.password = await page.waitForSelector('input[name="password"]');
            expect(this.password).to.exist;
            this.submit = await page.waitForSelector("button ::-p-text(Logon)");
            expect(this.submit).to.exist;
        });
        it("sends the logon", async () => {
            const { expect } = await import("chai");
            testUser = await seed_db();
            await this.email.type(testUser.email);
            await this.password.type(testUserPassword);
            await this.submit.click();
            await page.waitForNavigation();
            await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
            await page.waitForSelector("a ::-p-text(change the secret)");
            await page.waitForSelector('a[href="/secretWord"]');
            
        });
    });
    describe("puppeteer jobs operations", function () {
        this.timeout(60000);
        it("should display the job listings page with 20 job entries", async () => {
            const { expect } = await import("chai");
            const jobsLink = await page.waitForSelector("a ::-p-text(List of jobs.)");
            expect(jobsLink).to.exist;
            await jobsLink.click();

            await page.waitForNavigation();
            const pageHeader = await page.waitForSelector("h2");
            const pageHeaderText = await pageHeader.evaluate((el) => el.textContent);
            expect(pageHeaderText.trim()).to.equal("Jobs List");

            const content = await page.content();
            const rows = content.split("<tr>").length - 1;
            expect(rows).to.equal(21);//1 for header+20+1 for buttoms
        });
        it("should display the add job form with fields", async () => {
            const { expect } = await import("chai");
            const addJobButton = await page.waitForSelector("button ::-p-text(Create new job)");
            await addJobButton.click();
            await page.waitForNavigation();
            const pageHeader = await page.waitForSelector("h2");
            const pageHeaderText = await pageHeader.evaluate((el) => el.textContent);
            expect(pageHeaderText.trim()).to.equal("Job Entry");
            this.companyField = await page.waitForSelector('input[name="company"]');
            expect(await this.companyField).to.exist;
            this.positionField = await page.waitForSelector('input[name="position"]');
            expect(await this.positionField).to.exist;
            this.statusField = await page.waitForSelector('input[name="status"]');
            expect(await this.statusField).to.exist;
            this.addButton = await page.waitForSelector("button ::-p-text(Add)");
            expect(await this.addButton).to.exist;
        });
        it("should add a new job to the database", async () => {
            const { expect } = await import("chai");
            const newJobBody = await factory.build('job');
            const companyField = await page.waitForSelector('input[name="company"]');
            await companyField.type(newJobBody.company);
            const positionField = await page.waitForSelector('input[name="position"]');
            await positionField.type(newJobBody.position);
            const statusField = await page.waitForSelector('input[name="status"]');
            await statusField.type("pending");
            const addButton = await page.waitForSelector("button[type='submit']");
            await addButton.click();
            await page.waitForNavigation();
            
            const newJob = await Job.findOne({ company: newJobBody.company, position: newJobBody.position});
            expect(newJob).not.to.be.null;
            expect(newJob.company).to.equal(newJobBody.company);
            expect(newJob.position).to.equal(newJobBody.position);
        });
    });
});