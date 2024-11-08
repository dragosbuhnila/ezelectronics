import moment from "moment";
import { Product, Category } from "../components/product"
import db from "../db/db"
import { ModelAlreadyExistsError, LowProductStockError, ProductNotFoundError, EmptyProductStockError } from "../errors/productError"
import { ProductInCart } from "../components/cart";
import e from "express";
import { DateError } from "../utilities";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    
/**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string): Promise<void>{ 
    return new Promise<void>((resolve, reject) => {
        try {
            const sql = "INSERT INTO products(sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)"
            db.run(sql,[sellingPrice, model, category, arrivalDate, details, quantity], (err: Error | null) => {
                if (err) {
                    if(err.message.includes("UNIQUE constraint failed: products.model")){
                        reject(new ModelAlreadyExistsError);
                        return;
                    }
                }
                resolve();
                return;
            })
        } catch (error) {
            reject(error)    
        }
    });
}

/**
 * Increases the available quantity of a product through the addition of new units.
 * @param model The model of the product to increase.
 * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
 * @param changeDate The optional date in which the change occurred.
 * @returns A Promise that resolves to the new available quantity of the product.
 */
changeProductQuantity(model: string, newQuantity: number, changeDate: string): Promise<number>{
    return new Promise<number>((resolve, reject) => {
        try {
            const sqlCtrl = "SELECT arrivalDate FROM products where model = ?"
            const sql = "UPDATE products SET quantity = quantity + ? where model = ?"
            db.get(sqlCtrl, [model], (err: Error | null, row: {arrivalDate: string}) => {
                if (err) {
                    reject(err);
                    return;
                }
                if(row == null) {
                    reject(new ProductNotFoundError);
                    return;
                }
                if (moment(changeDate).isBefore(moment(row.arrivalDate)) ) {
                    reject(new DateError());
                    return;
                }
            
                db.run(sql, [newQuantity, model], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    } else {
                    const sqlr = "SELECT quantity FROM products WHERE model = ?"
                        db.get(sqlr, [model], (err: Error | null, row: { quantity: number}) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if(row == null) {
                                reject(new ProductNotFoundError);
                                return;
                            }
                            resolve(row.quantity);
                        })
                    }
                })
            });
        } catch (error) {
            reject(error);
        }
    });
 }

 /**
 * Decreases the available quantity of a product through the sale of units.
 * @param model The model of the product to sell
 * @param quantity The number of product units that were sold.
 * @param sellingDate The optional date in which the sale occurred.
 * @returns A Promise that resolves to the new available quantity of the product.
 */
sellProduct(model: string, quantity: number, sellingDate: string):Promise<void>{
    return new Promise<void>((resolve, reject) => {
        try {
            if (moment(sellingDate).isAfter(moment())) {
                reject(new DateError());
                return;
            }
            const sqlCtrl = "SELECT quantity, arrivalDate FROM products where model = ?"
            db.get(sqlCtrl, [model], (err: Error | null, row: { quantity: number, arrivalDate: string}) => {
                if (err) {
                    reject(err);
                    return;
                }
                if(row == null) {
                    reject(new ProductNotFoundError);
                    return;
                }
                if (moment(sellingDate).isBefore(moment(row.arrivalDate)) ) {
                    reject(new DateError());
                    return;
                }
                if (row.quantity == 0) {
                    reject(new EmptyProductStockError());
                    return;
                } else if (quantity > row.quantity) {
                    reject(new LowProductStockError());
                    return;
                }
                const sql = "UPDATE products SET quantity = quantity - ? where model = ?"
                db.run(sql, [quantity, model], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                    return;
                })
            })
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Returns all products in the database, with the option to filter them by category or model.
 * @param grouping An optional parameter. If present, it can be either "category" or "model".
 * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
 * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
 * @returns A Promise that resolves to an array of Product objects.
 */
getProducts():Promise<Product[]>{
    return new Promise<Product[]>((resolve, reject) => {
        try{
            const sql = "SELECT * FROM products"
            db.all(sql, [], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err)
                    return;
                }
                const products: Product[] = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                resolve(products)
            })
        } catch (error) {
            reject(error);
        }
    })
}

getProductsByCategory(category: string): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
        try {
            const sql = "SELECT * FROM products WHERE category = ?"
            db.all(sql, [category], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err)
                    return;
                }
                const products: Product[] = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                resolve(products)
            })
        } catch (error) {
            reject(error)
        }
    })
}

getProductsByModel(model: string): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
        try {
            const sql = "SELECT * FROM products WHERE model = ?"
            db.all(sql, [model], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err)
                    return;
                }
                const products: Product[] = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                if (products.length == 0) {
                    reject(new ProductNotFoundError)
                    return;
                } else {
                    resolve(products)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}
/**
 * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
 * @param grouping An optional parameter. If present, it can be either "category" or "model".
 * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
 * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
 * @returns A Promise that resolves to an array of Product objects.
 */
