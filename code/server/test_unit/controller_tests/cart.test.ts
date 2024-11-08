import { describe, test, expect, beforeAll, afterAll, jest, beforeEach } from "@jest/globals"

import CartDAO from "../../src/dao/cartDAO"
import CartController from "../../src/controllers/cartController"
import { Category, Product } from "../../src/components/product";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Role, User } from "../../src/components/user";
import { mock } from "node:test";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";
import exp from "node:constants";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";

/* =================== createCart tests =================== */
describe('CartController - addToCart Tests', () => {
    // Successes: upnaid-cart-existed, no-unpaid-cart (should create), product already in cart (i.e. find() finds)
    describe('addToCart Success 1 - Unpaid Cart Existed and Product Is In Cart', () => {
        test('should add product to cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct = new Product(500, "iphone13", Category.SMARTPHONE, '2022-01-01', 'Test Product', 2);
            const mockProductInCartList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart_full = new Cart('giuliano', false, '', 500, mockProductInCartList);
            // const mockCart_empty = new Cart('giuliano', false, '', 0, []);
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');


            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(mockProduct);
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            // jest.spyOn(CartDAO.prototype, 'createCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'updateCurrentCartContentAndTotal').mockResolvedValue(true);


            /* Assert */
            const result = await controller.addToCart(mockUser, 'iphone13');

            expect(result).toBe(true);
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith(mockProduct.model);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);
            // expect(CartDAO.prototype.createCart).toHaveBeenCalledWith(mockUser.username);
            expect(CartDAO.prototype.updateCurrentCartContentAndTotal).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockCart_full,
                    total: 1000,
                    products: expect.arrayContaining([
                        new ProductInCart(mockProduct.model, 2, mockProduct.category, mockProduct.sellingPrice)
                    ]),
                })
            );

            jest.restoreAllMocks();
        });
    });

    describe('addToCart Success 2 - Unpaid Cart Does Not Exist Yet', () => {
        test('should add product to cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct = new Product(500, "iphone13", Category.SMARTPHONE, '2022-01-01', 'Test Product', 2);
            // const mockProductInCartList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 1)];
            // const mockCart_full = new Cart('giuliano', false, '', 784.43, mockProductInCartList);
            const mockCart_empty = new Cart('giuliano', false, '', 0, []);
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');


            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(mockProduct);
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(null);
            jest.spyOn(CartDAO.prototype, 'createCart').mockResolvedValue(mockCart_empty);
            jest.spyOn(CartDAO.prototype, 'updateCurrentCartContentAndTotal').mockResolvedValue(true);


            /* Assert */
            const result = await controller.addToCart(mockUser, 'iphone13');

            expect(result).toBe(true);
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith(mockProduct.model);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);
            expect(CartDAO.prototype.createCart).toHaveBeenCalledWith(mockUser.username);
            expect(CartDAO.prototype.updateCurrentCartContentAndTotal).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockCart_empty,
                    total: 500,
                    products: expect.arrayContaining([
                        new ProductInCart(mockProduct.model, 1, mockProduct.category, mockProduct.sellingPrice)
                    ]),
                })
            );

            jest.resetAllMocks();
        });
    });

    describe('addToCart Defined Errors 1 - ProductNotFoundError', () => {
        test('should throw ProductNotFoundError', async () => {
            /* Arrange Objects */
            const controller = new CartController();
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(null);

            /* Assert */
            await expect(controller.addToCart(mockUser, 'iphone13')).rejects.toThrow(ProductNotFoundError);
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('iphone13');

            jest.resetAllMocks();
        });
    });

    describe('addToCart Defined Errors 2 - EmptyProductStockError', () => {
        test('should throw EmptyProductStockError', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct = new Product(500, "iphone13", Category.SMARTPHONE, '2022-01-01', 'Test Product', 0);
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(mockProduct);

            /* Assert */
            await expect(controller.addToCart(mockUser, 'iphone13')).rejects.toThrow(EmptyProductStockError);
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('iphone13');

            jest.resetAllMocks();
        });
    });
});

