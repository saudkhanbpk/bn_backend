"use strict";

const express = require("express");
const Controllers = {
    Volunteer: require("../../controllers/volunteer.controller")
};
const Middleware = {
    Validator: {
        /* Insert the require statement to the validator file here */
        Volunteer: require("../../middlewares/validators/volunteer.validator")
    },
    /* Insert all of ther middleware require statements here */
    parseBody: require("../../middlewares/parse-body.middleware"),
    Volunteer: require("../../middlewares/volunteer.middleware"),
};

module.exports = {
    activate: function (apiRouter) {
        const volunteerRouter = express.Router();

        /**
         * @api {post} /volunteer/ create a new volunteer
         * @apiName createVolunteer
         * @apiGroup Volunteer
         * @apiVersion 0.0.8
         * 
         * @apiParam (body) {MongoID} accountId MongoID of the account of the volunteer
         * 
         * @apiSuccess {string} message Success message
         * @apiSuccess {object} data Volunteer object
         * @apiSuccessExample {object} Success-Response: 
         *      {
                    "message": "Volunteer creation successful", 
                    "data": {...}
                }

         * @apiError {string} message Error message
         * @apiError {object} data empty
         * @apiErrorExample {object} Error-Response: 
         *      {"message": "Issue with volunteer creation", "data": {}}
         */
        volunteerRouter.route("/").post(
            Middleware.Validator.Volunteer.newVolunteerValidator,

            Middleware.parseBody.middleware,

            Middleware.Volunteer.parseVolunteer,

            Controllers.Volunteer.createVolunteer
        );

        apiRouter.use("/volunteer", volunteerRouter);
    }
};