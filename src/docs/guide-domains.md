---
title: Domains
permalink: /compute-engine/guides/domains/
layout: single
date: Last Modified
sidebar:
  - nav: 'compute-engine'
---

<script defer type='module'>
    import {  renderMathInDocument } 
      from '//unpkg.com/mathlive/dist/mathlive.min.mjs';
    renderMathInDocument({
      TeX: {
        delimiters: {
          inline: [ ['$', '$'], ['\\(', '\\)']],
          display: [['$$', '$$'],['\\[', '\\]']],
        },
      },
      asciiMath: null,
      processEnvironments : false,
      renderAccessibleContent: false,
    });
</script>

# Domains

A **domain**, such as `Integer` `Boolean`, is a **set** used to represent the possible values of an expression.


**Domains are similar to _types_ in programming languages.** They are used to 
select the correct function definition. For example a function `Add` could operate
either on numbers or matrixes. The domain of the arguments indicates the appropriate function definition. Symbolic manipulation algorithms use domains to decide when certain manipulations are applicable. For example,
\\( \sqrt{x^2} = x\\) only if \\(x \geq 0\\)


<div class='read-more'><a href="/compute-engine/reference/domains/">Read more about the <strong>Domains</strong> included in the standard dictionary of the Compute Engine<svg class="svg-chevron" ><use xlink:href="#svg-chevron"></use></svg></a></div>


**To query the domain of an expression**, use the `domain()` function.

```js
ce.domain('Pi');
// -> "IrrationalNumber"
```


## Domains Lattice

**Domains are defined in a hierarchy (a lattice).** The upper bound of the
lattice is `Anything` and the lower bound is `Nothing`. 

The _parent_ of a domain represents a _is-a_/_subset-of_ relationship, for example, a `List` _is-a_ `Collection`.

![Anything domains](/assets/domains.001.jpeg 'The top-level domains')
![Tensor domains](/assets/domains.002.jpeg 'The Tensor sub-domains')
![Function domains](/assets/domains.003.jpeg 'The Function sub-domains')
![Number domains](/assets/domains.004.jpeg 'The Number sub-domains')

The implementation of the CortexJS domains is based on
[Weibel, Trudy & Gonnet, Gaston. (1991). An Algebra of Properties.. 352-359. 10.1145/120694.120749. ](https://www.researchgate.net/publication/.221564157_An_Algebra_of_Properties).{.notice--info}

## Obtaining the Domain of an Expression

**To obtain the domain of an expression**, use the `ce.domain()` function.

```js
const ce = new ComputeEngine();

ce.domain('Pi');
// ➔ "TranscendentalNumber"

ce.domain('Add');
// ➔ "Function": domain of the symbol "Add"

ce.domain(['Add', 5, 2]);
// ➔ "Number": the result of the "Add" function
// (its codomain) in general is a "Number"

ce.domain(ce.evaluate(['Add', 5, 2]));
// ➔ "Integer": once evaluated, the domain of the result may be more specific
```

## Defining New Domains

A new domain can be defined using a **domain expression**, that is a **set 
expression** using any of the **set functions**: `Union` 
`Intersection` `SetMinus`..., combined with domains and **parametric domain** functions.


```json
//  A number or a boolean.
["Union", "Number", "Boolean"]

// Any number except "1".
["SetMinus", "Number", 1]
```

<div class='read-more'><a href="/compute-engine/reference/sets/">Read more about <strong>Sets</strong> and the set functions<svg class="svg-chevron" ><use xlink:href="#svg-chevron"></use></svg></a></div>


**Parametric domains** are functions that define a domain:

```json
// Range of non-negative integers
["Range", 0, "+Infinity"]
```

The `["Range", <min>, <max>]` parametric domain defines a set of integers such
that \\( \mathord{min} \le n \le \mathord{max}, n \in \N \\).

The `["Interval", <min>, <max>]` parametric domain defines a set of real numbers
such that \\( \mathord{min} \le x \le \mathord{max}, n \in \R \\).

**To represent an open interval**, use the `Open` function:
`["Interval", ["Open", <min>], <max>]` \\( \operatorname{min} \lt x \le \operatorname{max},
n \in \R \\) or \\(x \in \rbrack \operatorname{min}, \operatorname{max} \rbrack \\).


<div class=symbols-table>

| Parametric Domain | Description |
| :--- | :--- |
| `Function` | `["Function", ...<arg-domain>, <co-domain>]` <br> For example, `["Function", "Number", "Boolean"]` is the domain of the functions that have a single argument, a number, and return a boolean (has a boolean codomain). |
| `Interval` | `["Interval", <min>, <max>]` <br> The set of real numbers between `<min>` and `<max>`. Use `["Interval", ["Open", <min>], <max>]` to indicate an  open interval. |
| `Multiple` | `["Multiple", <factor>, <domain>, <offset>]` <br> The set of numbers that satisfy `<factor> * x + <offset>` with `x` in `domain`. For example, the set of odd numbers is `["Multiple", 2, "Integer", 1]`|
| `Range` | `["Range", <min>, <max>]` <br> The set of integers from `<min>` to `<max>` (inclusive). |

</div>





## Simplifying Domains

**To simplify a domain expression**, use `ce.simplify(<domain>)`.

```js
ce.simplify(["SetMinus", "Integer", ["Range", "-Infinity", 0]]);
// ➔ ["Range", 1, "+Infinity]]

ce.simplify(
  ["Union", ["Number", 0, "+Infinity"], ["Number", "-Infinity", 5]],
);
// ➔ "ExtendedRealNumber"
```