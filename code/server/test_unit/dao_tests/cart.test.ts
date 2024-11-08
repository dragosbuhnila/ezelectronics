import { describe, test, expect, beforeAll, afterAll, jest, beforeEach } from "@jest/globals"

import CartDAO from "../../src/dao/cartDAO"
import db from "../../src/db/db"
import { Cart, Cart_DBRepresentation, ProductInCart } from "../../src/components/cart"
import { Database } from "sqlite3";
import { Category, Product } from "../../src/components/product";

jest.mock("../../src/db/db.ts")

/* =================== createCart tests =================== */
describe('CartDAO - createCart Tests', () => {
    describe('createCart Success 1', () => {
        test('should resolve with a new Cart', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spyGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.createCart('giuliano');

            expect(result).toEqual(new Cart('giuliano', false, '', 0, []));

            // Cleanup
            spyGet.mockRestore();
            spy.mockRestore();
        });
    });

    describe('createCart Failure 1 - zero-length username', () => {
        test('should reject invalid username', async () => {
            let cartDAO = new CartDAO();

            // Act
            try {
                await cartDAO.createCart('');
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid username, should have length > 0'));
            }
        });
    });

    describe('createCart Failure 2 - Unpaid cart already exists for current user', () => {
        test('should reject with an error when an unpaid cart already exists for the user', async () => {
            let cartDAO = new CartDAO();

            const mockCart_empty = new Cart('giuliano', false, '', 0, []); 

            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, new Cart_DBRepresentation(mockCart_empty));
                return {} as Database;
            });

            // Act and Assert
            await expect(cartDAO.createCart('giuliano')).rejects.toThrow(new Error('Unpaid cart already exists for this user'));

            // Cleanup
            spy.mockRestore();
        });
    });


    describe('createCart Failure 3 - db.get error', () => {
        test('should reject with an error when the "get" database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error("Database Error"), null);
                return {} as Database;
            });

    
            // Act and Assert
            await expect(cartDAO.createCart('giuliano')).rejects.toThrow('db.get failed');
    
            // Cleanup
            spy.mockRestore();
        });
    });

    describe('createCart Failure 4 - db.run error', () => {
        test('should reject with an error when the "run" database operation fails', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spyGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
    
            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.createCart('giuliano')).rejects.toThrow('db.run failed');
    
            // Cleanup
            spy.mockRestore();
        });
    });
});

/* =================== getUnpaidCart tests =================== */
describe('CartDAO - getUnpaidCart Tests', () => {
    describe('getUnpaidCart Success 1 - empty cart', () => {
        test('should resolve with an unpaid Cart', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockCart = new Cart('giuliano', false, '', 0, []);
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart)]);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getUnpaidCart('giuliano');

            // Assert
            expect(result).toEqual(expect.objectContaining({
                ...mockCart,
                paymentDate: null}));

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getUnpaidCart Success 2 - non-empty cart', () => {
        test('should resolve with an unpaid Cart', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockProductInCartList = [new ProductInCart('model', 1, Category.SMARTPHONE, 1)];
            let mockCart = new Cart('giuliano', false, '', 784.43, mockProductInCartList);
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart)]);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getUnpaidCart('giuliano');

            // Assert
            expect(result).toEqual(expect.objectContaining({
                ...mockCart,
                paymentDate: null}));

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getUnpaidCart Success 3 - no unpaid carts', () => {
        test('should resolve with null when no unpaid carts are found', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getUnpaidCart('giuliano');

            // Assert
            expect(result).toBeNull();

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getUnpaidCart Failure 1 - zero-length username', () => {
        test('should resolve with an unpaid Cart', async () => {
            let cartDAO = new CartDAO();

            // Act and Assert
            try {
                await cartDAO.getUnpaidCart('');
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid username, should have length > 0'));
            }
        });
    });

    describe('getUnpaidCart Failure 2 - Error from database', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.getUnpaidCart('giuliano')).rejects.toThrow('Database error');
    
            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getUnpaidCart Failure 3 - More than one unpaid cart', () => {
        test('should reject with an error when more than one unpaid cart is found', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockCart1 = new Cart('giuliano', false, '', 0, []);
            const mockCart2 = new Cart('giuliano', false, '', 0, []);
            
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart1), new Cart_DBRepresentation(mockCart2)]);
                return {} as Database;
            });

            // Act and Assert
            await expect(cartDAO.getUnpaidCart('giuliano')).rejects.toThrow('More than one unpaid cart found');

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getUnpaidCart Failure 4 - Invalid product_in_cart_list JSON', () => {
        test('should reject with an error when the product_in_cart_list JSON is invalid', async () => {
            let cartDAO = new CartDAO();

            // Arrange        
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [{
                    customer: 'giuliano',
                    paid: 0,
                    paymentDate: '',
                    total: 0,
                    products_in_cart: 'invalid_json'
                }]);
                return {} as Database;
            });

            // Act and Assert
            await expect(cartDAO.getUnpaidCart('giuliano')).rejects.toThrow('Invalid product_in_cart_list JSON');

            // Cleanup
            spy.mockRestore();
        });
    });
});

