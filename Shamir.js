const fs = require('fs');

// --- Load JSON from file ---
const data = fs.readFileSync('input.json', 'utf8');
const json = JSON.parse(data);

// --- Utility functions ---
function parseInBase(str, base) {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  const b = BigInt(base);
  let v = 0n;
  for (const ch of str.toLowerCase()) {
    const d = BigInt(digits.indexOf(ch));
    if (d < 0n || d >= b) throw new Error(`Invalid digit '${ch}' for base ${base}`);
    v = v * b + d;
  }
  return v;
}

class Frac {
  constructor(num, den = 1n) {
    if (den === 0n) throw new Error('Zero denominator');
    const g = gcd(abs(num), abs(den));
    let n = num / g, d = den / g;
    if (d < 0n) { n = -n; d = -d; }
    this.n = n; this.d = d;
  }
  add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
}

const abs = x => (x < 0n ? -x : x);
function gcd(a,b){ while (b) { const t = a % b; a = b; b = t; } return a; }

// f(0) using Lagrange interpolation
function secretAtZero(points) {
  let S = new Frac(0n, 1n);
  const k = points.length;
  for (let i = 0; i < k; i++) {
    const [xi, yi] = points[i];
    let num = 1n, den = 1n;
    for (let j = 0; j < k; j++) if (j !== i) {
      const [xj] = points[j];
      num *= -xj;
      den *= (xi - xj);
    }
    S = S.add(new Frac(yi * num, den));
  }
  if (S.d !== 1n) throw new Error(`Non-integer secret: ${S.n}/${S.d}`);
  return S.n;
}

function recoverSecret(json) {
  const { n, k } = json.keys;
  const points = [];
  for (const key of Object.keys(json)) {
    if (key === 'keys') continue;
    const xi = BigInt(key);
    const base = parseInt(json[key].base, 10);
    const yi = parseInBase(json[key].value, base);
    points.push([xi, yi]);
  }
  points.sort((a,b) => (a[0] < b[0] ? -1 : 1));
  const chosen = points.slice(0, k);
  return secretAtZero(chosen);
}

// --- Run ---
const secret = recoverSecret(json);
console.log("Recovered Secret:", secret.toString());
