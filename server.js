const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve index.html

// In-memory storage
let users = [];
let carts = [];
let orders = [];
const products = [
    {
        id: '1',
        name: 'Laptop',
        price: 999.99,
        description: 'High-performance laptop with 16GB RAM and 512GB SSD.',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'
    },
    {
        id: '2',
        name: 'Smartphone',
        price: 499.99,
        description: 'Latest smartphone with 5G support and 128GB storage.',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897208'
    },
    {
        id: '3',
        name: 'Headphones',
        price: 79.99,
        description: 'Wireless noise-cancelling headphones.',
        image: 'https://images.unsplash.com/photo-1505740106531-4243f3831145'
    }
];

// Helper function to generate ID
function generateId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}

// API Endpoints

// Get all products
app.get('/api/products', (req, res) => {
    res.json({ products });
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Register user
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    if (users.find(u => u.email === email)) {
        return res.json({ success: false, message: 'Email already exists' });
    }
    const user = { id: generateId(), email, password };
    users.push(user);
    res.json({ success: true });
});

// Login user
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ success: true, user: { id: user.id, email: user.email } });
    } else {
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

// Add to cart
app.post('/api/cart', (req, res) => {
    const { userId, productId } = req.body;
    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    let userCart = carts.find(c => c.userId === userId);
    if (!userCart) {
        userCart = { userId, items: [] };
        carts.push(userCart);
    }
    const cartItem = userCart.items.find(i => i.productId === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        userCart.items.push({ productId, quantity: 1 });
    }
    res.status(200).send();
});

// Get cart
app.get('/api/cart', (req, res) => {
    const { userId } = req.query;
    const userCart = carts.find(c => c.userId === userId) || { userId, items: [] };
    const cart = userCart.items.map(item => ({
        product: products.find(p => p.id === item.productId),
        quantity: item.quantity
    }));
    res.json({ cart });
});

// Update cart
app.put('/api/cart', (req, res) => {
    const { userId, productId, quantity } = req.body;
    const userCart = carts.find(c => c.userId === userId);
    if (userCart) {
        const cartItem = userCart.items.find(i => i.productId === productId);
        if (cartItem && quantity > 0) {
            cartItem.quantity = quantity;
        }
    }
    res.status(200).send();
});

// Remove from cart
app.delete('/api/cart', (req, res) => {
    const { userId, productId } = req.body;
    const userCart = carts.find(c => c.userId === userId);
    if (userCart) {
        userCart.items = userCart.items.filter(i => i.productId !== productId);
    }
    res.status(200).send();
});

// Place order
app.post('/api/orders', (req, res) => {
    const { userId } = req.body;
    const userCart = carts.find(c => c.userId === userId);
    if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }
    let total = 0;
    const items = userCart.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        total += product.price * item.quantity;
        return { product, quantity: item.quantity };
    });
    const order = {
        id: generateId(),
        userId,
        items,
        total: total.toFixed(2),
        date: new Date()
    };
    orders.push(order);
    userCart.items = []; // Clear cart
    res.json({ success: true, order });
});

// Get orders
app.get('/api/orders', (req, res) => {
    const { userId } = req.query;
    const userOrders = orders.filter(o => o.userId === userId);
    res.json({ orders: userOrders });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});