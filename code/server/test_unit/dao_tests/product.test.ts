/**
 * This file contains unit tests for the ProductDAO class.
 * The ProductDAO class is responsible for interacting with the database and performing CRUD operations on the products table.
 * It tests the registerProducts, changeProductQuantity, sellProduct, and getProducts methods of the ProductDAO class.
 */
import { describe, test, expect, afterEach, jest} from "@jest/globals"

import db from "../../src/db/db"
import { Database } from "sqlite3"
import ProductDAO from "../../src/dao/productDAO"
import {Product, Category} from "../../src/components/product"

import {ModelAlreadyExistsError, ProductNotFoundError, LowProductStockError, EmptyProductStockError} from "../../src/errors/productError";
import { mock } from "node:test"

jest.mock("../../src/db/db.ts");

describe("Product.DAO - Register Products", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Create a product - without date', async () => {
        const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const result = await productDAO.registerProducts("TestLaptop", "Laptop", 10, "Test details", 1000, "");
        expect(result).toBeUndefined();
        mockDB.mockRestore();
    });

    test('Create a product - with date', async () => {
        const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const result = await productDAO.registerProducts("TestLaptop", "Laptop", 10, "Test details", 1000, "2021-01-01");
        expect(result).toBeUndefined();
        mockDB.mockRestore();
    });

    test("Return error ModelAlreadyExistsError when product already exists", async () => {      
        const mockDB = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            const err = new Error("UNIQUE constraint failed: products.model");
            callback(err);
            return {} as Database
        });
        
        await expect(productDAO.registerProducts("TestLaptop", "Laptop", 10, "Test details", 1000, "2021-01-01")).rejects.toThrow(ModelAlreadyExistsError);
        mockDB.mockRestore();
    });
});

describe("Product.DAO - Change Product Quantity", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Change the quantity of a product - without date", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {quantity: 10})
            return {} as Database
        });

        const result = await productDAO.changeProductQuantity("TestLaptop", 5, "");
        expect(result).toEqual(10);
        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    });

    test("Change the quantity of a product - with date", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("arrivalDate")) {
                callback(null, {arrivalDate: "2021-01-01"})
            } else {
                callback(null, {quantity: 10})
            }
            return {} as Database
        });

        const result = await productDAO.changeProductQuantity("TestLaptop", 5, "2021-01-01");
        expect(result).toEqual(10);
        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    });

    test("Return ProductNotFoundError when product not found - without date", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        await expect(productDAO.changeProductQuantity("testLaptop", 5, "")).rejects.toThrow(ProductNotFoundError);
        mockDBGet.mockRestore();
    });

    test("Return ProductNotFoundError when product not found - with date", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            const err = new ProductNotFoundError();
            callback(err);
            return {} as Database
        });

        await expect(productDAO.changeProductQuantity("testLaptop", 5, "2021-01-01")).rejects.toThrow(ProductNotFoundError);
        mockDBGet.mockRestore();
    });

    test("Return an error when the arrival date is before previous arrival date", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {arrivalDate: "2021-01-01"})
            return {} as Database
        });
        
        await expect(productDAO.changeProductQuantity("TestLaptop", 5, "1995-01-01")).rejects.toThrow(Error);
        mockDBGet.mockRestore();
    });
});