/* =================== updateCurrentCartContentAndTotal tests =================== */
describe('CartDAO - updateCurrentCartContentAndTotal Tests', () => {
    describe('updateCurrentCartContent Success 1 - empty cart', () => {
        test('should resolve with true when the cart is updated', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockProductInCart1List = [new ProductInCart('model', 1, Category.SMARTPHONE, 1)];
            const mockCart1 = new Cart('giuliano', true, '2022-01-01', 3560.778, mockProductInCart1List);
            const spyGet = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart1)]);
                return {} as Database;
            });

            const mockCart = new Cart('giuliano', false, '', 0, []);
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.updateCurrentCartContentAndTotal(mockCart);

            // Assert
            expect(result).toBe(true);

            // Cleanup
            spy.mockRestore();
            spyGet.mockRestore();
        });
    });

    describe('updateCurrentCartContent Success 2 - non-empty cart', () => {
        test('should resolve with true when the cart is updated', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockProductInCart1List = [new ProductInCart('model', 1, Category.SMARTPHONE, 1)];
            const mockCart1 = new Cart('giuliano', true, '2022-01-01', 3560.778, mockProductInCart1List);
            const spyGet = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart1)]);
                return {} as Database;
            });

            const mockCart = new Cart('giuliano', false, '', 784.43, [new ProductInCart('model', 1, Category.SMARTPHONE, 1)]);
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.updateCurrentCartContentAndTotal(mockCart);

            // Assert
            expect(result).toBe(true);

            // Cleanup
            spy.mockRestore();
            spyGet.mockRestore();
        });
    });

    describe('updateCurrentCartContent Failure 1 - Error from database (db.run)', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange

            const mockProductInCart1List = [new ProductInCart('model', 1, Category.SMARTPHONE, 1)];
            const mockCart1 = new Cart('giuliano', true, '2022-01-01', 3560.778, mockProductInCart1List);
            const spyGet = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart1)]);
                return {} as Database;
            });

            const mockCart2 = new Cart('giuliano', false, '', 0, []);
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.updateCurrentCartContentAndTotal(mockCart2)).rejects.toThrow('db.run failed');
    
            // Cleanup
            spy.mockRestore();
            spyGet.mockRestore();
        });
    });

    describe('updateCurrentCartContent Failure 2 - Paid cart', () => {
        test('should reject with an error when trying to update a paid cart', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockCart = new Cart('giuliano', true, '2022-01-01', 100, [new ProductInCart('model', 1, Category.SMARTPHONE, 1)]);

            // Act and Assert
            await expect(cartDAO.updateCurrentCartContentAndTotal(mockCart)).rejects.toThrow('Cannot update a paid cart');
        });
    });

    describe('updateCurrentCartContent Failure 3 - zero-length username', () => {
        test('should reject invalid username', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockCart = new Cart('', false, '', 0, []);

            // Act
            try {
                await cartDAO.updateCurrentCartContentAndTotal(mockCart);
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid username, should have length > 0'));
            }
        });
    });

    describe('updateCurrentCartContent Failure 4 - negative total', () => {
        test('should reject with an error when the total is negative', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockCart = new Cart('giuliano', false, '', -100, [new ProductInCart('model', 1, Category.SMARTPHONE, 1)]);

            // Act and Assert
            await expect(cartDAO.updateCurrentCartContentAndTotal(mockCart)).rejects.toThrow('Invalid total, should be >= 0');
        });
    });

    describe('updateCurrentCartContent Failure 5 - No unpaid cart', () => {
        test('should reject with an error when there is no unpaid cart', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });
            
            const mockCart = new Cart('giuliano', false, '', 100, [new ProductInCart('model', 1, Category.SMARTPHONE, 1)]);

            // Act and Assert
            await expect(cartDAO.updateCurrentCartContentAndTotal(mockCart)).rejects.toThrow('No unpaid cart found');

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('updateCurrentCartContent Failure 6 - More than one unpaid cart', () => {
        test('should reject with an error when more than one unpaid cart is found', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockCart1 = new Cart('giuliano', false, '', 0, []);
            const mockCart2 = new Cart('giuliano', false, '', 0, []);
            
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart1), new Cart_DBRepresentation(mockCart2)]);
                return {} as Database;
            });

            const mockCart = new Cart('giuliano', false, '', 100, [new ProductInCart('model', 1, Category.SMARTPHONE, 1)]);

            // Act and Assert
            await expect(cartDAO.updateCurrentCartContentAndTotal(mockCart)).rejects.toThrow('More than one unpaid cart found');

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('updateCurrentCartContent Failure 7 - Error from database (db.all)', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });

            const mockCart = new Cart('giuliano', false, '', 100, [new ProductInCart('model', 1, Category.SMARTPHONE, 1)]);

            // Act and Assert
            await expect(cartDAO.updateCurrentCartContentAndTotal(mockCart)).rejects.toThrow('db.all failed');

            // Cleanup
            spy.mockRestore();
        });
    });
});

