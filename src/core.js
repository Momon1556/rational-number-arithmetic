/**
 * Core rational number implementation.
 *
 * A Rational is stored as a pair of BigInts: a numerator and a denominator.
 * The class invariant is that the denominator is strictly positive and the
 * fraction is in lowest terms (gcd of |numerator| and denominator is 1).
 *
 * Storing the sign on the numerator and keeping the denominator positive
 * makes equality and comparison straightforward: two rationals are equal iff
 * their numerators and denominators are equal, with no case analysis on sign
 * combinations. It also gives a single canonical form for each value.
 */

/**
 * Greatest common divisor of the absolute values of two BigInts.
 *
 * Implemented with the iterative form of the Euclidean algorithm. The
 * recursive form would also work, but an iterative loop avoids any concerns
 * about stack depth on very large inputs and keeps the function tail-call
 * free so it behaves identically across engines.
 *
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint} non-negative gcd; zero only when both inputs are zero
 */
export function bigintGcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Rational number supporting exact arithmetic.
 */
export class Rational {
  /**
   * @param {number|bigint} numerator
   * @param {number|bigint} denominator - must be non-zero; sign is normalised
   */
  constructor(numerator, denominator) {
    let n = typeof numerator === "bigint" ? numerator : BigInt(numerator);
    let d = typeof denominator === "bigint" ? denominator : BigInt(denominator);

    if (d === 0n) {
      throw new RangeError("Rational denominator cannot be zero");
    }

    // Normalise the sign onto the numerator so the denominator is positive.
    // Doing this before the gcd saves sign juggling later.
    if (d < 0n) {
      n = -n;
      d = -d;
    }

    // Reduce to lowest terms. A denominator of 1 (after normalisation) is
    // already canonical; skipping the gcd call in that case is a small but
    // worthwhile fast path for integer-valued rationals, which arise often.
    if (d !== 1n) {
      const g = bigintGcd(n, d);
      if (g !== 1n) {
        n = n / g;
        d = d / g;
      }
    }

    /** @type {bigint} */
    this._numerator = n;
    /** @type {bigint} */
    this._denominator = d;
  }

  /** @returns {bigint} */
  get numerator() {
    return this._numerator;
  }

  /** @returns {bigint} always positive */
  get denominator() {
    return this._denominator;
  }

  /**
   * @param {Rational} other
   * @returns {Rational}
   */
  add(other) {
    // a/b + c/d = (ad + cb) / bd. The constructor reduces the result, so we
    // do not need to pre-reduce the product of denominators here.
    return new Rational(
      this._numerator * other._denominator + other._numerator * this._denominator,
      this._denominator * other._denominator,
    );
  }

  /**
   * @param {Rational} other
   * @returns {Rational}
   */
  sub(other) {
    return new Rational(
      this._numerator * other._denominator - other._numerator * this._denominator,
      this._denominator * other._denominator,
    );
  }

  /**
   * @param {Rational} other
   * @returns {Rational}
   */
  mul(other) {
    return new Rational(
      this._numerator * other._numerator,
      this._denominator * other._denominator,
    );
  }

  /**
   * @param {Rational} other
   * @returns {Rational}
   */
  div(other) {
    if (other._numerator === 0n) {
      throw new RangeError("Cannot divide by a zero Rational");
    }
    // (a/b) / (c/d) = (a*d) / (b*c). The denominator of the result is
    // b * other.numerator; since other's numerator may be negative we let
    // the constructor normalise the sign back onto the numerator.
    return new Rational(
      this._numerator * other._denominator,
      this._denominator * other._numerator,
    );
  }

  /**
   * Additive inverse.
   * @returns {Rational}
   */
  neg() {
    return new Rational(-this._numerator, this._denominator);
  }

  /**
   * Multiplicative inverse. Throws on zero, which cannot be inverted.
   * @returns {Rational}
   */
  inv() {
    if (this._numerator === 0n) {
      throw new RangeError("Cannot invert zero Rational");
    }
    // The constructor will normalise the sign if the numerator was negative.
    return new Rational(this._denominator, this._numerator);
  }

  /**
   * @param {Rational} other
   * @returns {boolean}
   */
  equals(other) {
    return this._numerator === other._numerator && this._denominator === other._denominator;
  }

