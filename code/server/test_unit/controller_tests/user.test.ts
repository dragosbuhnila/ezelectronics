import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from "../../src/components/user"
import { UserNotAdminError, UserIsAdminError, UnauthorizedUserError } from "../../src/errors/userError";
import moment from "moment";
import { DateError } from "../../src/utilities";

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});

//getUsers tests

test('UserController.getUsers should return an array of users', async () => {
    jest.resetAllMocks();
    const mockUsers = [
        new User('user1', 'Cristiano', 'Ronaldo', Role.MANAGER, 'Via Roma 2', '1980-01-01'),
        new User('user2', 'Lionel', 'Messi', Role.CUSTOMER, 'Via Roma 1', '1990-02-02'),
    ];
    const userController = new UserController();
    // Mock the getAllUsers method to return the mockUsers array
    jest.spyOn(UserDAO.prototype, 'getAllUsers').mockResolvedValueOnce(mockUsers);
    const result = await userController.getUsers();
    expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUsers);
    jest.restoreAllMocks();
});

test('UserController.getUsers should handle errors from the DAO', async () => {
    jest.resetAllMocks();
    const errorMessage = 'Database error';
    const userController = new UserController();

    jest.spyOn(UserDAO.prototype, 'getAllUsers').mockRejectedValueOnce(new Error(errorMessage));

    await expect(userController.getUsers()).rejects.toThrow(errorMessage);
    expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
});

//getUsersByRole tests

test('UserController.getUsersByRole should return an array of users with the specified role', async () => {
    const role = Role.MANAGER;
    const mockUsers = [
        new User('user1', 'Cristiano', 'Ronaldo', role, 'Via Roma 2', '1980-01-01'),
        new User('user2', 'Lionel', 'Messi', role, 'Via Roma 1', '1990-02-02'),
    ];

    // Reset all mocks before this test
    jest.resetAllMocks();

    // Mock the getUsersByRole method to return the mockUsers array
    jest.spyOn(UserDAO.prototype, 'getUsersByRole').mockResolvedValueOnce(mockUsers);

    const userController = new UserController();
    const result = await userController.getUsersByRole(role);

    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(role);
    expect(result).toEqual(mockUsers);
});

test('UserController.getUsersByRole should handle errors from the DAO', async () => {
    const role = Role.CUSTOMER;
    const errorMessage = 'Database error';

    // Reset all mocks before this test
    jest.resetAllMocks();

    // Mock the getUsersByRole method to throw an error
    jest.spyOn(UserDAO.prototype, 'getUsersByRole').mockRejectedValueOnce(new Error(errorMessage));

    const userController = new UserController();

    await expect(userController.getUsersByRole(role)).rejects.toThrow(errorMessage);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(role);
});

//getUserByUsername tests

test('UserController.getUserByUsername should return the user for an admin', async () => {
    const username = 'user1';
    const mockUser = new User(username, 'Cristiano', 'Ronaldo', Role.MANAGER, 'Via Roma 2', '1980-01-01');
    const requestingUser = new User('admin', 'Admin', 'User', Role.ADMIN, 'Via Roma 1', '1970-01-01');

    // Reset all mocks before this test
    jest.resetAllMocks();

    // Mock the getUserByUsername method to return the mockUser
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(mockUser);

    const userController = new UserController();
    const result = await userController.getUserByUsername(requestingUser, username);

    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(result).toEqual(mockUser);
});

test('UserController.getUserByUsername should return the user for non-admin retrieving their own info', async () => {
    const username = 'user1';
    const mockUser = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 1', '1980-01-01');
    const requestingUser = mockUser;

    // Reset all mocks before this test
    jest.resetAllMocks();

    // Mock the getUserByUsername method to return the mockUser
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(mockUser);

    const userController = new UserController();
    const result = await userController.getUserByUsername(requestingUser, username);

    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(result).toEqual(mockUser);
});