/* =================== payCurrentCart tests =================== */
describe('CartDAO - payCurrentCart Tests', () => {
    describe('payCurrentCart Success 1', () => {
        test('should resolve with true when the cart is paid', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.payCurrentCart('giuliano');

            // Assert
            expect(result).toBe(true);

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('payCurrentCart Failure 1 - Error from database', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.payCurrentCart('giuliano')).rejects.toThrow('Database error');
    
            // Cleanup
            spy.mockRestore();
        });
    });

    describe('payCurrentCart Failure 2 - zero-length username', () => {
        test('should reject invalid username', async () => {
            let cartDAO = new CartDAO();

            // Act
            try {
                await cartDAO.payCurrentCart('');
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid username, should have length > 0'));
            }
        });
    });
});

/* =================== getPaidCarts tests =================== */
describe('CartDAO - getPaidCarts Tests', () => {
    describe('getPaidCarts Success 1 - non-empty list', () => {
        test('should resolve with an unpaid Cart', async () => {
            let cartDAO = new CartDAO();

            const mockProductInCart1List = [new ProductInCart('model', 1, Category.SMARTPHONE, 1)];
            const mockProductInCart2List = [new ProductInCart('model_other', 1, Category.LAPTOP, 1)];
            const mockCart1 = new Cart('giuliano', true, '2022-01-01', 3560.778, mockProductInCart1List);
            const mockCart2 = new Cart('giuliano', true, '2022-03-01', 33.64, mockProductInCart2List);
            
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [new Cart_DBRepresentation(mockCart1), new Cart_DBRepresentation(mockCart2)]);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getPaidCarts('giuliano');

            // Assert
            expect(result).toEqual([mockCart1, mockCart2]);

            // Cleanup
            spy.mockRestore();
        });
    });

    // getPaidCarts empty list
    describe('getPaidCarts Success 2 - empty list', () => {
        test('should resolve with an empty list when no paid carts are found', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getPaidCarts('giuliano');

            // Assert
            expect(result).toEqual([]);

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getPaidCarts Failure 1 - zero-length username', () => {
        test('should reject invalid username', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            // Act
            try {
                await cartDAO.getPaidCarts('');
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid username, should have length > 0'));
            }

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getPaidCarts Failure 2 - Error from database', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.getPaidCarts('giuliano')).rejects.toThrow('Database error');
    
            // Cleanup
            spy.mockRestore();
        });
    });
});

/* =================== getAllCarts tests =================== */
describe('CartDAO - getAllCarts Tests', () => {
    describe('getAllCarts Success 1', () => {
        test('should resolve with all carts', async () => {
            let cartDAO = new CartDAO();

            const mockProductInCart1List = [new ProductInCart('iphone', 1, Category.SMARTPHONE, 1)];
            const mockProductInCart3List = [new ProductInCart('lenovo', 1, Category.LAPTOP, 1)];
            const mockCart1 = new Cart('giuliano', true, '2022-01-01', 3560.778, mockProductInCart1List);
            const mockCart2 = new Cart('giuliano', false, '', 0, []);            
            const mockCart3 = new Cart('massimiliano', true, '2022-03-01', 33.64, mockProductInCart3List);
            const mockCart4 = new Cart('massimiliano', false, '', 0, []);
            
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, [
                    new Cart_DBRepresentation(mockCart1), 
                    new Cart_DBRepresentation(mockCart2),
                    new Cart_DBRepresentation(mockCart3),
                    new Cart_DBRepresentation(mockCart4)
                ]);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getAllCarts();

            // Assert
            expect(result).toEqual([mockCart1,
                                    expect.objectContaining({...mockCart2, paymentDate: null}),
                                    mockCart3,
                                    expect.objectContaining({...mockCart4, paymentDate: null})]);

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getAllCarts Success 2 - empty list', () => {
        test('should resolve with an empty list when no carts are found', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getAllCarts();

            // Assert
            expect(result).toEqual([]);

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getAllCarts Failure 1 - Error from database', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.getAllCarts()).rejects.toThrow('Database error');
    
            // Cleanup
            spy.mockRestore();
        });
    });
});

