import { test, expect, jest, describe } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import CartController from "../../src/controllers/cartController"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Category } from "../../src/components/product"
import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
const baseURL = "/ezelectronics/carts"
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError"
import { CartNotFoundError, EmptyCartError, ProductInCartError, ProductNotInCartError } from "../../src/errors/cartError"

/* =================== GET /ezelectronics/carts tests =================== */
describe(`Cart Routes - GET ${baseURL}`, () => {
    describe(`GET ${baseURL} Success`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            const mockCart = new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)])

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(mockCart);
            
            /* Assert */
            return request(app).get(baseURL).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.getCart).toHaveBeenCalledWith(mockUser);
                    expect(response.body).toEqual(mockCart);
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL} Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                return res.status(401).send('Unauthenticated User');
            });
            
            /* Assert */
            return request(app).get(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL} Defined Error 2 - Not Customer but Admin`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).get(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL} Defined Error 3 - Not Customer but Manager`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).get(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL} Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "getCart").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).get(baseURL).send()
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});

/* =================== POST /ezelectronics/carts tests =================== */
describe(`Cart Routes - POST ${baseURL}`, () => {
    describe(`POST ${baseURL} Success`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            const mockCart = new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)])

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValue(true);
            
            /* Assert */
            return request(app).post(baseURL).send({ model: 'iphone13' })
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.addToCart).toHaveBeenCalledWith(mockUser, 'iphone13');
                    expect(response.body).toEqual({});
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`POST ${baseURL} Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return res.status(401).send('Unauthenticated User'); });
            
            /* Assert */
            return request(app).post(baseURL).send({ model: 'iphone13' })
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`POST ${baseURL} Defined Error 2.1 - Not Customer but Admin`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).post(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`POST ${baseURL} Defined Error 2.2 - Not Customer but Manager`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).post(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });


    describe(`POST ${baseURL} Defined Error 3 - Model param zero-length`, () => {
        test("It should return a 422 Body or Paramt Format Error", async () => {
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            
            /* Assert */
            return request(app).post(baseURL).send({ model: '' })
                .expect(422)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`POST ${baseURL} Defined Error 4 - Model param not string`, () => {
        test("It should return a 422 Body or Paramt Format Error", async () => {
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            
            /* Assert */
            return request(app).post(baseURL).send({ model: 123 })
                .expect(422)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`POST ${baseURL} Defined Error 5 - ProductNotFound`, () => {
        test("It should return a 404 ProductNotFoundError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValue(new ProductNotFoundError());
            
            /* Assert */
            return request(app).post(baseURL).send({ model: 'iphone13' })
                .expect(404)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`POST ${baseURL} Defined Error 6 - EmptyProductStock`, () => {
        test("It should return a 409 EmptyProductStockError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValue(new EmptyProductStockError());
            
            /* Assert */
            return request(app).post(baseURL).send({ model: 'iphone13' })
                .expect(409)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`POST ${baseURL} Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).post(baseURL).send({ model: 'iphone13' })
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});

