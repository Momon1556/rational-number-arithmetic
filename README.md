# Rational Number Arithmetic

Exact arithmetic on rational numbers represented as numerator-denominator pairs, with automatic reduction to lowest terms and consistent sign normalisation.

## Usage

```js
import { Rational } from "./src/index.js";

const a = new Rational(1, 3);   // 1/3
const b = new Rational(2, 3);   // 2/3
console.log(a.add(b).toString());        // "1"
console.log(a.mul(b).toString());        // "2/9"
console.log(a.sub(b).toString());        // "-1/3"
console.log(b.div(a).toString());        // "2"
console.log(Rational.from(5).toString());        // "5"
console.log(Rational.from(2.5).toString());      // "5/2"
console.log(a.inv().toString());                 // "3"
console.log(Rational.ZERO.equals(Rational.from(0)));  // true
```

## Why

Floating-point arithmetic cannot exactly represent many fractions and accumulates rounding error across operations. For applications that need exact comparisons — geometry predicates, combinatorics, exact linear algebra, financial calculations where a cent must remain a cent — a rational type eliminates that class of bug at the cost of slower arithmetic and unbounded growth of numerator and denominator as operations chain. This library implements the four arithmetic operations, negation, inversion, comparison, and parsing from `number`, `string`, and `BigInt`, using only the JavaScript standard library.

## Behaviour choices

- A `Rational` always stores its value in lowest terms with a positive denominator. The sign, if any, lives on the numerator. This makes equality comparisons simple and keeps denominators canonical.
- Constructors and factory functions reduce automatically. You never receive a `Rational` with a negative or zero denominator.
- Division by zero and inversion of zero throw a `RangeError`. This is a deliberate choice: a silent `NaN`-style rational would poison downstream calculations and surface much later as a mysterious wrong answer. A thrown error names the site.
- Parsing a decimal like `2.5` yields the exact rational `5/2`, not a floating-point approximation. Converting an arbitrary JS `number` first goes through `String(number)` to recover a clean decimal form when possible; this means `Rational.from(0.1)` is `1/10`, not the `3602879701896397/36028797018963968` that `0.1` actually stores. This is the one place the library lies slightly about its input, and it is the lie users almost always want.

## Awkward edges

- `Rational.from` accepts `NaN`, `Infinity`, and `-Infinity` and will throw a `RangeError`; there is no representation for non-finite values.
- Repeated multiplication and addition grow numerators and denominators without bound. The reduction keeps each individual result canonical but does not cap size; callers doing long chains should be aware that the integers can become large.
- Only the four basic operations, negation, inversion, and comparison are provided. There is no exponentiation, no square root, no decimal-output formatting beyond `toString`.

## Exports

From `src/index.js`:

- `Rational` — the class. Constructor: `new Rational(numerator, denominator)`. Both arguments may be `number` or `BigInt`.
- `Rational.from(value)` — accept a `number`, `string`, or `BigInt`. Returns a `Rational`.
- `Rational.ZERO`, `Rational.ONE` — common constants.
- Instance methods: `add`, `sub`, `mul`, `div`, `neg`, `inv`, `equals`, `compare`, `toString`, `toNumber`, `numerator`, `denominator`.

## Tests

```
node --test
```
