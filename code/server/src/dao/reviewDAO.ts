import db from "../db/db"
import { ProductNotFoundError } from "../errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError"
import { ProductReview } from "../components/review"
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    createReview(model: string, username: string, score: number, date: string, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                // check if model exists
                const sql_check_model = "SELECT model FROM products WHERE model = ?"
                db.get(sql_check_model, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new ProductNotFoundError())
                        return
                    }
                })
                const sql = "INSERT INTO reviews(model, username, score, date, comment) VALUES(?, ?, ?, ?, ?)"
                db.run(sql, [model, username, score, date, comment], (err: Error | null) => {
                    if (err) {
                        // if element already in database then error ExistingReviewError
                        if (err.message.includes("UNIQUE constraint failed: reviews.model, reviews.username")) {
                            reject(new ExistingReviewError);
                            return;
                        }
                        reject(err);
                        return;
                    }
                    resolve(undefined)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    getReviewsByModel(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            try {
                const sql_check_model = "SELECT model FROM products WHERE model = ?"
                db.get(sql_check_model, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new ProductNotFoundError())
                        return
                    }
                })
                const sql = "SELECT * FROM reviews WHERE model = ?"
                db.all(sql, [model], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    const reviews: ProductReview[] = rows.map(row => new ProductReview(row.model, row.username, row.score, row.date, row.comment))
                    resolve(reviews)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteReviewByModel(model: string, username: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql_check_model = "SELECT model FROM products WHERE model = ?"
                db.get(sql_check_model, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new ProductNotFoundError())
                        return
                    }
                })
                const sql = "DELETE FROM reviews WHERE model = ? AND username = ?"
                db.run(sql, [model, username], function (err: Error | null) {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (this.changes === 0) {
                        reject(new NoReviewProductError())
                        return
                    }
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteAllReviewsByModel(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql_check_model = "SELECT model FROM products WHERE model = ?"
                db.get(sql_check_model, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new ProductNotFoundError())
                        return
                    }
                })
                const sql = "DELETE FROM reviews WHERE model == ?"
                db.run(sql, [model], function (err: Error | null) {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM reviews"
                db.run(sql, function (err: Error | null) {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default ReviewDAO;