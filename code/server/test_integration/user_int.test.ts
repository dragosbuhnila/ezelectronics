import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../index";
import db from "../src/db/db";
import { User, Role } from "../src/components/user";
import crypto from "crypto";

const baseURL = "/ezelectronics";

describe("Authentication Route integration tests", () => {
    let cookies: string[];

    beforeAll(async () => {
        // Cleanup database
        await db.run("DELETE FROM users");

        // Insert admin user for authentication
        const saltadmin = crypto.randomBytes(16);
        const hashedPasswordadmin = crypto.scryptSync("prova", saltadmin, 16);

        await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
            ["Matteo", "prova", "prova", Role.ADMIN, hashedPasswordadmin, saltadmin]);
    });

    afterAll(async () => {
        // Cleanup database after all tests
        await db.run("DELETE FROM users");
    });

    describe("FR1.1 - POST /ezelectronics/sessions - Login", () => {
        test("Scenario 1.1 - Successful Login", async () => {
            const response = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'Matteo',
                    password: 'prova'
                });

            expect(response.status).toBe(200);
            expect(response.headers['set-cookie']).toBeDefined();

            // Save cookies for subsequent requests
            const setCookieHeader = response.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });

        test("Scenario 1.2 - Wrong password", async () => {
            const response = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'Matteo',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });

        test("Scenario 1.3 - User not registered", async () => {
            const response = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'nonexistentuser',
                    password: 'password'
                });

            expect(response.status).toBe(401);
        });

        test("Scenario 1.4 - User already logged in", async () => {
            const response = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'Matteo',
                    password: 'prova'
                });

            const setCookieHeader = response.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

            const response2 = await request(app).post('/ezelectronics/sessions')
            .send({
                username: 'Matteo',
                password: 'prova'
            }).set('Cookie', cookies);

            expect(response2.status).toBe(401);
        });

    });

    describe("FR1.2 - DELETE /ezelectronics/sessions/current - Logout", () => {
        test("Scenario 2.1 - Logout", async () => {
            const response = await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            expect(response.status).toBe(200);
            expect(response.headers['set-cookie']).toBeDefined();
        });

        test("Scenario 2.2 - User already logged out", async () => {
            const response = await request(app).delete('/ezelectronics/sessions/current');

            expect(response.status).toBe(401);
        });
    });

    describe("FR1.3 - POST /ezelectronics/users - Create a new user account", () => {
        test("Scenario 3.1 - Registration", async () => {
            const newUser = new User("newUser", "new", "user", Role.MANAGER, "Via Roma 1", "1990-01-01");

            const response = await request(app)
                .post(baseURL + "/users")
                .send({
                    username: newUser.username,
                    name: newUser.name,
                    surname: newUser.surname,
                    password: "password",
                    role: newUser.role
                });

            expect(response.status).toBe(200);

            // Cleanup the created user
            await db.run("DELETE FROM users WHERE username = ?", [newUser.username]);
        });

        test("Scenario 3.2 - Username already in use", async () => {
            const newUser = new User("newUser", "new", "user", Role.MANAGER, "Via Roma 1", "1990-01-01");

            const response = await request(app)
                .post(baseURL + "/users")
                .send({
                    username: newUser.username,
                    name: newUser.name,
                    surname: newUser.surname,
                    password: "password",
                    role: newUser.role
                });

            const response2 = await request(app)
                .post(baseURL + "/users")
                .send({
                    username: newUser.username,
                    name: newUser.name,
                    surname: newUser.surname,
                    password: "password",
                    role: newUser.role
                });

            expect(response2.status).toBe(409);

            // Cleanup the created user
            await db.run("DELETE FROM users WHERE username = ?", [newUser.username]);
        });

        test("Scenario 3.3 - User provides empty parameters", async () => {
            const response = await request(app)
                .post(baseURL + "/users")
                .send({
                    username: "",
                    name: "new",
                    surname: "user",
                    password: "password",
                    role: Role.MANAGER
                });

            expect(response.status).toBe(422);
        });
    });
});

