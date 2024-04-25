let countdown;
let encryptionType = 'AES-GCM';
let isElectron = false;

function generateSecret() {
    const array = new Uint8Array(10);
    window.crypto.getRandomValues(array);
    return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join(
        ''
    );
}

function generateAuthenticator() {
    const secret = generateSecret();
    const code = otplib.authenticator.generate(secret);
    const authenticatorInput = document.getElementById('authenticatorInput');
    authenticatorInput.value = code;

    saveAuthenticatorCode(secret, code);

    if (countdown) {
        clearInterval(countdown);
    }
    let timeLeft = 30;
    countdown = setInterval(() => {
        timeLeft--;
        document.getElementById(
            'timer'
        ).innerText = `Code expires in ${timeLeft} seconds`;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            document.getElementById('timer').innerText = 'Code has expired';
        }
    }, 1000);
}

function saveAuthenticatorCode(secret, code) {
    const data = { secret, code };
    localStorage.setItem('authenticatorData', JSON.stringify(data));

    const li = document.createElement('li');
    li.textContent = `Secret: ${secret}, Code: ${code}`;
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = function () {
        this.parentElement.remove();
        localStorage.removeItem('authenticatorData');
    };
    li.appendChild(deleteButton);
    document.getElementById('savedCodes').appendChild(li);
}

function getToken() {
    const data = JSON.parse(localStorage.getItem('authenticatorData'));
    alert(`Secret: ${data.secret}, Code: ${data.code}`);
}

async function encryptText(text, password) {
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    // Derive a 256-bit key from the password using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const key = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(0),
            iterations: 100000, // Adjust as needed
            hash: 'SHA-256',
        },
        keyMaterial,
        256
    );

    // Convert derived bits to a CryptoKey object
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: encryptionType },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: encryptionType,
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
    encryptedBytes.set(new Uint8Array(encryptedData), iv.byteLength);

    // Encode encrypted bytes as Base64 string
    const encryptedString = btoa(String.fromCharCode(...encryptedBytes));

    return encryptedString;
}

async function decryptText(encryptedString, password, encryptionType) {
    const decoder = new TextDecoder();

    // Decode Base64 string to bytes
    const encryptedBytes = new Uint8Array(
        atob(encryptedString)
            .split('')
            .map((c) => c.charCodeAt(0))
    );

    // Extract IV and data
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);

    // Derive the same 256-bit key from the password
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const key = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(0),
            iterations: 100000, // Adjust as needed
            hash: 'SHA-256',
        },
        keyMaterial,
        256
    );

    // Convert derived bits to a CryptoKey object
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: encryptionType },
        false,
        ['decrypt']
    );

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
        {
            name: encryptionType,
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
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return hashHex;
}
async function setMasterPassword() {
    let masterPassword = document.getElementById(
        'masterPasswordSetInput'
    ).value;
    localStorage.setItem('masterPassword', await sha256(masterPassword));
    alert('Master password set successfully!', 'success');
    showPage('masterpassword-login');
    document.getElementById('masterPasswordSetInput').value = '';
    document.getElementById('setPasswordSidebar').classList.add('hidden');
    document.getElementById('loginSidebar').classList.remove('hidden');
}
function deleteData(
    showAlert = true,
    showConfirm = true,
    deleteMasterPassword = true
) {
    if (showConfirm) {
        if (!confirm('Are you sure you want to delete all data?')) {
            return;
        }
    }
    if (deleteMasterPassword) {
        localStorage.removeItem('masterPassword');
    }
    localStorage.removeItem('passwords');
    if (showAlert) {
        alert('Data deleted successfully!', 'success');
    }
    showPage('masterpassword-set');
    document.getElementById('loginSidebar').classList.add('hidden');
    document.getElementById('setPasswordSidebar').classList.remove('hidden');
    document.getElementById('passwordEntrySidebar').classList.add('hidden');
    document.getElementById('passwordGeneratorSidebar').classList.add('hidden');
    document.getElementById('passwordDisplaySidebar').classList.add('hidden');
    document.getElementById('AuthenticatorSidebar').classList.add('hidden');
    document.getElementById('spacerSidebar').classList.add('hidden');
    document.getElementById('logoutSidebar').classList.add('hidden');
}
// only show register page if master password is not set
if (localStorage.getItem('masterPasswordPlain')) {
    localStorage.removeItem('masterPasswordPlain');
}
if (!localStorage.getItem('masterPassword')) {
    showPage('masterpassword-set');
} else {
    showPage('masterpassword-login');
    document.getElementById('loginSidebar').classList.remove('hidden');
    document.getElementById('setPasswordSidebar').classList.add('hidden');
}
async function login() {
    let masterPassword = document.getElementById('masterPasswordInput').value;
    let hashedInputPassword = await sha256(masterPassword);
    let hashedStoredPassword = localStorage.getItem('masterPassword');
    if (hashedInputPassword == hashedStoredPassword) {
        masterPassword = null;
        hashedInputPassword = null;
        hashedStoredPassword = null;
        localStorage.setItem(
            'masterPasswordPlain',
            document.getElementById('masterPasswordInput').value
        );

        document.getElementById('masterPasswordInput').value = '';
        if (countdown) {
            clearInterval(countdown);
        }
        alert('Logged in', 'success');
        showPage('password-entry');
        document.getElementById('loginSidebar').classList.add('hidden');
        document
            .getElementById('passwordEntrySidebar')
            .classList.remove('hidden');
        document
            .getElementById('passwordGeneratorSidebar')
            .classList.remove('hidden');
        document
            .getElementById('passwordDisplaySidebar')
            .classList.remove('hidden');
        /*
        document
            .getElementById('AuthenticatorSidebar')
            .classList.remove('hidden');
            */
        document.getElementById('spacerSidebar').classList.remove('hidden');
        document.getElementById('logoutSidebar').classList.remove('hidden');
    } else {
        alert('Invalid master password', 'failure');
    }
}
function logout(showAlert = true) {
    if (localStorage.getItem('masterPasswordPlain')) {
        localStorage.removeItem('masterPasswordPlain');
    }
    if (showAlert) {
        alert('Logged out', 'success');
    }
    showPage('masterpassword-login');
    document.getElementById('loginSidebar').classList.remove('hidden');
    document.getElementById('passwordEntrySidebar').classList.add('hidden');
    document.getElementById('passwordGeneratorSidebar').classList.add('hidden');
    document.getElementById('passwordDisplaySidebar').classList.add('hidden');
    document.getElementById('AuthenticatorSidebar').classList.add('hidden');
    document.getElementById('spacerSidebar').classList.add('hidden');
    document.getElementById('logoutSidebar').classList.add('hidden');
}
let userAgent = navigator.userAgent.toLowerCase();
if (userAgent.indexOf(' electron/') > -1) {
    isElectron = true;
    document.getElementById('s-t-aes').disabled = false;
    document.getElementById('syncSidebar').classList.remove('hidden');
}

