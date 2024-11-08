import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { User, Role } from "../../src/components/user";
import { UserNotFoundError, UserAlreadyExistsError } from "../../src/errors/userError";


jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

//createUser tests

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const result = await userDAO.createUser("username", "name", "surname", "password", "role")
    expect(result).toBe(true)
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
})

test("UserDAO.createUser should reject with UserAlreadyExistsError if username is already taken", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        const error = new Error("UNIQUE constraint failed: users.username");
        callback(error);
        return {} as Database;
    });

    await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(UserAlreadyExistsError);

    mockDBRun.mockRestore();
});

test("UserDAO.createUser should reject with an error if there is a different error", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        const error = new Error("Some other error");
        callback(error);
        return {} as Database;
    });

    await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow("Some other error");

    mockDBRun.mockRestore();
});

test("UserDAO.createUser should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation(() => Buffer.from("salt"));
    const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation(() => Buffer.from("hashedPassword"));

    await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow("Unexpected error");

    mockRandomBytes.mockRestore();
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
});

//getIsUserAuthenticated tests

test("UserDAO.getIsUserAuthenticated should resolve true for correct credentials", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { username: "username", password: "hashedPassword", salt: "salt" });
        return {} as Database;
    });
    const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation(() => Buffer.from("hashedPassword"));
    const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation(() => true);

    const result = await userDAO.getIsUserAuthenticated("username", "password");
    expect(result).toBe(true);

    mockDBGet.mockRestore();
    mockScrypt.mockRestore();
    mockTimingSafeEqual.mockRestore();
});

test("UserDAO.getIsUserAuthenticated should resolve false for incorrect credentials", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { username: "username", password: "hashedPassword", salt: "salt" });
        return {} as Database;
    });
    const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation(() => Buffer.from("wrongPassword"));
    const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation(() => false);

    const result = await userDAO.getIsUserAuthenticated("username", "password");
    expect(result).toBe(false);

    mockDBGet.mockRestore();
    mockScrypt.mockRestore();
    mockTimingSafeEqual.mockRestore();
});

test("UserDAO.getIsUserAuthenticated should resolve false if user not found", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null);
        return {} as Database;
    });

    const result = await userDAO.getIsUserAuthenticated("username", "password");
    expect(result).toBe(false);

    mockDBGet.mockRestore();
});

test("UserDAO.getIsUserAuthenticated should resolve false if user has no salt", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { username: "username", password: "hashedPassword", salt: null });
        return {} as Database;
    });

    const result = await userDAO.getIsUserAuthenticated("username", "password");
    expect(result).toBe(false);

    mockDBGet.mockRestore();
});

test("UserDAO.getIsUserAuthenticated should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });

    await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow("Unexpected error");

    mockDBGet.mockRestore();
});

test("UserDAO.getIsUserAuthenticated should reject with an error if there is an error during the database query", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database query error";

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error(errorMessage), null);
        return {} as Database;
    });

    await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow(errorMessage);

    mockDBGet.mockRestore();
});

//getAllUsers tests

test("UserDAO.getAllUsers should resolve with an array of users", async () => {
    const userDAO = new UserDAO();
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        const rows = [
            { username: "user1", name: "Cristiano", surname: "Ronaldo", role: Role.MANAGER, address: "Via Roma 1", birthdate: "1980-01-01" },
            { username: "user2", name: "Lionel", surname: "Messi", role: Role.CUSTOMER, address: "Via Roma 2", birthdate: "1990-02-02" },
        ];
        callback(null, rows);
        return {} as Database;
    });

    const result = await userDAO.getAllUsers();
    expect(result).toEqual([
        new User("user1", "Cristiano", "Ronaldo", Role.MANAGER, "Via Roma 1", "1980-01-01"),
        new User("user2", "Lionel", "Messi", Role.CUSTOMER, "Via Roma 2", "1990-02-02"),
    ]);

    mockDBAll.mockRestore();
});

