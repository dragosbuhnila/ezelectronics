import { describe, test, expect, afterEach, jest} from "@jest/globals"
import request from 'supertest';
import { app } from "../../index"

import Authenticator from "../../src/routers/auth"
import {User, Role} from "../../src/components/user"

import {Product, Category} from "../../src/components/product"
import {ModelAlreadyExistsError, ProductNotFoundError, EmptyProductStockError, LowProductStockError} from "../../src/errors/productError"
import ProductController from "../../src/controllers/productController"

jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/productController");

const baseURL = "/ezelectronics/products";

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

describe("Product.Routes - POST", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Route to register the arrival of a set of products", async () => {
        const mockProduct = new Product(1000, "Test", Category.LAPTOP,"2021-01-01", "Test details", 10);
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
            req.user = testAdmin;
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
        const mockController = jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValue();

        const response = await request(app).post(baseURL).send(mockProduct);
        expect(response.status).toBe(200);
        expect(response.text).toBe("");
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith("Test", Category.LAPTOP, 10, "Test details", 1000, "2021-01-01");
        mockController.mockRestore();
    });

    test("Return a 401 error when user is not logged in", async () => {
        const mockProduct = new Product(1000, "Test", Category.LAPTOP,"2021-01-01", "Test details", 10);
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
        });

        const response = await request(app).post(baseURL).send(mockProduct);
        expect(response.status).toBe(401);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0);
    });

    test("Return a 401 error when user is not an admin or manager", async () => {
        const mockProduct = new Product(1000, "Test", Category.LAPTOP,"2021-01-01", "Test details", 10);
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
            req.user = testCustomer;
            return next();
        });

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
            return res.status(401).json({ error: "User is not an admin or manager", status: 401 }) 
        });

        const response = await request(app).post(baseURL).send(mockProduct);
        expect(response.status).toBe(401);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0);
    });

    test("Return a 409 error when product already exists", async () => {
        const mockProduct = new Product(1000, "Test", Category.LAPTOP,"2021-01-01", "Test details", 10);
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
            req.user = testAdmin;
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
        const mockController = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new ModelAlreadyExistsError());

        const response = await request(app).post(baseURL).send(mockProduct);
        expect(response.status).toBe(409);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith("Test", Category.LAPTOP, 10, "Test details", 1000, "2021-01-01");
        mockController.mockRestore();
    });
    /**In this case is 503 as the error is NOT created */
    test("Return a 400 error when arrival date is after current date", async () => {
        const mockProduct = new Product(1000, "Test", Category.LAPTOP,"2321-01-01", "Test details", 10);
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
            req.user = testAdmin;
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
        const mockController = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new Error("The arrival date must be after the current date"));

        const response = await request(app).post(baseURL).send(mockProduct);
        expect(response.status).toBe(503);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith("Test", Category.LAPTOP, 10, "Test details", 1000, "2321-01-01");
        mockController.mockRestore();
    });
});

