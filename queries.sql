-- SQLite
CREATE TABLE reviews (
    model TEXT NOT NULL,
    username TEXT NOT NULL,
    score INTEGER,
    date DATE,
    comment VARCHAR(500),
    CONSTRAINT PK_reviews PRIMARY KEY (model, username)
);
CREATE TABLE "products" (
	"sellingPrice"	NUMERIC NOT NULL,
	"model"	TEXT NOT NULL UNIQUE,
	"category"	NUMERIC NOT NULL,
	"arrivalDate"	TEXT,
	"details"	TEXT,
	"quantity"	NUMERIC NOT NULL,
	PRIMARY KEY("model")
);
CREATE TABLE carts (
	id                  INTEGER,
	customer	        TEXT NOT NULL,
	paid	            INTEGER,
	paymentDate	        DATE,
	total	            INTEGER NOT NULL,
	products_in_cart	TEXT NOT NULL,
	PRIMARY KEY(id AUTOINCREMENT)
);
CREATE TABLE "users" (
	"username"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"surname"	TEXT NOT NULL,
	"role"	TEXT NOT NULL,
	"password"	TEXT,
	"salt"	TEXT,
	"address"	TEXT,
	"birthdate"	TEXT,
	PRIMARY KEY("username")
);

-- PRODUCTS
INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity)
VALUES ("iphone12", "smartphone", 567.3, '2001-09-11', "test_comment", 3);
INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity)
VALUES ("samsung12", "smartphone", 567.3, '2001-09-11', "test_comment", 3);
INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity)
VALUES ("wawei", "smartphone", 567.3, '2001-09-11', "test_comment", 3);
INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity)
VALUES ("alcatel", "smartphone", 567.3, '2001-09-11', "test_comment", 3);

-- REVIEWS
INSERT INTO reviews(model, username, score, date, comment)
VALUES("iphone12", "ccc", 5, '2002-11-09', "ciaociao");
INSERT INTO reviews(model, username, score, date, comment)
VALUES("iphone12", "cc", 5, '2002-11-09', "ciaociao");
INSERT INTO reviews(model, username, score, date, comment)
VALUES("samsung12", "cc", 5, '2002-11-09', "ciaociao");
INSERT INTO reviews(model, username, score, date, comment)
VALUES("wawei", "cc", 5, '2002-11-09', "ciaociao");
INSERT INTO reviews(model, username, score, date, comment)
VALUES("alcatel", "cc", 5, '2002-11-09', "ciaociao");

-- CARTS
INSERT INTO carts (id, customer, paid, paymentDate, total, products_in_cart)
VALUES (1, 'prova', 1, "2024-05-25", 1134.6, '[{"model": "iphone12", "quantity": 1, "category": "Smartphone", "price": 567.3}, {"model": "samsung12", "quantity": 1, "category": "Smartphone", "price": 567.3}]');
INSERT INTO carts (id, customer, paid, paymentDate, total, products_in_cart)
VALUES (2, 'prova', 0, NULL, 0, '[]');
INSERT INTO carts (id, customer, paid, paymentDate, total, products_in_cart)
VALUES (3, 'ccc', 0, NULL, 1701.9, '[{"model": "alcatel", "quantity": 3, "category": "Smartphone", "price": 567.3}]');
INSERT INTO carts (id, customer, paid, paymentDate, total, products_in_cart)
VALUES (4, 'ccc', 1, '2024-05-20', 1134.6, '[{"model": "iphone12", "quantity": 2, "category": "Smartphone", "price": 567.3}]');

-- delete table
DROP TABLE carts;
DROP TABLE reviews;
DROP TABLE users;
DROP TABLE products;

-- delete entries in tables
DELETE FROM carts;
DELETE FROM reviews;
DELETE FROM users;
DELETE FROM products;