test("UserDAO.getAllUsers should reject with an error if the database query fails", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database error";

    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(new Error(errorMessage), null);
        return {} as Database;
    });

    await expect(userDAO.getAllUsers()).rejects.toThrow(errorMessage);

    mockDBAll.mockRestore();
});

test("UserDAO.getAllUsers should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });

    await expect(userDAO.getAllUsers()).rejects.toThrow("Unexpected error");

    mockDBAll.mockRestore();
});

//getUsersByRole tests

test("UserDAO.getUsersByRole should resolve with an array of users with the specified role", async () => {
    const userDAO = new UserDAO();
    const role = Role.MANAGER;
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        const rows = [
            { username: "user1", name: "Cristiano", surname: "Ronaldo", role: Role.MANAGER, address: "Via Roma 1", birthdate: "1980-01-01" },
            { username: "user2", name: "Lionel", surname: "Messi", role: Role.MANAGER, address: "Via Roma 2", birthdate: "1990-02-02" },
        ];
        callback(null, rows);
        return {} as Database;
    });

    const result = await userDAO.getUsersByRole(role);
    expect(result).toEqual([
        new User("user1", "Cristiano", "Ronaldo", Role.MANAGER, "Via Roma 1", "1980-01-01"),
        new User("user2", "Lionel", "Messi", Role.MANAGER, "Via Roma 2", "1990-02-02"),
    ]);

    mockDBAll.mockRestore();
});

test("UserDAO.getUsersByRole should reject with an error if the database query fails", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database error";

    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(new Error(errorMessage), null);
        return {} as Database;
    });

    await expect(userDAO.getUsersByRole(Role.MANAGER)).rejects.toThrow(errorMessage);

    mockDBAll.mockRestore();
});

test("UserDAO.getUsersByRole should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });

    await expect(userDAO.getUsersByRole("role")).rejects.toThrow("Unexpected error");

    mockDBAll.mockRestore();
});

//getUserByUsername tests

test("UserDAO.getUserByUsername should resolve with a user for a valid username", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        const row = { username: "user1", name: "Cristiano", surname: "Ronaldo", role: Role.MANAGER, address: "Via Roma 1", birthdate: "1980-01-01" };
        callback(null, row);
        return {} as Database;
    });

    const result = await userDAO.getUserByUsername("user1");
    expect(result).toEqual(new User("user1", "Cristiano", "Ronaldo", Role.MANAGER, "Via Roma 1", "1980-01-01"));

    mockDBGet.mockRestore();
});

test("UserDAO.getUserByUsername should reject with UserNotFoundError for an invalid username", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null);
        return {} as Database;
    });

    await expect(userDAO.getUserByUsername("invalidUsername")).rejects.toThrow(UserNotFoundError);

    mockDBGet.mockRestore();
});

test("UserDAO.getUserByUsername should reject with an error if the database query fails", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database error";

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error(errorMessage), null);
        return {} as Database;
    });

    await expect(userDAO.getUserByUsername("user1")).rejects.toThrow(errorMessage);

    mockDBGet.mockRestore();
});

test("UserDAO.getUserByUsername should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });

    await expect(userDAO.getUserByUsername("username")).rejects.toThrow("Unexpected error");

    mockDBGet.mockRestore();
});

//deleteUserByUsername tests

test("UserDAO.deleteUserByUsername should resolve for a valid username", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 1 }, null); 
        return {} as Database;
    });

    await expect(userDAO.deleteUserByUsername("user1")).resolves.toBeUndefined();

    mockDBRun.mockRestore();
});

test("UserDAO.deleteUserByUsername should reject with UserNotFoundError for an invalid username", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 0 }, null); 
        return {} as Database;
    });

    await expect(userDAO.deleteUserByUsername("invalidUsername")).rejects.toThrow(UserNotFoundError);

    mockDBRun.mockRestore();
});

test("UserDAO.deleteUserByUsername should reject with an error if the database query fails", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database error";

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 0 }, new Error(errorMessage));  
        return {} as Database;
    });

    await expect(userDAO.deleteUserByUsername("user1")).rejects.toThrow(errorMessage);

    mockDBRun.mockRestore();
});