describe("Product.Routes - PATCH", () => {
    describe("Route to update the stock of a product /ezelectronics/products/:model", () => {

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("Route to update product stock", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue(10);

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({quantity: 10});
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Test", 10, undefined);
            mockController.mockRestore();
        });

        test("Return a 401 error when user is not logged in", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
            });

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        });

        test("Return a 401 error when user is not an admin or manager", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer;
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({ error: "User is not an admin or manager", status: 401 }) 
            });

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        });

        test("Return a 404 Product Not Found", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new ProductNotFoundError());

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Test", 10, undefined);
            mockController.mockRestore();
        });
        /**In this case is 503 as the error is NOT created */
        test("Return a 400 error when change date is after current date", async () => {
            const mockProduct = {quantity: 10, changeDate: "2321-01-02"};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new Error("The arrival date must be after the arrival date"));

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(503);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Test", 10, "2321-01-02");
            mockController.mockRestore();
        });
        /**In this case is 503 as the error is NOT created */
        test("Return a 400 error when change date is before product's arrival date", async () => {
            const mockProduct = {quantity: 10, changeDate: "1990-01-02"};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new Error("The arrival date must be before the current date"));

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(503);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("Test", 10, "1990-01-02");
            mockController.mockRestore();
        });
    });

    describe("Route to sell a product /ezelectronics/products/:model/sell", () => {
        test("Route for selling a product ", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue();

            const response = await request(app).patch(baseURL + "/Test/sell").send(mockProduct);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, undefined);
            mockController.mockRestore();
        });

        test("Return a 401 error when user is not logged in", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
            });

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        });

        test("Return a 401 error when user is not an admin or manager", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer;
                return next();
            });
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({ error: "User is not an admin or manager", status: 401 }) 
            });

            const response = await request(app).patch(baseURL + "/Test").send(mockProduct);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        });

        test("Return a 404 Product Not Found", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new ProductNotFoundError());

            const response = await request(app).patch(baseURL + "/Test/sell").send(mockProduct);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, undefined);
            mockController.mockRestore();
        });
        /**In this case is 503 as the error is NOT created */
        test("Return a 400 error when selling date is after current date", async () => {
            const mockProduct = {quantity: 10, sellingDate: "2321-01-02"};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new Error("The selling date must be before the current date"));

            const response = await request(app).patch(baseURL + "/Test/sell").send(mockProduct);
            expect(response.status).toBe(503);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, "2321-01-02");
            mockController.mockRestore();
        });
        /**In this case is 503 as the error is NOT created */
        test("Return a 400 error when selling date is before product's arrival date", async () => {
            const mockProduct = {quantity: 10, sellingDate: "1990-01-02"};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new Error("The selling date must be after the arrival date"));

            const response = await request(app).patch(baseURL + "/Test/sell").send(mockProduct);
            expect(response.status).toBe(503);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, "1990-01-02");
            mockController.mockRestore();
        });

        test("Return a 409 error when product is out of stock", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new EmptyProductStockError());

            const response = await request(app).patch(baseURL + "/Test/sell").send(mockProduct);
            expect(response.status).toBe(409);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, undefined);
            mockController.mockRestore();
        });

        test("Return a 409 error when available quantity is lower than requested", async () => {
            const mockProduct = {quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new LowProductStockError());

            const response = await request(app).patch(baseURL + "/Test/sell").send(mockProduct);
            expect(response.status).toBe(409);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, undefined);
            mockController.mockRestore();
        });
    });
});

describe("Produc.Routes - GET", () => {
    describe("Route to get all products /ezelectronics/products", () => {

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("Route to get all products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
    
            const response = await request(app).get(baseURL);
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined);
            mockController.mockRestore();
        });

        test("Route to get all Laptop products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
    
            const response = await request(app).get(baseURL+"?grouping=category&category=Laptop");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("category", Category.LAPTOP, undefined);
            mockController.mockRestore();
        });

        test("Route to get Test products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
    
            const response = await request(app).get(baseURL+"?grouping=model&model=Test");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", undefined, "Test");
            mockController.mockRestore();
        });

        test("Return a 401 error when user is not logged in", async () => {
            const mockProduct = {model: "Test", quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
            });

            const response = await request(app).get(baseURL);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
        });

        test("Return a 401 error when user is not an admin or manager", async () => {
            const mockProduct = {model: "Test", quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer;
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({ error: "User is not an admin or manager", status: 401 }) 
            });

            const response = await request(app).get(baseURL);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
        });
        /**In this case is 503 as the error is NOT created */
        test("Return a 422 error when grouping is null but category or model is not", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error("If grouping is not present, then model and category must also be absent"));

            const response_1 = await request(app).get(baseURL+"?category=Laptop");
            expect(response_1.status).toBe(503);

            const response_2 = await request(app).get(baseURL+"?model=Test");
            expect(response_2.status).toBe(503);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(2);
            expect(ProductController.prototype.getProducts).toHaveBeenNthCalledWith(1, undefined, "Laptop", undefined);
            expect(ProductController.prototype.getProducts).toHaveBeenNthCalledWith(2, undefined, undefined, "Test");
            mockController.mockRestore();
        });
        
        test("Return a 422 error when grouping is category, category is null or model is not null", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });

            const response_1 = await request(app).get(baseURL+"?grouping=category&model=Test");
            expect(response_1.status).toBe(422);
            const response_2 = await request(app).get(baseURL+"?grouping=category");
            expect(response_2.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
        });
        
        test("Return a 422 error when grouping is model, category is not null or model is null", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });

            const response_1 = await request(app).get(baseURL+"?grouping=model&category=Laptop");
            expect(response_1.status).toBe(422);
            const response_2 = await request(app).get(baseURL+"?grouping=model");
            expect(response_2.status).toBe(422);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
        });

        test("Return a 404 error when no products were found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new ProductNotFoundError());

            const response = await request(app).get(baseURL+"?grouping=model&model=Test");
            expect(response.status).toBe(404);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", undefined, "Test");
            mockController.mockRestore();
        });
    });

    describe("Route to get all available products /ezelectronics/products/available", () => {
            
        afterEach(() => {
            jest.clearAllMocks();
        });

        test("Route to get all available products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            const mockController = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
    
            const response = await request(app).get(baseURL+"/available");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(undefined, undefined, undefined);
            mockController.mockRestore();
        });

        test("Route to get all available Laptop products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            const mockController = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
    
            const response = await request(app).get(baseURL+"/available?grouping=category&category=Laptop");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("category", Category.LAPTOP, undefined);
            mockController.mockRestore();
        });

        test("Route to get available Test products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            const mockController = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
    
            const response = await request(app).get(baseURL+"/available?grouping=model&model=Test");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("model", undefined, "Test");
            mockController.mockRestore();
        });

        test("Return a 401 error when user is not logged in", async () => {
            const mockProduct = {model: "Test", quantity: 10};
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
            });

            const response = await request(app).get(baseURL+"/available");
            expect(response.status).toBe(401);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
        });

        /**In this case is 503 as the error is NOT created */
        test("Return a 422 error when grouping is null but category or model is not", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new Error("If grouping is not present, then model and category must also be absent"));

            const response_1 = await request(app).get(baseURL+"/available?category=Laptop");
            expect(response_1.status).toBe(503);

            const response_2 = await request(app).get(baseURL+"/available?model=Test");
            expect(response_2.status).toBe(503);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(2);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenNthCalledWith(1, undefined, "Laptop", undefined);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenNthCalledWith(2,undefined, undefined, "Test");
            mockController.mockRestore();
        });
        
        test("Return a 422 error when grouping is category, category is null or model is not null", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });

            const response_1 = await request(app).get(baseURL+"/available?grouping=category&model=Test");
            expect(response_1.status).toBe(422);
            const response_2 = await request(app).get(baseURL+"/available?grouping=category");
            expect(response_2.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
        });
        
        test("Return a 422 error when grouping is model, category is not null or model is null", async () => {
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });

            const response_1 = await request(app).get(baseURL+"/available?grouping=model&category=Laptop");
            expect(response_1.status).toBe(422);
            const response_2 = await request(app).get(baseURL+"/available?grouping=model");
            expect(response_2.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
        });

        test("Return a 404 error when no products were found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new ProductNotFoundError());

            const response = await request(app).get(baseURL+"/available?grouping=model&model=Test");
            expect(response.status).toBe(404);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("model", undefined, "Test");
            mockController.mockRestore();
        });
    });
});