/* =================== deleteAllCarts tests =================== */
describe('CartDAO - deleteAllCarts Tests', () => {
    describe('deleteAllCarts Success 1', () => {
        test('should resolve with true when all carts are deleted', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.deleteAllCarts();

            // Assert
            expect(result).toBe(true);

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('deleteAllCarts Failure 1 - Error from database', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow('Database error');
    
            // Cleanup
            spy.mockRestore();
        });
    });
});

/* =================== updateQuantity tests =================== */
describe('CartDAO - updateQuantity Tests', () => {
    describe('updateQuantity Success 1', () => {
        test('should resolve with true when the quantity is updated', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.updateQuantity('iphone', 2);

            // Assert
            expect(result).toBe(true);

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('updateQuantity Failure 1 - zero-length model', () => {
        test('should reject invalid model', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            try {
                await cartDAO.updateQuantity('', 2);
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid model, should have length > 0'));
            }

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('updateQuantity Failure 2 - negative quantity', () => {
        test('should reject invalid quantity', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            // Act
            try {
                await cartDAO.updateQuantity('iphone', -2);
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid new_quantity, should be >= 0'));
            }

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('updateQuantity Failure 3 - Error from database', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.updateQuantity('iphone', 2)).rejects.toThrow('Database error');
    
            // Cleanup
            spy.mockRestore();
        });
    });
});

/* =================== getProductByModel tests =================== */
describe('CartDAO - getProductByModel Tests', () => {
    describe('getProductByModel Success 1 - Existing Product', () => {
        test('should resolve with a Product when the model exists', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const mockProduct = new Product(100, 'iphone', Category.SMARTPHONE, '2022-01-01', 'details', 1);
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: 'iphone',
                    category: Category.SMARTPHONE,
                    arrivalDate: '2022-01-01',
                    details: 'details',
                    quantity: 1
                });
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getProductByModel('iphone');

            // Assert
            expect(result).toEqual(mockProduct);

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getProductByModel Success 2 - product does not exist in db', () => {
        test('should resolve with null when the model does not exist', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            // Act
            const result = await cartDAO.getProductByModel('iphone');

            // Assert
            expect(result).toBeNull();

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getProductByModel Failure 1 - zero-length model', () => {
        test('should reject invalid model', async () => {
            let cartDAO = new CartDAO();

            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            // Act
            try {
                await cartDAO.getProductByModel('');
            } catch (error) {
                // Assert
                expect(error).toEqual(new Error('Invalid model, should have length > 0'));
            }

            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getProductByModel Failure 2 - Error from database', () => {
        test('should reject with an error when the database operation fails', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'));
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.getProductByModel('iphone')).rejects.toThrow('Database error');
    
            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getProductByModel Failure 3 - Invalid category', () => {
        test('should reject with an error when the category is invalid', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: 'iphone',
                    category: 'invalid_category',
                    arrivalDate: '2022-01-01',
                    details: 'details',
                    quantity: 1
                });
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.getProductByModel('iphone')).rejects.toThrow(`Category isn't one of the 3 specified or isn't spelled correctly`);
    
            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getProductByModel Failure 4 - Typo in category (non uppercase first letter)', () => {
        test('should reject with an error when the category is invalid', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: 'iphone',
                    category: 'smartphone',
                    arrivalDate: '2022-01-01',
                    details: 'details',
                    quantity: 1
                });
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.getProductByModel('iphone')).rejects.toThrow(`Category isn't one of the 3 specified or isn't spelled correctly`);
    
            // Cleanup
            spy.mockRestore();
        });
    });

    describe('getProductByModel Failure 5 - Typo in category (generic typo)', () => {
        test('should reject with an error when the category is invalid', async () => {
            let cartDAO = new CartDAO();
    
            // Arrange
            const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: 'iphone',
                    category: 'Smratphone',
                    arrivalDate: '2022-01-01',
                    details: 'details',
                    quantity: 1
                });
                return {} as Database;
            });
    
            // Act and Assert
            await expect(cartDAO.getProductByModel('iphone')).rejects.toThrow(`Category isn't one of the 3 specified or isn't spelled correctly`);
    
            // Cleanup
            spy.mockRestore();
        });
    });
});