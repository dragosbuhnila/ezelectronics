import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import db from "../src/db/db";
import { User, Role } from "../src/components/user";
import crypto from "crypto";
import request from 'supertest';
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";

const baseURL = "/ezelectronics";

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${baseURL}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

describe("Reviews Integration Tests", () => {
    let cookie_customer1: string;
    let cookie_customer2: string;
    let cookie_manager: string;
    let cookie_admin: string;

    beforeAll(async () => {
        // Cleanup database before all tests
        db.run("DELETE FROM reviews");
        db.run("DELETE FROM products");
        db.run("DELETE FROM users");

        // Insert admin user for authentication
        await request(app)
            .post(baseURL + "/users")
            .send({
                username: "Matteo",
                name: "prova",
                surname: "prova",
                password: "prova",
                role: Role.ADMIN
            });
        
        // Insert manager user for authentication
        await request(app)
            .post(baseURL + "/users")
            .send({
                username: "Dragos",
                name: "prova",
                surname: "prova",
                password: "prova",
                role: Role.MANAGER
            });

        // Insert customer user for authentication
        await request(app)
            .post(baseURL + "/users")
            .send({
                username: "Juan",
                name: "prova",
                surname: "prova",
                password: "prova",
                role: Role.CUSTOMER
            });
        
        // Insert second customer user for authentication
        await request(app)
            .post(baseURL + "/users")
            .send({
                username: "Lorenzo",
                name: "prova",
                surname: "prova",
                password: "prova",
                role: Role.CUSTOMER
            });

        cookie_customer1 = await login(
                {
                    username: "Juan",
                    password: "prova"
                }
            );
        cookie_customer2 = await login(
                {
                    username: "Lorenzo",
                    password: "prova"
                }
            );
        cookie_manager = await login(
                {
                    username: "Dragos",
                    password: "prova"
                }
            );
        cookie_admin = await login(
                {
                    username: "Matteo",
                    password: "prova"
                }
            );
        

        // Insert products for testing
        await db.run("INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?);", 
            ["iphone12", "smartphone", 567.3, '2001-09-11', "test_comment", 3]);

        await db.run("INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?);", 
            ["wawei", "smartphone", 567.3, '2001-09-11', "test_comment", 3]);

        await db.run("INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?);", 
            ["alcatel", "smartphone", 567.3, '2001-09-11', "test_comment", 3]);
    });

    afterAll(() => {
        // Cleanup database after all tests
        db.run("DELETE FROM reviews");
        db.run("DELETE FROM products");
        db.run("DELETE FROM users");
    });

    describe("FR4.1 Add a new review to a product, FR4.3 Delete a review given to a product", () => {
            test("Scenario 17.1 Add a review to a product", async () => {
                // Add a review to a product
                const response1 = await request(app).post(baseURL + '/reviews/wawei').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 4,
                            comment: "test_comment"
                        }
                    )
                // Add a second review to a product
                const response2 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 4,
                            comment: "test_comment_iphone12"
                        }
                    )
                // change user to another customer
                // Add a third review to a product
                const response3 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer2)
                    .send(
                        {
                            score: 4,
                            comment: "test_comment_iphone12_lorenzo"
                        }
                    )
                // Get the review
                const response4 = await request(app).get(baseURL + '/reviews/wawei').set('Cookie', cookie_customer2)

                /* -------- Assert -------- */
                expect(response1.status).toBe(200);
                expect(response2.status).toBe(200);
                expect(response3.status).toBe(200);
                expect(response4.body[0].score).toBe(4);
                expect(response4.body[0].comment).toBe("test_comment"); 
            });
            test("Try to review product that does not exist", async () => {
                // Login as a customer
                // Add a review to a product
                const response1 = await request(app).post(baseURL + '/reviews/iphone11').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 4,
                            comment: "test_comment"
                        }
                    );
                /* -------- Assert -------- */
                expect(response1.status).toBe(404);
            });
            test("Try to review product already reviewed", async () => {
                // Login as a customer
                // Add a review to a product
                const response1 = await request(app).post(baseURL + '/reviews/wawei').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 4,
                            comment: "test_comment"
                        }
                    );
                /* -------- Assert -------- */
                expect(response1.status).toBe(409);
            });
            test("Try to review a product as an admin", async () => {
                // Login as an admin
                // Add a review to a product
                const response1 = await request(app).post(baseURL + '/reviews/iphone11').set('Cookie', cookie_admin)
                    .send(
                        {
                            score: 4,
                            comment: "test_comment"
                        }
                    );
                /* -------- Assert -------- */
                expect(response1.status).toBe(401);
            });
            test("Try to review a product as a manager", async () => {
                // Login as a Manager
                // Add a review to a product
                const response1 = await request(app).post(baseURL + '/reviews/iphone11').set('Cookie', cookie_manager)
                    .send(
                        {
                            score: 4,
                            comment: "test_comment"
                        }
                    );
                /* -------- Assert -------- */
                expect(response1.status).toBe(401);
            });
            test("Try to review a product with invalid score", async () => {
                // Login as a customer
                // Add a review to a product
                const response1 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 6,
                            comment: "test_comment"
                        }
                    );
                const response2 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 0,
                            comment: "test_comment"
                        }
                    );
                const response3 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: -1,
                            comment: "test_comment"
                        }
                    );
                const response4 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                    .send(
                        {
                            comment: "test_comment"
                        }
                    );
                /* -------- Assert -------- */
                expect(response1.status).toBe(422);
                expect(response2.status).toBe(422);
                expect(response3.status).toBe(422);
                expect(response4.status).toBe(422);
            });
            test("Try to review a product with null comment", async () => {
                // Login as a customer
                // Add a review to a product
                const response1 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 4
                        }
                    );
                const response2 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                    .send(
                        {
                            score: 4,
                            comment: ""
                        }
                    );
                /* -------- Assert -------- */
                expect(response1.status).toBe(422);
                expect(response2.status).toBe(422);
                            
            });
            test("Scenario 17.2 Delete review given to a product", async () => {
                // Login as a customer
                // Delete the review
                const response1 = await request(app).delete(baseURL + '/reviews/wawei').set('Cookie', cookie_customer1)
                
                /* -------- Assert -------- */
                expect(response1.status).toBe(200);
            });
            test("Try to delete the review of another user as an admin", async () => {
                // Login as an admin
                // Delete the review
                const response1 = await request(app).delete(baseURL + '/reviews/wawei').set('Cookie', cookie_admin)
                
                /* -------- Assert -------- */
                expect(response1.status).toBe(401);
            });
            test("Try to delete the review of another user as a manager", async () => {
                // Login as an manager
                // Delete the review
                const response1 = await request(app).delete(baseURL + '/reviews/wawei').set('Cookie', cookie_manager)
                
                /* -------- Assert -------- */
                expect(response1.status).toBe(401);
            });
            test("Try to delete the review of a model that does not exist", async () => {
                // Login as a customer
                // Delete the review
                const response1 = await request(app).delete(baseURL + '/reviews/iphone11').set('Cookie', cookie_customer1)
                
                /* -------- Assert -------- */
                expect(response1.status).toBe(404);
            });
            test("Try to delete the review of a product that has not been reviewed", async () => {
                // Login as a customer
                // Delete the review
                const response1 = await request(app).delete(baseURL + '/reviews/alcatel').set('Cookie', cookie_customer1)
                
                /* -------- Assert -------- */
                expect(response1.status).toBe(404);
            });
    });
    describe("FR4.2 Get the list of all reviews assigned to a product", () => {
        test("Scenario 18.1 View the reviews of a product", async () => {
            // login as a customer
            // Get the review
            const response1 = await request(app).get(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
            /* -------- Assert -------- */
            expect(response1.status).toBe(200);
            expect(response1.body[0].score).toBe(4);
            expect(response1.body[0].comment).toBe("test_comment_iphone12");
            expect(response1.body[1].score).toBe(4);
            expect(response1.body[1].comment).toBe("test_comment_iphone12_lorenzo");

            // login as an admin
            // Get the review
            const response2 = await request(app).get(baseURL + '/reviews/iphone12').set('Cookie', cookie_admin)
            /* -------- Assert -------- */
            expect(response2.status).toBe(200);
            expect(response2.body[0].score).toBe(4);
            expect(response2.body[0].comment).toBe("test_comment_iphone12");
            expect(response2.body[1].score).toBe(4);
            expect(response2.body[1].comment).toBe("test_comment_iphone12_lorenzo");

            // login as a manager
            // Get the review
            const response3 = await request(app).get(baseURL + '/reviews/iphone12').set('Cookie', cookie_manager)
            /* -------- Assert -------- */
            expect(response3.status).toBe(200);
            expect(response3.body[0].score).toBe(4);
            expect(response3.body[0].comment).toBe("test_comment_iphone12");
            expect(response3.body[1].score).toBe(4);
            expect(response3.body[1].comment).toBe("test_comment_iphone12_lorenzo");
        });
        test("Try to view the reviews of a product that does not exist", async () => {
            // login as a customer
            // Get the review
            const response1 = await request(app).get(baseURL + '/reviews/iphone11').set('Cookie', cookie_customer1)
            /* -------- Assert -------- */
            expect(response1.status).toBe(404);
        });
    });


    // FR4.4 Delete all reviews of a product
    // Scenario 19.1 Delete all reviews of one product
    describe("FR4.4 Delete all reviews of a product", () => {
        test("Scenario 19.1 Delete all reviews of one product", async () => {
            // Login as an admin
            // Delete all reviews of a product
            const response1 = await request(app).delete(baseURL + '/reviews/iphone12/all').set('Cookie', cookie_admin);

            // create new reviews for the test
            // login as a customer
            // Add a review to a product
            const response2 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                .send(
                    {
                        score: 4,
                        comment: "test_comment"
                    }
                )
            // login as another customer
            // Add a review to a product
            const response3 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer2)
                .send(
                    {
                        score: 4,
                        comment: "test_comment_iphone12_lorenzo"
                    }
                )
            
            // login as a manager
            // Delete all reviews of a product
            const response4 = await request(app).delete(baseURL + '/reviews/iphone12/all').set('Cookie', cookie_manager);

            /* -------- Assert -------- */
            expect(response1.status).toBe(200);
            expect(response4.status).toBe(200);
        });
        test("Try to delete all reviews of one product as a customer", async () => {
            // Login as a customer
            // create new reviews for the test
            // Add a review to a product
            const response1 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                .send(
                    {
                        score: 4,
                        comment: "test_comment"
                    }
                )
            // login as another customer
            // Add a review to a product
            const response2 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer2)
                .send(
                    {
                        score: 4,
                        comment: "test_comment_iphone12_lorenzo"
                    }
                )
            
            // Delete all reviews of a product
            const response3 = await request(app).delete(baseURL + '/reviews/iphone12/all').set('Cookie', cookie_customer2);

            /* -------- Assert -------- */
            expect(response3.status).toBe(401);
        });
        test("Try to delete all reviews of a product that does not exist", async () => {
            // Login as an admin
            // Delete all reviews of a product
            const response1 = await request(app).delete(baseURL + '/reviews/iphone11/all').set('Cookie', cookie_admin);

            /* -------- Assert -------- */
            expect(response1.status).toBe(404);
        });
    });

    // FR4.5 Delete all reviews of all products
    // Scenario 19.2 Delete all reviews of all products
    describe("FR4.5 Delete all reviews of all products", () => {
        test("Scenario 19.2 Delete all reviews of all products", async () => {
            // create new reviews for the test
            // Login as a customer
            // Add a review to a product
            const response1 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                .send(
                    {
                        score: 4,
                        comment: "test_comment"
                    }
                )
            // Add a review to another product
            const response2 = await request(app).post(baseURL + '/reviews/wawei').set('Cookie', cookie_customer1)
                .send(
                    {
                        score: 4,
                        comment: "test_comment"
                    }
                )
            // login as another customer
            // Add a review to a product
            const response3 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer2)
                .send(
                    {
                        score: 4,
                        comment: "test_comment_iphone12_lorenzo"
                    }
                )
            // Add a review to another product
            const response4 = await request(app).post(baseURL + '/reviews/wawei').set('Cookie', cookie_customer2)
                .send(
                    {
                        score: 4,
                        comment: "test_comment_wawei_lorenzo"
                    }
                )

            // login as an admin
            // Delete all reviews of all products
            const response5 = await request(app).delete(baseURL + '/reviews/').set('Cookie', cookie_admin);

            // create new reviews for the test
            // Login as a customer
            // Add a review to a product
            const response6 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer1)
                .send(
                    {
                        score: 4,
                        comment: "test_comment"
                    }
                )
            // Add a review to another product
            const response7 = await request(app).post(baseURL + '/reviews/wawei').set('Cookie', cookie_customer1)
                .send(
                    {
                        score: 4,
                        comment: "test_comment"
                    }
                )
            // login as another customer
            // Add a review to a product
            const response8 = await request(app).post(baseURL + '/reviews/iphone12').set('Cookie', cookie_customer2)
                .send(
                    {
                        score: 4,
                        comment: "test_comment_iphone12_lorenzo"
                    }
                )
            // Add a review to another product
            const response9 = await request(app).post(baseURL + '/reviews/wawei').set('Cookie', cookie_customer2)
                .send(
                    {
                        score: 4,
                        comment: "test_comment_wawei_lorenzo"
                    }
                )
            // login as a manager
            // Delete all reviews of all products
            const response10 = await request(app).delete(baseURL + '/reviews/').set('Cookie', cookie_manager);
            /* -------- Assert -------- */
            expect(response5.status).toBe(200);
            expect(response10.status).toBe(200);
        });
        test("Try to delete all reviews of all products as a customer", async () => {
            // Login as a customer
            // Delete all reviews of all products
            const response1 = await request(app).delete(baseURL + '/reviews/').set('Cookie', cookie_customer1);

            /* -------- Assert -------- */
            expect(response1.status).toBe(401);
        });
    });
});