/* =================== getCart tests =================== */
describe('CartController - getCart Tests', () => {
    describe('getCart Success 1 - Unpaid Cart Exists', () => {
        test('should get cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProductInCartList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart_full = new Cart('giuliano', false, '', 500, mockProductInCartList);
            // const mockCart_empty = new Cart('giuliano', false, '', 0, []);
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            // jest.spyOn(CartDAO.prototype, 'createCart').mockResolvedValue(mockCart_empty);

            /* Assert */
            const result = await controller.getCart(mockUser);
            expect(result).toEqual(mockCart_full);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);
            // expect(CartDAO.prototype.createCart).toHaveBeenCalledWith(mockUser.username);

            jest.restoreAllMocks();
        });
    });

    describe('getCart Success 2 - Unpaid Cart Does Not Exists', () => {
        test('should get a new empty cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProductInCartList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            // const mockCart_full = new Cart('giuliano', false, '', 500, mockProductInCartList);
            const mockCart_empty = new Cart('giuliano', false, '', 0, []);
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(null);
            jest.spyOn(CartDAO.prototype, 'createCart').mockResolvedValue(mockCart_empty);

            /* Assert */
            const result = await controller.getCart(mockUser);
            expect(result).toEqual(expect.objectContaining({
                ...mockCart_empty,
                paymentDate: null}));
            // expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);

            jest.restoreAllMocks();
        });
    });

    describe('getCart Success 3 - Unpaid Cart Exists But Is Empty', () => {
        test('should get cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockCart_empty = new Cart('giuliano', false, '', 0, []);
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            // /* Arrange Mocks*/ // Don't need it anymore with the new version
            // jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_empty);

            /* Assert */
            const result = await controller.getCart(mockUser);
            expect(result).toEqual(expect.objectContaining({
                ...mockCart_empty,
                paymentDate: null}));
            // expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);

            jest.restoreAllMocks();
        });
    });

    describe('getCart Failure 1 - Undefined Error', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            const mockError = new Error('Random error');
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockRejectedValue(mockError);

            /* Assert */
            await expect(controller.getCart(mockUser)).rejects.toThrow(mockError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);

            jest.restoreAllMocks();
        });
    });
});

