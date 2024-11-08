import { User } from "../components/user";
import { Cart, ProductInCart } from "../components/cart";
import { Product } from "../components/product"
import CartDAO from "../dao/cartDAO";
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../errors/productError";
import { CartNotFoundError, EmptyCartError, ProductInCartError, ProductNotInCartError } from "../errors/cartError";

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO

    constructor() {
        this.dao = new CartDAO
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async addToCart(user: User, product_model: string): Promise<Boolean> {
        try {
            // 1) First of all check for errors 404 or 409
            const product = await this.dao.getProductByModel(product_model);
            // console.log(`addToCart: Product is ${JSON.stringify(product)}`);
            if (!product) {
                throw new ProductNotFoundError();
            } else if (product.quantity === 0) {
                throw new EmptyProductStockError();
            } else {
                // 2) Then if the cart doesn't exist yet, create it
                let cart = await this.dao.getUnpaidCart(user.username);
                if (!cart) {
                    cart = await this.dao.createCart(user.username);
                } 
                
                // 3) Finally if the product isn't yet in the cart, add that entry to its product list
                let productInCart = cart.products.find(p => p.model === product_model);
                if (!productInCart) {
                    cart.products.push(new ProductInCart(product_model, 1, product.category, product.sellingPrice));
                } else {
                    productInCart.quantity += 1; // Be sure that productInCart is a reference, not a copy
                }

                // Update the total price of the cart
                cart.total += product.sellingPrice;
                cart.total = parseFloat(cart.total.toFixed(2))

                // console.log(`addToCart: Cart is ${JSON.stringify(cart)}`);

                // Update the cart in the database
                return this.dao.updateCurrentCartContentAndTotal(cart);
            }
        } catch (error) {
            // console.error('Error adding product to cart:', error);
            throw error;
        };
        
    }


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User): Promise<Cart> {
        try {
            const cart = await this.dao.getUnpaidCart(user.username)

            // Special cases: if unpaid cart not found for current user, or if its list is empty, return an empty Cart instead of 404
            if (!cart) {
                // return await this.dao.createCart(user.username);  // It makes some tests crash
                return new Cart(
                    user.username,
                    false,
                    null,
                    0,
                    []
                )
            } else if (cart.products.length === 0) {
                return cart;
            } else {
                return cart;
            }
        } catch (error) {
            // console.error("Error while trying to get current (unpaid) cart for user");
            throw error;
        }
     }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User): Promise<Boolean> {
        try {
            // First 2 checks: no unpaid card found, the cart's list is empty
            const unpaidCart = await this.dao.getUnpaidCart(user.username);
            if (!unpaidCart) {
                throw new CartNotFoundError();
            } else if (unpaidCart.products.length === 0) {
                throw new EmptyCartError();
            }

            let new_quantities = [];
    
            // Last 2 checks: product quantity from the products table is either 0, or the cart list's product has greater value than that
            for (const product_in_cart of unpaidCart.products) {
                const actual_product = await this.dao.getProductByModel(product_in_cart.model)
                if (actual_product.quantity === 0) {
                    throw new EmptyProductStockError();
                } else if (product_in_cart.quantity > actual_product.quantity) {
                    throw new LowProductStockError();
                }

                new_quantities.push(actual_product.quantity - product_in_cart.quantity)
            }

            // console.log(`checkoutCart second: Cart is ${JSON.stringify(unpaidCart)}`);
            // 1) Set the cart to paid and set paymentDate to current date
            const ret = await this.dao.payCurrentCart(user.username);

            // 2) Update the products in the product table by decreasing the quantities
            let i = 0;
            for (const product_in_cart of unpaidCart.products) {
                this.dao.updateQuantity(product_in_cart.model, new_quantities[i]);
                i++;
            }

            return ret;
        } catch (error) {
            // console.error('Error adding product to cart:', error);
            throw error;
        };
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User): Promise<Cart[]> {
        return this.dao.getPaidCarts(user.username);
    } 

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, product_model: string): Promise<Boolean> {
        try {
            // 1st check: cart is found, and its list is not empty
            const cart = await this.dao.getUnpaidCart(user.username);
            if (!cart) {
                throw new CartNotFoundError();
            } else if (cart.products.length === 0) {
                throw new CartNotFoundError();
            }

            // 2nd check: model does not exist in db
            const product = await this.dao.getProductByModel(product_model);
            if (!product) {
                throw new ProductNotFoundError();
            } else {
                // 3rd check: model is not found in the cart
                const productIndex = cart.products.findIndex(p => p.model === product_model);
                if (productIndex === -1) {
                    throw new ProductNotInCartError();
                }

                // 1) Decrease quantity for local product. Decrease total price for cart.
                cart.products[productIndex].quantity -= 1;
                cart.total -= cart.products[productIndex].price; 
                cart.total = parseFloat(cart.total.toFixed(2))

                // 2) Remove the product from the cart list if quantity is 0
                if (cart.products[productIndex].quantity === 0) {
                    cart.products.splice(productIndex, 1);
                }

                // 2.5) Since we deal with floats, to be extra sure, if the cart is empty set price to 0
                if (cart.products.length === 0) cart.total = 0;

                // 3) Update the cart in the database
                await this.dao.updateCurrentCartContentAndTotal(cart);

                return true; 
            }
        } catch (error) {
            // console.error('Error removing product from cart:', error);
            throw error;
        }
    }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User):Promise<Boolean> {
        try {
            // 1) Retrieve the current cart for the user
            let cart = await this.dao.getUnpaidCart(user.username);
            if (!cart) {
                throw new CartNotFoundError();
            }

            // 2) Remove all products from the cart
            cart.products = [];
            cart.total = 0;

            // 3) Update the cart in the database
            await this.dao.updateCurrentCartContentAndTotal(cart);

            return true;
        } catch (error) {
            // console.error('Error clearing cart:', error);
            throw error;
        }
    }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts(): Promise<Boolean> {
        return this.dao.deleteAllCarts();
    }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts(): Promise<Cart[]> {
        return this.dao.getAllCarts();
    }
}

export default CartController