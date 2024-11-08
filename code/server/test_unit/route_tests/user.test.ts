import { test, expect, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, UserIsAdminError, UnauthorizedUserError } from "../../src/errors/userError";
import Authenticator from "../../src/routers/auth";
import { User, Role } from "../../src/components/user"
import ErrorHandler from "../../src/helper"

import UserController from "../../src/controllers/userController"
import { describe } from "node:test";
import { DateError } from "../../src/utilities";
import moment from "moment";
jest.mock("../../src/routers/auth");

const baseURL = "/ezelectronics"

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

//POST /ezelectronics/users tests

test("POST /ezelectronics/users - It should return a 200 success code", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    };
    jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true);
    const response = await request(app).post(baseURL + "/users").send(testUser);
    expect(response.status).toBe(200);
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
});

test("POST /ezelectronics/users - It should return a 422 status if username is empty", async () => {
    const invalidUser = {
        username: "",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    };
    const response = await request(app).post(baseURL + "/users").send(invalidUser);
    expect(response.status).toBe(422);
});

test("POST /ezelectronics/users - It should return a 422 status if name is empty", async () => {
    const invalidUser = {
        username: "test",
        name: "",
        surname: "test",
        password: "test",
        role: "Manager"
    };
    const response = await request(app).post(baseURL + "/users").send(invalidUser);
    expect(response.status).toBe(422);
});

test("POST /ezelectronics/users - It should return a 422 status if surname is empty", async () => {
    const invalidUser = {
        username: "test",
        name: "test",
        surname: "",
        password: "test",
        role: "Manager"
    };
    const response = await request(app).post(baseURL + "/users").send(invalidUser);
    expect(response.status).toBe(422);
});

test("POST /ezelectronics/users - It should return a 422 status if password is empty", async () => {
    const invalidUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "",
        role: "Manager"
    };
    const response = await request(app).post(baseURL + "/users").send(invalidUser);
    expect(response.status).toBe(422);
});

test("POST /ezelectronics/users - It should return a 422 status if role is invalid", async () => {
    const invalidUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "InvalidRole"
    };
    const response = await request(app).post(baseURL + "/users").send(invalidUser);
    expect(response.status).toBe(422);
});

test("POST /ezelectronics/users - It should return a 409 status if the username already exists", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    };
    jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError());
    const response = await request(app).post(baseURL + "/users").send(testUser);
    expect(response.status).toBe(409);
});

test("POST /ezelectronics/users - It should return a 503 status if createUser throws an error", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    };
    jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new Error("Create user error"));
    const response = await request(app).post(baseURL + "/users").send(testUser);
    expect(response.status).toBe(503);
});

//GET /ezelectronics/users tests

test("GET /ezelectronics/users/ - It should return a 200 success code and an array of users ", async () => {
    const mockUsers = [testAdmin, testCustomer];

    jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(mockUsers);
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
    
    const response = await request(app).get(`${baseURL}/users`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(UserController.prototype.getUsers).toHaveBeenCalled();
});

test("GET /ezelectronics/users - It should return a 503 status if getUsers throws an error", async () => {

    jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error("Get users by role error"));
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());

    const response = await request(app).get(`${baseURL}/users`);
    expect(response.status).toBe(503);
});

//GET /ezelectronics/users/roles/:role tests