describe("Product.DAO - Sell Product", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Sell a product - without date", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("arrivalDate")) {
                callback(null, {quantity: 10, arrivalDate: "2021-01-01"})
            } else {
                callback(null, {quantity: 5})
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const result = await productDAO.sellProduct("TestLaptop", 5, "");
        expect(result).toBeUndefined();
        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    });

    test("Sell a product - with date", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("arrivalDate")) {
                callback(null, {quantity: 10, arrivalDate: "2021-01-01"})
            } else {
                callback(null, {quantity: 5})
            }
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const result = await productDAO.sellProduct("TestLaptop", 5, "2021-01-01");
        expect(result).toBeUndefined();
        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    });

    test("Return ProductNotFoundError when product not found", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            const err = new ProductNotFoundError();
            callback(err);
            return {} as Database
        });

        await expect(productDAO.sellProduct("testLaptop", 5, "")).rejects.toThrow(ProductNotFoundError);
        mockDBGet.mockRestore();
    });

    test("Return an error when the arrival date is after current date", async () => {
        await expect(productDAO.sellProduct("TestLaptop", 5, "2525-01-01")).rejects.toThrow(Error);
    });

    test("Return an error when the arrival date is before previous arrival date", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {arrivalDate: "2021-01-01"})
            return {} as Database
        });
        
        await expect(productDAO.sellProduct("TestLaptop", 5, "1995-01-01")).rejects.toThrow(Error);
        mockDBGet.mockRestore();
    });

    test("Return EmptyProductStockError when product is out of stock", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {quantity: 0, arrivalDate: "2021-01-01"})
            return {} as Database
        });

        await expect(productDAO.sellProduct("TestLaptop", 5,"")).rejects.toThrow(EmptyProductStockError);
        mockDBGet.mockRestore();
    });

    test("Return LowProductStockError when product stock is below requested quantity", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {quantity: 5, arrivalDate: "2021-01-01"})
            return {} as Database
        });

        await expect(productDAO.sellProduct("TestLaptop", 10,"")).rejects.toThrow(LowProductStockError);
        mockDBGet.mockRestore();
    });
});
/**Everything checked until here */
describe("Product.DAO - Get Products", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Return all products", async () => {
        const mockRows = [
            {model: "TestLaptop", category: "Laptop", quantity: 10, details: "Test details", sellingPrice: 1000, arrivalDate: "2021-01-01"},
            {model: "TestSmartphone", category: "Smartphone", quantity: 20, details: "Test details", sellingPrice: 500, arrivalDate: "2021-01-01"}
        ];

        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows)
            return {} as Database
        });

        const ProductA = new Product(1000, "TestLaptop", Category.LAPTOP, "2021-01-01", "Test details", 10);
        const ProductB = new Product(500, "TestSmartphone", Category.SMARTPHONE, "2021-01-01", "Test details", 20);
        const expectedProduct = [ProductA, ProductB];

        const result = await productDAO.getProducts();
        expect(result).toEqual(expectedProduct);
        mockDBRun.mockRestore();
    });

    test("Return null when products not found", async () => {
        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });

        const result = await productDAO.getProducts();
        expect(result).toEqual([]);
        mockDBRun.mockRestore();
    });

});

describe("Product.DAO - Get Products By Category", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Return a product with specific category", async () => {
        const mockRows = [
            {model: "TestLaptop", category: "Laptop", quantity: 10, details: "Test details", sellingPrice: 1000, arrivalDate: "2021-01-01"}
        ];

        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows)
            return {} as Database
        });

        const ProductA = new Product(1000, "TestLaptop", Category.LAPTOP, "2021-01-01", "Test details", 10);
        const expectedProduct = [ProductA];

        const result = await productDAO.getProductsByCategory("Laptop");
        expect(result).toEqual(expectedProduct);
        mockDBRun.mockRestore();
    });

    test("Return null when products not found", async () => {
        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });

        const result = await productDAO.getProductsByCategory("Laptop");
        expect(result).toEqual([]);
        mockDBRun.mockRestore();
    });
});

describe("Product.DAO - Get Products By Model", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Return a product with specific model", async () => {
        const mockRows = [
            {model: "TestLaptop", category: "Laptop", quantity: 10, details: "Test details", sellingPrice: 1000, arrivalDate: "2021-01-01"}
        ];

        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows)
            return {} as Database
        });

        const ProductA = new Product(1000, "TestLaptop", Category.LAPTOP, "2021-01-01", "Test details", 10);
        const expectedProduct = [ProductA];

        const result = await productDAO.getProductsByModel("TestLaptop");
        expect(result).toEqual(expectedProduct);
        mockDBRun.mockRestore();
    });

    test("Return ProductNotFoundError when model not found", async () => {
        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });

        await expect(productDAO.getProductsByModel("testLaptop")).rejects.toThrow(ProductNotFoundError);
        mockDBRun.mockRestore();
    });
});

