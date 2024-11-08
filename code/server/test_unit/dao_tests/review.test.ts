import { describe, test, expect, beforeAll, afterAll, jest, beforeEach } from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3";
import { Category, Product } from "../../src/components/product";
import { ProductReview } from "../../src/components/review";

jest.mock("../../src/db/db.ts")

/* =================== createReview tests =================== */
describe('ReviewDAO - createReview Tests', () => {
    test('It should return resolve undefined', async () => {
        let reviewDAO = new ReviewDAO();
        const spy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const review = new ProductReview(
            "test_model",
            "test_username",
            5,
            "2001-09-11",
            "test_comment"
        )
        const result = await reviewDAO.createReview(review.model, review.user, review.score, review.date, review.comment);
        expect(result).toBe(undefined);
    });
});

/* =================== getReviewsByModel tests =================== */
describe('ReviewDAO - getReviewsByModel Tests', () => {
    test('It should return resolve an array of ProductReview objects', async () => {
        let reviewDAO = new ReviewDAO();
        // mock db.all so that it resolves with an array of ProductReview objects
        const spy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(null, [
                { model: "test_model1", username: "test_username1", score: 5, date: "2001-09-11", comment: "test_comment1" },
                { model: "test_model2", username: "test_username2", score: 4, date: "2002-09-11", comment: "test_comment2" }
            ]);
            return {} as Database;
        });
        const result = await reviewDAO.getReviewsByModel("test_model");
        expect(result).toEqual([
            // an array of ProductReview objects
            new ProductReview("test_model1", "test_username1", 5, "2001-09-11", "test_comment1"),
            new ProductReview("test_model2", "test_username2", 4, "2002-09-11", "test_comment2")
        ])
    });
});

/* =================== deleteReviewByModel tests =================== */
describe('ReviewDAO - deleteReviewByModel Tests', () => {
    test('It should return resolve undefined', async () => {
        let reviewDAO = new ReviewDAO();
        // mock db.get so that no error is rejected
        const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, { model: "test_model" });
            return {} as Database;
        });
        // mock db.run so that it resolves with undefined
        const spy2 = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
            return {} as Database;
        });
        const result = await reviewDAO.deleteReviewByModel("test_model", "test_username");
        expect(result).toBe(undefined);
    });
});

/* =================== deleteAllReviewsByModel tests =================== */
describe('ReviewDAO - deleteAllReviewsByModel Tests', () => {
    test('It should return resolve undefined', async () => {
        let reviewDAO = new ReviewDAO();
        // mock db.get so that no error is rejected
        const spy = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, { model: "test_model" });
            return {} as Database;
        });
        // mock db.run so that it resolves with undefined
        const spy2 = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const result = await reviewDAO.deleteAllReviewsByModel("test_model");
        expect(result).toBe(undefined);
    });
});

/* =================== deleteAllReviews tests =================== */
describe('ReviewDAO - deleteAllReviews Tests', () => {
    test('It should return resolve undefined', async () => {
        let reviewDAO = new ReviewDAO();
        // mock db.run so that it resolves with undefined
        const spy = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
            callback(null);
            return {} as Database;
        });
        const result = await reviewDAO.deleteAllReviews();
        expect(result).toBe(undefined);
    });
});