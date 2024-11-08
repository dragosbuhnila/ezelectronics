import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../index";

import db from "../src/db/db";
import { User, Role } from "../src/components/user";
import { Product, Category } from "../src/components/product";

const baseURL = "/ezelectronics/products";

describe("Product Integration Tests", () => {
    let Admincookies: string[];
    let Customercookies: string[];

    beforeAll(async () => {
        /**Reset test database */
        await db.run("DELETE FROM users");
        await db.run("DELETE FROM products");

        /**Sing-up admin user*/
        const adminUser = new User("test_admin", "Juan", "Corredor", Role.ADMIN, "Via Roma 1", "12-12-2000");
        const adminPswd = "test_password";
        await request(app)
            .post("/ezelectronics/users")
            .send({
                username: adminUser.username,
                name: adminUser.name,
                surname: adminUser.surname,
                password: adminPswd,
                role: adminUser.role
            });

        /**Sing-up customer user*/
        const CustomerUser = new User("test_customer", "Sofia", "Garcia", Role.ADMIN, "Via Roma 1", "12-12-2002");
        const CustomerPswd = "test_password";
        await request(app)
            .post("/ezelectronics/users")
            .send({
                username: CustomerUser.username,
                name: CustomerUser.name,
                surname: CustomerUser.surname,
                password: CustomerPswd,
                role: CustomerUser.role
            });
        
        /**Login admin user */
        const AdminresponseLogin = await request(app)
            .post("/ezelectronics/sessions")
            .send({
                username: adminUser.username,
                password: adminPswd
            });
        
        const AdminsetCookieHeader = AdminresponseLogin.headers["set-cookie"];
        Admincookies = Array.isArray(AdminsetCookieHeader) ? AdminsetCookieHeader : [AdminsetCookieHeader];

        /**Login customer user */
        const CustomerresponseLogin = await request(app)
            .post("/ezelectronics/sessions")
            .send({
                username: CustomerUser.username,
                password: CustomerPswd
            });
        
        const CustomersetCookieHeader = CustomerresponseLogin.headers["set-cookie"];
        Customercookies = Array.isArray(CustomersetCookieHeader) ? CustomersetCookieHeader : [CustomersetCookieHeader];
    });

    afterAll(async () => {
        /**Reset test database */
        //await db.run("DELETE FROM products");
        await db.run("DELETE FROM users");
    });

    describe("FR3.1 - Register a set of new products", () => {
        test("Scenario 6.1 - Register a new product", async () => {
            /**Prepare */
            const Testproduct = new Product(1000, "Test_phone", Category.SMARTPHONE, "2024-01-01", "Test_details", 10);

            /**Act */
            const response = await request(app).post(baseURL).send(Testproduct).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.text).toBe("");
        });

        test("Scenario 6.2 - Try to register a product that already exists", async () => {
            /**Prepare */
            const Testproduct = new Product(1000, "Test_phone", Category.SMARTPHONE, "2024-01-01", "Test_details", 10);
            
            /**Act */
            const response = await request(app).post(baseURL).send(Testproduct).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(409);
        });

        test("Scenario 6.3 - Try to register a product with invalid input parameters", async () => {
            /**Prepare */
            const Testproduct = new Product(1001, "", Category.SMARTPHONE, "2024-01-01", "Test_details", 10);

            /**Act */
            const response = await request(app).post(baseURL).send(Testproduct).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(422);
        });
    });

    describe("FR3.2 - Update the quantity of a product", () => {
        test("Scenario 6.4 - Update the quantity of a product", async () => {
            /**Prepare */
            const TestBody = {quantity: 10, changeDate: "2024-01-01"};

            /**Act */
            const response = await request(app).patch(baseURL + "/Test_phone").send(TestBody).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual({quantity: 20});
        });

        test("Scenario 6.5 - Try to increase the quantity of a product that does not exist", async () => {
            /**Prepare */
            const TestBody = {quantity: 10};
        
            /**Act */
            const response = await request(app).patch(baseURL + "/test").send(TestBody).set('Cookie', Admincookies);
        
            /**Assert */
            expect(response.status).toBe(404);
        });
    });

    describe("FR3.3 - Sell a product", () => {
        test("Scenario 7.1 - Sell a product after an in-store purchase", async () => {
            /**Prepare */
            const TestBody = {quantity: 5, sellingDate: "2024-01-01"};

            /**Act */
            const response = await request(app).patch(baseURL + "/Test_phone/sell").send(TestBody).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
        });

        test("Scenario 7.2 - Try to sell a product that does not exist", async () => {
            /**Prepare */
            const TestBody = {quantity: 5};

            /**Act */
            const response = await request(app).patch(baseURL + "/test/sell").send(TestBody).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(404);
        });

        test("Scenario 7.3 - Try to sell an unavailable product", async () => {
            /**Prepare */
            const TestBody = {quantity: -5};
            db.run("UPDATE products SET quantity = 0 WHERE model = 'Test_phone'");

            /**Act */
            const response = await request(app).patch(baseURL + "/Test_phone/sell").send(TestBody).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(422);
        });
    });
    describe("FR3.4 - Show the list of all products", () => {
        test("Scenario 8.1 - View information of a single product", async () => {
            /**Prepare */
            db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES ('Test_laptop', 'Laptop', 1000, '2024-01-01', 'Test_details', 15)");
            db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES ('Test_laptop_B', 'Laptop', 1200, '2024-01-01', 'Test_details', 0)");

            /**Act */
            const response = await request(app).get(baseURL+"?grouping=model&model=Test_phone").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{model: "Test_phone", category: "Smartphone", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 0}]);
        });

        test("Scenario 8.3 - View information of all products", async () => {
            /**Act */
            const response = await request(app).get(baseURL).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual([
                {model: "Test_phone", category: "Smartphone", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 0},
                {model: "Test_laptop", category: "Laptop", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 15},
                {model: "Test_laptop_B", category: "Laptop", sellingPrice: 1200, arrivalDate: "2024-01-01", details: "Test_details", quantity: 0}]);
        });
    });

    describe("FR3.4.1 - Show the list of available products", () => {
        test("Scenario 8.7 - View information of all available products", async () => {
            /**Act */
            const response = await request(app).get(baseURL+"/available").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{model: "Test_laptop", category: "Laptop", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 15}]);
        });
    });

    describe("FR3.5 - Show the list of all products with the same category", () => {
        test("Scenario 8.4 - View information of all products of the same category", async () => {
            /**Act */
            const response = await request(app).get(baseURL+"?grouping=category&category=Laptop").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual([
                {model: "Test_laptop", category: "Laptop", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 15},
                {model: "Test_laptop_B", category: "Laptop", sellingPrice: 1200, arrivalDate: "2024-01-01", details: "Test_details", quantity: 0}]);
        });
    });

    describe("FR3.5.1 - Show the list of all available products with the same category", () => {
        test("Scenario 8.8 - View information of all available products of the same category", async () => {
            /**Act */
            const response = await request(app).get(baseURL+"/available?grouping=category&category=Laptop").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{model: "Test_laptop", category: "Laptop", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 15}]);
        });

        test("Scenario 8.5 - Try to view information of all products of a category that does not exist", async () => {
            /**Act */
            const response = await request(app).get(baseURL+"?grouping=category&category=Test").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(422);
        });
    });

    describe("FR3.5 - Show the list of all products with the same model", () => {
        test("Scenario 8.2 - Try to view information of a product that does not exist", async () => {
            /**Act */
            const response = await request(app).get(baseURL+"?grouping=model&model=Test").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(404);
        });
        
        test("Scenario 8.6 - View information of all products with the same model", async () => {
            /**Act */
            const response = await request(app).get(baseURL+"?grouping=model&model=Test_laptop").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{model: "Test_laptop", category: "Laptop", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 15}]);
        });
    });

    describe("FR3.5.1 - Show the list of all available products with the same model", () => {
        test("Scenario 8.9 - View information of all available products with the same model", async () => {
            /**Act */
            const response = await request(app).get(baseURL+"/available?grouping=model&model=Test_laptop").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{model: "Test_laptop", category: "Laptop", sellingPrice: 1000, arrivalDate: "2024-01-01", details: "Test_details", quantity: 15}]);
        });
    });

    describe("FR3.7 - Delete a product", () => {
        test("Scenario 9.1 - Delete one product", async () => {
            /**Act */
            const response = await request(app).delete(baseURL+"/Test_phone").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.text).toBe("");
        });

        test("Scenario 9.2 - Try to delete a product that does not exist", async () => {
            /**Act */
            const response = await request(app).delete(baseURL+"/other").set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(404);
        });
    });

    describe("FR3.8 - Delete all products", () => {
        test("Scenario 14.1 - Delete all products", async () => {
            /**Act */
            const response = await request(app).delete(baseURL).set('Cookie', Admincookies);

            /**Assert */
            expect(response.status).toBe(200);
            expect(response.text).toBe("");
        });
    });
});