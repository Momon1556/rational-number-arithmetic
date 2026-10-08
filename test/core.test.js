import { test } from "node:test";
import assert from "node:assert/strict";

import { Rational } from "../src/index.js";

test("constructor reduces to lowest terms", () => {
  const r = new Rational(6, 4);
  assert.equal(r.numerator, 3n);
  assert.equal(r.denominator, 2n);
});

test("constructor normalises sign onto the numerator", () => {
  const r = new Rational(1, -3);
  assert.equal(r.numerator, -1n);
  assert.equal(r.denominator, 3n);
});

test("constructor accepts BigInt arguments", () => {
  const r = new Rational(6n, 4n);
  assert.equal(r.numerator, 3n);
  assert.equal(r.denominator, 2n);
});

test("constructor rejects a zero denominator", () => {
  assert.throws(() => new Rational(1, 0), RangeError);
  assert.throws(() => new Rational(0, 0), RangeError);
});

test("add of two rationals", () => {
  assert.equal(new Rational(1, 3).add(new Rational(2, 3)).toString(), "1");
  assert.equal(new Rational(1, 6).add(new Rational(1, 4)).toString(), "5/12");
});

test("sub yields the correct sign and reduction", () => {
  assert.equal(new Rational(2, 3).sub(new Rational(1, 3)).toString(), "1/3");
  assert.equal(new Rational(1, 3).sub(new Rational(2, 3)).toString(), "-1/3");
});

test("mul of two rationals", () => {
  assert.equal(new Rational(2, 3).mul(new Rational(3, 4)).toString(), "1/2");
});

test("div of two rationals", () => {
  assert.equal(new Rational(2, 3).div(new Rational(4, 5)).toString(), "5/6");
});

test("div by zero throws", () => {
  assert.throws(() => new Rational(1, 2).div(Rational.ZERO), RangeError);
});

test("neg flips the sign", () => {
  assert.equal(new Rational(1, 3).neg().toString(), "-1/3");
  assert.equal(new Rational(-1, 3).neg().toString(), "1/3");
});

test("inv of a non-zero rational", () => {
  assert.equal(new Rational(2, 3).inv().toString(), "3/2");
  assert.equal(new Rational(-2, 3).inv().toString(), "-3/2");
});

test("inv of zero throws", () => {
  assert.throws(() => Rational.ZERO.inv(), RangeError);
});

test("equals is structural after reduction", () => {
  assert.equal(new Rational(1, 2).equals(new Rational(2, 4)), true);
  assert.equal(new Rational(1, 2).equals(new Rational(1, 3)), false);
});

test("compare orders by value", () => {
  assert.equal(new Rational(1, 3).compare(new Rational(2, 3)), -1);
  assert.equal(new Rational(2, 3).compare(new Rational(1, 3)), 1);
  assert.equal(new Rational(1, 2).compare(new Rational(2, 4)), 0);
});

test("compare handles negatives", () => {
  assert.equal(new Rational(-1, 2).compare(new Rational(1, 2)), -1);
  assert.equal(new Rational(-1, 2).compare(new Rational(-1, 3)), -1);
});

test("toString renders integers without a denominator", () => {
  assert.equal(new Rational(4, 2).toString(), "2");
  assert.equal(new Rational(-4, 2).toString(), "-2");
});

test("toNumber yields the closest float", () => {
  assert.equal(new Rational(1, 2).toNumber(), 0.5);
  assert.equal(new Rational(1, 3).toNumber(), 1 / 3);
});

test("from BigInt", () => {
  const r = Rational.from(7n);
  assert.equal(r.toString(), "7");
  assert.equal(r.denominator, 1n);
});

test("from number yields exact decimal form", () => {
  // 0.1 is stored imprecisely in JS, but going through String() gives the
  // decimal the user wrote, so the rational is the exact 1/10.
  assert.equal(Rational.from(0.1).toString(), "1/10");
  assert.equal(Rational.from(2.5).toString(), "5/2");
});

test("from integer string", () => {
  assert.equal(Rational.from("3").toString(), "3");
  assert.equal(Rational.from("-7").toString(), "-7");
});

test("from decimal string", () => {
  assert.equal(Rational.from("3.75").toString(), "15/4");
  assert.equal(Rational.from("-0.5").toString(), "-1/2");
});

test("from fraction string", () => {
  assert.equal(Rational.from("1/3").toString(), "1/3");
  assert.equal(Rational.from("-1/3").toString(), "-1/3");
  assert.equal(Rational.from("6/-4").toString(), "-3/2");
});

test("from rejects non-finite numbers", () => {
  assert.throws(() => Rational.from(NaN), RangeError);
  assert.throws(() => Rational.from(Infinity), RangeError);
  assert.throws(() => Rational.from(-Infinity), RangeError);
});

test("from rejects malformed strings", () => {
  assert.throws(() => Rational.from(""), SyntaxError);
  assert.throws(() => Rational.from("abc"), SyntaxError);
  assert.throws(() => Rational.from("1.2.3"), SyntaxError);
  assert.throws(() => Rational.from("-"), SyntaxError);
});

test("from rejects unsupported types", () => {
  assert.throws(() => Rational.from(null), TypeError);
  assert.throws(() => Rational.from({}), TypeError);
});

test("ZERO and ONE constants", () => {
  assert.equal(Rational.ZERO.toString(), "0");
  assert.equal(Rational.ONE.toString(), "1");
  assert.equal(Rational.ZERO.equals(Rational.from(0)), true);
});

test("round-trip through toString and from for an integer-valued rational", () => {
  const r = new Rational(10, 2);
  assert.equal(Rational.from(r.toString()).toString(), r.toString());
});
