let countdown;

function generateSecret() {
    const array = new Uint8Array(10);
    window.crypto.getRandomValues(array);
    return Array.from(array, (dec) =>
        ("0" + dec.toString(16)).substr(-2)
    ).join("");
}

function generateAuthenticator() {
    const secret = generateSecret();
    const code = otplib.authenticator.generate(secret);
    const authenticatorInput =
        document.getElementById("authenticatorInput");
    authenticatorInput.value = code;

    saveAuthenticatorCode(secret, code);

    if (countdown) {
        clearInterval(countdown);
    }
    let timeLeft = 30;
    countdown = setInterval(() => {
        timeLeft--;
        document.getElementById(
            "timer"
        ).innerText = `Code expires in ${timeLeft} seconds`;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            document.getElementById("timer").innerText =
                "Code has expired";
        }
    }, 1000);
}

function saveAuthenticatorCode(secret, code) {
    const data = { secret, code };
    localStorage.setItem(
        "authenticatorData",
        JSON.stringify(data)
    );

    const li = document.createElement("li");
    li.textContent = `Secret: ${secret}, Code: ${code}`;
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function () {
        this.parentElement.remove();
        localStorage.removeItem("authenticatorData");
    };
    li.appendChild(deleteButton);
    document.getElementById("savedCodes").appendChild(li);
}

function getToken() {
    const data = JSON.parse(
        localStorage.getItem("authenticatorData")
    );
    alert(`Secret: ${data.secret}, Code: ${data.code}`);
}

async function encryptText(text, password) {
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    // Derive a 256-bit key from the password using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    const key = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: new Uint8Array(0),
            iterations: 100000, // Adjust as needed
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );

    // Convert derived bits to a CryptoKey object
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        cryptoKey,
        encodedText
    );

    // Combine IV and encrypted data
    const encryptedBytes = new Uint8Array(
        iv.byteLength + encryptedData.byteLength
    );
    encryptedBytes.set(iv, 0);
    encryptedBytes.set(
        new Uint8Array(encryptedData),
        iv.byteLength
    );

    // Encode encrypted bytes as Base64 string
    const encryptedString = btoa(
        String.fromCharCode(...encryptedBytes)
    );

    return encryptedString;
}

async function decryptText(encryptedString, password) {
    const decoder = new TextDecoder();

    // Decode Base64 string to bytes
    const encryptedBytes = new Uint8Array(
        atob(encryptedString)
            .split("")
            .map((c) => c.charCodeAt(0))
    );

    // Extract IV and data
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);

    // Derive the same 256-bit key from the password
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    const key = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: new Uint8Array(0),
            iterations: 100000, // Adjust as needed
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );

    // Convert derived bits to a CryptoKey object
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        cryptoKey,
        data
    );

    return decoder.decode(decryptedData);
}
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        msgBuffer
    );

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}
async function setMasterPassword() {
    let masterPassword = document.getElementById(
        "masterPasswordSetInput"
    ).value;
    localStorage.setItem(
        "masterPassword",
        await sha256(masterPassword)
    );
    alert("Master password set successfully!", "success");
    showPage("masterpassword-login");
    document.getElementById("masterPasswordSetInput").value =
        "";
    document
        .getElementById("setPasswordSidebar")
        .classList.add("hidden");
    document
        .getElementById("loginSidebar")
        .classList.remove("hidden");
}
function deleteLogins() {
    if (
        !confirm("Are you sure you want to delete all logins?")
    ) {
        return;
    }
    localStorage.removeItem("masterPassword");
    localStorage.removeItem("passwords");
    alert("Logins deleted successfully!", "success");
    setTimeout(() => {
        location.reload();
    }, 1500);
}
// only show register page if master password is not set
if (localStorage.getItem("masterPasswordPlain")) {
    localStorage.removeItem("masterPasswordPlain");
}
if (!localStorage.getItem("masterPassword")) {
    showPage("masterpassword-set");
} else {
    showPage("masterpassword-login");
    document
        .getElementById("loginSidebar")
        .classList.remove("hidden");
    document
        .getElementById("setPasswordSidebar")
        .classList.add("hidden");
}
async function login() {
    let masterPassword = document.getElementById(
        "masterPasswordInput"
    ).value;
    let hashedInputPassword = await sha256(masterPassword);
    let hashedStoredPassword =
        localStorage.getItem("masterPassword");
    if (hashedInputPassword == hashedStoredPassword) {
        masterPassword = null;
        hashedInputPassword = null;
        hashedStoredPassword = null;
        localStorage.setItem(
            "masterPasswordPlain",
            document.getElementById("masterPasswordInput").value
        );

        document.getElementById("masterPasswordInput").value =
            "";
        alert("Logged in", "success");
        showPage("password-entry");
        document
            .getElementById("loginSidebar")
            .classList.add("hidden");
        document
            .getElementById("passwordEntrySidebar")
            .classList.remove("hidden");
        document
            .getElementById("passwordGeneratorSidebar")
            .classList.remove("hidden");
        document
            .getElementById("passwordDisplaySidebar")
            .classList.remove("hidden");
        document
            .getElementById("AuthenticatorSidebar")
            .classList.remove("hidden");
        document
            .getElementById("spacerSidebar")
            .classList.remove("hidden");
        document
            .getElementById("logoutSidebar")
            .classList.remove("hidden");
    } else {
        alert("Invalid master password", "failure");
    }
}
function logout() {
    if (localStorage.getItem("masterPasswordPlain")) {
        localStorage.removeItem("masterPasswordPlain");
    }
    alert("Logged out", "success");
    showPage("masterpassword-login");
    document
        .getElementById("loginSidebar")
        .classList.remove("hidden");
    document
        .getElementById("passwordEntrySidebar")
        .classList.add("hidden");
    document
        .getElementById("passwordGeneratorSidebar")
        .classList.add("hidden");
    document
        .getElementById("passwordDisplaySidebar")
        .classList.add("hidden");
    document
        .getElementById("AuthenticatorSidebar")
        .classList.add("hidden");
    document
        .getElementById("spacerSidebar")
        .classList.add("hidden");
    document
        .getElementById("logoutSidebar")
        .classList.add("hidden");
}
let userAgent = navigator.userAgent.toLowerCase();
if (userAgent.indexOf(" electron/") > -1) {
    document.getElementById("s-t-aes").disabled = false;
} else {
    document.getElementById("s-t-aes").disabled = false;
}

