import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../index";
import db from "../src/db/db";
import { cleanup } from "../src/db/cleanup";
import { User, Role } from "../src/components/user";
import crypto from "crypto";
import { Cart, ProductInCart } from "../src/components/cart";
import { Category, Product } from "../src/components/product";
import { afterEach, beforeEach } from "node:test";
import { ProductNotFoundError } from "../src/errors/productError";

const baseURL = "/ezelectronics";
const cartbaseURL = baseURL + "/carts";
const userbaseURL = baseURL + "/users";

describe("Cart Route User-access integration tests", () => {
    let cookies: string[];

    beforeAll(async () => {
        // USERS is used for sign-up and log-in. PRODUCTS is interacted with in some use cases. CARTS is obvious
        db.run("DELETE FROM users")
        db.run("DELETE FROM carts");
        db.run("DELETE FROM products");

        // Sign-up Manager
        const newManagerUser = new User("giuliano2", "Paolo", "Brosio", Role.MANAGER, "Via Roma 1", "12-12-2000");
        const managerpassword = "giuliano2";
        await request(app)
            .post(baseURL + "/users")
            .send({
                username: newManagerUser.username,
                name: newManagerUser.name,
                surname: newManagerUser.surname,
                password: managerpassword,
                role: newManagerUser.role
            });

        // Sign-up Customer
        const newUser = new User("giuliano", "Paolo", "Brosio", Role.CUSTOMER, "Via Roma 1", "12-12-2000");
        const password = "giuliano";
        await request(app)
            .post(baseURL + "/users")
            .send({
                username: newUser.username,
                name: newUser.name,
                surname: newUser.surname,
                password: password,
                role: newUser.role
            });

        // Log-in
        const responseLogin = await request(app).post('/ezelectronics/sessions')
            .send({
                username: 'giuliano',
                password: 'giuliano'
            });
        const setCookieHeader = responseLogin.headers['set-cookie'];
        cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    });

    afterAll(async () => {
        db.run("DELETE FROM users")
        db.run("DELETE FROM carts");
        db.run("DELETE FROM products");
    });

    describe(`FR5.1 - GET ${cartbaseURL} - Show the information of the current cart`, () => {
        test("Scenario 10.1 - View information of the current cart (not paid yet)", async () => {
            /* -------- Arrange -------- */
            // Populate carts
            await db.run("DELETE FROM carts")
            const paidCart = new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [paidCart.customer, paidCart.paid, paidCart.paymentDate, paidCart.total, JSON.stringify(paidCart.products)]);
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);


            /* -------- Execute -------- */
            const response = await request(app).get(cartbaseURL).set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.objectContaining({
                ...unpaidCart,
                paymentDate: null}));
        });

        test(`Missing Authentication for GET ${cartbaseURL}`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Customer
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).get(cartbaseURL);

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Customer
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giuliano',
                    password: 'giuliano'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });

        // test(`Wrong Role for GET ${cartbaseURL}`, async () => {
        //     /* -------- Arrange -------- */
        //     // log-out From Customer
        //     await request(app).delete('/ezelectronics/sessions/current')
        //         .set('Cookie', cookies);

        //     // Log-in To Manager
        //     let responseLogin = await request(app).post('/ezelectronics/sessions')
        //     .send({
        //         username: 'giuliano2',
        //         password: 'giuliano2'
        //     });
        //     let setCookieHeader = responseLogin.headers['set-cookie'];
        //     cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

        //     /* -------- Execute -------- */
        //     request(app).get(cartbaseURL).set('Cookie', cookies).then(
        //         response => {
        //             /* -------- Assert -------- */
        //             expect(response.status).toBe(403);
        //         }
        //     );

        //     /* -------- Clean-up -------- */
        //    // Log-in To Customer
        //     responseLogin = await request(app).post('/ezelectronics/sessions')
        //     .send({
        //         username: 'giuliano',
        //         password: 'giuliano'
        //     });
        //     setCookieHeader = responseLogin.headers['set-cookie'];
        //     cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        // });
    });
    
    describe(`FR5.4 - GET ${cartbaseURL}/history - Show the history of the paid carts`, () => {
        test("Scenario 10.2 - View the history of already paid carts", async () => {
            /* -------- Arrange -------- */
            // Populate carts
            await db.run("DELETE FROM carts")
            const paidCart = new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [paidCart.customer, paidCart.paid, paidCart.paymentDate, paidCart.total, JSON.stringify(paidCart.products)]);
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).get(cartbaseURL + "/history").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.arrayContaining([paidCart]));
        });

        test(`Missing Authentication for GET ${cartbaseURL}/history`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Customer
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).get(cartbaseURL + "/history");

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Customer
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giuliano',
                    password: 'giuliano'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });
    });

    describe(`FR5.2 - POST ${cartbaseURL} - Add a product to the current cart`, () => {
        test("Scenario 10.3 - Add a product to the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            // Populate PRODUCTS  
            await db.run("DELETE FROM products")
            const iphone13 = new Product(500, 'iphone13', Category.SMARTPHONE, '12-12-2022', 'A new iPhone', 10);
            await db.run("INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
                [iphone13.model, iphone13.category, iphone13.sellingPrice, iphone13.arrivalDate, iphone13.details, iphone13.quantity]);

            /* -------- Execute -------- */
            const response = await request(app).post(cartbaseURL).set('Cookie', cookies)
                .send({
                    model: 'iphone13',
                });

            if (response.status !== 200) {
                //console.log(response.body); // Log the error details
            }
            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});

            // Check if the product was added to the cart
            const curcart_response = await request(app).get(cartbaseURL).set('Cookie', cookies);
            const products = curcart_response.body.products;
            expect(products).toEqual(expect.arrayContaining([new ProductInCart('iphone13', 3, Category.SMARTPHONE, 500)]));
        });

        test("Scenario 10.4 - Try to add a product that does not exist to the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).post(cartbaseURL).set('Cookie', cookies)
                .send({
                    model: 'iphone12',
                });

            /* -------- Assert -------- */
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Product not found");
        });

        test("Scenario 10.5 - Try to add a product that is not available to the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, []);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            // Populate PRODUCTS
            await db.run("DELETE FROM products")
            const iphone13 = new Product(500, 'iphone13', Category.SMARTPHONE, '12-12-2022', 'A new iPhone', 0);
            await db.run("INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
                [iphone13.model, iphone13.category, iphone13.sellingPrice, iphone13.arrivalDate, iphone13.details, iphone13.quantity]);

            /* -------- Execute -------- */
            const response = await request(app).post(cartbaseURL).set('Cookie', cookies)
                .send({
                    model: 'iphone13',
                });

            /* -------- Assert -------- */
            expect(response.status).toBe(409);
            expect(response.body.error).toEqual("Product stock is empty");
        });

        test(`Missing Authentication for POST ${cartbaseURL}`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Customer
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).post(cartbaseURL)
                .send({
                    model: 'iphone13',
                });

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Customer
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giuliano',
                    password: 'giuliano'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });
    });

    describe(`FR5.3 - PATCH ${cartbaseURL} - Checkout the current cart`, () => {
        test("Scenario 10.6 - Pay for the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            // Populate PRODUCTS   
            await db.run("DELETE FROM products")
            const iphone13 = new Product(500, 'iphone13', Category.SMARTPHONE, '12-12-2022', 'A new iPhone', 10);
            await db.run("INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
                [iphone13.model, iphone13.category, iphone13.sellingPrice, iphone13.arrivalDate, iphone13.details, iphone13.quantity]);

            /* -------- Execute -------- */
            const response = await request(app).patch(cartbaseURL).set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});

            // Check if the cart was paid
            const paidcarts_response = await request(app).get(cartbaseURL + "/history").set('Cookie', cookies);
            const paidCart = paidcarts_response.body[0];
            expect(paidCart.paid).toBe(true);
            expect(paidCart.paymentDate).not.toBe('');
        });

        test("Scenario 10.7 - Try to pay for an empty cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, []);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).patch(cartbaseURL).set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual("Cart is empty");
        });

        test("Scenario 10.8 - Try to pay for a cart that does not exist", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")

            /* -------- Execute -------- */
            const response = await request(app).patch(cartbaseURL).set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Cart not found");
        });

        test(`Missing Authentication for PATCH ${cartbaseURL}`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Customer
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).patch(cartbaseURL);

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Customer
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giuliano',
                    password: 'giuliano'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });
    });

    describe(`FR5.5 - DELETE ${cartbaseURL}/products/:model - Remove a product from the current cart`, () => {
        test("Scenario 10.9 - Remove a product instance from the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/products/iphone13").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});

            // Check if the product was removed from the cart
            const curcart_response = await request(app).get(cartbaseURL).set('Cookie', cookies);
            const products = curcart_response.body.products;
            expect(products).toEqual([]);
        });

        test("Scenario 10.10 - Try to remove a product that does not exist from the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/products/iphone12").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Product not found");
        });

        test("Try to remove a product from an empty cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, []);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/products/iphone13").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(404);
        });

        test("Scenario 10.11 - Try to remove a product from a cart that does not exist", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/products/iphone13").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Cart not found");
        });

        test("Scenario 10.12 - Try to remove a product that is not in the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone12', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/products/iphone13").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Product not in cart");
        });

        test(`Missing Authentication for DELETE ${cartbaseURL}/products/:model`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Customer
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/products/iphone13");

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Customer
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giuliano',
                    password: 'giuliano'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });
    });
    
    describe(`FR5.6 - DELETE ${cartbaseURL}/current - Remove all products from the current cart`, () => {
        test("Scenario 11.1 - Delete the current cart", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/current").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});

            // Check if the cart was cleared
            const curcart_response = await request(app).get(cartbaseURL).set('Cookie', cookies);
            const products = curcart_response.body.products;
            expect(products).toEqual([]);
        });

        test("Scenario 11.2 - Try to delete the current cart when there is none", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/current").set('Cookie', cookies);

            /* -------- Assert -------- */
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Cart not found");
        });

        test(`Missing Authentication for DELETE ${cartbaseURL}/current`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Customer
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL + "/current");

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Customer
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giuliano',
                    password: 'giuliano'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });
    });
});



