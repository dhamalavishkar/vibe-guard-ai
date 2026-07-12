const express = require('express');
const app = express();

app.get('/user', (req, res) => {
    // SECURITY: XSS vulnerability
    const username = req.query.username;
    res.send(`<h1>Welcome, ${username}</h1>`);
});

app.get('/login', (req, res) => {
    // SECURITY: Hardcoded secrets
    const superSecretKey = "sk_live_1234567890abcdef";
    if (req.query.password === "admin123") {
        res.send("Logged in!");
    }
});

function calculateStuff() {
    // OPTIMIZATION: Dead code and unnecessary loops
    let arr = [];
    for(let i=0; i<1000; i++) {
        arr.push(i);
    }
    return true;
    console.log("This will never run");
}