// const darkReader = require("darkreader");
/*
DarkReader.auto({
brightness: 100,
contrast: 90,
sepia: 10,
});
*/

// theme selection code
const themeSelection = document.getElementById("theme");
const storedTheme = localStorage.getItem("theme");
if (storedTheme) {
    themeSelection.value = storedTheme;
    if (storedTheme === "dark") {
        document.getElementById("dark").disabled = false;
        document.getElementById(
            "darkCatppuccin"
        ).disabled = true;
    } else if (storedTheme === "dark-catppuccin") {
        document.getElementById("dark").disabled = true;
        document.getElementById(
            "darkCatppuccin"
        ).disabled = false;
    } else {
        document.getElementById("dark").disabled = true;
        document.getElementById(
            "darkCatppuccin"
        ).disabled = true;
    }
}
themeSelection.addEventListener("change", (event) => {
    const theme = event.target.value;
    if (theme === "dark") {
        document.getElementById("dark").disabled = false;
        document.getElementById(
            "darkCatppuccin"
        ).disabled = true;
    } else if (theme === "dark-catppuccin") {
        document.getElementById("dark").disabled = true;
        document.getElementById(
            "darkCatppuccin"
        ).disabled = false;
    } else {
        document.getElementById("dark").disabled = true;
        document.getElementById(
            "darkCatppuccin"
        ).disabled = true;
    }
    localStorage.setItem("theme", theme);
});

function showPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");
    if (pageId === "password-display") {
        displayPasswords();
    }
}

async function storePassword() {
    const username = await encryptText(
        document.getElementById("usernameInput").value,
        localStorage.getItem("masterPasswordPlain")
    );
    const password = await encryptText(
        document.getElementById("passwordInput").value,
        localStorage.getItem("masterPasswordPlain")
    );
    const website = await encryptText(
        document.getElementById("websiteInput").value,
        localStorage.getItem("masterPasswordPlain")
    );
    let passwords =
        JSON.parse(localStorage.getItem("passwords")) || [];
    passwords.push({ username, password, website });
    localStorage.setItem(
        "passwords",
        JSON.stringify(passwords)
    );
    alert("Password stored successfully!", "success");
    username.value = "";
    password.value = "";
}

function generatePassword() {
    const length = 12;
    const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]\\{}|:\";'<>?,./~`";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(
            Math.floor(Math.random() * charset.length)
        );
    }
    document.getElementById("generatedPassword").value =
        password;
}

async function displayPasswords() {
    const passwords =
        JSON.parse(localStorage.getItem("passwords")) || [];
    const table = document.getElementById("passwordTable");
    table.innerHTML = `<tr><th>Website</th><th>Username</th><th>Password</th><th>Action</th></tr>`;
    passwords.forEach(async (entry, index) => {
        table.innerHTML += `<tr><td>${await decryptText(
            entry.website,
            localStorage.getItem("masterPasswordPlain")
        )}</td><td>${await decryptText(
            entry.username,
            localStorage.getItem("masterPasswordPlain")
        )}</td><td>${await decryptText(
            entry.password,
            localStorage.getItem("masterPasswordPlain")
        )}</td><td><button onclick="deletePassword(${index})">Delete</button></td></tr>`;
    });
}

function deletePassword(index) {
    let passwords =
        JSON.parse(localStorage.getItem("passwords")) || [];
    passwords.splice(index, 1);
    localStorage.setItem(
        "passwords",
        JSON.stringify(passwords)
    );
    alert("Password deleted successfully!", "success");
    displayPasswords();
}

function closePage() {
    window.close();
}

function alert(text, icon) {
    Toastify({
        text: text,
        avatar: "data/" + icon + ".png",
        duration: 1750,
        close: false,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: "#313333",
        },
        onClick: function () {}, // Callback after click
    }).showToast();
}