  /**
   * Standard lexical ordering by value.
   * @param {Rational} other
   * @returns {number} -1, 0, or 1
   */
  compare(other) {
    // Both denominators are positive by invariant, so the direction of the
    // comparison is preserved when we cross-multiply.
    const left = this._numerator * other._denominator;
    const right = other._numerator * this._denominator;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  /**
   * Canonical text form: "n" for integers, "n/d" otherwise.
   * @returns {string}
   */
  toString() {
    if (this._denominator === 1n) {
      return this._numerator.toString();
    }
    return this._numerator.toString() + "/" + this._denominator.toString();
  }

  /**
   * Closest floating-point approximation. Uses Number() on the BigInt parts
   * and divides; for values within the safe-integer range this is exact-ish,
   * and for larger values the result inherits the usual float rounding.
   * @returns {number}
   */
  toNumber() {
    return Number(this._numerator) / Number(this._denominator);
  }

  /**
   * Build a Rational from a number, string, or BigInt.
   *
   * Strings may be "p/q", "-p/q", "p", or a decimal like "-3.75".
   * Numbers are routed through String() first. This matters because a JS
   * number like 0.1 is internally 3602879701896397 / 2^55; going through
   * String(0.1) gives "0.1", which we parse to the exact 1/10 that the user
   * wrote. This is a deliberate, documented lie about the true value of the
   * number, chosen because it matches what callers virtually always intend.
   *
   * @param {number|string|bigint} value
   * @returns {Rational}
   */
  static from(value) {
    if (typeof value === "bigint") {
      return new Rational(value, 1n);
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new RangeError("Cannot build a Rational from a non-finite number");
      }
      return Rational.from(String(value));
    }
    if (typeof value !== "string") {
      throw new TypeError("Rational.from expects a number, string, or BigInt");
    }

    const s = value.trim();
    if (s.length === 0) {
      throw new SyntaxError("Empty rational literal");
    }

    // Fraction form: optional sign, digits, slash, digits.
    const slash = s.indexOf("/");
    if (slash !== -1) {
      const numStr = s.slice(0, slash);
      const denStr = s.slice(slash + 1);
      const num = parseDecimalLike(numStr);
      const den = parseDecimalLike(denStr);
      return new Rational(num[0] * den[1], num[1] * den[0]);
    }

    const [n, d] = parseDecimalLike(s);
    return new Rational(n, d);
  }
}

/**
 * Parse a signed decimal-or-integer string into a [numerator, denominator]
 * BigInt pair. The denominator is 10^(fraction length) for decimals, or 1n
 * for integers.
 *
 * Decimals like "3.75" become [375n, 100n]. The caller can hand the pair
 * straight to the Rational constructor, which will reduce the fraction.
 *
 * We deliberately do NOT support scientific notation ("1e3"). It is rare in
 * the inputs this library targets and supporting it would mean either
 * pulling in a parser or relying on Number() to normalise — which would
 * reintroduce the very float-approximation problem from which we are
 * escaping. A clear refusal is better than a half-correct acceptance.
 *
 * @param {string} text - already trimmed, may start with + or -
 * @returns {[bigint, bigint]} the numerator and denominator as a pair
 */
function parseDecimalLike(text) {
  if (text.length === 0) {
    throw new SyntaxError("Invalid rational literal: empty component");
  }

  let sign = 1n;
  let i = 0;
  const c0 = text.charCodeAt(0);
  if (c0 === 45 /* '-' */) {
    sign = -1n;
    i = 1;
  } else if (c0 === 43 /* '+' */) {
    i = 1;
  }

  if (i === text.length) {
    throw new SyntaxError("Invalid rational literal: lone sign in \"" + text + "\"");
  }

  // Split on the decimal point. We accept at most one '.'; anything else is
  // a syntax error rather than a silent reinterpretation.
  let dotIndex = -1;
  for (let j = i; j < text.length; j++) {
    const code = text.charCodeAt(j);
    if (code === 46 /* '.' */) {
      if (dotIndex !== -1) {
        throw new SyntaxError("Invalid rational literal: multiple points in \"" + text + "\"");
      }
      dotIndex = j;
    } else if (code < 48 /* '0' */ || code > 57 /* '9' */) {
      throw new SyntaxError("Invalid rational literal: \"" + text + "\"");
    }
  }

  let intPart;
  let fracPart;
  if (dotIndex === -1) {
    intPart = text.slice(i);
    fracPart = "";
  } else {
    intPart = text.slice(i, dotIndex);
    fracPart = text.slice(dotIndex + 1);
    if (intPart.length === 0 && fracPart.length === 0) {
      throw new SyntaxError("Invalid rational literal: lone point in \"" + text + "\"");
    }
  }

  const digits = intPart + fracPart;
  const numerator = sign * BigInt(digits.length === 0 ? "0" : digits);
  const denominator = 10n ** BigInt(fracPart.length);
  return [numerator, denominator];
}

/** Zero as a canonical Rational. Defined after the class so the constructor exists. */
Rational.ZERO = new Rational(0n, 1n);
Rational.ONE = new Rational(1n, 1n);
