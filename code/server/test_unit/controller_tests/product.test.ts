import { describe, test, expect, afterEach, jest} from "@jest/globals"

import {Product, Category} from "../../src/components/product"
import productController from "../../src/controllers/productController"
import productDAO from "../../src/dao/productDAO"
import {ModelAlreadyExistsError, ProductNotFoundError, EmptyProductStockError, LowProductStockError} from "../../src/errors/productError"
import exp from "constants"
import { DateError } from "../../src/utilities"

jest.mock("../../src/dao/productDAO");

describe("Product.Controller - Register Products", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    const controller = new productController();

    test("Create a new product and return void", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "registerProducts").mockResolvedValue();
        
        const response = await controller.registerProducts("Test", Category.LAPTOP, 1000, "Test details", 10, "2021-01-01");

        expect(response).toBeUndefined();
        expect(mockDAO).toHaveBeenCalledTimes(1);
        expect(mockDAO).toHaveBeenCalledWith("Test", Category.LAPTOP, 1000, "Test details", 10, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return a ModelAlreadyExistsError when product already exist", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "registerProducts").mockRejectedValue(new ModelAlreadyExistsError());

        await expect(controller.registerProducts("Test", Category.LAPTOP, 1000, "Test details", 10, "2021-01-01")).rejects.toThrow(ModelAlreadyExistsError);

        expect(productDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.registerProducts).toHaveBeenCalledWith("Test", Category.LAPTOP, 1000, "Test details", 10, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return an error when arrival date is after the current date", async () => {
        jest.resetAllMocks();       
        await expect(controller.registerProducts("Test", Category.LAPTOP, 1000, "Test details", 10, "2521-01-01")).rejects.toThrow(new DateError());
    });
});

describe("Product.Controller - Change Product Quantity", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    const controller = new productController();

    test("Increase the quantity of a product and return the new quantity", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "changeProductQuantity").mockResolvedValue(200);

        const response = await controller.changeProductQuantity("Test", 100, "2021-01-01");

        expect(response).toBe(200);
        expect(productDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.changeProductQuantity).toHaveBeenCalledWith("Test", 100, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return a ProductNotFoundError when model does not exist", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError());
        
        await expect(controller.changeProductQuantity("Test", 100, "2021-01-01")).rejects.toThrow(ProductNotFoundError);

        expect(productDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.changeProductQuantity).toHaveBeenCalledWith("Test", 100, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return an error when arrival date is after the current date", async () => {       
        await expect(controller.changeProductQuantity("Test", 100, "2521-01-01")).rejects.toThrow(new DateError());
    });

    test("Return an error when arrival date is before arrival date", async () => {
        const errorMessage = "The arrival date must be after the arrival date";

        const mockDAO = jest.spyOn(productDAO.prototype, "changeProductQuantity").mockRejectedValueOnce(new Error(errorMessage));
        
        await expect(controller.changeProductQuantity("Test", 100, "2021-01-01")).rejects.toThrow(errorMessage);

        expect(productDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.changeProductQuantity).toHaveBeenCalledWith("Test", 100, "2021-01-01");
        mockDAO.mockRestore();
    });
});

describe("Product.Controller - Sell Product", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    const controller = new productController();

    test("Decrease the quantity of a product and return the new quantity", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "sellProduct").mockResolvedValue();

        const response = await controller.sellProduct("Test", 10, "2021-01-01");

        expect(response).toBeUndefined();
        expect(productDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return a ProductNotFoundError when model does not exist", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError());
        
        await expect(controller.sellProduct("Test", 10, "2021-01-01")).rejects.toThrow(ProductNotFoundError);

        expect(productDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return an error when selling date is after the current date", async () => {
        const errorMessage = "The selling date must be before the current date";

        const mockDAO = jest.spyOn(productDAO.prototype, "sellProduct").mockRejectedValueOnce(new Error(errorMessage));
        
        await expect(controller.sellProduct("Test", 10, "2521-01-01")).rejects.toThrow(errorMessage);

        expect(productDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, "2521-01-01");
        mockDAO.mockRestore();
    });

    test("Return an error when selling date is before arrival date", async () => {
        const errorMessage = "The selling date must be after the arrival date";

        const mockDAO = jest.spyOn(productDAO.prototype, "sellProduct").mockRejectedValueOnce(new Error(errorMessage));
        
        await expect(controller.sellProduct("Test", 10, "2021-01-01")).rejects.toThrow(errorMessage);

        expect(productDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.sellProduct).toHaveBeenCalledWith("Test", 10, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return an EmptyProductStockError when product stock is empty", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError());
        
        await expect(controller.sellProduct("Test", 100, "2021-01-01")).rejects.toThrow(EmptyProductStockError);

        expect(productDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.sellProduct).toHaveBeenCalledWith("Test", 100, "2021-01-01");
        mockDAO.mockRestore();
    });

    test("Return a LowProductStockError when product stock is lower than the requested quantity", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError());
        
        await expect(controller.sellProduct("Test", 100, "2021-01-01")).rejects.toThrow(LowProductStockError);

        expect(productDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.sellProduct).toHaveBeenCalledWith("Test", 100, "2021-01-01");
        mockDAO.mockRestore();
    });
});

