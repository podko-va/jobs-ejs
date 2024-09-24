const express = require('express')

const router = express.Router()
const {
    getAllJobs,
    createJob,
    createNewJob,
    deleteJob,
    updateJob,
    getJob,
    editJob,
} = require('../controllers/jobs')

router.route('/').get(getAllJobs).post(createJob)
router.route('/new').get(createNewJob)
router.route("/:id").get(getJob);
router.route('/update/:id').post(updateJob)
router.route('/delete/:id').post(deleteJob)
router.route('/edit/:id').get(editJob)

module.exports = router