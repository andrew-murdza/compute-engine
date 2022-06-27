---
title: Symbols
permalink: /compute-engine/guides/symbols/
layout: single
date: Last Modified
sidebar:
  - nav: 'compute-engine'
---

# Symbols

## Scopes

The Compute Engine supports
[lexical scoping](<https://en.wikipedia.org/wiki/Scope_(computer_science)>).

A stack of scopes define the current definition associated with a symbol.

To locate the definition of a symbol or function, the dictionary associated with
the current (top-most) scope is used first.

If no matching definition is found, the parent scope is searched, and so on
until a definition is found.

**To create a new scope** use `ce.pushScope()`.

```ts
ce.pushScope({
  dictionary: {
    symbols: [{ name: 'd', value: 500 }],
  },
});
```

The `dictionary` property of a scope contains bindings for symbols and
functions.

**To exit a scope** use `ce.popScope()`. This will invalidate any definition
associated with the scope, and restore definitions from previous scopes that may
have been shadowed by the current scope.

## Name Binding

**Name Binding is the process of associating the name of a function or symbol
with a definition.**

The definition of symbols and functions is set when an instance of a Compute
Engine is created.

Dictionaries that contain additional definitions can be provided when the
Compute Engine is first created, or later at runtime.

The definitions record contain information such as the domain or value of a
symbol, or how to simplify or evaluate functions.

### Symbol Binding

When a symbol is boxed, that is when `ce.box()` is called on an expression that
contains the symbol, a definition matching the name of the symbol is searched in
the dictionary of the current scope (`ce.context`). If none is found, the parent
scope is searched recursively until one is found or the root scope is reached.

If a definition is found, the symbol is associated with (bound to) the
definition.

### Auto-binding

If no definition is found for the symbol, a new one is created automatically.

The new definition will have no value associated with it, so the symbol will be
a **free variable**. It will have a domain of `ce.defaultDomain'.

If `ce.defaultDomain` is `null`, no definition is created, and the symbol is not
bound to any definition. This will severely limit the usefulness of the symbol.

By default, `defaultDomain` is `ExtendedRealNumber` so any unknown variables is
automatically assumed to be a real number.

```js
const symbol = ce.box('m'); // m for mystery
console.log(symbol.domain.symbol);
// ➔ "ExtendedRealNumber"
symbol.value = 5;
console.log(symbol.numericValue?.json);
// ➔ 5
```

### Symbol Binding: Bound Variables, Free Variables and Constants

When discussing **binding** and symbols, this can either relate to
[**name binding**](https://en.wikipedia.org/wiki/Name_binding) (associating a
definition with the name of a symbol) or
[**value binding**](https://en.wikipedia.org/wiki/Free_variables_and_bound_variables)
(associating a value with the definition of a symbol).

If the definition of a symbol has a value, the symbol is said to be a **bound
variable** (value binding).

This is in opposition to **free variables** which are symbols that have a
definition, but no values, and **constants** which are symbols that have a value
that cannot be altered.

The property `expr.symbolDefinition` is not `undefined` if a symbol is a bound
variable (name binding, it has a definition).

The property `expr.symbolDefinition?.constant` is true if a symbol is a
constant.

Assigning a value to a free variable makes it a bound variable (name binding and
value binding).

The value of constants is determined at the time of name binding. The value of
some symbols — `Pi`, for example — may be determined based on settings of the
compute engine, for example the value of the `precision` property. So the same
symbol could have different values depending on when the binding occurs.

```js
ce.precision = 4;
const smallPi = ce.box('Pi'); // π with 4 digits
console.log(smallPi.latex);
// ➔ 3.1415

ce.prevision = 10;
const bigPi = ce.box('Pi'); // π with 10 digits
console.log(bigPi.latex);
// ➔ 3.1415926535

ce.precision = 100; // Future computations will be done with 100 digits

console.log('pi = ', smallPi.numericValue, '=', bigPi.numericValue);
// ➔ pi  = 3.1415 = 3.1415926535
```

### Declaring a Symbol

Declaring a symbol is providing some information about this symbol, such as its
domain or whether it is positive, without providing a value for the symbol.

If the symbol had not been used before, a new definition record for this symbol
is created, and the symbol is bound to it.

**To declare a symbol** use `ce.assume()`.

For example:

```ts
ce.assume('n', 'Integer');
ce.assume('n > 0');

const symbol = ce.box('n');
console.log(n.isPositive);
// ➔ true
console.log(n.domain);
// ➔ Integer
```

### Function Binding

The definition associated with a function determines how it is put in canonical
form, simplified and evaluated.

When a function is boxed, for example when `ce.box()` is called on an expression
that includes the name of the function, a function definition matching the
function name is looked for in the current context, then in any parent scope.