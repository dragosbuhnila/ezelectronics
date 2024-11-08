import { User } from "../components/user";
import { Cart, ProductInCart } from "../components/cart";
import { Category, Product } from "../components/product"
import ProductDAO from "../dao/productDAO";
import { ProductNotFoundError, EmptyProductStockError } from "../errors/productError";

import db from "../db/db"

const isValidCategoryEnum = (value: any): value is Category => {
    return Object.values(Category).includes(value);
}

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
    getUnpaidCart(username: string): Promise<Cart | null> {        
        return new Promise<Cart | null>((resolve, reject) => {
            // Check_1: Input validation
            if (username.length === 0) {
                return reject(new Error('Invalid username, should have length > 0'));
            } 
            
            // 1) Fetch all unpaid carts for the user (should be at most 1)
            const sql = "SELECT * FROM carts WHERE customer = ? AND paid = 0";
            db.all(sql, [username], (err, rows: any[]) => {
                if (err) return reject(err);
                // Check_2: At most one unpaid cart should exist for a user
                if (rows.length > 1) {
                    return reject(new Error('More than one unpaid cart found'));
                }

                // 2) If no unpaid cart exists, return null
                if (rows.length === 0) return resolve(null);

                // 3) If an unpaid cart exists, return the cart
                const row = rows[0];

                // Check_3: Check if the products_in_cart field is a valid JSON
                let products_in_cart;
                try {
                    products_in_cart = (JSON.parse(row.products_in_cart) as any[]).map(obj => new ProductInCart(obj.model, obj.quantity, obj.category, obj.price));
                } catch (error) {
                    // console.log('Error parsing JSON in getUnpaidCart. The provided JSON string is: ', row.products_in_cart);
                    // console.log('Error message: ', error);
                    return reject(new Error("Invalid product_in_cart_list JSON"));
                }

                resolve(new Cart(
                    row.customer,
                    row.paid === 1,
                    row.paymentDate ? row.paymentDate : null,
                    row.total,
                    products_in_cart
                ));
            });
        });
    }


    createCart(username: string): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            // Input validation
            if (username.length === 0) {
                return reject(new Error('Invalid username, should have length > 0'));
            }   

            // select empty carts
            const sql_empty_cart = "SELECT * FROM carts WHERE customer = ? AND paid = 0";
            
            db.get(sql_empty_cart, [username], (err, row: any) => {
                if (err) return reject(new Error("db.get failed"));
                if (row) return reject(new Error('Unpaid cart already exists for this user'));

                const sql = "INSERT INTO carts (customer, paid, paymentDate, total, products_in_cart) VALUES (?, 0, '', 0, ?)";
                const emptyProducts: ProductInCart[] = [];
                db.run(sql, [username, JSON.stringify(emptyProducts)], function (err) {
                    if (err) return reject(new Error("db.run failed"));
                    resolve(new Cart(
                        username,
                        false,
                        '',
                        0,
                        emptyProducts
                    ));
                });
            });
        });
    }


    // // Version with Retries
    // updateCurrentCartContent(cart: Cart, retryCount = 5, retryDelay = 200): Promise<boolean> {
    //     return new Promise<boolean>((resolve, reject) => {
    //         const sql = "UPDATE carts SET products_in_cart = ?, total = ? WHERE customer = ? AND paid = 0";
    
    //         const tryUpdate = (attempt: any) => {
    //             db.run(sql, [JSON.stringify(cart.products), cart.total, cart.customer], function (err: any) {
    //                 if (err) {
    //                     if (err.code === 'SQLITE_BUSY' && attempt < retryCount) {
    //                         console.log(`Database is busy. Retrying ${attempt + 1}/${retryCount}...`);
    //                         setTimeout(() => tryUpdate(attempt + 1), retryDelay);
    //                     } else {
    //                         console.log("Update cart failed");
    //                         return reject(err);
    //                     }
    //                 } else {
    //                     resolve(true);
    //                 }
    //             });
    //         };
    
    //         tryUpdate(0);
    //     });
    // }


    updateCurrentCartContentAndTotal(cart: Cart): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            // Check_1) username is not zero-length
            if (cart.customer.length === 0) return reject(new Error('Invalid username, should have length > 0'));

            // Check_2) Cannot update a paid cart
            if (cart.paid === true) return reject(new Error('Cannot update a paid cart'));

            // Check_3) total is >= 0
            if (cart.total < 0) return reject(new Error('Invalid total, should be >= 0'));

            const sql_empty_cart = "SELECT * FROM carts WHERE customer = ? AND paid = 0";
            db.all(sql_empty_cart, [cart.customer], (err, rows: any[]) => {
                if (err) return reject(new Error("db.all failed"));

                // Check_4) there is an unpaid cart for the user
                if (rows.length === 0) return reject(new Error('No unpaid cart found'));
                
                // Check_5) there is at most one unpaid cart for the user
                if (rows.length > 1) return reject(new Error('More than one unpaid cart found'));

                // 1) Actually update the cart
                const sql = "UPDATE carts SET products_in_cart = ?, total = ? WHERE customer = ? AND paid = 0";
                db.run(sql, [JSON.stringify(cart.products), cart.total, cart.customer], function (err) {
                    if (err) {
                        return reject(new Error('db.run failed'));
                    }
                    resolve(true);
                });
            });
        });
    }


    payCurrentCart(username: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            // Input validation
            // 1) Check if the username is not zero-length
            if (username.length === 0) {
                return reject(new Error('Invalid username, should have length > 0'));
            }

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            var currentDate: string = `${year}-${month}-${day}`;
            // console.log(currentDate, username);
    
            const sql = "UPDATE carts SET paid = 1, paymentDate = ? WHERE customer = ? AND paid = 0";
            db.run(sql, [currentDate, username], function (err) {
                if (err) return reject(err);
                resolve(true);
            });
        });
    }

    
    getPaidCarts(username: string): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            // Input validation
            if (username.length === 0) {
                return reject(new Error('Invalid username, should have length > 0'));
            }

            const sql = "SELECT * FROM carts WHERE customer = ? AND paid = 1";
            db.all(sql, [username], (err, rows: any[]) => {
                if (err) return reject(err);
                if (rows.length === 0) return resolve([]);
                const carts: Cart[] = rows.map(row => {
                    // console.log(row);  
                    const products_in_cart = (JSON.parse(row.products_in_cart) as any[]).map(obj => new ProductInCart(obj.model, obj.quantity, obj.category, obj.price));
                    return new Cart(
                        row.customer,
                        row.paid === 1,
                        row.paymentDate ? row.paymentDate : null,
                        row.total,
                        products_in_cart
                    );
                });
                resolve(carts);
            });
        });
    }


    getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            const sql = "SELECT * FROM carts";
            db.all(sql, [], (err, rows: any[]) => {
                if (err) return reject(err);
                const carts: Cart[] = rows.map(row => {
                    const products_in_cart = (JSON.parse(row.products_in_cart) as any[]).map(obj => new ProductInCart(obj.model, obj.quantity, obj.category, obj.price));
                    return new Cart(
                        row.customer,
                        row.paid === 1,
                        row.paymentDate ? row.paymentDate : null,
                        row.total,
                        products_in_cart
                    );
                });
                resolve(carts);
            });
        });
    }


    deleteAllCarts(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sql = "DELETE FROM carts"
            db.run(sql, [],  function(err) {
                if (err) return reject (err);
                resolve(true);
            })
        })
    }


    // MAY WANT TO MOVE THIS IN PRODUCT_DAO  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    updateQuantity(model: string, new_quantity: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            // Input validation
            // 1) Check if the model is not zero-length
            if (model.length === 0) {
                return reject(new Error('Invalid model, should have length > 0'));
            }
            // 2) Check if the new_quantity is not negative
            if (new_quantity < 0) {
                return reject(new Error('Invalid new_quantity, should be >= 0'));
            }

            const sql = "UPDATE products SET quantity = ?  WHERE model = ?";
            db.run(sql, [new_quantity, model], function (err) {
                if (err) return reject(err);
                resolve(true);
            });
        });
    }


    getProductByModel(model: string): Promise<Product | null> {
        return new Promise<Product | null>((resolve, reject) => {
            // Input validation
            if (model.length === 0) {
                return reject(new Error('Invalid model, should have length > 0'));
            }

            const sql = "SELECT * FROM products WHERE model = ?";
            db.get(sql, [model], (err, row: any) => {
                if (err) return reject(err);
                if (!row) return resolve(null);

                
                
                if(!isValidCategoryEnum(row.category)) {
                    // console.log(`getProductByModel: Category isn't one of the 3 specified or isn't spelled correctly -> ${row.category}`);
                    reject(new Error(`Category isn't one of the 3 specified or isn't spelled correctly`));
                }

                resolve(new Product(
                    row.sellingPrice,
                    row.model,
                    row.category,
                    row.arrivalDate,
                    row.details,
                    row.quantity
                ));
            });
        });
    }
}

export default CartDAO