getAvailableProducts():Promise<Product[]>{    
    return new Promise<Product[]>((resolve, reject) => {
        try {
            const sql = "SELECT * FROM products WHERE quantity > 0"
            db.all(sql, [], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(new EmptyProductStockError)
                    return;
                }
                const products: Product[] = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                resolve(products)
            })
        } catch (error) {
            reject(error);
        }
    });
}

getAvailableProductsByCategory(category: string):Promise<Product[]>{    
    return new Promise<Product[]>((resolve, reject) => {
        try {
            const sql = "SELECT * FROM products WHERE quantity > 0 AND category = ?"
            db.all(sql, [category], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err)
                    return;
                }
                const products: Product[] = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                resolve(products)
            })
        } catch (error) {
            reject(error);
        }
    });
}

getAvailableProductsByModel(model: string):Promise<Product[]>{    
    return new Promise<Product[]>((resolve, reject) => {
        try {
            const sqlr = "SELECT quantity FROM products WHERE model = ?"
            db.get(sqlr, [model], (err: Error | null, row: { quantity: number}) => {
                if (err) {
                    reject(err);
                    return;
                }
                if(row == null) {
                    reject(new ProductNotFoundError);
                    return;
                }
                else {
                    const sql = "SELECT * FROM products WHERE quantity > 0 AND model = ?"
                    db.all(sql, [model], (err: Error | null, rows: any[]) => {
                        if (err) {
                            reject(err)
                            return;
                        }
                        const products: Product[] = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                        resolve(products)
                        return
                    })
                }
            })
        } catch (error) {
            reject(error);
        }
    });
}


/**
 * Deletes all products.
 * @returns A Promise that resolves to `true` if all products have been successfully deleted.
 */
deleteAllProducts(): Promise<Boolean> {
    return new Promise<Boolean>((resolve, reject) => {
        try {
            // 1) Actual product deletion
            const sql = "DELETE FROM products";
            db.run(sql, [], (err: Error | null) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // 2) Cascade emptying of the carts that are not paid yet
                const sql = "UPDATE carts SET products_in_cart = '[]', total = 0 WHERE paid = 0";
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(true);
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Deletes one product, identified by its model
 * @param model The model of the product to delete
 * @returns A Promise that resolves to `true` if the product has been successfully deleted.
 */
deleteProduct(model: string):Promise<Boolean>{
    return new Promise<Boolean>((resolve, reject) => {
        try {
            // check if the product exists
            const sqlx = "SELECT * FROM products WHERE model = ?"
            db.get(sqlx, [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new ProductNotFoundError);
                    return;
                }
                else {
                    const sql = "DELETE FROM products WHERE model = ?"
                    db.run(sql, [model], (err: Error | null, check: any) => {
                        if (err) {
                            reject(new ProductNotFoundError);
                            return;
                        }
        
                        // 2) Cascade removal of the product from the carts
                        // 2.1) For all carts that are not paid yet, retrieve the list of products in the cart,
                        const sql = "SELECT * FROM carts WHERE paid = 0"
                        db.all(sql, [], (err: Error | null, rows: any[]) => {
                            if (err) {
                                reject(err)
                                return;
                            }                            
                            // 2.2) Remove move the item that has the removed model
                            let some_failed = false;
                            rows.forEach((cart) => {
                                const products_in_cart = (JSON.parse(cart.products_in_cart) as any[]).map(obj => new ProductInCart(obj.model, obj.quantity, obj.category, obj.price));
                                const new_products_in_cart = products_in_cart.filter((product) => product.model !== model);
                                const new_total = new_products_in_cart.reduce((acc, product) => acc + product.price, 0);
        
                                // 2.3) Finally update the carts.
                                const sql = "UPDATE carts SET products_in_cart = ?, total = ? WHERE customer = ? AND paid = 0";
                                    db.run(sql, [JSON.stringify(new_products_in_cart), new_total, cart.customer], (err)  => {
                                        if (err) {
                                            some_failed = true;
                                        }
                                    });
                            })
                            if (some_failed) {
                                reject(new Error("Some carts were not updated"));
                                return;
                            }
                            resolve(true);
                        })
                    })
                }
            });
        } catch (error) {
            //console.log("Error in deleteProduct: " + error)
            reject(error)
        }
    })
}

/***************************************************************************/

    getProductByModel(productId: string): Promise<Product | null> {
        return new Promise<Product | null>((resolve, reject) => {
            const sql = "SELECT * FROM products WHERE id = ?";
            db.get(sql, [productId], (err, row: any) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve(new Product(
                    row.sellingPrice,
                    row.model,
                    row.category as Category,
                    row.arrivalDate,
                    row.details,
                    row.quantity
                ));
            });
        });
    }


    decreaseProductQuantityByModel(model: string)/*: Promise<boolean>*/ { }
}

export default ProductDAO


