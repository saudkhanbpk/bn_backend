"use strict";

const TAG = `[ HACKER.MIDDLEWARE.js ]`;
const mongoose = require("mongoose");
const Services = {
    Hacker: require("../services/hacker.service"),
    Storage: require("../services/storage.service"),
    Email: require("../services/email.service"),
    Account: require("../services/account.service")
};
const Middleware = {
    Util: require("./util.middleware")
};
const Constants = {
    General: require("../constants/general.constant"),
    Error: require("../constants/error.constant"),
};
const fs = require("fs");
const path = require("path");

/**
 * @function parsePatch
 * @param {body: {id: ObjectId}} req 
 * @param {*} res 
 * @param {(err?) => void} next 
 * @return {void}
 * @description Delete the req.body.id that was added by the validation of route parameter.
 */
function parsePatch(req, res, next) {
    delete req.body.id;
    next();
}

/**
 * @function parseHacker
 * @param {{body: {accountId: ObjectId, school: string, gender: string, needsBus: string, application: Object, authorization: string}}} req
 * @param {*} res
 * @param {(err?)=>void} next
 * @return {void}
 * @description 
 * Moves accountId, school, gender, needsBus, application from req.body to req.body.teamDetails. 
 * Adds _id to teamDetails.
 */
function parseHacker(req, res, next) {
    const hackerDetails = {
        _id: mongoose.Types.ObjectId(),
        accountId: req.body.accountId,
        school: req.body.school,
        gender: req.body.gender,
        needsBus: req.body.needsBus,
        application: req.body.application,
    };
    req.body.token = req.body.authorization;

    delete req.body.accountId;
    delete req.body.school;
    delete req.body.gender;
    delete req.body.needsBus;
    delete req.body.application;
    delete req.body.authorization;

    req.body.hackerDetails = hackerDetails;

    next();
}

/**
 * @function addDefaultStatus
 * @param {{body: {hackerDetails: {status: String}}}} req
 * @param {JSON} res
 * @param {(err?)=>void} next
 * @return {void}
 * @description Adds status to hackerDetails.
 */
function addDefaultStatus(req, res, next) {
    req.body.hackerDetails.status = "Applied";
    next();
}

/**
 * Verifies that account is confirmed and of proper type from the account ID passed in req.body.accountId
 * @param {{body: {accountId: ObjectId}}} req 
 * @param {*} res 
 * @param {(err?) => void} next 
 */
async function validateConfirmedStatus(req, res, next) {
    const account = await Services.Account.findById(req.body.accountId);
    if (!account) {
        next({
            status: 404,
            message: Constants.Error.ACCOUNT_ERROR404_MESSAGE,
            error: {}
        });
    } else if (!account.confirmed) {
        next({
            status: 403,
            message: Constants.Error.ACCOUNT_ERROR403_MESSAGE,
            error: {}
        });
    } else if (account.accountType !== Constants.General.HACKER) {
        next({
            status: 409,
            message: Constants.Error.ACCOUNT_TYPE_ERROR409_MESSAGE
        });
    } else {
        next();
    }
}

/**
 * Verifies that the current signed in user is linked to the hacker passed in via req.body.id
 * @param {{body: {id: ObjectId}}} req 
 * @param {*} res 
 * @param {(err?)=>void} next
 */
// must check that the account id is in the hacker schema.
function ensureAccountLinkedToHacker(req, res, next) {
    Services.Hacker.findById(req.body.id).then(
        (hacker) => {
            req.hacker = hacker;
            if (hacker && req.user && String.toString(hacker.accountId) === String.toString(req.user.id)) {
                next();
            } else {
                next({
                    status: 403,
                    message: Constants.Error.AUTH_ERROR403_MESSAGE,
                    error: {}
                });
            }
        }
    ).catch(next);
}

/**
 * Uploads resume via the storage service. Assumes there is a resume in req, and a hacker id in req.body. 
 * @param {{body: {id: ObjectId}, resume: [Buffer]}} req 
 * @param {*} res 
 * @param {(err?)=>void} next
 */