describe("Product.Routes - DELETE", () => {
    describe("Route to delete a product /ezelectronics/products/:model", () => {

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("Route to delete an specific product", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValue(true);
    
            const response = await request(app).delete(baseURL+"/Test");
            expect(response.status).toBe(200);
            expect(response.text).toBe("");
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("Test");
            mockController.mockRestore();
        });

        test("Return a 401 error when user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
            });

            const response = await request(app).delete(baseURL+"/Test");
            expect(response.status).toBe(401);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(0);
        });

        test("Return a 401 error when user is not an admin or manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer;
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({ error: "User is not an admin or manager", status: 401 }) 
            });

            const response = await request(app).delete(baseURL+"/Test");
            expect(response.status).toBe(401);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(0);
        });

        test("Return a 404 Product Not Found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testAdmin;
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            const mockController = jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValue(new ProductNotFoundError());

            const response = await request(app).delete(baseURL+"/Test");
            expect(response.status).toBe(404);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("Test");
            mockController.mockRestore();
        });
    });

    describe("Route to delete all products /ezelectronics/products", () => {
            
            afterEach(() => {
                jest.clearAllMocks();
            });
    
            test("When the user is an admin", async () => {
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                    req.user = testAdmin;
                    return next();
                });
                jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
                const mockController = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValue(true);
        
                const response = await request(app).delete(baseURL);
                expect(response.status).toBe(200);
                expect(response.text).toBe("");
                expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
                mockController.mockRestore();
            });

            test("Return a 401 error when user is not logged in", async () => {
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return res.status(401).json({ error: "Unauthenticated user", status: 401 }) 
                });
    
                const response = await request(app).delete(baseURL);
                expect(response.status).toBe(401);
                expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(0);
            });

            test("Return a 401 error when user is not an admin or manager", async () => {
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                    req.user = testCustomer;
                    return next();
                });
    
                jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                    return res.status(401).json({ error: "User is not an admin or manager", status: 401 }) 
                });
    
                const response = await request(app).delete(baseURL);
                expect(response.status).toBe(401);
                expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(0);
            });
        });
});