test('UserController.getUserByUsername should throw UserNotAdminError for non-admin trying to retrieve another user\'s info', async () => {
    const username = 'user1';
    const requestingUser = new User('user2', 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 2', '1990-02-02');

    // Reset all mocks before this test
    jest.resetAllMocks();

    const userController = new UserController();

    await expect(userController.getUserByUsername(requestingUser, username)).rejects.toThrow(UserNotAdminError);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
});

test('UserController.getUserByUsername should handle errors from the DAO', async () => {
    const username = 'user1';
    const errorMessage = 'Database error';
    const requestingUser = new User('admin', 'Admin', 'User', Role.ADMIN, 'Via Roma 1', '1970-01-01');

    // Reset all mocks before this test
    jest.resetAllMocks();

    // Mock the getUserByUsername method to throw an error
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockRejectedValueOnce(new Error(errorMessage));

    const userController = new UserController();

    await expect(userController.getUserByUsername(requestingUser, username)).rejects.toThrow(errorMessage);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
});

//deleteUser tests

test('UserController.deleteUser should delete a user when called by an admin', async () => {
    const username = 'user1';
    const requestingUser = new User('admin', 'Admin', 'User', Role.ADMIN, 'Via Roma 2', '1970-01-01');
    const mockUserToDelete = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 3', '1980-01-01');

    jest.resetAllMocks();

    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(mockUserToDelete);
    jest.spyOn(UserDAO.prototype, 'deleteUserByUsername').mockResolvedValueOnce();

    const userController = new UserController();
    await userController.deleteUser(requestingUser, username);

    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledWith(username);
});

test('UserController.deleteUser should delete their own account when called by a non-admin', async () => {
    const username = 'user1';
    const requestingUser = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 3', '1980-01-01');

    jest.resetAllMocks();

    const getUserByUsernameMock = jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(requestingUser);
    const deleteUserByUsernameMock = jest.spyOn(UserDAO.prototype, 'deleteUserByUsername').mockResolvedValueOnce();

    const userController = new UserController();
    await userController.deleteUser(requestingUser, username);

    expect(getUserByUsernameMock).toHaveBeenCalledTimes(0);
    expect(deleteUserByUsernameMock).toHaveBeenCalledTimes(1);
    expect(deleteUserByUsernameMock).toHaveBeenCalledWith(username);
});

test('UserController.deleteUser should throw UserNotAdminError when non-admin tries to delete another user', async () => {
    const username = 'user1';
    const requestingUser = new User('user2', 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 2', '1990-02-02');

    jest.resetAllMocks();

    const userController = new UserController();

    await expect(userController.deleteUser(requestingUser, username)).rejects.toThrow(UserNotAdminError);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
    expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledTimes(0);
});

test('UserController.deleteUser should throw UserIsAdminError when admin tries to delete another admin', async () => {
    const username = 'admin2';
    const requestingUser = new User('admin1', 'Admin', 'User1', Role.ADMIN, 'Via Roma 2', '1970-01-01');
    const mockUserToDelete = new User(username, 'Admin', 'User2', Role.ADMIN, 'Via Roma 3', '1980-01-01');

    jest.resetAllMocks();

    const getUserByUsernameMock = jest.spyOn(UserDAO.prototype, 'getUserByUsername');
    getUserByUsernameMock.mockResolvedValueOnce(mockUserToDelete).mockResolvedValueOnce(mockUserToDelete);

    const userController = new UserController();

    await expect(userController.deleteUser(requestingUser, username)).rejects.toThrow(UserIsAdminError);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(2);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledTimes(0);
});

test('UserController.deleteUser should handle errors from the DAO', async () => {
    const username = 'user1';
    const errorMessage = 'Database error';
    const requestingUser = new User('admin', 'Admin', 'User', Role.ADMIN, 'Via Roma 3', '1970-01-01');

    jest.resetAllMocks();

    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockRejectedValueOnce(new Error(errorMessage));

    const userController = new UserController();

    await expect(userController.deleteUser(requestingUser, username)).rejects.toThrow(errorMessage);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledTimes(0);
});

//deleteAll tests

test('UserController.deleteAll should delete all non-admin users', async () => {
    jest.resetAllMocks();

    // Mock the deleteNonAdminUsers method to resolve without any error
    const deleteNonAdminUsersMock = jest.spyOn(UserDAO.prototype, 'deleteNonAdminUsers').mockResolvedValueOnce();

    const userController = new UserController();
    await userController.deleteAll();

    expect(deleteNonAdminUsersMock).toHaveBeenCalledTimes(1);
});

test('UserController.deleteAll should handle errors from the DAO', async () => {
    const errorMessage = 'Database error';

    jest.resetAllMocks();

    // Mock the deleteNonAdminUsers method to reject with an error
    const deleteNonAdminUsersMock = jest.spyOn(UserDAO.prototype, 'deleteNonAdminUsers').mockRejectedValueOnce(new Error(errorMessage));

    const userController = new UserController();

    await expect(userController.deleteAll()).rejects.toThrow(errorMessage);
    expect(deleteNonAdminUsersMock).toHaveBeenCalledTimes(1);
});

//updateUserInfo tests

test('UserController.updateUserInfo should update user information for the same user', async () => {
    const username = 'user1';
    const requestingUser = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
    const updatedUser = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 3', '1980-01-01');
    const name = 'Cristiano';
    const surname = 'Ronaldo';
    const address = 'Via Roma 3';
    const birthdate = '1980-01-01';

    jest.resetAllMocks();

    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(requestingUser);
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockResolvedValueOnce(updatedUser);

    const userController = new UserController();
    const result = await userController.updateUserInfo(requestingUser, name, surname, address, birthdate, username);

    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(name, surname, address, birthdate, username);
    expect(result).toEqual(updatedUser);
});

test('UserController.updateUserInfo should allow admin to update another user\'s information', async () => {
    const username = 'user1';
    const requestingUser = new User('admin', 'Admin', 'User', Role.ADMIN, '789 Elm St', '1970-01-01');
    const userToUpdate = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
    const updatedUser = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 3', '1980-01-01');
    const name = 'Cristiano';
    const surname = 'Ronaldo';
    const address = 'Via Roma 3';
    const birthdate = '1980-01-01';

    jest.resetAllMocks();

    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(userToUpdate);
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockResolvedValueOnce(updatedUser);

    const userController = new UserController();
    const result = await userController.updateUserInfo(requestingUser, name, surname, address, birthdate, username);

    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(name, surname, address, birthdate, username);
    expect(result).toEqual(updatedUser);
});

test('UserController.updateUserInfo should throw UnauthorizedUserError when non-admin tries to update another user\'s information', async () => {
    const username = 'user1';
    const requestingUser = new User('user2', 'Lionel', 'Messi', Role.CUSTOMER, 'Via Roma 1', '1990-02-02');
    const userToUpdate = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
    const name = 'Cristiano';
    const surname = 'Ronaldo';
    const address = 'Via Roma 3';
    const birthdate = '1980-01-01';

    jest.resetAllMocks();

    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(userToUpdate);

    const userController = new UserController();

    await expect(userController.updateUserInfo(requestingUser, name, surname, address, birthdate, username)).rejects.toThrow(UnauthorizedUserError);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(0);
});

test('UserController.updateUserInfo should throw UnauthorizedUserError when an admin tries to update another admin\'s information if they are not the same user', async () => {
    const username = 'admin2';
    const requestingUser = new User('admin1', 'Admin', 'User', Role.ADMIN, 'Via Roma 1', '1970-01-01');
    const userToUpdate = new User(username, 'Cristiano', 'Ronaldo', Role.ADMIN, 'Via Roma 2', '1980-01-01');
    const name = 'Cristiano';
    const surname = 'Ronaldo';
    const address = 'Via Roma 3';
    const birthdate = '1980-01-01';

    jest.resetAllMocks();

    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(userToUpdate);

    const userController = new UserController();

    await expect(userController.updateUserInfo(requestingUser, name, surname, address, birthdate, username)).rejects.toThrow(UnauthorizedUserError);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(0);
});

test('UserController.updateUserInfo should throw an error if birthdate is in the future', async () => {
    const username = 'user1';
    const requestingUser = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
    const name = 'Cristiano';
    const surname = 'Ronaldo';
    const address = 'Via Roma 3';
    const futureBirthdate = moment().add(1, 'day').format('YYYY-MM-DD');

    jest.resetAllMocks();

    const userController = new UserController();

    await expect(userController.updateUserInfo(requestingUser, name, surname, address, futureBirthdate, username)).rejects.toThrow(DateError);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(0);
});

test('UserController.updateUserInfo should handle errors from the DAO', async () => {
    const username = 'user1';
    const requestingUser = new User(username, 'Cristiano', 'Ronaldo', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
    const name = 'Cristiano';
    const surname = 'Ronaldo';
    const address = 'Via Roma 3';
    const birthdate = '1980-01-01';
    const errorMessage = 'Database error';

    jest.resetAllMocks();

    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValueOnce(requestingUser);
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockRejectedValueOnce(new Error(errorMessage));

    const userController = new UserController();

    await expect(userController.updateUserInfo(requestingUser, name, surname, address, birthdate, username)).rejects.toThrow(errorMessage);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(name, surname, address, birthdate, username);
});