test("UserDAO.deleteUserByUsername should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });

    await expect(userDAO.deleteUserByUsername("username")).rejects.toThrow("Unexpected error");

    mockDBRun.mockRestore();
});

//deleteNonAdminUsers tests

test("UserDAO.deleteNonAdminUsers should resolve when all non-admin users are deleted", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        if (typeof params === "function") { 
            callback = params;
        }
        callback(null);
        return {} as Database;
    });

    await expect(userDAO.deleteNonAdminUsers()).resolves.toBeUndefined();

    mockDBRun.mockRestore();
});

test("UserDAO.deleteNonAdminUsers should reject with an error if the database query fails", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database error";

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        if (typeof params === "function") { 
            callback = params;
        }
        callback(new Error(errorMessage));
        return {} as Database;
    });

    await expect(userDAO.deleteNonAdminUsers()).rejects.toThrow(errorMessage);

    mockDBRun.mockRestore();
});

test("UserDAO.deleteNonAdminUsers should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });

    await expect(userDAO.deleteNonAdminUsers()).rejects.toThrow("Unexpected error");

    mockDBRun.mockRestore();
});

//updateUserInfo tests

test("UserDAO.updateUserInfo should resolve with the updated user for a valid username", async () => {
    const userDAO = new UserDAO();
    const updatedUser = new User("user1", "Cristiano", "Ronaldo", Role.CUSTOMER, "Via Roma 1", "1980-01-01");

    const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
        callback.call({ changes: 1 }, null);
        return {} as Database;
    });

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        const row = { username: "user1", name: "Cristiano", surname: "Ronaldo", role: Role.CUSTOMER, address: "Via Roma 1", birthdate: "1980-01-01" };
        callback(null, row);
        return {} as Database;
    });

    const result = await userDAO.updateUserInfo("Cristiano", "Ronaldo", "Via Roma 1", "1980-01-01", "user1");
    expect(result).toEqual(updatedUser);

    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
});

test("UserDAO.updateUserInfo should reject with UserNotFoundError for an invalid username", async () => {
    const userDAO = new UserDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
        callback.call({ changes: 0 }, null);
        return {} as Database;
    });

    await expect(userDAO.updateUserInfo("Cristiano", "Ronaldo", "Via Roma 1", "1980-01-01", "invalidUsername")).rejects.toThrow(UserNotFoundError);

    mockDBRun.mockRestore();
});

test("UserDAO.updateUserInfo should reject with an error if the database query fails", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database error";

    const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
        callback.call({ changes: 0 }, new Error(errorMessage));
        return {} as Database;
    });

    await expect(userDAO.updateUserInfo("Cristiano", "Ronaldo", "Via Roma 1", "1980-01-01", "user1")).rejects.toThrow(errorMessage);

    mockDBRun.mockRestore();
});

test("UserDAO.updateUserInfo should reject with an error if there is an exception", async () => {
    const userDAO = new UserDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("Unexpected error");
    });

    await expect(userDAO.updateUserInfo("name", "surname", "address", "birthdate", "username")).rejects.toThrow("Unexpected error");

    mockDBRun.mockRestore();
});

test("UserDAO.updateUserInfo should reject with an error if there is an error while selecting the updated user", async () => {
    const userDAO = new UserDAO();
    const errorMessage = "Database select error";

    const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
        callback.call({ changes: 1 }, null);
        return {} as Database;
    });

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error(errorMessage), null);
        return {} as Database;
    });

    await expect(userDAO.updateUserInfo("Cristiano", "Ronaldo", "Via Roma 1", "1980-01-01", "user1")).rejects.toThrow(errorMessage);

    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
});

test("UserDAO.updateUserInfo should reject with UserNotFoundError if the updated user is not found", async () => {
    const userDAO = new UserDAO();

    const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
        callback.call({ changes: 1 }, null);
        return {} as Database;
    });

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null); // Simula che l'utente aggiornato non venga trovato
        return {} as Database;
    });

    await expect(userDAO.updateUserInfo("Cristiano", "Ronaldo", "Via Roma 1", "1980-01-01", "user1")).rejects.toThrow(UserNotFoundError);

    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
});