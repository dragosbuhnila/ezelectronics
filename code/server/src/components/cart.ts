import { Category } from "./product"

/**
 * Represents a shopping cart.
 */
class Cart {
    customer: string
    paid: boolean
    paymentDate: string
    total: number
    products: ProductInCart[]

    /**
     * Creates a new instance of the Cart class.
     * @param customer - The username of the customer who owns the cart.
     * @param paid - A boolean value indicating whether the cart has been paid for.
     * @param paymentDate - The date the cart was paid for. This is null if the cart has not been paid for.
     * @param total - The total amount of the cart. It corresponds to the sum of the prices of all the products in the cart, computed as price * quantity.
     * @param products - The products in the cart.
     */
    constructor(customer: string, paid: boolean, paymentDate: string, total: number, products: ProductInCart[]) {
        this.customer = customer
        this.paid = paid
        this.paymentDate = paymentDate
        this.total = total
        this.products = products
    }
}

class Cart_DBRepresentation {
    customer: string
    paid: number
    paymentDate: string
    total: number
    products_in_cart: string

    /**
     * Transorms a Cart object into its db representation version.
     * @param cart - The Cart object to be transformed.
     * cart.paid is converted to 1 if true, 0 if false.
     * cart.products is converted to a JSON string.
     * All the other parameters are the same as in the Cart object.
     */
    constructor(cart: Cart) {
        this.customer = cart.customer
        this.paid = (cart.paid === true ? 1 : 0)
        this.paymentDate = cart.paymentDate
        this.total = cart.total
        this.products_in_cart = JSON.stringify(cart.products)
    }
}

/**
 * Represents a product in a shopping cart.
 */
class ProductInCart {
    model: string
    quantity: number
    category: Category
    price: number

    /**
     * Creates a new instance of the ProductInCart class.
     * @param model - The model of the product.
     * @param quantity - The quantity (number of units) of the product in the cart.
     * @param category - The category of the product.
     * @param price - The price of a single product unit.
     */
    constructor(model: string, quantity: number, category: Category, price: number) {
        this.model = model
        this.quantity = quantity
        this.category = category
        this.price = price
    }
}

export { Cart, ProductInCart, Cart_DBRepresentation }
