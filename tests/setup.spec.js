"use strict";
const winston = require("winston");
winston.remove(winston.transports.Console);
const server = require("../app.js");
const Util = {
    Account: require("./util/account.test.util"),
    Bus: require("./util/bus.test.util"),
    Hacker: require("./util/hacker.test.util"),
    Role: require("./util/role.test.util"),
    RoleBinding: require("./util/roleBinding.test.util"),
    Sponsor: require("./util/sponsor.test.util"),
    Staff: require("./util/staff.test.util"),
    Team: require("./util/team.test.util"),
    Volunteer: require("./util/volunteer.test.util"),
    AccountConfirmation: require("./util/accountConfirmation.test.util"),
    ResetPassword: require("./util/resetPassword.test.util.js")
};


//make sure that we are connected to the database
before(function (done) {
    this.timeout(60000);
    server.app.on("event:connected to db", () => {
        // drop all information, and then add some users
        dropAll(done);
    });
});

beforeEach(function (done) {
    this.timeout(60000);
    Util.Account.storeAll(Util.Account.allAccounts, () => {
        Util.Hacker.storeAll(Util.Hacker.Hackers, () => {
            Util.Sponsor.storeAll(Util.Sponsor.Sponsors, () => {
                Util.Team.storeAll(Util.Team.Teams, () => {
                    Util.Staff.storeAll(Util.Staff.Staffs, () => {
                        Util.AccountConfirmation.storeAll(Util.AccountConfirmation.AccountConfirmationTokens, () => {
                            Util.ResetPassword.storeAll(Util.ResetPassword.ResetPasswords, () => {
                                Util.Bus.storeAll(Util.Bus.Busses, () => {
                                    Util.Volunteer.storeAll(Util.Volunteer.Volunteers, () => {
                                        Util.Role.storeAll(Util.Role.allRolesArray, () => {
                                            Util.RoleBinding.storeAll(Util.RoleBinding.RoleBindings, () => {
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

afterEach(function (done) {
    this.timeout(60000);
    dropAll(done);
});

function dropAll(done) {
    Util.RoleBinding.dropAll(() => {
        Util.Role.dropAll(() => {
            Util.ResetPassword.dropAll(() => {
                Util.AccountConfirmation.dropAll(() => {
                    Util.Volunteer.dropAll(() => {
                        Util.Staff.dropAll(() => {
                            Util.Team.dropAll(() => {
                                Util.Sponsor.dropAll(() => {
                                    Util.Bus.dropAll(() => {
                                        Util.Hacker.dropAll(() => {
                                            Util.Account.dropAll(done);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}