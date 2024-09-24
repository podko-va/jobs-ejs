const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id })
  //res.status(StatusCodes.OK).json({ jobs, count: jobs.length })
  res.render("jobs", { jobs });
}

const getJob = async (req, res) => {
  const userId = req.user._id.toString();
  const jobId = req.params.id;
  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId
  });
  if (!job) {
    req.flash("error", `No data with id ${req.params.id}`);
    res.redirect("/jobs"); 
  }
  console.log(job)
  res.render("jobForm", { job: job });
}

const createNewJob = async (req, res) => {
    res.render("jobForm", { job: null });
};


const createJob = async (req, res) => {
    const {
      body: { company, position, status }
    } = req;
    console.log(company)
    req.body.createdBy = req.user._id;
   if (company === "" || position === "" || status === "") {
     req.flash("error", "Company or Position or Status fields cannot be empty.");
     res.redirect("/jobs/new"); 
   }
    await Job.create(req.body);
    res.redirect("/jobs"); 
};

  const updateJob = async (req, res) => {
    const {
      body: { company, position, status },
      user: { _id: userId },
      params: { id: jobId }
    } = req;
    if (company === "" || position === "" || status === "") {
       req.flash("error", "Company or Position or Status fields cannot be empty");
       res.redirect("/jobs"); 
    }
    const job = await Job.findByIdAndUpdate(
      {
        _id: jobId,
        createdBy: userId
      },
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) {
      req.flash("error", `No data with id ${jobId}`);
      res.redirect("/jobs"); 
    }
    res.redirect("/jobs") 
};

const deleteJob = async (req, res) => {
    const {
        user: { _id: userId },
        params: { id: jobId }
      } = req;
      const job = await Job.findOneAndDelete({
        _id: jobId,
        createdBy: userId
      });
      console.log(job)
      if (!job) {
           req.flash("error", `No data with id ${jobId}`);
           res.redirect("/"); 
      }
       res.redirect("/jobs"); 
}

const editJob = async (req, res) => {
    const userId = req.user._id.toString();
    const jobId = req.params.id;
  
    const job = await Job.findOne({
      _id: jobId,
      createdBy: userId
    });
    if (!job) {
       req.flash("error", `No data with id ${req.params.id}`);
       res.redirect("/data"); 
    }
    res.render("jobForm", { job });
  };

module.exports = {
    getAllJobs,
    createJob,
    createNewJob,
    deleteJob,
    updateJob,
    getJob,
    editJob,
}