// const darkReader = require('darkreader');
/*
DarkReader.auto({
brightness: 100,
contrast: 90,
sepia: 10,
});
*/

// theme selection code
const themeSelection = document.getElementById('theme');
const storedTheme = localStorage.getItem('theme');
if (storedTheme) {
    themeSelection.value = storedTheme;
    if (storedTheme === 'dark') {
        document.getElementById('dark').disabled = false;
        document.getElementById('darkCatppuccin').disabled = true;
    } else if (storedTheme === 'dark-catppuccin') {
        document.getElementById('dark').disabled = true;
        document.getElementById('darkCatppuccin').disabled = false;
    } else {
        document.getElementById('dark').disabled = true;
        document.getElementById('darkCatppuccin').disabled = true;
    }
}
themeSelection.addEventListener('change', (event) => {
    const theme = event.target.value;
    if (theme === 'dark') {
        document.getElementById('dark').disabled = false;
        document.getElementById('darkCatppuccin').disabled = true;
    } else if (theme === 'dark-catppuccin') {
        document.getElementById('dark').disabled = true;
        document.getElementById('darkCatppuccin').disabled = false;
    } else {
        document.getElementById('dark').disabled = true;
        document.getElementById('darkCatppuccin').disabled = true;
    }
    localStorage.setItem('theme', theme);
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach((page) => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'password-display') {
        displayPasswords();
    }
}

const encryptionTypeSelection = document.getElementById('encryptionType');
encryptionTypeSelection.addEventListener('change', (event) => {
    encryptionType = event.target.value;
});

async function registerDataForSync() {
    let passwordsToSend = JSON.parse(localStorage.getItem('passwords'));
    let response = await fetch(
        `http://localhost:58585/registerData?password=${localStorage.getItem(
            'masterPassword'
        )}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                passwords: passwordsToSend,
            }),
        }
    );
    let data = await response.json();
    console.log(data);
}

function sync() {
    registerDataForSync();
    let timeLeft = 120;
    document.getElementById('syncTimer').innerText = `Expiring in ${formatTime(
        timeLeft
    )}`;
    document.getElementById('syncProgress').value = timeLeft;
    document.getElementById('syncProgress').innerText = formatTime(timeLeft);
    document.getElementById('syncProgress').classList.remove('hidden');
    let countdown = setInterval(() => {
        fetch('http://localhost:58585/isDataClaimed')
            .then((response) => response.text())
            .then((data) => {
                if (data === '1') {
                    clearInterval(countdown);
                    document.getElementById('syncTimer').innerText = 'Synced';
                    document
                        .getElementById('syncProgress')
                        .classList.add('hidden');
                    registerDataForSync();
                } else {
                    timeLeft--;
                    document.getElementById(
                        'syncTimer'
                    ).innerText = `Expiring in ${formatTime(timeLeft)}`;
                    document.getElementById('syncProgress').value = timeLeft;
                    document.getElementById('syncProgress').innerText =
                        formatTime(timeLeft);
                    if (timeLeft <= 0) {
                        clearInterval(countdown);
                        document.getElementById('syncTimer').innerText =
                            'Expired';
                        document
                            .getElementById('syncProgress')
                            .classList.add('hidden');
                        registerDataForSync();
                    }
                }
            })
            .catch((error) => console.error('Error:', error));
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function syncFromDevice(password) {
    document.getElementById('syncTimer').innerText = '';
    document.getElementById('syncProgress').classList.add('hidden');
    document.getElementById('syncPasswordInput').value = '';
    clearInterval(countdown);
    // fetch data
    fetch(`http://localhost:58585/getData?password=${password}`)
        .then((response) => response.json())
        .then((data) => {
            if (data === -1) {
                alert('Failed to sync', 'failure');
                return;
            }
            console.log(data);
            logout(true); // set to false in production
            deleteData(true, false, false); // set to false in production
            // Check if data is an object and not an array
            if (typeof data === 'object' && !Array.isArray(data)) {
                // Convert object to array
                data = Object.values(data);
            }
            // Flatten the array if it's an array of arrays
            if (Array.isArray(data) && Array.isArray(data[0])) {
                data = data.flat();
            }
            localStorage.setItem('passwords', JSON.stringify(data));
            alert('Synced successfully!', 'success');
            document.getElementById('syncTimer').innerText = '';
            document.getElementById('syncProgress').classList.add('hidden');
            document.getElementById('syncPasswordInput').value = password;
            document.getElementById('masterPasswordInput').value = password;
            login();
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to sync', 'failure');
            deleteData(true, false, false); // set to false in production
        });
}

async function storePassword() {
    const username = await encryptText(
        document.getElementById('usernameInput').value,
        localStorage.getItem('masterPasswordPlain')
    );
    const password = await encryptText(
        document.getElementById('passwordInput').value,
        localStorage.getItem('masterPasswordPlain')
    );
    const website = await encryptText(
        document.getElementById('websiteInput').value,
        localStorage.getItem('masterPasswordPlain')
    );
    let passwords = JSON.parse(localStorage.getItem('passwords')) || [];
    passwords.push({ username, password, website, encryptionType });
    localStorage.setItem('passwords', JSON.stringify(passwords));
    alert('Password stored successfully!', 'success');
    username.value = '';
    password.value = '';
    website.value = '';
    // now send all of localstorage passwords to the server
    // registerDataForSync();
}

function generatePassword() {
    const length = 12;
    const charset =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]\\{}|:";\'<>?,./~`';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    document.getElementById('generatedPassword').value = password;
}

async function displayPasswords() {
    let passwords = JSON.parse(localStorage.getItem('passwords'));
    if (!Array.isArray(passwords)) {
        passwords = [];
    }
    const table = document.getElementById('passwordTable');
    table.innerHTML = 'Decrypting...';

    const rows = await Promise.all(
        passwords.map(async (entry, index) => {
            return `<tr><td>${await decryptText(
                entry.website,
                localStorage.getItem('masterPasswordPlain'),
                entry.encryptionType
            )}</td><td>${await decryptText(
                entry.username,
                localStorage.getItem('masterPasswordPlain'),
                entry.encryptionType
            )}</td><td>${await decryptText(
                entry.password,
                localStorage.getItem('masterPasswordPlain'),
                entry.encryptionType
            )}</td><td><button onclick='deletePassword(${index})'>Delete</button></td></tr>`;
        })
    );

    table.innerHTML = `<tr><th>Website</th><th>Username</th><th>Password</th><th>Action</th></tr>`;
    rows.forEach((row) => {
        table.innerHTML += row;
    });
    // registerDataForSync();
}

function deletePassword(index) {
    let passwords = JSON.parse(localStorage.getItem('passwords')) || [];
    passwords.splice(index, 1);
    localStorage.setItem('passwords', JSON.stringify(passwords));
    alert('Password deleted successfully!', 'success');
    displayPasswords();
}

function closePage() {
    window.close();
}

function alert(text, icon) {
    Toastify({
        text: text,
        avatar: 'data/' + icon + '.png',
        duration: 1750,
        close: false,
        gravity: 'top', // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: '#313333',
        },
        onClick: function () {}, // Callback after click
    }).showToast();
}