/* =================== checkoutCart tests =================== */
describe('CartController - checkoutCart Tests', () => {
    describe('checkoutCart Success', () => {
        test('should checkout cart successfully, thus returning true', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct1 = new Product(500, 'iphone13', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);
            const mockProduct2 = new Product(700, 'oppo', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);
            const mockProduct3 = new Product(999, 'lenovo', Category.LAPTOP, '2022-01-01', 'Test Product', 10);
            const mockProductInCartList = [new ProductInCart('iphone13', 3, Category.SMARTPHONE, 500),
                                            new ProductInCart('oppo', 2, Category.SMARTPHONE, 700),
                                            new ProductInCart('lenovo', 1, Category.LAPTOP, 999)];
            const mockCart_full = new Cart('giuliano', false, '', 3899, mockProductInCartList);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'getProductByModel')
                .mockResolvedValueOnce(mockProduct1)
                .mockResolvedValueOnce(mockProduct2)
                .mockResolvedValueOnce(mockProduct3);
            jest.spyOn(CartDAO.prototype, 'payCurrentCart').mockResolvedValue(true);
            jest.spyOn(CartDAO.prototype, 'updateQuantity').mockResolvedValue(true);

            /* Act */
            const result = await controller.checkoutCart(mockUser);

            /* Assert */
            expect(result).toBe(true);

            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');

            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('iphone13');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('oppo');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('lenovo');

            expect(CartDAO.prototype.payCurrentCart).toHaveBeenCalledWith('giuliano');

            expect(CartDAO.prototype.updateQuantity).toHaveBeenCalledWith('iphone13', 7);
            expect(CartDAO.prototype.updateQuantity).toHaveBeenCalledWith('oppo', 8);
            expect(CartDAO.prototype.updateQuantity).toHaveBeenCalledWith('lenovo', 9);

            jest.restoreAllMocks();
        });
    });

    describe('checkoutCart Defined Error 1 - CartNotFoundError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(null);

            /* Assert */
            await expect(controller.checkoutCart(mockUser)).rejects.toThrow(CartNotFoundError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');

            jest.restoreAllMocks();
        });
    });


    describe('checkoutCart Defined Error 2 - EmptyCartError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockCart_empty = new Cart('giuliano', false, '', 0, []);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_empty);

            /* Assert */
            await expect(controller.checkoutCart(mockUser)).rejects.toThrow(EmptyCartError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');

            jest.restoreAllMocks();
        });
    });

    describe('checkoutCart Defined Error 3 - EmptyProductStockError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct1 = new Product(500, 'iphone13', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);
            const mockProduct2 = new Product(700, 'oppo', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);
            const mockProduct3 = new Product(999, 'lenovo', Category.LAPTOP, '2022-01-01', 'Test Product', 0);
            const mockProductInCartList = [new ProductInCart('lenovo', 1, Category.LAPTOP, 999)];
            const mockCart_full = new Cart('giuliano', false, '', 3899, mockProductInCartList);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'getProductByModel')
                .mockResolvedValueOnce(mockProduct3);

            /* Assert */
            await expect(controller.checkoutCart(mockUser)).rejects.toThrow(EmptyProductStockError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('lenovo');

            jest.restoreAllMocks();
        });
    });

    describe('checkoutCart Defined Error 4 - LowProductStockError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct1 = new Product(500, 'iphone13', Category.SMARTPHONE, '2022-01-01', 'Test Product', 2);
            const mockProduct2 = new Product(700, 'oppo', Category.SMARTPHONE, '2022-01-01', 'Test Product', 2);
            const mockProduct3 = new Product(999, 'lenovo', Category.LAPTOP, '2022-01-01', 'Test Product', 2);
            const mockProductInCartList = [new ProductInCart('iphone13', 3, Category.SMARTPHONE, 500),
                                            new ProductInCart('oppo', 2, Category.SMARTPHONE, 700),
                                            new ProductInCart('lenovo', 1, Category.LAPTOP, 999)];
            const mockCart_full = new Cart('giuliano', false, '', 3899, mockProductInCartList);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'getProductByModel')
                .mockResolvedValueOnce(mockProduct1)
                .mockResolvedValueOnce(mockProduct2)
                .mockResolvedValueOnce(mockProduct3);

            /* Assert */
            await expect(controller.checkoutCart(mockUser)).rejects.toThrow(LowProductStockError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('iphone13');

            jest.restoreAllMocks();
        });
    });

    describe('checkoutCart Failure 1 - Undefined Error', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            const mockError = new Error('Random error');
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockRejectedValue(mockError);

            /* Assert */
            await expect(controller.checkoutCart(mockUser)).rejects.toThrow(mockError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');

            jest.restoreAllMocks();
        });
    });
});

/* =================== getCustomerCarts tests =================== */
describe('CartController - getCustomerCarts Tests', () => {
    describe('getCustomerCarts Success 1 - Unpaid Cart Exists', () => {
        test('should get cart list successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            const mockCartList: Cart[] = [
                new Cart('giuliano', true, '12-12-2022', 500, [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)]),
                new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)])
            ];

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getPaidCarts').mockResolvedValue(mockCartList);

            /* Assert */
            const result = await controller.getCustomerCarts(mockUser);
            expect(result).toEqual(mockCartList);
            expect(CartDAO.prototype.getPaidCarts).toHaveBeenCalledWith(mockUser.username);

            jest.restoreAllMocks();
        });
    });

    describe('getCustomerCarts Success 2 - No Carts Exist', () => {
        test('should get cart list successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            const mockCartList: Cart[] = [];

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getPaidCarts').mockResolvedValue(mockCartList);

            /* Assert */
            const result = await controller.getCustomerCarts(mockUser);
            expect(result).toEqual(mockCartList);
            expect(CartDAO.prototype.getPaidCarts).toHaveBeenCalledWith(mockUser.username);

            jest.restoreAllMocks();
        });
    });

    describe('getCustomerCarts Failure 1 - Undefined Error', () => {
        test('should get cart list successfully', () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            const mockError = new Error('Random error');
            jest.spyOn(CartDAO.prototype, 'getPaidCarts').mockRejectedValue(mockError);

            /* Assert */
            expect(controller.getCustomerCarts(mockUser)).rejects.toThrow(mockError);
            expect(CartDAO.prototype.getPaidCarts).toHaveBeenCalledWith(mockUser.username);

            jest.restoreAllMocks();
        });
    }); 
});

