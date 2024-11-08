import { test, expect, jest } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { User, Role } from "../../src/components/user"
import { ProductNotFoundError } from "../../src/errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ProductReview } from "../../src/components/review";


jest.mock("../../src/dao/reviewDAO")
// describe("Reviews Controller tests", () => {
    // describe("Controller.addReview tests", () => {
        // addReview tests
        test("It should return undefined", async () => {
            jest.resetAllMocks();
            const testReview = {
                model: "test_model",
                user: new User("test_username", "test_name", "test_surname", Role.CUSTOMER, "test_address", "2001-09-11"),
                score: 3,
                comment: "test_comment"
            }
            jest.spyOn(ReviewDAO.prototype, "createReview").mockResolvedValueOnce(undefined);
            const controller = new ReviewController();
            const response = await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment);

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const current_date = `${year}-${month}-${day}`;

            expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(
                testReview.model,
                testReview.user.username,
                testReview.score,
                current_date,
                testReview.comment
            );
            expect(response).toBe(undefined);
        });

        test("It should return ProductNotFoundError", async () => {
            jest.resetAllMocks();
            const testReview = {
                model: "test_model",
                user: new User("test_username", "test_name", "test_surname", Role.CUSTOMER, "test_address", "2001-09-11"),
                score: 3,
                comment: "test_comment"
            }
            jest.spyOn(ReviewDAO.prototype, "createReview").mockRejectedValueOnce(new ProductNotFoundError());
            const controller = new ReviewController();

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const current_date = `${year}-${month}-${day}`;

            await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)
                .catch((err) => {
                    expect(err).toBeInstanceOf(ProductNotFoundError)
                });

            expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(
                testReview.model,
                testReview.user.username,
                testReview.score,
                current_date,
                testReview.comment
            );
        });

        test("It should return ExistingReviewError", async () => {
            jest.resetAllMocks();
            const testReview = {
                model: "test_model",
                user: new User("test_username", "test_name", "test_surname", Role.CUSTOMER, "test_address", "2001-09-11"),
                score: 3,
                comment: "test_comment"
            }
            jest.spyOn(ReviewDAO.prototype, "createReview").mockRejectedValueOnce(new ExistingReviewError());
            const controller = new ReviewController();

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const current_date = `${year}-${month}-${day}`;

            await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)
                .catch((err) => {
                    expect(err).toBeInstanceOf(ExistingReviewError)
                });

            expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(
                testReview.model,
                testReview.user.username,
                testReview.score,
                current_date,
                testReview.comment
            );
        });
    // });

    // describe("Controller.getProductReviews tests", () => {
        // getProductReviews tests
        test("It should return ProductReview[]", async () => {
            jest.resetAllMocks();
            const testModel = "test_model";
            const testUser1 = "test_user1";
            const testUser2 = "test_user2";
            const productReview = [
                new ProductReview(testModel, testUser1, 5, "2001-09-11", "test_comment1"),
                new ProductReview(testModel, testUser2, 5, "2002-09-11", "test_comment2")
            ];
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModel").mockResolvedValueOnce(productReview);
            const controller = new ReviewController();

            const response = await controller.getProductReviews(testModel);

            expect(ReviewDAO.prototype.getReviewsByModel).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.getReviewsByModel).toHaveBeenCalledWith(
                testModel
            );
            expect(response).toBe(productReview);
        });

        test("It should return ProductNotFoundError", async () => {
            jest.resetAllMocks();
            const testModel = "test_model";
            const testUser1 = "test_user1";
            const testUser2 = "test_user2";
            const productReview = [
                new ProductReview(testModel, testUser1, 5, "2001-09-11", "test_comment1"),
                new ProductReview(testModel, testUser2, 5, "2002-09-11", "test_comment2")
            ];
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModel").mockRejectedValueOnce(new ProductNotFoundError())
            const controller = new ReviewController();

            await expect(controller.getProductReviews(testModel)).rejects.toThrowError(new ProductNotFoundError());

            expect(ReviewDAO.prototype.getReviewsByModel).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.getReviewsByModel).toHaveBeenCalledWith(
                testModel
            );
        });
    // });

    // describe("Controller.deleteReview tests", () => {
        // deleteReview tests
        test("It should return undefined", async () => {
            jest.resetAllMocks();
            const testReview = {
                model: "test_model",
                user: new User("test_username", "test_name", "test_surname", Role.CUSTOMER, "test_address", "2001-09-11"),
            }
            jest.spyOn(ReviewDAO.prototype, "deleteReviewByModel").mockResolvedValueOnce(undefined);
            const controller = new ReviewController();
            const response = await controller.deleteReview(testReview.model, testReview.user);

            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalledWith(
                testReview.model,
                testReview.user.username
            );
            expect(response).toBe(undefined);
        });

        test("It should return ProductNotFoundError", async () => {
            jest.resetAllMocks();
            const testReview = {
                model: "test_model",
                user: new User("test_username", "test_name", "test_surname", Role.CUSTOMER, "test_address", "2001-09-11"),
            }
            jest.spyOn(ReviewDAO.prototype, "deleteReviewByModel").mockRejectedValueOnce(new ProductNotFoundError());
            const controller = new ReviewController();
            
            await controller.deleteReview(testReview.model, testReview.user)
                .catch((err) => {
                    expect(err).toBeInstanceOf(ProductNotFoundError)
                });

            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalledWith(
                testReview.model,
                testReview.user.username
            );
        });

        test("It should return NoReviewProductError", async () => {
            jest.resetAllMocks();
            const testReview = {
                model: "test_model",
                user: new User("test_username", "test_name", "test_surname", Role.CUSTOMER, "test_address", "2001-09-11"),
            }
            jest.spyOn(ReviewDAO.prototype, "deleteReviewByModel").mockRejectedValueOnce(new NoReviewProductError());
            const controller = new ReviewController();
            
            await controller.deleteReview(testReview.model, testReview.user)
                .catch((err) => {
                    expect(err).toBeInstanceOf(NoReviewProductError)
                });

            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalledWith(
                testReview.model,
                testReview.user.username
            );
        });

        // deleteReviewsOfProduct tests
        test("It should return undefined", async () => {
            jest.resetAllMocks();
            const test_model = "test_model"
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviewsByModel").mockResolvedValueOnce(undefined);
            const controller = new ReviewController();
            const response = await controller.deleteReviewsOfProduct(test_model);

            expect(ReviewDAO.prototype.deleteAllReviewsByModel).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteAllReviewsByModel).toHaveBeenCalledWith(
                test_model
            );
            expect(response).toBe(undefined);
        });

        test("It should return ProductNotFoundError", async () => {
            jest.resetAllMocks();
            const test_model = "test_model"
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviewsByModel").mockRejectedValueOnce(new ProductNotFoundError());
            const controller = new ReviewController();
            
            await controller.deleteReviewsOfProduct(test_model)
                .catch((err) => {
                    expect(err).toBeInstanceOf(ProductNotFoundError)
                });

            expect(ReviewDAO.prototype.deleteAllReviewsByModel).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteAllReviewsByModel).toHaveBeenCalledWith(
                test_model
            );
        });

        // deleteAllReviews tests
        test("It should return undefined", async () => {
            jest.resetAllMocks();
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined);
            const controller = new ReviewController();
            const response = await controller.deleteAllReviews();

            expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
            expect(response).toBe(undefined);
        });
    // });
// });