describe("Product.DAO - Get Available Products", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Return all products with quantity above 0", async () => {
        const mockRows = [
            {model: "TestLaptop", category: "Laptop", quantity: 10, details: "Test details", sellingPrice: 1000, arrivalDate: "2021-01-01"},
            {model: "TestSmartphone", category: "Smartphone", quantity: 1, details: "Test details", sellingPrice: 500, arrivalDate: "2021-01-01"}
        ];

        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows)
            return {} as Database
        });

        const ProductA = new Product(1000, "TestLaptop", Category.LAPTOP, "2021-01-01", "Test details", 10);
        const ProductB = new Product(500, "TestSmartphone", Category.SMARTPHONE, "2021-01-01", "Test details", 1);
        const expectedProduct = [ProductA, ProductB];

        const result = await productDAO.getAvailableProducts();
        expect(result).toEqual(expectedProduct);
        mockDBRun.mockRestore();
    });

    test("Return null when no available products where found", async () => {
        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });

        const result = await productDAO.getAvailableProducts();
        expect(result).toEqual([]);
        mockDBRun.mockRestore();
    });
});

describe("Product.DAO - Get Available Products By Category", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Return a product with quantity above 0 of a specific category", async () => {
        const mockRows = [
            {model: "TestLaptop", category: "Laptop", quantity: 10, details: "Test details", sellingPrice: 1000, arrivalDate: "2021-01-01"}
        ];

        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows)
            return {} as Database
        });

        const ProductA = new Product(1000, "TestLaptop", Category.LAPTOP, "2021-01-01", "Test details", 10);

        const result = await productDAO.getAvailableProductsByCategory("Laptop");
        expect(result).toContainEqual(ProductA);
        mockDBRun.mockRestore();
    });

    test("Return null when no available products where found", async () => {
        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });

        const result = await productDAO.getAvailableProductsByCategory("Laptop");
        expect(result).toEqual([]);
        mockDBRun.mockRestore();
    });
});

describe("Product.DAO - Get Available Products By Model", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Return a product with quantity above 0 of a specific model", async () => {
        const mockRows = [
            {model: "TestLaptop", category: "Laptop", quantity: 10, details: "Test details", sellingPrice: 1000, arrivalDate: "2021-01-01"}
        ];

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {quantity: 10})
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows)
            return {} as Database
        });

        const ProductA = new Product(1000, "TestLaptop", Category.LAPTOP, "2021-01-01", "Test details", 10);

        const result = await productDAO.getAvailableProductsByModel("TestLaptop");
        expect(result).toContainEqual(ProductA);
        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    });

    test("Return ProductNotFoundError when model not found", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        await expect(productDAO.getAvailableProductsByModel("testLaptop")).rejects.toThrow(ProductNotFoundError);
        mockDBGet.mockRestore();
    });
});

describe("Product.DAO - Delete All Products", () => {
    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Delete all products", async () => {
        const mockDB = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const result = await productDAO.deleteAllProducts();

        expect(result).toEqual(true);
        mockDB.mockRestore()
    });
});

describe("Product.DAO - Delete Product", () => {

    const productDAO = new ProductDAO();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Delete a specific product", async () => {
        const mockRows = [
            {model: "TestLaptop", category: "Laptop", quantity: 10, details: "Test details", sellingPrice: 1000, arrivalDate: "2021-01-01"}
        ];
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockRows)
            return {} as Database
        });
        
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });

        const result = await productDAO.deleteProduct("test_product");
        expect(result).toEqual(true);
        mockDBRun.mockRestore()
        mockDBAll.mockRestore()
        mockDBGet.mockRestore()
    });

    test("Return ProductNotFoundError when product not found", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        await expect(productDAO.deleteProduct("test_product")).rejects.toThrow(ProductNotFoundError);
        mockDBGet.mockRestore()
    });
});
