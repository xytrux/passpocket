const express = require('express');
const crypto = require('crypto');
const app = express();
const bonjour = require("bonjour")();
const Chance = require("chance");
let chance = new Chance();
let port = 58585;

let encryptedData;
let dataTimeout;

// SHA256
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}

// Parse JSON bodies
app.use(express.json());

// sync server for password manager

app.post('/registerData', (req, res) => {
    console.log(req.body);
    // save body somewhere for later
    const body = JSON.stringify(req.body);

    // Encrypt the data
    const password = req.query.password; // Get the password from the query parameters
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update(password).digest(), iv);
    let encrypted = cipher.update(body, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    encryptedData = {
        content: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
    res.send('1');
    // clear after 2 minutes
    dataTimeout = setTimeout(() => {
        encryptedData = null;
    }, 12e4);
});

app.get('/getData', async (req, res) => {
    try {
        // Decrypt the data
        const password = await sha256(req.query.password); // Get the password from the query parameters
        const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(password).digest(), Buffer.from(encryptedData.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // send the data
        res.send(JSON.parse(decrypted));
        // clear original variable
        encryptedData = null;
        // clear timeout
        clearTimeout(dataTimeout);
    } catch (error) {
        console.warn(error);
        // Send a response with status code 418 and a body of "-1" if anything goes wrong
        res.status(418).send('-1');
    }
});

app.get('/isDataClaimed', (req, res) => {
    res.send(encryptedData ? '0' : '1');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});