/* =================== removeProductFromCart tests =================== */
describe('CartController - removeProductFromCart Tests', () => {
    describe('removeProductFromCart Success 1 - Some Quantity Left', () => {
        test('should remove product from cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct = new Product(500, 'iphone13', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);
            const mockProductInCartList = [new ProductInCart('iphone13', 3, Category.SMARTPHONE, 500)];
            const mockCart_full = new Cart('giuliano', false, '', 1500, mockProductInCartList);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(mockProduct);
            jest.spyOn(CartDAO.prototype, 'updateCurrentCartContentAndTotal').mockResolvedValue(true);

            /* Act */
            const result = await controller.removeProductFromCart(mockUser, 'iphone13');

            /* Assert */
            expect(result).toBe(true);

            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('iphone13');
            expect(CartDAO.prototype.updateCurrentCartContentAndTotal).toHaveBeenCalledWith(
                expect.objectContaining({
                    customer: 'giuliano',
                    paid: false,
                    paymentDate: '',
                    total: 1000,
                    products: expect.arrayContaining([
                        new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)
                    ]),
                })
            );

            jest.restoreAllMocks();
        });
    });

    describe('removeProductFromCart Success 2 - No Quantity Left', () => {
        test('should remove product from cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct = new Product(500, 'iphone13', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);
            const mockProductInCartList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart_full = new Cart('giuliano', false, '', 500, mockProductInCartList);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(mockProduct);
            jest.spyOn(CartDAO.prototype, 'updateCurrentCartContentAndTotal').mockResolvedValue(true);

            /* Act */
            const result = await controller.removeProductFromCart(mockUser, 'iphone13');

            /* Assert */
            expect(result).toBe(true);

            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('iphone13');
            expect(CartDAO.prototype.updateCurrentCartContentAndTotal).toHaveBeenCalledWith(
                expect.objectContaining({
                    customer: 'giuliano',
                    paid: false,
                    paymentDate: '',
                    total: 0,
                    products: [],
                })
            );

            jest.restoreAllMocks();
        });
    });

    describe('removeProductFromCart Defined Error 1 - CartNotFoundError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(null);

            /* Assert */
            await expect(controller.removeProductFromCart(mockUser, 'iphone13')).rejects.toThrow(CartNotFoundError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');

            jest.restoreAllMocks();
        });
    });

    describe('removeProductFromCart Defined Error 2 - EmptyCartError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockCart_empty = new Cart('giuliano', false, '', 0, []);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_empty);

            /* Assert */
            await expect(controller.removeProductFromCart(mockUser, 'iphone13')).rejects.toThrow(CartNotFoundError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');

            jest.restoreAllMocks();
        });
    });

    describe('removeProductFromCart Defined Error 3 - ProductNotFoundError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProductInCartList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart_full = new Cart('giuliano', false, '', 500, mockProductInCartList);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(null);

            /* Assert */
            await expect(controller.removeProductFromCart(mockUser, 'iphone13')).rejects.toThrow(ProductNotFoundError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('iphone13');

            jest.restoreAllMocks();
        });
    });

    describe('removeProductFromCart Defined Error 4 - ProductNotInCartError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProduct1 = new Product(700, 'oppo', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);
            const mockProductInCartList = [new ProductInCart('iphone', 1, Category.SMARTPHONE, 700), new ProductInCart('lenovo', 1, Category.LAPTOP, 999)];
            const mockCart_full = new Cart('giuliano', false, '', 700, mockProductInCartList);
            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'getProductByModel').mockResolvedValue(mockProduct1);

            /* Assert */
            await expect(controller.removeProductFromCart(mockUser, 'oppo')).rejects.toThrow(ProductNotInCartError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');
            expect(CartDAO.prototype.getProductByModel).toHaveBeenCalledWith('oppo');

            jest.restoreAllMocks();
        });
    });

    describe('removeProductFromCart Failure 1 - Undefined Error', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User
                ('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');
            
            /* Arrange Mocks */
            const mockError = new Error('Random error');
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockRejectedValue(mockError);

            /* Assert */
            await expect(controller.removeProductFromCart(mockUser, 'iphone13')).rejects.toThrow(mockError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith('giuliano');

            jest.restoreAllMocks();
        });
    });
});