test("GET /ezelectronics/users/roles/:role - It should return a 200 success code and an array of users with a specific role", async () => {
    const role = Role.ADMIN;
    const mockUsers = [testAdmin];

    jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(mockUsers);
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
    
    const response = await request(app).get(`${baseURL}/users/roles/${role}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(UserController.prototype.getUsersByRole).toHaveBeenCalled();
    expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith(role);
});

test("GET /ezelectronics/users/roles/:role - It should return a 503 status if getUsersByRole throws an error", async () => {
    const role = Role.MANAGER;

    jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new Error("Get users by role error"));
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());

    const response = await request(app).get(`${baseURL}/users/roles/${role}`);
    expect(response.status).toBe(503);
});

// GET /ezelectronics/users/:username tests

test("GET /ezelectronics/users/:username - It should return a 200 success code and the user for a valid username", async () => {
    const username = "admin";
    const mockUser = testAdmin;

    const mockGetUserByUsername = jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(mockUser);
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated user
        return next();
    });

    const response = await request(app).get(`${baseURL}/users/${username}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(testAdmin, username);

    mockGetUserByUsername.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("GET /ezelectronics/users/:username - It should return a 404 status if the user is not found", async () => {
    const username = "nonexistentUser";

    const mockGetUserByUsername = jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated user
        return next();
    });

    const response = await request(app).get(`${baseURL}/users/${username}`);
    expect(response.status).toBe(404);

    mockGetUserByUsername.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("GET /ezelectronics/users/:username - It should return a 503 status if getUserByUsername throws an error", async () => {
    const username = "admin";

    const mockGetUserByUsername = jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new Error("Internal Server Error"));
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated user
        return next();
    });

    const response = await request(app).get(`${baseURL}/users/${username}`);
    expect(response.status).toBe(503);

    mockGetUserByUsername.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("GET /ezelectronics/users/:username - It should return a 401 status if a non-admin tries to access another user's data", async () => {
    const username = "admin";
    const nonAdminUser = testCustomer;

    const mockGetUserByUsername = jest.spyOn(UserController.prototype, "getUserByUsername").mockImplementation(() => {
        throw new UserNotAdminError();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = nonAdminUser; // Mock the authenticated non-admin user
        return next();
    });

    const response = await request(app).get(`${baseURL}/users/${username}`);
    expect(response.status).toBe(401);

    mockGetUserByUsername.mockRestore();
    mockIsLoggedIn.mockRestore();
});

//DELETE /ezelectronics/users/:username tests

test("DELETE /ezelectronics/users/:username - It should return a 200 success code for an admin deleting a non-admin user", async () => {
    const username = "customer";

    const mockDeleteUser = jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce();
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testAdmin; 
        return next();
    });

    const response = await request(app).delete(`${baseURL}/users/${username}`);
    expect(response.status).toBe(200);
    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    expect(mockDeleteUser).toHaveBeenCalledWith(testAdmin, username);

    mockDeleteUser.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/users/:username - It should return a 401 status if a non-admin tries to delete another user", async () => {
    const username = "admin";
    const nonAdminUser = testCustomer;

    const mockDeleteUser = jest.spyOn(UserController.prototype, "deleteUser").mockImplementation(() => {
        throw new UserNotAdminError();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = nonAdminUser; // Mock the authenticated non-admin user
        return next();
    });

    const response = await request(app).delete(`${baseURL}/users/${username}`);
    expect(response.status).toBe(401);

    mockDeleteUser.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/users/:username - It should return a 401 status if an admin tries to delete another admin", async () => {
    const username = "anotherAdmin";
    const anotherAdminUser = new User("anotherAdmin", "another", "admin", Role.ADMIN, "", "");

    const mockGetUserByUsername = jest.spyOn(UserController.prototype, "deleteUser").mockImplementation(async () => {
        throw new UserIsAdminError();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated admin user
        return next();
    });

    const response = await request(app).delete(`${baseURL}/users/${username}`);
    expect(response.status).toBe(401);

    mockGetUserByUsername.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/users/:username - It should return a 404 status if the user is not found", async () => {
    const username = "nonexistentUser";

    const mockDeleteUser = jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotFoundError());
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated admin user
        return next();
    });

    const response = await request(app).delete(`${baseURL}/users/${username}`);
    expect(response.status).toBe(404);

    mockDeleteUser.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/users/:username - It should return a 503 status if deleteUser throws an error", async () => {
    const username = "customer";

    const mockDeleteUser = jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new Error("Internal Server Error"));
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated admin user
        return next();
    });

    const response = await request(app).delete(`${baseURL}/users/${username}`);
    expect(response.status).toBe(503);

    mockDeleteUser.mockRestore();
    mockIsLoggedIn.mockRestore();
});

//DELETE /ezelectronics/users tests

test("DELETE /ezelectronics/users - It should return a 200 success code when an admin deletes all non-admin users", async () => {
    const mockDeleteAll = jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce();
    const mockIsAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated admin user
        return next();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());

    const response = await request(app).delete(`${baseURL}/users`);
    expect(response.status).toBe(200);
    expect(mockDeleteAll).toHaveBeenCalledTimes(1);

    mockDeleteAll.mockRestore();
    mockIsAdmin.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/users - It should return a 401 status if a non-admin tries to delete all users", async () => {
    const mockDeleteAll = jest.spyOn(UserController.prototype, "deleteAll").mockImplementation(() => {
        throw new UserNotAdminError();
    });
    const mockIsAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        req.user = testCustomer; // Mock the authenticated non-admin user
        return next();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());

    const response = await request(app).delete(`${baseURL}/users`);
    expect(response.status).toBe(401);

    mockDeleteAll.mockRestore();
    mockIsAdmin.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/users - It should return a 503 status if deleteAll throws an error", async () => {
    const mockDeleteAll = jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new Error("Internal Server Error"));
    const mockIsAdmin = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        req.user = testAdmin; // Mock the authenticated admin user
        return next();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());

    const response = await request(app).delete(`${baseURL}/users`);
    expect(response.status).toBe(503);

    mockDeleteAll.mockRestore();
    mockIsAdmin.mockRestore();
    mockIsLoggedIn.mockRestore();
});

//PATCH /ezelectronics/users/:username