describe("User Route integration tests", () => {
    let cookies: string[];

    beforeAll(async () => {
        // Cleanup database
        await db.run("DELETE FROM users");

        // Insert admin user for authentication
        const saltadmin = crypto.randomBytes(16);
        const hashedPasswordadmin = crypto.scryptSync("prova", saltadmin, 16);

        await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
            ["Matteo", "prova", "prova", Role.ADMIN, hashedPasswordadmin, saltadmin]);

        // Login as admin to get cookies
        const responseLogin = await request(app).post('/ezelectronics/sessions')
            .send({
                username: 'Matteo',
                password: 'prova'
            });

        const setCookieHeader = responseLogin.headers['set-cookie'];
        cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    });

    afterAll(async () => {
        // Cleanup database after all tests
        await db.run("DELETE FROM users");
    });

    describe("FR2.1 - GET /ezelectronics/users - Show the list of all users", () => {
        test("Scenario 4.3 - View the information of all users", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, hashedPassword, salt]);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);

            const response = await request(app).get(baseURL + "/users").set('Cookie', cookies);
            
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ username: testAdmin.username }),
                    expect.objectContaining({ username: testCustomer.username })
                ])
            );
            expect(response.status).toBe(200);

            // Cleanup the created users
            await db.run("DELETE FROM users WHERE username = ? OR username = ?", [testAdmin.username, testCustomer.username]);
        });
    });

    describe("FR2.2 - GET /ezelectronics/users/roles/:role - Show the list of all users with a specific role", () => {
        test("Scenario 4.4 - View the information of all users with a specific role (Customer or Manager)", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            const testManager = new User("manager", "manager", "manager", Role.MANAGER, "", "");
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
    
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, hashedPassword, salt]);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testManager.username, testManager.name, testManager.surname, testManager.role, hashedPassword, salt]);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);
    
            const response = await request(app).get(`${baseURL}/users/roles/${Role.MANAGER}`).set('Cookie', cookies);
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ username: testManager.username, role: Role.MANAGER }),
                ])
            );
            expect(response.body).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ username: testAdmin.username }),
                    expect.objectContaining({ username: testCustomer.username })
                ])
            );
    
            // Cleanup the created users
            await db.run("DELETE FROM users WHERE username = ? OR username = ? OR username = ?", [testAdmin.username, testManager.username, testCustomer.username]);
        });
    
        test("Scenario 4.5 - Ask to view information of users with a role that does not exist", async () => {
            const response = await request(app).get(`${baseURL}/users/roles/nonexistentRole`).set('Cookie', cookies);
            expect(response.status).toBe(422);
        });
    });

    describe("FR2.3 - GET /ezelectronics/users/:username - Show the information of a single user", () => {
        test("Scenario 4.1 - View the information of one user", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);

            const response = await request(app).get(`${baseURL}/users/${testCustomer.username}`).set('Cookie', cookies);
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                username: testCustomer.username,
                name: testCustomer.name,
                surname: testCustomer.surname,
                role: testCustomer.role
            });

            // Cleanup the created user
            await db.run("DELETE FROM users WHERE username = ?", [testCustomer.username]);
        });

        test("Scenario 4.2 - Ask to view information of a user who does not exist", async () => {
            const response = await request(app).get(`${baseURL}/users/nonexistentUser`).set('Cookie', cookies);
            expect(response.status).toBe(404);
        });
    });

    describe("FR2.4 - PATCH /ezelectronics/users/:username - Update the information of a single user", () => {
        test("Scenario 12.1 - Edit user information", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);

            const updatedUser = {
                name: "updatedName",
                surname: "updatedSurname",
                address: "updatedAddress",
                birthdate: "1980-01-01"
            };

            const response = await request(app)
                .patch(`${baseURL}/users/${testCustomer.username}`)
                .send(updatedUser)
                .set('Cookie', cookies);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                username: testCustomer.username,
                ...updatedUser
            });

            // Cleanup the updated user
            await db.run("DELETE FROM users WHERE username = ?", [testCustomer.username]);
        });

        test("It should return a 400 error if birthdate is in the future", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);

            const response = await request(app)
                .patch(`${baseURL}/users/${testCustomer.username}`)
                .send({
                    name: "updatedName",
                    surname: "updatedSurname",
                    address: "updatedAddress",
                    birthdate: "3000-01-01"
                })
                .set('Cookie', cookies);

            expect(response.status).toBe(400);

            // Cleanup the created user
            await db.run("DELETE FROM users WHERE username = ?", [testCustomer.username]);
        });

        test("It should return a 401 error if a non-admin tries to update another user's info", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, hashedPassword, salt]);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);

            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'customer',
                    password: 'password'
                });
            const customerCookies = responseLogin.headers['set-cookie'];

            const response = await request(app).patch(`${baseURL}/users/${testAdmin.username}`)
            .send({
                name: "updatedName",
                surname: "updatedSurname",
                address: "updatedAddress",
                birthdate: "1990-01-01"
            }).set('Cookie', customerCookies);

            expect(response.status).toBe(401);

            // Cleanup the created users
            await db.run("DELETE FROM users WHERE username = ? OR username = ?", [testAdmin.username, testCustomer.username]);
        });
    
        test("It should return a 404 error if user is not found", async () => {
            const response = await request(app)
                .patch(`${baseURL}/users/nonexistentUser`)
                .send({
                    name: "updatedName",
                    surname: "updatedSurname",
                    address: "updatedAddress",
                    birthdate: "1990-01-01"
                })
                .set('Cookie', cookies);
    
            expect(response.status).toBe(404);
        });
    });
    
    describe("FR2.5 - DELETE /ezelectronics/users/:username - Delete a single non Admin user", () => {
        test("Scenario 5.1 - Delete one user", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const newUser = new User("newUser", "new", "user", Role.MANAGER, "Via Roma 1", "1990-01-01");
    
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [newUser.username, newUser.name, newUser.surname, newUser.role, hashedPassword, salt]);
    
            const response = await request(app)
                .delete(`${baseURL}/users/${newUser.username}`)
                .set('Cookie', cookies);
    
            expect(response.status).toBe(200);
    
            // Verify user is deleted
            const checkResponse = await request(app).get(`${baseURL}/users/${newUser.username}`).set('Cookie', cookies);
            expect(checkResponse.status).toBe(404);
        });
    
        test("Scenario 5.2 - Try to delete a user that does not exist", async () => {
            const response = await request(app)
                .delete(`${baseURL}/users/nonexistentUser`)
                .set('Cookie', cookies);
    
            expect(response.status).toBe(404);
        });
    
        test("It should return a 401 error if a non-admin tries to delete another user", async () => {
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
    
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, hashedPassword, salt]);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);
    
            const agent = request.agent(app);
    
            // First log in the customer
            await agent
                .post("/ezelectronics/sessions/")
                .send({ username: testCustomer.username, password: "password" });
    
            const response = await agent.delete(`${baseURL}/users/${testAdmin.username}`);
    
            expect(response.status).toBe(401);
    
            // Cleanup the created users
            await db.run("DELETE FROM users WHERE username = ? OR username = ?", [testAdmin.username, testCustomer.username]);
        });
    });
    
    describe("FR2.6 - DELETE /ezelectronics/users - Delete all non Admin users", () => {
        test("Scenario 13.1 - Delete all non-Admin users", async () => {
            const newUser = new User("newUser", "new", "user", Role.MANAGER, "Via Roma 1", "1990-01-01");
            const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
    
            // First create an admin user and a non-admin user to delete
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, hashedPassword, salt]);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [newUser.username, newUser.name, newUser.surname, newUser.role, "password", "salt"]);
    
            const response = await request(app)
                .delete(baseURL + "/users")
                .set('Cookie', cookies);
    
            expect(response.status).toBe(200);
    
            // Verify non-admin user is deleted
            const checkResponse = await request(app).get(`${baseURL}/users/${newUser.username}`).set('Cookie', cookies);
            expect(checkResponse.status).toBe(404);
    
            // Verify admin user still exists
            const adminCheckResponse = await request(app).get(`${baseURL}/users/${testAdmin.username}`).set('Cookie', cookies);
            expect(adminCheckResponse.status).toBe(200);
    
            // Cleanup the created admin user
            await db.run("DELETE FROM users WHERE username = ?", [testAdmin.username]);
        });
    
        test("It should return a 401 error if a non-admin tries to delete all users", async () => {
            const newUser = new User("newUser", "new", "user", Role.MANAGER, "Via Roma 1", "1990-01-01");
            const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
    
            // First create a customer user and a non-admin user to delete
            const salt = crypto.randomBytes(16);
            const hashedPassword = crypto.scryptSync("password", salt, 16);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, hashedPassword, salt]);
            await db.run("INSERT INTO users (username, name, surname, role, password, salt) VALUES (?, ?, ?, ?, ?, ?)", 
                [newUser.username, newUser.name, newUser.surname, newUser.role, "password", "salt"]);
    
            const agent = request.agent(app);
    
            // First log in the customer
            await agent
                .post("/ezelectronics/sessions/")
                .send({ username: testCustomer.username, password: "password" });
    
            const response = await agent.delete(baseURL + "/users");
    
            expect(response.status).toBe(401);
    
            // Cleanup the created users
            await db.run("DELETE FROM users WHERE username = ? OR username = ?", [testCustomer.username, newUser.username]);
        });
    });
});