async function uploadResume(req, res, next) {
    const gcfilename = `resumes/${Date.now()}-${req.hacker.id}`;
    await Services.Storage.upload(req.file, gcfilename);
    req.body.gcfilename = gcfilename;
    await Services.Hacker.updateOne(req.hacker.id, {
        $set: {
            "application.portfolioURL.resume": gcfilename
        }
    });
    next();
}

/**
 * Attaches the resume of a hacker to req.body.resume. Assumes req.body.id exists.
 * @param {{body: {id: ObjectId}}} req 
 * @param {*} res 
 * @param {(err?)=>void} next
 */
async function downloadResume(req, res, next) {
    const hacker = await Services.Hacker.findById(req.body.id);
    if (hacker && hacker.application && hacker.application.portfolioURL && hacker.application.portfolioURL.resume) {
        res.body.resume = await Services.Storage.download(hacker.application.portfolioURL.resume);
    } else {
        return next({
            status: 404,
            message: Constants.Error.RESUME_ERROR404_MESSAGE,
            error: {}
        });
    }
    next();
}
/**
 * Sends a preset email to a user if a status change occured.
 * @param {{body: {status?: string}, email: string}} req 
 * @param {*} res 
 * @param {(err?:*)=>void} next 
 */
function sendStatusUpdateEmail(req, res, next) {
    //skip if the status doesn't exist
    if (!req.body.status) {
        return next();
    } else {
        const mailData = {
            to: req.email,
            from: process.env.NO_REPLY_EMAIL,
            subject: Constants.General.EMAIL_SUBJECTS[req.body.status],
            html: fs.readFileSync(path.join(__dirname, `../assets/email/statusEmail/${req.body.status}.html`)).toString()
        };
        Services.Email.send(mailData).then(
            (response) => {
                if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
                    next();
                } else {
                    next(response[0]);
                }
            }, next);
    }
}

/**
 * Updates a hacker that is specified by req.params.id, and then sets req.email 
 * to the email of the hacker, found in Account.
 * @param {{params:{id: string}, body: *}} req 
 * @param {*} res 
 * @param {*} next 
 */
async function updateHacker(req, res, next) {
    const hacker = await Services.Hacker.updateOne(req.params.id, req.body);
    if (hacker) {
        const acct = await Services.Account.findById(hacker.accountId);
        if (!acct) {
            return next({
                status: 500,
                message: Constants.Error.HACKER_UPDATE_BY_ACCOUNTID_ERROR500MESSAGE,
                data: {
                    hackerId: hacker.id,
                    accountId: hacker.accountId
                }
            });
        }
        req.email = acct.email;
        next();
    } else {
        next({
            status: 404,
            message: Constants.Error.HACKER_ERROR404_MESSAGE,
            data: {
                id: req.params.id
            }
        });
    }
}

/**
 * Checks that there are no other hackers with the same account id as the one passed into req.body.accountId
 * @param {{body:{accountId: ObjectId}}} req 
 * @param {*} res 
 * @param {*} next
 */
async function checkDuplicateAccountLinks(req, res, next) {
    const hacker = await Services.Hacker.findByAccountId(req.body.accountId);
    if (!hacker) {
        next();
    } else {
        next({
            status: 409,
            message: Constants.Error.HACKER_ID_ERROR409_MESSAGE,
            data: {
                id: req.body.accountId
            }
        });
    }
}

module.exports = {
    parsePatch: parsePatch,
    parseHacker: parseHacker,
    addDefaultStatus: addDefaultStatus,
    ensureAccountLinkedToHacker: ensureAccountLinkedToHacker,
    uploadResume: Middleware.Util.asyncMiddleware(uploadResume),
    downloadResume: Middleware.Util.asyncMiddleware(downloadResume),
    sendStatusUpdateEmail: sendStatusUpdateEmail,
    updateHacker: Middleware.Util.asyncMiddleware(updateHacker),
    validateConfirmedStatus: Middleware.Util.asyncMiddleware(validateConfirmedStatus),
    checkDuplicateAccountLinks: Middleware.Util.asyncMiddleware(checkDuplicateAccountLinks),
};