const express = require("express");
const bonjour = require("bonjour")();
const Chance = require("chance");
let chance = new Chance();

const operatingSystem = process.platform;

const osTable = {
    aix: "AIX",
    darwin: "macOS",
    freebsd: "FreeBSD",
    linux: "Linux",
    openbsd: "OpenBSD",
    sunos: "Solaris",
    win32: "Windows",
    android: "Android",
};

const app = express();
const port = 58585;
const random = chance.string({
    length: 15,
    alpha: true,
    numeric: true,
    casing: "lower",
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    // Advertise the server using Bonjour
    bonjour.publish({
        name: "Passpocket Sync Server",
        type: "http",
        port: port,
        host: `${random}-passpocket.local`,
        txt: {
            os: osTable[operatingSystem],
        },
    });

    console.log("Server advertised using Bonjour");
});
