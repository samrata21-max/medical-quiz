
const ACCOUNT_KEY = "neurologyMCQAccount";
const SESSION_KEY = "neurologyMCQSession";

function getAccount() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); }
    catch { return null; }
}

function setSession(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, loggedIn: true }));
}

function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
}

function requireLogin() {
    const session = getSession();
    const account = getAccount();
    if (!session?.loggedIn || !account || session.userId !== account.userId) {
        window.location.href = "login.html";
        return null;
    }
    return account;
}

/* Small SHA-256 implementation for local-file development.
   Production authentication should move to a secure backend/auth provider. */
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = "";
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = sha256.h || [];
    let k = sha256.k || [];
    let primeCounter = k.length;

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    sha256.h = hash;
    sha256.k = k;

    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";

    for (let i = 0; i < ascii.length; i++) {
        const j = ascii.charCodeAt(i);
        if (j > 255) throw new Error("Non-ASCII password character is not supported in this local demo.");
        words[i >> 2] |= j << ((3 - i) % 4 * 8);
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = asciiBitLength;

    for (let j = 0; j < words.length;) {
        const w = words.slice(j, j += 16);
        const oldHash = hash.slice(0);

        for (let i = 16; i < 64; i++) {
            const w15 = w[i - 15], w2 = w[i - 2];
            const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
            const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }

        let a = hash[0], b = hash[1], c = hash[2], d = hash[3],
            e = hash[4], f = hash[5], g = hash[6], h = hash[7];

        for (let i = 0; i < 64; i++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;

            h = g; g = f; f = e; e = (d + temp1) | 0;
            d = c; c = b; b = a; a = (temp1 + temp2) | 0;
        }

        hash = [
            (hash[0] + a) | 0, (hash[1] + b) | 0, (hash[2] + c) | 0, (hash[3] + d) | 0,
            (hash[4] + e) | 0, (hash[5] + f) | 0, (hash[6] + g) | 0, (hash[7] + h) | 0
        ];
    }

    for (let i = 0; i < hash.length; i++) {
        for (let j = 7; j >= 0; j--) result += ((hash[i] >>> (j * 4)) & 0xF).toString(16);
    }
    return result;
}

/**
 * Hashes a password for local storage/comparison.
 * Throws if the password contains non-ASCII characters (the demo sha256
 * implementation only supports ASCII). Callers (login.js, register.js)
 * MUST wrap calls to this in try/catch and show a friendly message —
 * do not let this exception reach the user as a silent failure.
 */
function passwordHash(password) {
    return sha256(password);
}
