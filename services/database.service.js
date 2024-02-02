// "use strict";
// const mongoose = require("mongoose");
// const logger = require("./logger.service");
// const Q = require("q");

// const TAG = "[ DATABASE SERVICE ]";
// const env = require("./env.service");

// // if DB is defined as an env var, it will go there, elsewise, try local
// // you ideally set DB to your database uri that the provider gives you
// // it should be easily findable

// // DATABASE SERVICE
// // function getAddressFromEnvironment() {
// //     return env.isDevelopment()
// //         ? process.env.DB_ADDRESS_DEV
// //         : env.isProduction()
// //         ? process.env.DB_ADDRESS_DEPLOY
// //         : process.env.DB_ADDRESS_TEST;
// // }
// function getAddressFromEnvironment() {
//     const dbName =
//         "mongodb+srv://vikinghacks:vikinghacks123@cluster0.5p0dekd.mongodb.net/"; // Replace with your actual database name
//     const baseAddress = env.isProduction()
//         ? process.env.DB_ADDRESS_DEPLOY
//         : env.isDevelopment()
//         ? process.env.DB_ADDRESS_DEV
//         : process.env.DB_ADDRESS_TEST;

//     const credentials =
//         process.env.DB_USER_DEV && process.env.DB_PASS_DEV
//             ? `${encodeURIComponent(
//                   process.env.DB_USER_DEV
//               )}:${encodeURIComponent(process.env.DB_PASS_DEV)}@`
//             : "";

//     return `mongodb+srv://${credentials}${baseAddress}/${dbName}?retryWrites=true&w=majority`;
// }

// function getUserFromEnvironment() {
//     return env.isDevelopment()
//         ? process.env.DB_USER_DEV
//         : env.isProduction()
//         ? process.env.DB_USER_DEPLOY
//         : process.env.DB_USER_TEST;
// }

// function getPassFromEnvironment() {
//     return process.env.NODE_ENV === "development"
//         ? process.env.DB_PASS_DEV
//         : process.env.NODE_ENV === "deployment"
//         ? process.env.DB_PASS_DEPLOY
//         : process.env.DB_PASS_TEST;
// }

// module.exports = {
//     connect: function(app, callback) {
//         mongoose.Promise = Q.promise;
//         const user = getUserFromEnvironment();
//         const pass = getPassFromEnvironment();
//         const address = getAddressFromEnvironment();
//         const url =
//             !!user && !!pass
//                 ? `mongodb://${user}:${pass}@${address}`
//                 : `mongodb://${address}`;
//         logger.info(`${TAG} Connecting to db on ${url}`);
//         mongoose
//             .connect(
//                 "",
//                 {
//                     useNewUrlParser: true,
//                     useCreateIndex: true,
//                     useFindAndModify: false,
//                     useUnifiedTopology: true
//                 }
//             )
//             .then(
//                 function() {
//                     logger.info(`${TAG} Connected to database on ${url}`);
//                     if (app) {
//                         app.emit("event:connected to db");
//                     }
//                     if (callback) {
//                         callback();
//                     }
//                 },
//                 function(error) {
//                     logger.error(
//                         `${TAG} Failed to connect to database at ${url}. Error: ${error}`
//                     );
//                     throw `Failed to connect to database at ${url}`;
//                 }
//             );
//     },
//     address: getAddressFromEnvironment(),
//     readyState: function() {
//         return mongoose.connection.readyState;
//     }
// };
"use strict";
const mongoose = require("mongoose");
const logger = require("./logger.service");
const Q = require("q");

const TAG = "[ DATABASE SERVICE ]";
const env = require("./env.service");

// if DB is defined as an env var, it will go there, elsewise, try local
// you ideally set DB to your database uri that the provider gives you
// it should be easily findableprocess.env.DB_ADDRESS_DEV
// console.log("process.env.DB_ADDRESS_DEV::::", );
// DATABASE SERVICE
function getAddressFromEnvironment() {
    return env.isDevelopment()
        ? process.env.DB_ADDRESS_DEV
        : env.isProduction()
        ? process.env.DB_ADDRESS_DEPLOY
        : process.env.DB_ADDRESS_TEST;
}

function getUserFromEnvironment() {
    return env.isDevelopment()
        ? process.env.DB_USER_DEV
        : env.isProduction()
        ? process.env.DB_USER_DEPLOY
        : process.env.DB_USER_TEST;
}

function getPassFromEnvironment() {
    return process.env.NODE_ENV === "development"
        ? process.env.DB_PASS_DEV
        : process.env.NODE_ENV === "deployment"
        ? process.env.DB_PASS_DEPLOY
        : process.env.DB_PASS_TEST;
}

module.exports = {
    connect: function(app, callback) {
        mongoose.Promise = Q.promise;
        const user = getUserFromEnvironment();
        const pass = getPassFromEnvironment();
        const address = getAddressFromEnvironment();
        // const url =
        //     !!user && !!pass
        //         ? `mongodb://${user}:${pass}@${address}`
        //         : `mongodb://${address}`;
        // logger.info(`${TAG} Connecting to db on ${url}`);
        const url = process.env.DB_ADDRESS_DEV;
        mongoose
            .connect(url, {
                // useNewUrlParser: true,
                // useCreateIndex: true,
                // useFindAndModify: false,
                // useUnifiedTopology: true
            })
            .then(
                function() {
                    logger.info(`${TAG} Connected to database on ${url}`);
                    if (app) {
                        app.emit("event:connected to db");
                    }
                    if (callback) {
                        callback();
                    }
                },
                function(error) {
                    logger.error(
                        `${TAG} Failed to connect to database at ${url}. Error: ${error}`
                    );
                    throw `Failed to connect to database at ${url}`;
                }
            );
    },
    address: getAddressFromEnvironment(),
    readyState: function() {
        return mongoose.connection.readyState;
    }
};