describe("Product.Controller - Get Products", () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    const controller = new productController();

    test("Return all products when no grouping is provided", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);

        const response = await controller.getProducts(null, null, null);

        expect(response).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
        expect(productDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getProducts).toHaveBeenCalledWith();
        mockDAO.mockRestore();
    });

    test("Return all products filtered by category", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getProductsByCategory").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);

        const response = await controller.getProducts("category", "Laptop", null);

        expect(response).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
        expect(productDAO.prototype.getProductsByCategory).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getProductsByCategory).toHaveBeenCalledWith("Laptop");
        mockDAO.mockRestore();
    });

    test("Return all products filtered by model", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getProductsByModel").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);

        const response = await controller.getProducts("model", null, "Test");

        expect(response).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
        expect(productDAO.prototype.getProductsByModel).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getProductsByModel).toHaveBeenCalledWith("Test");
        mockDAO.mockRestore();
    });

    test("Return a ProductNotFoundError when model does not exist", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getProductsByModel").mockRejectedValueOnce(new ProductNotFoundError());

        await expect(controller.getProducts("model", null, "Test")).rejects.toThrow(ProductNotFoundError);

        expect(productDAO.prototype.getProductsByModel).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getProductsByModel).toHaveBeenCalledWith("Test");
        mockDAO.mockRestore();
    });
});

describe("Product.Controller - Get Available Products", () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    const controller = new productController();

    test("Return all available products when no grouping is provided", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);

        const response = await controller.getAvailableProducts(null, null, null);

        expect(response).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
        expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledWith();
        mockDAO.mockRestore();
    });

    test("Return all available products filtered by category", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getAvailableProductsByCategory").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);

        const response = await controller.getAvailableProducts("category", "Laptop", null);

        expect(response).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
        expect(productDAO.prototype.getAvailableProductsByCategory).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getAvailableProductsByCategory).toHaveBeenCalledWith("Laptop");
        mockDAO.mockRestore();
    });

    test("Return all available products filtered by model", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getAvailableProductsByModel").mockResolvedValue([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);

        const response = await controller.getAvailableProducts("model", null, "Test");

        expect(response).toEqual([{sellingPrice: 1000, model: "Test", category: Category.LAPTOP, arrivalDate: "2021-01-01", details: "Test details", quantity: 10}]);
        expect(productDAO.prototype.getAvailableProductsByModel).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getAvailableProductsByModel).toHaveBeenCalledWith("Test");
        mockDAO.mockRestore();
    });

    test("Return a ProductNotFoundError when model does not exist", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "getAvailableProductsByModel").mockRejectedValueOnce(new ProductNotFoundError());

        await expect(controller.getAvailableProducts("model", null, "Test")).rejects.toThrow(ProductNotFoundError);

        expect(productDAO.prototype.getAvailableProductsByModel).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.getAvailableProductsByModel).toHaveBeenCalledWith("Test");
        mockDAO.mockRestore();
    });
});

describe("Product.Controller - Delete Product", () => {
        
    afterEach(() => {
        jest.clearAllMocks();
    });

    const controller = new productController();

    test("Delete a product and return true", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "deleteProduct").mockResolvedValue(true);
        
        const response = await controller.deleteProduct("Test");

        expect(response).toBe(true);
        expect(mockDAO).toHaveBeenCalledTimes(1);
        expect(mockDAO).toHaveBeenCalledWith("Test");
        mockDAO.mockRestore();
    });

    test("Return a ProductNotFoundError when model does not exist", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError());

        await expect(controller.deleteProduct("Test")).rejects.toThrow(ProductNotFoundError);

        expect(productDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
        expect(productDAO.prototype.deleteProduct).toHaveBeenCalledWith("Test");
        mockDAO.mockRestore();
    });
});

describe("Product.Controller - Delete All Products", () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    const controller = new productController();

    test("Delete all products and return true", async () => {
        const mockDAO = jest.spyOn(productDAO.prototype, "deleteAllProducts").mockResolvedValue(true);
        
        const response = await controller.deleteAllProducts();

        expect(response).toBe(true);
        expect(mockDAO).toHaveBeenCalledTimes(1);
        expect(mockDAO).toHaveBeenCalledWith();
        mockDAO.mockRestore();
    });
});