/* =================== clearCart tests =================== */
describe('CartController - clearCart Tests', () => {
    describe('clearCart Success', () => {
        test('should clear cart successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockProductInCartList = [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)];
            const mockCart_full = new Cart('giuliano', false, '', 500, mockProductInCartList);
            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(mockCart_full);
            jest.spyOn(CartDAO.prototype, 'updateCurrentCartContentAndTotal').mockResolvedValue(true);

            /* Assert */
            const result = await controller.clearCart(mockUser);
            expect(result).toBe(true);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);
            expect(CartDAO.prototype.updateCurrentCartContentAndTotal).toHaveBeenCalledWith(
                expect.objectContaining({
                    customer: 'giuliano',
                    paid: false,
                    paymentDate: '',
                    total: 0,
                    products: [],
                })
            );

            jest.restoreAllMocks();
        });
    });

    describe('clearCart Defined Error 1 - CartNotFoundError', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockResolvedValue(null);

            /* Assert */
            await expect(controller.clearCart(mockUser)).rejects.toThrow(CartNotFoundError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);

            jest.resetAllMocks();
        });
    });

    describe('clearCart Failure 1 - Undefined Error', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockUser = new User('giuliano', 'Paolo', 'Brosio', Role.CUSTOMER, 'Via Roma 2', '1980-01-01');

            /* Arrange Mocks*/
            const mockError = new Error('Random error');
            jest.spyOn(CartDAO.prototype, 'getUnpaidCart').mockRejectedValue(mockError);

            /* Assert */
            await expect(controller.clearCart(mockUser)).rejects.toThrow(mockError);
            expect(CartDAO.prototype.getUnpaidCart).toHaveBeenCalledWith(mockUser.username);

            jest.resetAllMocks();
        });
    });
});

/* =================== deleteAllCarts tests =================== */
describe('CartController - deleteAllCarts Tests', () => {
    describe('deleteAllCarts Success', () => {
        test('should delete all carts successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            /* Arrange Mocks*/
            jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockResolvedValue(true);

            /* Assert */
            const result = await controller.deleteAllCarts();
            expect(result).toBe(true);
            expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();

            jest.restoreAllMocks();
        });
    });

    describe('deleteAllCarts Failure 1 - Undefined Error', () => {
        test('should throw error', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            /* Arrange Mocks*/
            const mockError = new Error('Random error');
            jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockRejectedValue(mockError);

            /* Assert */
            await expect(controller.deleteAllCarts()).rejects.toThrow(mockError);
            expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();

            jest.restoreAllMocks();
        });
    });
});


/* =================== getAllCarts tests =================== */
describe('CartController - getAllCarts Tests', () => {
    describe('getAllCarts Success 1 - Carts Exist', () => {
        test('should get all carts successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockCartList: Cart[] = [
                new Cart('giuliano', true, '12-12-2022', 500, [new ProductInCart('iphone13', 1, Category.SMARTPHONE, 500)]),
                new Cart('giuliano', true, '13-12-2022', 1000, [new ProductInCart('iphone13', 2, Category.SMARTPHONE, 500)])
            ];

            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getAllCarts').mockResolvedValue(mockCartList);

            /* Assert */
            const result = await controller.getAllCarts();
            expect(result).toEqual(mockCartList);
            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();

            jest.restoreAllMocks();
        });
    });

    describe('getAllCarts Success 2 - No Carts Exist', () => {
        test('should get all carts successfully', async () => {
            /* Arrange Objects */
            const controller = new CartController();

            const mockCartList: Cart[] = [];

            /* Arrange Mocks */
            jest.spyOn(CartDAO.prototype, 'getAllCarts').mockResolvedValue(mockCartList);

            /* Assert */
            const result = await controller.getAllCarts();
            expect(result).toEqual(mockCartList);
            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();

            jest.restoreAllMocks();
        });
    });

    describe('getAllCarts Failure 1 - Undefined Error', () => {
        test('should get all carts successfully', () => {
            /* Arrange Objects */
            const controller = new CartController();

            /* Arrange Mocks */
            const mockError = new Error('Random error');
            jest.spyOn(CartDAO.prototype, 'getAllCarts').mockRejectedValue(mockError);

            /* Assert */
            expect(controller.getAllCarts()).rejects.toThrow(mockError);
            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();

            jest.restoreAllMocks();
        });
    }); 
});