test("PATCH /ezelectronics/users/:username - It should return a 200 success code for updating user info", async () => {
    const username = "customer";
    const updatedUser = { ...testCustomer, name: "updatedName", surname: "updatedSurname", address: "updatedAddress", birthdate: "1990-01-01" };

    const mockUpdateUserInfo = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer; // Mock the authenticated customer user
        return next();
    });

    const response = await request(app)
        .patch(`${baseURL}/users/${username}`)
        .send({
            name: "updatedName",
            surname: "updatedSurname",
            address: "updatedAddress",
            birthdate: "1990-01-01"
        });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedUser);
    expect(mockUpdateUserInfo).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserInfo).toHaveBeenCalledWith(testCustomer, "updatedName", "updatedSurname", "updatedAddress", "1990-01-01", username);

    mockUpdateUserInfo.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("PATCH /ezelectronics/users/:username - It should return a 401 status if a non-admin tries to update another user's info", async () => {
    const username = "admin";

    const mockUpdateUserInfo = jest.spyOn(UserController.prototype, "updateUserInfo").mockImplementation(() => {
        throw new UnauthorizedUserError();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer; // Mock the authenticated customer user
        return next();
    });

    const response = await request(app)
        .patch(`${baseURL}/users/${username}`)
        .send({
            name: "updatedName",
            surname: "updatedSurname",
            address: "updatedAddress",
            birthdate: "1990-01-01"
        });

    expect(response.status).toBe(401);

    mockUpdateUserInfo.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("PATCH /ezelectronics/users/:username - It should return a 400 status if birthdate is in the future", async () => {
    const username = "customer";

    const mockUpdateUserInfo = jest.spyOn(UserController.prototype, "updateUserInfo").mockImplementation(() => {
        throw new DateError();
    });
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer; // Mock the authenticated customer user
        return next();
    });

    const response = await request(app)
        .patch(`${baseURL}/users/${username}`)
        .send({
            name: "updatedName",
            surname: "updatedSurname",
            address: "updatedAddress",
            birthdate: moment().add(1, 'day').format("YYYY-MM-DD") // Future date
        });

    expect(response.status).toBe(400);

    mockUpdateUserInfo.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("PATCH /ezelectronics/users/:username - It should return a 503 status if updateUserInfo throws an error", async () => {
    const username = "customer";

    const mockUpdateUserInfo = jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new Error("Internal Server Error"));
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer; // Mock the authenticated customer user
        return next();
    });

    const response = await request(app)
        .patch(`${baseURL}/users/${username}`)
        .send({
            name: "updatedName",
            surname: "updatedSurname",
            address: "updatedAddress",
            birthdate: "1990-01-01"
        });

    expect(response.status).toBe(503);

    mockUpdateUserInfo.mockRestore();
    mockIsLoggedIn.mockRestore();
});

//Authentication routes tests

test("POST /ezelectronics/sessions/ - It should return a 200 success code and the logged in user", async () => {
    const loginUser = { username: "admin", password: "password" };
    const mockIsNotLoggedIn = jest.spyOn(Authenticator.prototype, "isNotLoggedIn").mockImplementation((req, res, next) => {
        return next();
    });

    const mockLogin = jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(testAdmin);

    const response = await request(app)
        .post(`${baseURL}/sessions/`)
        .send(loginUser);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(testAdmin);

    mockLogin.mockRestore();
    mockIsNotLoggedIn.mockRestore();
});

test("POST /ezelectronics/sessions/ - It should return a 401 error code for invalid credentials", async () => {
    const loginUser = { username: "admin", password: "wrongpassword" };
    const mockIsNotLoggedIn = jest.spyOn(Authenticator.prototype, "isNotLoggedIn").mockImplementation((req, res, next) => {
        return next();
    });

    const mockLogin = jest.spyOn(Authenticator.prototype, "login").mockRejectedValueOnce(new Error("Invalid credentials"));

    const response = await request(app)
        .post(`${baseURL}/sessions/`)
        .send(loginUser);

    expect(response.status).toBe(401);

    mockLogin.mockRestore();
    mockIsNotLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/sessions/current - It should return a 200 success code for logging out the current user", async () => {
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer; // Mock the authenticated customer user
        return next();
    });
    const mockLogout = jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(true);

    const response = await request(app)
        .delete(`${baseURL}/sessions/current`);

    expect(response.status).toBe(200);

    mockLogout.mockRestore();
    mockIsLoggedIn.mockRestore();
});

test("DELETE /ezelectronics/sessions/current - It should return a 503 error code if logout fails", async () => {
    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer; // Mock the authenticated customer user
        return next();
    });
    const mockLogout = jest.spyOn(Authenticator.prototype, "logout").mockRejectedValueOnce(new Error("Logout failed"));

    const response = await request(app)
        .delete(`${baseURL}/sessions/current`);

    expect(response.status).toBe(503);

    mockLogout.mockRestore();
    mockIsLoggedIn.mockRestore();
});