/* =================== PATCH /ezelectronics/carts tests =================== */
describe(`Cart Routes - PATCH ${baseURL}`, () => {
    describe(`PATCH ${baseURL} Success`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            const mockCart = new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)])

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(mockUser);
                    expect(response.body).toEqual({});
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return res.status(401).send('Unauthenticated User'); });
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Defined Error 2 - Not Customer but Admin`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Defined Error 2.5 - Not Customer but Manager`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Defined Error 3 - NoUnpaidCart`, () => {
        test("It should return a 404 CartNotFoundError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new CartNotFoundError());
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(404)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Defined Error 4 - EmptyCart`, () => {
        test("It should return a 400 EmptyCartError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new EmptyCartError());
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(400)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Defined Error 5 - EmptyProductStockError`, () => {
        test("It should return a 409 EmptyProductStockError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new EmptyProductStockError());
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(409)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Defined Error 6 - LowProductStockError`, () => {
        test("It should return a 409 LowProductStockError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new LowProductStockError());
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(409)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`PATCH ${baseURL} Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).patch(baseURL).send()
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});

/* =================== GET /ezelectronics/carts/history tests =================== */
describe(`Cart Routes - GET ${baseURL}/history`, () => {
    describe(`GET ${baseURL}/history Success`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            const mockProductInCar1tList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart1 = new Cart('giuliano', true, '13-12-2022', 1000, mockProductInCar1tList);
            const mockProductInCart2List = [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]
            const mockCart2 = new Cart('giuliano', false, '', 0, mockProductInCart2List);
            const mockCarts = [mockCart1, mockCart2]

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue(mockCarts);
            
            /* Assert */
            return request(app).get(`${baseURL}/history`).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(mockUser);
                    expect(response.body).toEqual(mockCarts);
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL}/history Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                return res.status(401).send('Unauthenticated User');
            });
            
            /* Assert */
            return request(app).get(`${baseURL}/history`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL}/history Defined Error 2.1 - Not Customer but Admin`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).get(`${baseURL}/history`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL}/history Defined Error 2.2 - Not Customer but Manager`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).get(`${baseURL}/history`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL}/history Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).get(`${baseURL}/history`).send()
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});

/* =================== DELETE /ezelectronics/carts/products/:model tests =================== */
describe(`Cart Routes - DELETE ${baseURL}/products/:model`, () => {
    describe(`DELETE ${baseURL}/products/:model Success`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(mockUser, 'iphone13');
                    expect(response.body).toEqual({});
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/products/:model Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                return res.status(401).send('Unauthenticated User');
            });
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    }); 

    describe(`DELETE ${baseURL}/products/:model Defined Error 2.1 - Not Customer but Admin`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/products/:model Defined Error 2.2 - Not Customer but Manager`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    // The tests for checking the parameters not being strings or being emtpy strings can't be performed because
    // 1) Leaving an empty string in the request body will result in a 404 error, as the API will look for the 
    //            carts/products page instead of carts/products/:model, with the 404 referring to the page not being found,
    //            since the 'carts/products' route doesn't exist.
    // 2) The API will automatically convert the parameter to a string, so it's impossible to send a non-string parameter.


    describe(`DELETE ${baseURL}/products/:model Defined Error 5 - ProductNotInCart`, () => {
        test("It should return a 404 ProductNotInCartError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValue(new ProductNotInCartError());
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(404)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/products/:model Defined Error 6 - No Unpaid Cart`, () => {
        test("It should return a 404 CartNotFoundError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValue(new CartNotFoundError());
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(404)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/products/:model Defined Error 7 - EmptyCartError`, () => {
        test("It should return a 400 EmptyCartError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValue(new EmptyCartError());
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(400)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/products/:model Defined Error 8 - ProductNotFoundError`, () => {
        test("It should return a 404 ProductNotFoundError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValue(new ProductNotFoundError());
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(404)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/products/:model Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).delete(`${baseURL}/products/iphone13`).send()
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});

/* =================== DELETE /ezelectronics/carts/current tests =================== */
describe(`Cart Routes - DELETE ${baseURL}/current`, () => {
    describe(`DELETE ${baseURL}/current Success`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);
            
            /* Assert */
            return request(app).delete(`${baseURL}/current`).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.clearCart).toHaveBeenCalledWith(mockUser);
                    expect(response.body).toEqual({});
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/current Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                return res.status(401).send('Unauthenticated User');
            });
            
            /* Assert */
            return request(app).delete(`${baseURL}/current`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/current Defined Error 2 - Not Customer but Admin`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).delete(`${baseURL}/current`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/current Defined Error 2.5 - Not Customer but Manager`, () => {
        test("It should return a 401 User Is Not A Customer", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).delete(`${baseURL}/current`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/current Defined Error 3 - No Unpaid Cart`, () => {
        test("It should return a 404 CartNotFoundError", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValue(new CartNotFoundError());
            
            /* Assert */
            return request(app).delete(`${baseURL}/current`).send()
                .expect(404)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL}/current Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).delete(`${baseURL}/current`).send()
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});

/* =================== DELETE /ezelectronics/carts tests =================== */
describe(`Cart Routes - DELETE ${baseURL}`, () => {
    describe(`DELETE ${baseURL} Success 1 - Admin call`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);
            
            /* Assert */
            return request(app).delete(baseURL).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledWith();
                    expect(response.body).toEqual({});
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL} Success 2 - Manager call`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);
            
            /* Assert */
            return request(app).delete(baseURL).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledWith();
                    expect(response.body).toEqual({});
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL} Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                return res.status(401).send('Unauthenticated User');
            });
            
            /* Assert */
            return request(app).delete(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL} Defined Error 2 - Not Admin or Manager`, () => {
        test("It should return a 401 User Is Not Admin or Manager", async () => {
            /* Arrange */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            
            /* Assert */
            return request(app).delete(baseURL).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`DELETE ${baseURL} Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).delete(baseURL).send()
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});

/* =================== GET /ezelectronics/carts/all tests =================== */
describe(`Cart Routes - GET ${baseURL}/all`, () => {
    describe(`GET ${baseURL}/all Success 1 - Admin call`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');
            const mockProductInCart1List = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart1 = new Cart('giuliano', true, '13-12-2022', 1000, mockProductInCart1List);
            const mockProductInCart2List = [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]
            const mockCart2 = new Cart('giuliano', false, '', 0, mockProductInCart2List);
            const mockCarts = [mockCart1, mockCart2]

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue(mockCarts);
            
            /* Assert */
            return request(app).get(`${baseURL}/all`).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.getAllCarts).toHaveBeenCalledWith();
                    expect(response.body).toEqual(mockCarts);
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL}/all Success 2 - Manager call`, () => {
        test("It should return a 200 ok code", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.MANAGER, 'Via Roma 2', '1980-01-01');
            const mockProductInCart1List = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart1 = new Cart('giuliano', true, '13-12-2022', 1000, mockProductInCart1List);
            const mockProductInCart2List = [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)]
            const mockCart2 = new Cart('giuliano', false, '', 0, mockProductInCart2List);
            const mockCarts = [mockCart1, mockCart2]

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue(mockCarts);
            
            /* Assert */
            return request(app).get(`${baseURL}/all`).send()
                .expect(200)
                .then(response => {
                    expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1);
                    expect(CartController.prototype.getAllCarts).toHaveBeenCalledWith();
                    expect(response.body).toEqual(mockCarts);
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL}/all Defined Error 1 - Not Logged In`, () => {
        test("It should return a 401 Unauthenticated User", async () => {
            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                return res.status(401).send('Unauthenticated User');
            });
            
            /* Assert */
            return request(app).get(`${baseURL}/all`).send()
                .expect(401)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });

    describe(`GET ${baseURL}/all Defined Error 2 - Not Admin or Manager`, () => {
        test("It should return a 401 User Is Not Admin Or Manager", async () => {
           /* Arrange Objects */
           const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

           /* Arrange Mocks */
           jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
               req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
               return next();
           });
           
           /* Assert */
           return request(app).get(`${baseURL}/all`).send()
               .expect(401)
               .then(response => {
                   jest.restoreAllMocks();
               });
        })
    });

    describe(`GET ${baseURL}/all Failure`, () => {
        test("It should return a 503 Internal Server Error", async () => {
            /* Arrange Objects */
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.ADMIN, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks */
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = mockUser; // The authenticator theoretically fetches the user data from cookies or session
                return next();
            });
            jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValue(new Error('Internal Server Error'));
            
            /* Assert */
            return request(app).get(`${baseURL}/all`).send()
                .expect(503)
                .then(response => {
                    jest.restoreAllMocks();
                });
        })
    });
});
