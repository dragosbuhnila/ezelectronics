import { test, expect, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import ReviewController from "../../src/controllers/reviewController"
import { Role } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"
import { ProductReview } from "../../src/components/review"

const baseURL = "/ezelectronics"
const model = "test_model"
jest.mock("../../src/routers/auth")

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters

// POST /:model test
test("POST /:model should return a 200 success code", async () => {
    jest.resetAllMocks()
    const body = { //Define a test user object sent to the route
        score: 5,
        comment: "test_comment"
    }
    
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
    jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValue(undefined)
    const response = await request(app).post(baseURL + "/reviews/" + model).send(body)
    expect(response.status).toBe(200)
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
        model,
        undefined,
        body.score,
        body.comment
    )
})

// GET /:model test
test("GET /:model should return a 200 success code", async () => {
    jest.resetAllMocks()
    const product_reviews = [new ProductReview("test_model", "test_user1", 5, "2001-09-11", "test_comment"), new ProductReview("test_model", "test_user2", 5, "2001-09-11", "test_comment")]
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
    jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValue(product_reviews)
    const response = await request(app).get(baseURL + "/reviews/" + model).send()
    expect(response.status).toBe(200)
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(
        model
    )
    expect(response.body).toEqual(product_reviews)
})

// DELETE /:model test
test("DELETE /:model should return a 200 success code", async () => {
    jest.resetAllMocks()

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValue(undefined)
    const response = await request(app).delete(baseURL + "/reviews/" + model).send()
    expect(response.status).toBe(200)
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(
        model,
        undefined
    )
})

// DELETE /:model/all test
test("DELETE /:model/all should return a 200 success code", async () => {
    jest.resetAllMocks()

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValue(undefined)
    const response = await request(app).delete(baseURL + "/reviews/" + model + "/all").send()
    expect(response.status).toBe(200)
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(
        model
    )
})

// DELETE / test
test("DELETE / should return a 200 success code", async () => {
    jest.resetAllMocks()

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValue(undefined)
    const response = await request(app).delete(baseURL + "/reviews/").send()
    expect(response.status).toBe(200)
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith();
})