describe("Cart Route Admin/Manager-access integration tests", () => {
    let cookies: string[];

    beforeAll(async () => {
        // USERS is used for sign-up and log-in. PRODUCTS is interacted with in some use cases. CARTS is obvious
        db.run("DELETE FROM users")
        db.run("DELETE FROM carts");
        db.run("DELETE FROM products");

        // Sign-up
        const newUser = new User("giancarlo", "Mirko", "Scarcella", Role.MANAGER, "Via Roma 1", "12-12-2000");
        const password = "giancarlo";
        await request(app)
            .post(baseURL + "/users")
            .send({
                username: newUser.username,
                name: newUser.name,
                surname: newUser.surname,
                password: password,
                role: newUser.role
            });

        // Log-in
        const responseLogin = await request(app).post('/ezelectronics/sessions')
            .send({
                username: 'giancarlo',
                password: 'giancarlo'
            });
        const setCookieHeader = responseLogin.headers['set-cookie'];
        cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    });

    afterAll(async () => {
        db.run("DELETE FROM users")
        db.run("DELETE FROM carts");
        db.run("DELETE FROM products");
    });

    describe(`FR5.7 - GET ${cartbaseURL}/all - See the list of all carts of all users`, () => {
        test("Scenario 15.1 - View all carts", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);
            const paidCart = new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [paidCart.customer, paidCart.paid, paidCart.paymentDate, paidCart.total, JSON.stringify(paidCart.products)]);
            const unpaidCart2 = new Cart('ornella', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart2.customer, unpaidCart2.paid, unpaidCart2.paymentDate, unpaidCart2.total, JSON.stringify(unpaidCart2.products)]);
            const paidCart2 = new Cart('ornella', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [paidCart2.customer, paidCart2.paid, paidCart2.paymentDate, paidCart2.total, JSON.stringify(paidCart2.products)]);
    
            /* -------- Execute -------- */
            const response = await request(app).get(cartbaseURL + "/all").set('Cookie', cookies);
    
            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.arrayContaining(
                                                                [expect.objectContaining({...unpaidCart, paymentDate: null}),
                                                                 paidCart,
                                                                 expect.objectContaining({...unpaidCart, paymentDate: null}),
                                                                 paidCart2]
                                                                ));
        });

        test(`Missing Authentication for GET ${cartbaseURL}/all`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Manager
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).get(cartbaseURL + "/all");

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Manager
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giancarlo',
                    password: 'giancarlo'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });

        // test(`Wrong Role for GET ${cartbaseURL}/all`, async () => {
        //     /* -------- Arrange -------- */
        //     // Log-out From Manager
        //     await request(app).delete('/ezelectronics/sessions/current')
        //         .set('Cookie', cookies);

        //     // Log-in To Customer
        //     let responseLogin = await request(app).post('/ezelectronics/sessions')
        //     .send({
        //         username: 'giuliano',
        //         password: 'giuliano'
        //     });
        //     let setCookieHeader = responseLogin.headers['set-cookie'];
        //     cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

        //     /* -------- Execute -------- */
        //     request(app).get(cartbaseURL + "/all").set('Cookie', cookies).then(
        //         response => {
        //             /* -------- Assert -------- */
        //             expect(response.status).toBe(401);
        //             expect(response.body.error).toEqual("User is not an admin or manager");
        //         }
        //     );

        //     /* -------- Clean-up -------- */
        //     // Log-in To Manager
        //     responseLogin = await request(app).post('/ezelectronics/sessions')
        //     .send({
        //         username: 'giancarlo',
        //         password: 'giancarlo'
        //     });
        //     setCookieHeader = responseLogin.headers['set-cookie'];
        //     cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        // });
    });

    describe(`FR5.8 - DELETE ${cartbaseURL} - Delete all carts `, () => {
        test("Scenario 16.1 - Delete all carts", async () => {
            /* -------- Arrange -------- */
            // Populate CARTS
            await db.run("DELETE FROM carts")
            const unpaidCart = new Cart('giuliano', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart.customer, unpaidCart.paid, unpaidCart.paymentDate, unpaidCart.total, JSON.stringify(unpaidCart.products)]);
            const paidCart = new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [paidCart.customer, paidCart.paid, paidCart.paymentDate, paidCart.total, JSON.stringify(paidCart.products)]);
            const unpaidCart2 = new Cart('ornella', false, '', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [unpaidCart2.customer, unpaidCart2.paid, unpaidCart2.paymentDate, unpaidCart2.total, JSON.stringify(unpaidCart2.products)]);
            const paidCart2 = new Cart('ornella', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]);
            await db.run("INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, ?, ?, ?, ?)", 
                [paidCart2.customer, paidCart2.paid, paidCart2.paymentDate, paidCart2.total, JSON.stringify(paidCart2.products)]);
    
            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL).set('Cookie', cookies);
    
            /* -------- Assert -------- */
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
    
            // Check if all carts were deleted
            const allcarts_response = await request(app).get(cartbaseURL + "/all").set('Cookie', cookies);
            expect(allcarts_response.body).toEqual([]);
        });

        test(`Missing Authentication for DELETE ${cartbaseURL}`, async () => {
            /* -------- Arrange -------- */
            // Log-out From Manager
            await request(app).delete('/ezelectronics/sessions/current')
                .set('Cookie', cookies);

            /* -------- Execute -------- */
            const response = await request(app).delete(cartbaseURL);

            /* -------- Assert -------- */
            expect(response.status).toBe(401);

            /* -------- Clean-up -------- */
            // Log-in To Manager
            const responseLogin = await request(app).post('/ezelectronics/sessions')
                .send({
                    username: 'giancarlo',
                    password: 'giancarlo'
                });
            const setCookieHeader = responseLogin.headers['set-cookie'];
            cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        });

        // test(`Wrong Role for DELETE ${cartbaseURL}`, async () => {
        //     /* -------- Arrange -------- */
        //     // Log-in To Customer
        //     let responseLogin = await request(app).post('/ezelectronics/sessions')
        //     .send({
        //         username: 'giuliano',
        //         password: 'giuliano'
        //     });
        //     let setCookieHeader = responseLogin.headers['set-cookie'];
        //     let cookiesManager = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

        //     /* -------- Execute -------- */
        //     const response = await request(app).delete(cartbaseURL).set('Cookie', cookiesManager);

        //     /* -------- Assert -------- */
        //     expect(response.status).toBe(401);
        //     expect(response.body.error).toEqual("User is not an admin or manager");


        //     /* -------- Clean-up -------- */
        //     // Log-in To Manager
        //     responseLogin = await request(app).post('/ezelectronics/sessions')
        //     .send({
        //         username: 'giancarlo',
        //         password: 'giancarlo'
        //     });
        //     setCookieHeader = responseLogin.headers['set-cookie'];
        //     cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        // });
    });
});

