import Complex from 'complex.js';
import type {
  Expression,
  MathJsonNumber,
  MathJsonString,
  MathJsonSymbol,
  MathJsonFunction,
  MathJsonIdentifier,
} from '../../math-json';
import type {
  SerializeLatexOptions,
  LatexDictionaryEntry,
  ParseLatexOptions,
} from '../latex-syntax/public';

import type { IndexedLatexDictionary } from '../latex-syntax/dictionary/definitions';
import { Rational } from '../numerics/rationals';
import { NumericValue, NumericValueData } from '../numeric-value/public';
import { BigNum, IBigNum } from '../numerics/bignum';

/**
 * :::info[THEORY OF OPERATIONS]
 *
 * To create a boxed expression:
 *
 * ### `ce.box()` and `ce.parse()`
 * 
 * Use `ce.box()` or `ce.parse()` to get a canonical expression.
 *    - the arguments are put in canonical form
 *    - invisible operators are made explicit
 *    - a limited number of core simplifications are applied,
 *      for example 0 is removed from additions
 *    - sequences are flattened: `["Add", 1, ["Sequence", 2, 3]]` is
 *      transformed to `["Add", 1, 2, 3]`
 *    - associative functions are flattened: `["Add", 1, ["Add", 2, 3]]` is
 *      transformed to `["Add", 1, 2, 3]`
 *    - the arguments of commutative functions are sorted
 *    - identifiers are **not** replaced with their values
 *
 * ### Algebraic methods (expr.add(), expr.mul(), etc...)
 * 
 * The boxed expression have some algebraic methods, 
 * i.e. `add`, `mul`, `div`, `pow`, etc. These methods are suitable for
 * internal calculations, although they may be used as part of the public 
 * API as well.
 * 
 *    - the operation is performed on the canonical version of the expression
 *    - the arguments are not evaluated
 *    - the canonical handler (of the corresponding operation) is not called
 *    - some additional simplifications over canonicalization are applied, for
 *      example number literals are combined. However, the result is exact, 
 *      and no approximation is made. Use `.N()` to get an approximate value.
 *      This is equivalent to calling `simplify()` on the expression.
 
 *    - sequences were already flattened as part of the canonicalization process
 *
 *   For 'add' and 'mul', which take multiple arguments, separate functions
 *   are provided that take an array of arguments. They are equivalent
 *   to calling the boxed algebraic method, i.e. `ce.Zero.add(1, 2, 3)` or
 *   `add(1, 2, 3)` are equivalent.
 * 
 * These methods are not equivalent to calling `expr.evaluate()` on the
 * expression: evaluate will replace identifiers with their values, and
 * evaluate the expression.
 *
 * ### `ce._fn()`
 * 
 * Use `ce._fn()` to create a new function expression.
 *
 * This is a low level method which is typically invoked in the canonical
 * handler of a function definition.
 *
 * The arguments are not modified. The expression is not put in canonical
 * form. The canonical handler is *not* called.
 * 
 * A canonical flag can be set when calling the function, but it only 
 * asserts that the function and its arguments are canonical. The caller
 * is responsible for ensuring that is the case.
 *
 * 
 * ### `ce.function()`
 * 
 * This is a specialized version of `ce.box()`. It is used to create a new
 * function expression.
 * 
 * The arguments are put in canonical form and the canonical handler is called.
 *
 * For algebraic functions (add, mul, etc..), use the corresponding 
 * canonicalization function, i.e. `canonicalAdd(a, b)` instead of
 * `ce.function('Add', a, b)`.
 * 
 * Another option is to use the algebraic methods directly, i.e. `a.add(b)`
 * instead of `ce.function('Add', a, b)`. However, the algebraic methods will
 * apply further simplifications which may or may not be desirable. For
 * example, number literals will be combined.
 *
 * ### Canonical Handlers
 * 
 * Canonical handlers are responsible for:
 *    - validating the signature (domain and number of arguments)
 *    - flattening sequences
 *    - flattening associative functions
 *    - sort the arguments (if the function is commutative)
 *    - calling `ce._fn()` to create a new function expression
 *    - if the function definition has a hold, they should also put
 *      their arguments in canonical form, if appropriate
 *
 * When the canonical handler is invoked, the arguments have been put in 
 * canonical form according to the `hold` flag.
 * 
 * Some canonical handlers are available as separate functions and can be
 * used directly, for example `canonicalAdd(a, b)` instead of 
 * `ce.function('Add', [a, b])`.
 * 
 * :::
 */

export type Type =
  | 'complex'
  | 'real'
  | 'rational'
  | 'integer'
  | 'boolean'
  | 'string'
  | 'expression'
  | 'collection'
  | 'function'
  | 'symbol'
  | 'unknown'
  | 'error'
  | 'nothing';

/**
 * :::info[THEORY OF OPERATIONS]
 *
 * The `BoxedExpression` interface includes most of the member functions
 * applicable to any kind of expression, for example `get symbol()` or
 * `get ops()`.
 *
 * When a member function is not applicable to this `BoxedExpression`,
 * for example `get symbol()` on a `BoxedNumber`, it returns `null`.
 *
 * This convention makes it convenient to manipulate expressions without
 * having to check what kind of instance they are before manipulating them.
 * :::
 *
 * To get a boxed expression from a LaTeX string use `ce.parse()`, or to
 * get a boxed expression from a MathJSON expression use `ce.box()`.
 *
 * @category Boxed Expression
 *
 */
export interface BoxedExpression {
  //
  // CANONICAL OR NON-CANONICAL
  //
  // The methods/properties below can be used with canonical or non-canonical
  // expressions. They do not trigger binding (associating the expression
  // with a definition).
  //
  //
  /** The Compute Engine associated with this expression provides
   * a context in which to interpret it, such as definition of symbols
   * and functions.
   *
   */
  readonly engine: IComputeEngine;

  /** From `Object.valueOf()`, return a primitive value for the expression.
   *
   * If the expression is a machine number, or bignum or rational that can be
   * converted to a machine number, return a JavaScript `number`.
   *
   * If the expression is a symbol, return the name of the symbol as a `string`.
   *
   * Otherwise return a JavaScript primitive representation of the expression.
   *
   * @category Primitive Methods
   */
  valueOf(): number | any | string | boolean;

  /** From `Object.toString()`, return a string representation of the
   *  expression. This string is suitable to be output to the console
   * for debugging, for example. It is formatted as a ASCIIMath expression.
   *
   * To get a LaTeX representation of the expression, use `expr.latex`.
   *
   * Used when coercing a `BoxedExpression` to a `String`.
   *
   * @category Primitive Methods
   */
  toString(): string;

  /**
   * Output to the console a string representation of the expression.
   *
   * @category Primitive Methods
   */
  print(): void;

  /** Similar to`expr.valueOf()` but includes a hint.
   *
   * @category Primitive Methods
   */
  [Symbol.toPrimitive](
    hint: 'number' | 'string' | 'default'
  ): number | string | null;

  /** Used by `JSON.stringify()` to serialize this object to JSON.
   *
   * Method version of `expr.json`.
   *
   * @category Primitive Methods
   */
  toJSON(): Expression;

  /** Serialize to a MathJSON expression with specified options*/
  toMathJson(options?: Readonly<Partial<JsonSerializationOptions>>): Expression;

  /** Serialize to a LaTeX string.
   *
   * Will ignore any LaTeX metadata.
   */
  toLatex(options?: Partial<SerializeLatexOptions>): LatexString;

  verbatimLatex?: string;

  /** If `true`, this expression is in a canonical form. */
  get isCanonical(): boolean;

  /** For internal use only, set when a canonical expression is created.
   * @internal
   */
  set isCanonical(val: boolean);

  /** If `true`, this expression is in a structural form. */
  get isStructural(): boolean;

  /** MathJSON representation of this expression.
   *
   * This representation always use shorthands when possible. Metadata is not
   * included.
   *
   * Numbers are converted to JavaScript numbers and may lose precision.
   *
   * The expression is represented exactly and no sugaring is applied. For
   * example, `["Power", "x", 2]` is not represented as `["Square", "x"]`.
   *
   * For more control over the serialization, use `expr.toMathJson()`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  readonly json: Expression;

  /**
   * The scope in which this expression has been defined.
   *
   * Is `null` when the expression is not canonical.
   */
  readonly scope: RuntimeScope | null;

  /** From `Object.is()`. Equivalent to `BoxedExpression.isSame()`
   *
   * @category Primitive Methods
   *
   */
  is(rhs: unknown): boolean;

  /** @internal */
  readonly hash: number;

  /** LaTeX representation of this expression.
   *
   * If the expression was parsed from LaTeX, the LaTeX representation is
   * the same as the input LaTeX.
   *
   * To customize the serialization, use `expr.toLatex()`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  get latex(): LatexString;

  /**
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   * @internal
   */
  set latex(val: LatexString);

  /** If this expression is a symbol, return the name of the symbol as a string.
   * Otherwise, return `null`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::

  * @category Symbol Expression
   *
   */
  readonly symbol: string | null;

  /** If this expression is a string, return the value of the string.
   * Otherwise, return `null`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::

  * @category String Expression
   *
   */
  readonly string: string | null;

  /** All the subexpressions matching the named operator, recursively.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  getSubexpressions(name: string): ReadonlyArray<BoxedExpression>;

  /** All the subexpressions in this expression, recursively
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  readonly subexpressions: ReadonlyArray<BoxedExpression>;

  /**
   *
   * All the symbols in the expression, recursively
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  readonly symbols: ReadonlyArray<string>;

  /**
   * All the identifiers used in the expression that do not have a value
   * associated with them, i.e. they are declared but not defined.
   */
  readonly unknowns: ReadonlyArray<string>;

  /**
   *
   * All the identifiers (symbols and functions) in the expression that are
   * not a local variable or a parameter of that function.
   *
   */
  readonly freeVariables: ReadonlyArray<string>;

  /** All the `["Error"]` subexpressions.
   *
   * If an expression includes an error, the expression is also an error.
   * In that case, the `this.isValid` property is `false`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  readonly errors: ReadonlyArray<BoxedExpression>;

  /** `true` if this expression or any of its subexpressions is an `["Error"]`
   * expression.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions. For
   * non-canonical expression, this may indicate a syntax error while parsing
   * LaTeX. For canonical expression, this may indicate argument domain
   * mismatch, or missing or unexpected arguments.
   * :::
   *
   * @category Symbol Expression
   *
   */
  readonly isValid: boolean;

  /**
   * The name of the operator of the expression.
   *
   * For example, the name of the operator of `["Add", 2, 3]` is `"Add"`.
   *
   * A string literal has a `"String"` operator.
   *
   * A symbol has a `"Symbol"` operator.
   *
   * A number has a `"Number"`, `"Real"`, `"Rational"` or `"Integer"` operator.
   *
   */
  readonly operator: string;

  /** The list of operands of the function.
   *
   * If the expression is not a function, return `null`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   * @category Function Expression
   *
   */
  readonly ops: null | ReadonlyArray<BoxedExpression>;

  /** If this expression is a function, the number of operands, otherwise 0.
   *
   * Note that a function can have 0 operands, so to check if this expression
   * is a function, check if `this.ops !== null` instead.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   * @category Function Expression
   *
   */
  readonly nops: number;

  /** First operand, i.e.`this.ops[0]`.
   *
   * If there is no first operand, return the symbol `Nothing`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   * @category Function Expression
   *
   *
   */
  readonly op1: BoxedExpression;

  /** Second operand, i.e.`this.ops[1]`
   *
   * If there is no second operand, return the symbol `Nothing`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   * @category Function Expression
   *
   *
   */
  readonly op2: BoxedExpression;

  /** Third operand, i.e. `this.ops[2]`
   *
   * If there is no third operand, return the symbol `Nothing`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   * @category Function Expression
   *
   *
   */
  readonly op3: BoxedExpression;

  /** If true, the value of the expression never changes and evaluating it has
   * no side-effects.
   *
   * If false, the value of the expression may change, if the
   * value of other expression changes or for other reasons.
   *
   * If `this.isPure` is `false`, `this.value` is undefined. Call
   * `this.evaluate()` to determine the value of the expression instead.
   *
   * As an example, the `Random` function is not pure.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   */
  readonly isPure: boolean;

  /**
   * True if the the value of the expression does not depend on the value of
   * any other expression.
   *
   * For example, a number literal, a symbol with a constant value.
   * - `2` is constant
   * - `Pi` is constant
   * - `["Add", "Pi", 2]` is constant
   * - `x` is not constant
   * - `["Add", "x", 2]` is not constant
   */
  readonly isConstant: boolean;

  /**
   * Return the canonical form of this expression.
   *
   * If this is a function expression, a definition is associated with the
   * canonical expression.
   *
   * When determining the canonical form the following function definition
   * flags are applied:
   * - `associative`: \\( f(a, f(b), c) \longrightarrow f(a, b, c) \\)
   * - `idempotent`: \\( f(f(a)) \longrightarrow f(a) \\)
   * - `involution`: \\( f(f(a)) \longrightarrow a \\)
   * - `commutative`: sort the arguments.
   *
   * If this expression is already canonical, the value of canonical is
   * `this`.
   *
   */
  get canonical(): BoxedExpression;

  /**
   * Return the structural form of this expression.
   *
   * Some expressions, such as rational numbers, are represented with
   * a `BoxedExpression` object. In some cases, for example when doing a
   * structural comparison of two expressions, it is useful to have a
   * structural representation of the expression where the rational numbers
   * is represented by a function expression instead.
   *
   * If there is a structural representation of the expression, return it,
   * otherwise return `this`.
   *
   */
  get structural(): BoxedExpression;

  /**
   * Replace all the symbols in the expression as indicated.
   *
   * Note the same effect can be achieved with `this.replace()`, but
   * using `this.subs()` is more efficient, and simpler, but limited
   * to replacing symbols.
   *
   * The result is bound to the current scope, not to `this.scope`.
   *
   * If `options.canonical` is not set, the result is canonical if `this`
   * is canonical.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  subs(
    sub: Substitution,
    options?: { canonical?: CanonicalOptions }
  ): BoxedExpression;

  /**
   * Recursively replace all the subexpressions in the expression as indicated.
   *
   * To remove a subexpression, return an empty `["Sequence"]` expression.
   *
   * The canonical option is applied to each function subexpression after
   * the substitution is applied.
   *
   * If no `options.canonical` is set, the result is canonical if `this`
   * is canonical.
   *
   * **Default**: `{ canonical: this.isCanonical, recursive: true }`
   */
  map(
    fn: (expr: BoxedExpression) => BoxedExpression,
    options?: { canonical: CanonicalOptions; recursive?: boolean }
  ): BoxedExpression;

  /**
   * Transform the expression by applying one or more replacement rules:
   *
   * - If the expression matches the `match` pattern and the `condition`
   *  predicate is true, replace it with the `replace` pattern.
   *
   * - If no rules apply, return `null`.
   *
   * See also `expr.subs()` for a simple substitution of symbols.
   *
   * If `options.canonical` is not set, the result is canonical if `this`
   * is canonical.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   */
  replace(
    rules: BoxedRuleSet | Rule | Rule[],
    options?: ReplaceOptions
  ): null | BoxedExpression;

  /**
   * True if the expression includes a symbol `v` or a function operator `v`.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   */
  has(v: string | string[]): boolean;

  /** Structural/symbolic equality (weak equality).
   *
   * `ce.parse('1+x').isSame(ce.parse('x+1'))` is `false`.
   *
   * See `expr.isEqual()` for mathematical equality.
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   * @category Relational Operator
   */
  isSame(rhs: BoxedExpression): boolean;

  /**
   * If this expression matches `pattern`, return a substitution that makes
   * `pattern` equal to `this`. Otherwise return `null`.
   *
   * If `pattern` includes wildcards (identifiers that start
   * with `_`), the substitution will include a prop for each matching named
   * wildcard.
   *
   * If this expression matches `pattern` but there are no named wildcards,
   * return the empty substitution, `{}`.
   *
   * Read more about [**patterns and rules**](/compute-engine/guides/patterns-and-rules/).
   *
   * :::info[Note]
   * Applicable to canonical and non-canonical expressions.
   * :::
   *
   */
  match(
    pattern: BoxedExpression,
    options?: PatternMatchOptions
  ): BoxedSubstitution | null;

  /**
   * "Not a Number".
   *
   * A value representing undefined result of computations, such as `0/0`,
   * as per the floating point format standard IEEE-754.
   *
   * Note that if `isNaN` is true, `isNumber` is also true (yes, `NaN` is a
   * number).
   *
   * @category Numeric Expression
   *
   */
  readonly isNaN: boolean | undefined;

  /**
   * The numeric value of this expression is 0.
   *
   * The expression is not evaluated. For example,
   * `ce.box(["Add", 1, 1]).isZero` returns `undefined`, but
   * `ce.box(["Add", 1, 1]).evaluate().isZero` returns `false`.
   *
   * @category Numeric Expression
   */
  readonly isZero: boolean | undefined;

  /**
   * The numeric value of this expression is not 0.
   *
   * @category Numeric Expression
   */
  readonly isNotZero: boolean | undefined;

  /**
   * The numeric value of this expression is 1.
   *
   * @category Numeric Expression
   */
  readonly isOne: boolean | undefined;

  /**
   * The numeric value of this expression is -1.
   *
   * @category Numeric Expression
   */
  readonly isNegativeOne: boolean | undefined;

  /**
   * The numeric value of this expression is `±Infinity` or Complex Infinity
   *
   * @category Numeric Expression
   */
  readonly isInfinity: boolean | undefined;

  /** This expression is a number, but not `±Infinity`, 'ComplexInfinity` or
   *  `NaN`
   *
   * @category Numeric Expression
   */
  readonly isFinite: boolean | undefined;

  /**
   * @category Numeric Expression
   */
  readonly isEven: boolean | undefined;

  /**
   * @category Numeric Expression
   */
  readonly isOdd: boolean | undefined;

  /**
   * Return the value of this expression, if a number literal.
   *
   * Note it is possible for `this.numericValue` to be `null`, and for
   * `this.isNotZero` to be true. For example, when a symbol has been
   * defined with an assumption.
   *
   * Conversely, `this.isNumber` may be true even if `numericValue` is `null`,
   * example the symbol `Pi` return `true` for `isNumber` but `numericValue` is
   * `null`. Its value can be accessed with `.N().numericValue`.
   *
   * To check if an expression is a number literal, use `this.isNumberLiteral`.
   * If `this.isNumberLiteral` is `true`, `this.numericValue` is not `null`
   * and `this.re` is not `undefined`.
   *
   * @category Numeric Expression
   *
   */
  readonly numericValue: number | NumericValue | null;

  /**
   * Return `true` if this expression is a number literal, for example
   * `2`, `3.14`, `1/2`, `√2` etc.
   *
   * This is equivalent to checking if `this.numericValue` is not `null`
   * or `this.re` is not `undefined`.
   *
   * @category Numeric Expression
   *
   */
  readonly isNumberLiteral: boolean;

  /**
   * If this expression is a number literal, return the real part of the value.
   *
   * If the expression is not a number literal, return `undefined`.
   *
   * @category Numeric Expression
   */
  readonly re: number | undefined;

  /**
   * If this expression is a number literal, return the imaginary part of the
   * value. It may be 0 if this is a real number.
   *
   * If the expression is not a number literal, return `undefined`.
   *
   * @category Numeric Expression
   */
  readonly im: number | undefined;

  /**
   * If this expression is a number literal, return the real part as a bignum.
   *
   * If the expression is not a number literal or the value is not available
   * as a bignum return `undefined`. That is, the value is not upconverted
   * to a bignum.
   *
   * To get the value either as a bignum or a number, use
   * `this.bignumRe ?? this.re`.
   *
   * @category Numeric Expression
   *
   */
  readonly bignumRe: BigNum | undefined;
  /**
   * If this expression is a number literal, return the imaginary part as a `BigNum`.
   *
   * It may be 0 if the number is real.
   *
   * If the expression is not a number literal or the value is not available
   * as a bignum return `undefined`. That is, the value is not upconverted
   * to a bignum.
   *
   * To get the value either as a bignum or a number, use
   * `this.bignumIm ?? this.im`.
   *
   * @category Numeric Expression
   */
  readonly bignumIm: BigNum | undefined;

  /**
   * Attempt to factor a numeric coefficient `c` and a `rest` out of a
   * canonical expression such that `rest.mul(c)` is equal to `this`.
   *
   * Attempts to make `rest` a positive value (i.e. pulls out negative sign).
   *
   * For example:
   *
   * ['Multiply', 2, 'x', 3, 'a']
   *    -> [NumericValue(6), ['Multiply', 'x', 'a']]
   *
   * ['Divide', ['Multiply', 2, 'x'], ['Multiply', 3, 'y', 'a']]
   *    -> [NumericValue({rational: [2, 3]}), ['Divide', 'x', ['Multiply, 'y', 'a']]]
   */

  toNumericValue(): [NumericValue, BoxedExpression];

  //
  // Algebraic operations
  //
  neg(): BoxedExpression;
  inv(): BoxedExpression;
  abs(): BoxedExpression;
  add(rhs: number | BoxedExpression): BoxedExpression;
  sub(rhs: BoxedExpression): BoxedExpression;
  mul(rhs: NumericValue | number | BoxedExpression): BoxedExpression;
  div(rhs: number | BoxedExpression): BoxedExpression;
  pow(exp: number | BoxedExpression): BoxedExpression;
  root(exp: number | BoxedExpression): BoxedExpression;
  sqrt(): BoxedExpression;
  ln(base?: SemiBoxedExpression): BoxedExpression;
  // exp(): BoxedExpression;

  /**
   *
   * The shape describes the axis of the expression.
   *
   * When the expression is a scalar (number), the shape is `[]`.
   *
   * When the expression is a vector of length `n`, the shape is `[n]`.
   *
   * When the expression is a `n` by `m` matrix, the shape is `[n, m]`.
   */
  readonly shape: number[];

  /** Return 0 for a scalar, 1 for a vector, 2 for a matrix, > 2 for
   * a multidimensional matrix.
   *
   * The rank is equivalent to the length of `expr.shape` */
  readonly rank: number;

  /**
   * Return the following, depending on the value of this expression:
   *
   * * `-1` if it is < 0
   * * `0` if it is = 0
   * * `+1` if it is > 0
   * * `undefined` this value may be positive, negative or zero. We don't know
   *    right now (a symbol with an Integer domain, but no currently assigned
   *    value, for example)
   * * `NaN` this value will never be positive, negative or zero (`NaN`,
   *     a string or a complex number for example)
   *
   * Note that complex numbers have no natural ordering,
   * so if the value is an imaginary number (a complex number with a non-zero
   * imaginary part), `this.sgn` will return `NaN`.
   *
   * If a symbol, this does take assumptions into account, that is `this.sgn`
   * will return `1` if the symbol is assumed to be positive
   * (using `ce.assume()`).
   *
   * @category Numeric Expression
   *
   */
  readonly sgn: number | undefined;

  /** If the expressions cannot be compared, return `undefined`
   *
   * The numeric value of both expressions are compared.
   *
   * @category Relational Operator
   */
  isLess(rhs: number | BoxedExpression): boolean | undefined;

  /**
   * The numeric value of both expressions are compared.
   * @category Relational Operator
   */
  isLessEqual(rhs: number | BoxedExpression): boolean | undefined;

  /**
   * The numeric value of both expressions are compared.
   * @category Relational Operator
   */
  isGreater(rhs: number | BoxedExpression): boolean | undefined;

  /**
   * The numeric value of both expressions are compared.
   * @category Relational Operator
   */
  isGreaterEqual(rhs: number | BoxedExpression): boolean | undefined;

  /** The numeric value of this expression is > 0, same as `isGreater(0)`
   *
   * @category Numeric Expression
   */
  readonly isPositive: boolean | undefined;

  /** The numeric value of this expression is >= 0, same as `isGreaterEqual(0)`
   *
   * @category Numeric Expression
   */
  readonly isNonNegative: boolean | undefined;

  /** The numeric value of this expression is < 0, same as `isLess(0)`
   *
   * @category Numeric Expression
   */
  readonly isNegative: boolean | undefined;

  /** The numeric value of this expression is &lt;= 0, same as `isLessEqual(0)`
   *
   * @category Numeric Expression
   */
  readonly isNonPositive: boolean | undefined;

  //
  // CANONICAL EXPRESSIONS ONLY
  //
  // The properties/methods below return only `undefined` for non-canonical
  // expressions
  //

  /** Wikidata identifier.
   *
   * :::info[Note]
   * `undefined` if not a canonical expression.
   * :::
   */
  readonly wikidata: string | undefined;

  /** An optional short description if a symbol or function expression.
   *
   * May include markdown. Each string is a paragraph.
   *
   * :::info[Note]
   * `undefined` if not a canonical expression.
   * :::
   *
   */
  readonly description: undefined | string[];

  /** An optional URL pointing to more information about the symbol or
   *  function operator.
   *
   * :::info[Note]
   * `undefined` if not a canonical expression.
   * :::
   *
   */
  readonly url: string | undefined;

  /** Expressions with a higher complexity score are sorted
   * first in commutative functions
   *
   * :::info[Note]
   * `undefined` if not a canonical expression.
   * :::
   */
  readonly complexity: number | undefined;

  /**
   * For symbols and functions, a definition associated with the
   *  expression. `this.baseDefinition` is the base class of symbol and function
   *  definition.
   *
   * :::info[Note]
   * `undefined` if not a canonical expression.
   * :::
   *
   */
  readonly baseDefinition: BoxedBaseDefinition | undefined;

  /**
   * For functions, a definition associated with the expression.
   *
   * :::info[Note]
   * `undefined` if not a canonical expression or not a function.
   * :::
   *
   */
  readonly functionDefinition: BoxedFunctionDefinition | undefined;

  /**
   * For symbols, a definition associated with the expression.
   *
   * Return `undefined` if not a symbol
   *
   */
  readonly symbolDefinition: BoxedSymbolDefinition | undefined;

  /**
   *
   * Infer the domain of this expression.
   *
   * If the domain of this expression is already known, return `false`.
   *
   * If the domain was not set, set it to the inferred domain, return `true`
   * If the domain was previously inferred, adjust it by widening it,
   *    return `true`
   *
   * @internal
   */
  infer(domain: BoxedDomain): boolean;

  /**
   * Update the definition associated with this expression, using the
   * current scope (`ce.context`).
   *
   * @internal
   */
  bind(): void;

  /**
   *
   * Reset the cached value associated with this expression.
   *
   * Use when the environment has changed, for example the numeric mode
   * or precision, to force the expression to be re-evaluated.
   *
   * @internal
   */
  reset(): void;

  //
  // AUTO CANONICAL
  //
  // The methods below are automatically applied to the canonical version
  // of the expression
  //

  /**
   * Return a simpler form of this expression.
   *
   * A series of rewriting rules are applied repeatedly, until no more rules
   * apply.
   *
   * The values assigned to symbols and the assumptions about symbols may be
   * used, for example `expr.isInteger` or `expr.isPositive`.
   *
   * No calculations involving decimal numbers (numbers that are not
   * integers) are performed but exact calculations may be performed,
   * for example:
   *
   * \\( \sin(\frac{\pi}{4}) \longrightarrow \frac{\sqrt{2}}{2} \\).
   *
   * The result is canonical.
   *
   * To manipulate symbolically non-canonical expressions, use `expr.replace()`.
   *
   */
  simplify(options?: Partial<SimplifyOptions>): BoxedExpression;

  /**
   * Return the value of the canonical form of this expression.
   *
   * A pure expression always return the same value and has no side effects.
   * If `expr.isPure` is `true`, `expr.value` and `expr.evaluate()` are
   * synonyms.
   *
   * For an impure expression, `expr.value` is undefined.
   *
   * Evaluating an impure expression may have some side effects, for
   * example modifying the `ComputeEngine` environment, such as its set of
   * assumptions.
   *
   * The result may be a rational number or the product of a rational number
   * and the square root of an integer.
   *
   * To perform approximate calculations, use `expr.N()` instead,
   * or set `options.numericApproximation` to `true`.
   *
   * The result of `expr.evaluate()` may be the same as `expr.simplify()`.
   *
   * The result is in canonical form.
   *
   */
  evaluate(options?: EvaluateOptions): BoxedExpression;

  /** Return a numeric approximation of the canonical form of this expression.
   *
   * Any necessary calculations, including on decimal numbers (non-integers),
   * are performed.
   *
   * The calculations are performed according to the
   * `precision` property of the `ComputeEngine`.
   *
   * To only perform exact calculations, use `this.evaluate()` instead.
   *
   * If the function is not numeric, the result of `this.N()` is the same as
   * `this.evaluate()`.
   *
   * The result is in canonical form.
   */
  N(): BoxedExpression;

  /**
   * Compile the expression to a JavaScript function.
   *
   * The function takes an object as argument, with the keys being the
   * symbols in the expression, and returns the value of the expression.
   *
   *
   * ```javascript
   * const expr = ce.parse('x^2 + y^2');
   * const f = expr.compile('javascript');
   * console.log(f({x: 2, y: 3}));
   * ```
   */
  compile(
    to?: 'javascript',
    options?: { optimize: ('simplify' | 'evaluate')[] }
  ): ((args: Record<string, any>) => any | undefined) | undefined;

  /**
   * If this is an equation, solve the equation for the variables in vars.
   * Otherwise, solve the equation `this = 0` for the variables in vars.
   *
   *
   * ```javascript
   * const expr = ce.parse('x^2 + 2*x + 1 = 0');
   * console.log(expr.solve('x'));
   * ```
   *
   *
   */
  solve(
    vars:
      | Iterable<string>
      | string
      | BoxedExpression
      | Iterable<BoxedExpression>
  ): null | ReadonlyArray<BoxedExpression>;

  /**
   * Return a JavaScript primitive representing the value of this expression.
   *
   * Equivalent to `expr.N().valueOf()`.
   *
   */
  get value(): number | boolean | string | object | undefined;

  /**
   * Only the value of variables can be changed (symbols that are not
   * constants).
   *
   * Throws a runtime error if a constant.
   *
   * :::info[Note]
   * If non-canonical, does nothing
   * :::
   *
   */
  set value(
    value:
      | boolean
      | string
      | BigNum
      | { re: number; im: number }
      | { num: number; denom: number }
      | number[]
      | BoxedExpression
      | number
      | undefined
  );

  /**
   *
   * The type of the value of this expression.
   *
   * If a function expression, the type of the value of the function
   * (the result type).
   *
   * If a symbol the type of the value of the symbol.
   *
   * :::info[Note]
   * If not valid, return `error`.
   * If non-canonical, return `undefined`.
   * If the type is not known, return `unknown`.
   * :::
   *
   */
  get type(): Type;

  /**
   *
   * The domain of the value of this expression.
   *
   * If a function expression, the domain  of the value of the function
   * (the codomain of the function).
   *
   * If a symbol the domain of the value of the symbol.
   *
   * Use `expr.operator` to determine if an expression is a symbol or function
   * expression.
   *
   * :::info[Note]
   * If non-canonical or not valid, return `undefined`.
   * :::
   *
   */
  get domain(): BoxedDomain | undefined;

  /** Modify the domain of a symbol.
   *
   * :::info[Note]
   * If non-canonical does nothing
   * :::
   *
   */
  set domain(domain: DomainExpression | BoxedDomain | undefined);

  /** `true` if the value of this expression is a number.
   *
   * `isReal || isImaginary`
   *
   * Note that in a fateful twist of cosmic irony, `NaN` ("Not a Number")
   * **is** a number.
   *
   * If `isNumber` is `true`, this indicates that evaluate the expression
   * will return a number. This does not indicate that the expression
   * is a number literal. To check if the expression is a number literal,
   * use `expr.isNumberLiteral`.
   *
   * For example, the expression `["Add", 1, 2]` is a number and
   * `expr.isNumber` is `true`, but `isNumberLiteral` is `false`.
   *
   * @category Domain Properties
   */
  readonly isNumber: boolean | undefined;

  /**
   *
   * The value of this expression is an element of the set ℤ: ...,-2, -1, 0, 1, 2...
   *
   *
   * @category Domain Properties
   *
   */
  readonly isInteger: boolean | undefined;

  /** The value of this expression is an element of the set ℚ, p/q with p ∈ ℕ, q ∈ ℤ ⃰  q >= 1
   *
   * Note that every integer is also a rational.
   *
   *
   * @category Domain Properties
   *
   */
  readonly isRational: boolean | undefined;
  /**
   * The value of this expression is real number.
   *
   *
   * @category Domain Properties
   */
  readonly isReal: boolean | undefined;

  /**
   * The value of this expression is a number.
   *
   *
   *
   * @category Domain Properties
   *
   */
  readonly isComplex: boolean | undefined;

  /** The value of this expression is a number with an imaginary part
   *
   *
   * @category Domain Properties
   */
  readonly isImaginary: boolean | undefined;

  /** Mathematical equality (strong equality), that is the value
   * of this expression and of `rhs` are numerically equal.
   *
   * The numeric value of both expressions are compared.
   *
   * Numbers whose difference is less than `engine.tolerance` are
   * considered equal. This tolerance is set when the `engine.precision` is
   * changed to be such that the last two digits are ignored.
   *
   * @category Relational Operator
   */
  isEqual(rhs: number | BoxedExpression): boolean;
}

/** A semi boxed expression is a MathJSON expression which can include some
 * boxed terms.
 *
 * This is convenient when creating new expressions from portions
 * of an existing `BoxedExpression` while avoiding unboxing and reboxing.
 *
 * @category Boxed Expression
 */
export type SemiBoxedExpression =
  | number
  | string
  | BigNum
  | MathJsonNumber
  | MathJsonString
  | MathJsonSymbol
  | MathJsonFunction
  | readonly [MathJsonIdentifier, ...SemiBoxedExpression[]]
  | BoxedExpression;

/**
 * @category Definitions
 *
 */
export interface BoxedBaseDefinition {
  name: string;
  wikidata?: string;
  description?: string | string[];
  url?: string;
  /**
   * The scope this definition belongs to.
   *
   * This field is usually undefined, but its value is set by `getDefinition()`
   */
  scope: RuntimeScope | undefined;

  /** When the environment changes, for example the numerical precision,
   * call `reset()` so that any cached values can be recalculated.
   */
  reset(): void;
}

/**
 * Use `contravariant` for the arguments of a function.
 * Use `covariant` for the result of a function.
 * Use `bivariant` to check the domain matches exactly.
 *
 * @category Boxed Expression
 */

export type DomainCompatibility =
  | 'covariant' // A <: B
  | 'contravariant' // A :> B
  | 'bivariant' // A <: B and A :>B, A := B
  | 'invariant'; // Neither A <: B, nor A :> B

/** A domain constructor is the operator of a domain expression.
 *
 * @category Boxed Expression
 *
 */
export type DomainConstructor =
  | 'FunctionOf' // <domain-of-args>* <co-domain>
  | 'ListOf' // <domain-of-elements>
  | 'DictionaryOf'
  | 'TupleOf'
  | 'Intersection'
  | 'Union'
  | 'OptArg'
  | 'VarArg'
  | 'Covariant'
  | 'Contravariant'
  | 'Bivariant'
  | 'Invariant';

/**
 * @noInheritDoc
 *
 * @category Boxed Expression
 */
export interface BoxedDomain extends BoxedExpression {
  get canonical(): BoxedDomain;

  get json(): Expression;

  /** True if a valid domain, and compatible with `dom`
   * `kind` is '"covariant"' by default, i.e. `this <: dom`
   */
  isCompatible(
    dom: BoxedDomain | DomainLiteral,
    kind?: DomainCompatibility
  ): boolean;

  get base(): DomainLiteral;

  get ctor(): DomainConstructor | null;
  get params(): DomainExpression[];

  readonly isNumeric: boolean;
  readonly isFunction: boolean;
}

/**
 * These handlers are the primitive operations that can be performed on
 * collections.
 *
 * There are two types of collections:
 * - finite collections, such as lists, tuples, sets, matrices, etc...
 *  The `size()` handler of finite collections returns the number of elements
 * - infinite collections, such as sequences, ranges, etc...
 *  The `size()` handler of infinite collections returns `Infinity`
 *  Infinite collections are not indexable, they have no `at()` handler.
 *
 *  @category Definitions
 */
export type CollectionHandlers = {
  /** Return an iterator
   * - start is optional and is a 1-based index.
   * - if start is not specified, start from index 1
   * - count is optional and is the number of elements to return
   * - if count is not specified or negative, return all the elements from start to the endna
   *
   * If there is a `keys()` handler, there is no `iterator()` handler.
   *
   * @category Definitions
   */
  iterator: (
    expr: BoxedExpression,
    start?: number,
    count?: number
  ) => Iterator<BoxedExpression, undefined>;

  /** Return the element at the specified index.
   * The first element is `at(1)`, the last element is `at(-1)`.
   * If the index is &lt;0, return the element at index `size() + index + 1`.
   * The index can also be a string for example for dictionaries.
   * If the index is invalid, return `undefined`.
   */
  at: (
    expr: BoxedExpression,
    index: number | string
  ) => undefined | BoxedExpression;

  /** Return the number of elements in the collection.
   * An empty collection has a size of 0.
   */
  size: (expr: BoxedExpression) => number;

  /**
   * If the collection is indexed by strings, return the valid values
   * for the index.
   */
  keys: (expr: BoxedExpression) => undefined | Iterator<string>;

  /**
   * Return the index of the first element that matches the target expression.
   * The comparison is done using the `target.isEqual()` method.
   * If the expression is not found, return `undefined`.
   * If the expression is found, return the index, 1-based.
   * If the expression is found multiple times, return the index of the first
   * match.
   *
   * From is the starting index for the search. If negative, start from the end
   * and search backwards.
   */
  indexOf: (
    expr: BoxedExpression,
    target: BoxedExpression,
    from?: number
  ) => number | string | undefined;
};

/**
 * A function definition can have some flags to indicate specific
 * properties of the function.
 * @category Definitions
 */
export type FunctionDefinitionFlags = {
  /**  If `true`, the function is applied element by element to lists, matrices
   * (`["List"]` or `["Tuple"]` expressions) and equations (relational
   * operators).
   *
   * **Default**: `false`
   */
  threadable: boolean;

  /** If `true`, `["f", ["f", a], b]` simplifies to `["f", a, b]`
   *
   * **Default**: `false`
   */
  associative: boolean;

  /** If `true`, `["f", a, b]` equals `["f", b, a]`. The canonical
   * version of the function will order the arguments.
   *
   * **Default**: `false`
   */
  commutative: boolean;

  /**
   * If `commutative` is `true`, the order of the arguments is determined by
   * this function.
   *
   * If the function is not provided, the arguments are ordered by the
   * default order of the arguments.
   *
   */
  commutativeOrder:
    | ((a: BoxedExpression, b: BoxedExpression) => number)
    | undefined;

  /** If `true`, when the function is univariate, `["f", ["Multiply", x, c]]`
   * simplifies to `["Multiply", ["f", x], c]` where `c` is constant
   *
   * When the function is multivariate, multiplicativity is considered only on
   * the first argument: `["f", ["Multiply", x, y], z]` simplifies to
   * `["Multiply", ["f", x, z], ["f", y, z]]`
   *
   * Default: `false`
   */

  /** If `true`, `["f", ["f", x]]` simplifies to `["f", x]`.
   *
   * **Default**: `false`
   */
  idempotent: boolean;

  /** If `true`, `["f", ["f", x]]` simplifies to `x`.
   *
   * **Default**: `false`
   */
  involution: boolean;

  /** If `true`, the value of this function is always the same for a given
   * set of arguments and it has no side effects.
   *
   * An expression using this function is pure if the function and all its
   * arguments are pure.
   *
   * For example `Sin` is pure, `Random` isn't.
   *
   * This information may be used to cache the value of expressions.
   *
   * **Default:** `true`
   */
  pure: boolean;

  /**
   * An inert function evaluates directly to one of its argument, typically
   * the first one. They may be used to provide formating hints, but do
   * not affect simplification or evaluation.
   *
   * **Default:** false
   */
  inert: boolean;

  /**
   * All the arguments of a numeric function are numeric,
   * and its value is numeric.
   */
  numeric: boolean;
};

/** @category Compiling */
export type CompiledExpression = {
  evaluate?: (scope: {
    [symbol: string]: BoxedExpression;
  }) => number | BoxedExpression;
};

/**
 * @category Definitions
 *
 */
export type BoxedFunctionSignature = {
  inferredSignature: boolean;

  params: BoxedDomain[];
  optParams: BoxedDomain[];
  restParam?: BoxedDomain;
  result:
    | BoxedDomain
    | ((
        ce: IComputeEngine,
        args: ReadonlyArray<BoxedExpression>
      ) => BoxedDomain | null | undefined);

  canonical?: (
    ce: IComputeEngine,
    args: ReadonlyArray<BoxedExpression>
  ) => BoxedExpression | null;
  evaluate?: (
    args: ReadonlyArray<BoxedExpression>,
    options: EvaluateOptions & { engine: IComputeEngine }
  ) => BoxedExpression | undefined;
  evalDimension?: (
    ce: IComputeEngine,
    args: ReadonlyArray<BoxedExpression>
  ) => BoxedExpression;
  sgn?: (
    args: ReadonlyArray<BoxedExpression>,
    options: { engine: IComputeEngine }
  ) => -1 | 0 | 1 | typeof NaN | undefined;

  compile?: (expr: BoxedExpression) => CompiledExpression;
};

/** @category Definitions */
export type Hold = 'none' | 'all' | 'first' | 'rest' | 'last' | 'most';

/**
 * @category Definitions
 *
 */
export type BoxedFunctionDefinition = BoxedBaseDefinition &
  Partial<CollectionHandlers> &
  FunctionDefinitionFlags & {
    complexity: number;
    hold: Hold;

    signature: BoxedFunctionSignature;

    flags?: Partial<NumericFlags>;

    type: 'function';
  };

/**
 * @category Definitions
 *
 */
export type SymbolAttributes = {
  /**
   * If `true` the value of the symbol is constant. The value or domain of
   * symbols with this attribute set to `true` cannot be changed.
   *
   * If `false`, the symbol is a variable.
   *
   * **Default**: `false`
   */
  constant: boolean;

  /**
   * If the symbol has a value, it is held as indicated in the table below.
   * A green checkmark indicate that the symbol is substituted.

<div className="symbols-table">

| Operation | `"never"` | `"evaluate"` | `"N"` |
| :--- | :----- |
| `canonical()`|  (X) | | |
| `evaluate()` |   (X) | (X) | |
| `"N()"` |  (X) | (X)  |  (X) |

</div>

  * Some examples:
  * - `i` has `holdUntil: 'never'`: its is never substituted
  * - `x` has `holdUntil: 'evaluate'` (variables)
  * - `Pi` has `holdUntil: 'N'` (special numeric constant)
  * 
  * **Default:** `evaluate`
  */
  holdUntil: 'never' | 'evaluate' | 'N';
};

/**
 * When used in a `SymbolDefinition`, these flags are optional.
 *
 * If provided, they will override the value derived from
 * the symbol's value.
 *
 * @category Definitions
 */
export type NumericFlags = {
  number: boolean | undefined;
  integer: boolean | undefined;
  rational: boolean | undefined;
  real: boolean | undefined;
  complex: boolean | undefined;
  imaginary: boolean | undefined;

  positive: boolean | undefined; // x > 0
  nonPositive: boolean | undefined; // x <= 0
  negative: boolean | undefined; // x < 0
  nonNegative: boolean | undefined; // x >= 0

  zero: boolean | undefined;
  notZero: boolean | undefined;
  one: boolean | undefined;
  negativeOne: boolean | undefined;
  infinity: boolean | undefined;
  NaN: boolean | undefined;
  finite: boolean | undefined;

  even: boolean | undefined;
  odd: boolean | undefined;
};

/**
 * @noInheritDoc
 * @category Definitions
 */
export interface BoxedSymbolDefinition
  extends BoxedBaseDefinition,
    SymbolAttributes,
    Partial<NumericFlags> {
  get value(): BoxedExpression | undefined;
  set value(val: SemiBoxedExpression | number | undefined);

  domain: BoxedDomain | undefined;
  // True if the domain has been inferred: while a domain is inferred,
  // it can be updated as more information becomes available.
  // A domain that is not inferred, but has been set explicitly, cannot be updated.
  inferredDomain: boolean;

  type: Type;
}

/**
 * Given an expression and set of wildcards, return a new expression.
 *
 * For example:
 *
 * ```ts
 * {
 *    match: '_x',
 *    replace: (expr, {_x}) => { return ['Add', 1, _x] }
 * }
 * ```
 *
 * @category Rules */
export type RuleReplaceFunction = (
  expr: BoxedExpression,
  wildcards: BoxedSubstitution
) => BoxedExpression | undefined;

/** @category Rules */
export type RuleConditionFunction = (
  wildcards: BoxedSubstitution,
  ce: IComputeEngine
) => boolean;

/** @category Rules */
export type RuleFunction = (
  expr: BoxedExpression
) => undefined | BoxedExpression | RuleStep;

export function isRuleStep(x: any): x is RuleStep {
  return x && typeof x === 'object' && x.value && x.because;
}

/**
 * A rule describes how to modify an expressions that matches a pattern `match`
 * into a new expression `replace`.
 *
 * - `x-1` \( \to \) `1-x`
 * - `(x+1)(x-1)` \( \to \) `x^2-1
 *
 * The patterns can be expressed as LaTeX strings or a MathJSON expressions.
 *
 * As a shortcut, a rule can be defined as a LaTeX string: `x-1 -> 1-x`.
 * The expression to the left of `->` is the `match` and the expression to the
 * right is the `replace`. When using LaTeX strings, single character variables
 * are assumed to be wildcards.
 *
 * When using MathJSON expressions, anonymous wildcards (`_`) will match any
 * expression. Named wildcards (`_x`, `_a`, etc...) will match any expression
 * and bind the expression to the wildcard name.
 *
 * In addition the sequence wildcard (`__1`, `__a`, etc...) will match
 * a sequence of one or more expressions, and bind the sequence to the
 * wildcard name.
 *
 * Sequence wildcards are useful when the number of elements in the sequence
 * is not known in advance. For example, in a sum, the number of terms is
 * not known in advance. ["Add", 0, `__a`] will match two or more terms and
 * the `__a` wildcard will be a sequence of the matchign terms.
 *
 * If `exact` is false, the rule will match variants.
 *
 * For example 'x' will match 'a + x', 'x' will match 'ax', etc...
 *
 * For simplification rules, you generally want `exact` to be true, but
 * to solve equations, you want it to be false. Default to true.
 *
 * When set to false, infinite recursion is possible.
 *
 * @category Rules
 */

export type Rule =
  | string
  | RuleFunction
  | {
      match?: LatexString | SemiBoxedExpression | Pattern;
      replace:
        | LatexString
        | SemiBoxedExpression
        | RuleReplaceFunction
        | RuleFunction;
      condition?: LatexString | RuleConditionFunction;
      useVariations?: boolean; // Default to false
      id?: string; // Optional, for debugging or filtering
    };

/**
 *
 * If the `match` property is `undefined`, all expressions match this rule
 * and `condition` should also be `undefined`. The `replace` property should
 * be a `BoxedExpression` or a `RuleFunction`, and further filtering can be
 * done in the `replace` function.
 *
 * @category Rules */
export type BoxedRule = {
  /** @internal */
  _tag: 'boxed-rule';

  match: undefined | Pattern;

  replace: BoxedExpression | RuleReplaceFunction | RuleFunction;

  condition: undefined | RuleConditionFunction;

  useVariations?: boolean; // If true, the rule will match variations, for example
  // 'x' will match 'a + x', 'x' will match 'ax', etc...
  // Default to false.

  id?: string; // For debugging
};

export function isBoxedRule(x: any): x is BoxedRule {
  return x && typeof x === 'object' && x._tag === 'boxed-rule';
}

export type RuleStep = {
  value: BoxedExpression;
  because: string; // id of the rule
};

export type RuleSteps = RuleStep[];

/**
 * To create a BoxedRuleSet use the `ce.rules()` method.
 *
 * Do not create a `BoxedRuleSet` directly.
 *
 * @category Rules */
export type BoxedRuleSet = { rules: ReadonlyArray<BoxedRule> };

/**
 * @noInheritDoc
 *
 * @category Pattern Matching
 */
export type Pattern = BoxedExpression;

/**
 * @category Boxed Expression
 *
 */
export type BoxedSubstitution = Substitution<BoxedExpression>;

/**
 * When provided, canonical forms are used to put an expression in a
 * "standard" form.
 *
 * Each canonical form applies some transformation to an expression. When
 * specified as an array, each transformation is done in the order in which
 * it was provided.
 *
 * - `InvisibleOperator`: replace use of the `InvisibleOperator` with
 *    another operation, such as multiplication (i.e. `2x` or function
 *    application (`f(x)`).
 * - `Number`: replace all numeric values with their
 *    canonical representation, for example, reduce
 *    rationals and replace complex numbers with no imaginary part with a real number.
 * - `Multiply`: replace negation with multiplication by -1, remove 1 from multiplications, simplify signs (`-y \times -x` -> `x \times y`), complex numbers are promoted (['Multiply', 2, 'ImaginaryUnit'] -> `["Complex", 0, 2]`)
 * - `Add`: replace `Subtract` with `Add`, removes 0 in addition, promote complex numbers (["Add", "a", ["Complex", 0, "b"] -> `["Complex", "a", "b"]`)
 * - `Power`: simplify `Power` expression, for example, `x^{-1}` -> `\frac{1}{x}`, `x^0` -> `1`, `x^1` -> `x`, `1^x` -> `1`, `x^{\frac{1}{2}}` -> `\sqrt{x}`, `a^b^c` -> `a^{bc}`...
 * - `Divide`: replace with a `Rational` number if numerator and denominator are integers, simplify, e.g. `\frac{x}{1}` -> `x`...
 * - `Flatten`: remove any unnecessary `Delimiter` expression, and flatten any associative functions, for example `["Add", ["Add", "a", "b"], "c"]` -> `["Add", "a", "b", "c"]`
 * - `Order`: when applicable, sort the arguments in a specific order, for
 *    example for addition and multiplication.
 *
 *
 * @category Boxed Expression
 */
export type CanonicalForm =
  | 'InvisibleOperator'
  | 'Number'
  | 'Multiply'
  | 'Add'
  | 'Power'
  | 'Divide'
  | 'Flatten'
  | 'Order';

export type CanonicalOptions = boolean | CanonicalForm | CanonicalForm[];

/** @category Boxed Expression */
export type DomainLiteral =
  | 'Anything'
  | 'Values'
  | 'Domains'
  | 'Void'
  | 'NothingDomain'
  | 'Booleans'
  | 'Strings'
  | 'Symbols'
  | 'Collections'
  | 'Lists'
  | 'Dictionaries'
  | 'Sequences'
  | 'Tuples'
  | 'Sets'
  | 'Functions'
  | 'Predicates'
  | 'LogicOperators'
  | 'RelationalOperators'
  | 'NumericFunctions'
  | 'RealFunctions'
  | 'Numbers'
  | 'ComplexNumbers'
  | 'ImaginaryNumbers'
  | 'Integers'
  | 'Rationals'
  | 'PositiveNumbers'
  | 'PositiveIntegers'
  | 'NegativeNumbers'
  | 'NegativeIntegers'
  | 'NonNegativeNumbers'
  | 'NonNegativeIntegers'
  | 'NonPositiveNumbers'
  | 'NonPositiveIntegers'
  | 'TranscendentalNumbers'
  | 'AlgebraicNumbers'
  | 'RationalNumbers'
  | 'RealNumbers';

/** @category Boxed Expression */
export type DomainExpression<T = SemiBoxedExpression> =
  | DomainLiteral
  | ['Union', ...DomainExpression<T>[]]
  | ['Intersection', ...DomainExpression<T>[]]
  | ['ListOf', DomainExpression<T>]
  | ['DictionaryOf', DomainExpression<T>]
  | ['TupleOf', ...DomainExpression<T>[]]
  | ['OptArg', ...DomainExpression<T>[]]
  | ['VarArg', DomainExpression<T>]
  // | ['Value', T]
  // | ['Head', string]
  // | ['Symbol', string]
  | ['Covariant', DomainExpression<T>]
  | ['Contravariant', DomainExpression<T>]
  | ['Bivariant', DomainExpression<T>]
  | ['Invariant', DomainExpression<T>]
  | ['FunctionOf', ...DomainExpression<T>[]];

/** Options for `BoxedExpression.simplify()`
 *
 * @category Compute Engine
 */
export type SimplifyOptions = {
  /**
   * The set of rules to apply. If `null`, use no rules. If not provided,
   * use the default simplification rules.
   */
  rules?: null | Rule | ReadonlyArray<BoxedRule | Rule> | BoxedRuleSet;

  /**
   * Use this cost function to determine if a simplification is worth it.
   *
   * If not provided, `ce.costFunction`, the cost function of the engine is
   * used.
   */
  costFunction?: (expr: BoxedExpression) => number;
};

/** Options for `BoxedExpression.evaluate()`
 *
 * @category Boxed Expression
 */
export type EvaluateOptions = {
  numericApproximation?: boolean; // Default to false
};

/**
 * Metadata that can be associated with a `BoxedExpression`
 *
 * @category Boxed Expression
 */

export type Metadata = {
  latex?: string | undefined;
  wikidata?: string | undefined;
};

/**
 * When a unitless value is passed to or returned from a trigonometric function,
 * the angular unit of the value.
 *
 * - `rad`: radians, 2π radians is a full circle
 * - `deg`: degrees, 360 degrees is a full circle
 * - `grad`: gradians, 400 gradians is a full circle
 * - `turn`: turns, 1 turn is a full circle
 *
 * @category Compute Engine
 */
export type AngularUnit = 'rad' | 'deg' | 'grad' | 'turn';

/** @category Compute Engine */
export type ArrayValue =
  | boolean
  | number
  | string
  | BigNum
  | BoxedExpression
  | undefined;

/** @category Assumptions */
export type AssumeResult =
  | 'internal-error'
  | 'not-a-predicate'
  | 'contradiction'
  | 'tautology'
  | 'ok';

/** @category Compute Engine */
export type AssignValue =
  | boolean
  | number
  | string
  | BigNum
  | LatexString
  | SemiBoxedExpression
  | ((
      args: BoxedExpression[],
      options: EvaluateOptions & { engine: IComputeEngine }
    ) => BoxedExpression)
  | undefined;

/** @internal */
export interface IComputeEngine extends IBigNum {
  latexDictionary: readonly LatexDictionaryEntry[];

  /** @private */
  indexedLatexDictionary: IndexedLatexDictionary;

  decimalSeparator: LatexString;

  // Common domains
  readonly Anything: BoxedDomain;
  readonly Void: BoxedDomain;
  readonly Strings: BoxedDomain;
  readonly Booleans: BoxedDomain;
  readonly Numbers: BoxedDomain;

  // Common symbols
  readonly True: BoxedExpression;
  readonly False: BoxedExpression;
  readonly Pi: BoxedExpression;
  readonly E: BoxedExpression;
  readonly Nothing: BoxedExpression;

  readonly Zero: BoxedExpression;
  readonly One: BoxedExpression;
  readonly Half: BoxedExpression;
  readonly NegativeOne: BoxedExpression;
  readonly I: BoxedExpression;
  readonly NaN: BoxedExpression;
  readonly PositiveInfinity: BoxedExpression;
  readonly NegativeInfinity: BoxedExpression;
  readonly ComplexInfinity: BoxedExpression;

  /** @internal */
  readonly _BIGNUM_NAN: BigNum;
  /** @internal */
  readonly _BIGNUM_ZERO: BigNum;
  /** @internal */
  readonly _BIGNUM_ONE: BigNum;
  /** @internal */
  readonly _BIGNUM_TWO: BigNum;
  /** @internal */
  readonly _BIGNUM_HALF: BigNum;
  /** @internal */
  readonly _BIGNUM_PI: BigNum;
  /** @internal */
  readonly _BIGNUM_NEGATIVE_ONE: BigNum;

  /** The current scope */
  context: RuntimeScope | null;

  /** Absolute time beyond which evaluation should not proceed
   * @internal
   */
  deadline?: number;

  /** @hidden */
  readonly timeLimit: number;
  /** @hidden */
  readonly iterationLimit: number;
  /** @hidden */
  readonly recursionLimit: number;

  chop(n: number): number;
  chop(n: BigNum): BigNum | 0;
  chop(n: number | BigNum): number | BigNum;

  bignum: (a: string | number | bigint | BigNum) => BigNum;

  complex: (a: number | Complex, b?: number) => Complex;
  // isComplex(a: unknown): a is Complex;

  /** @internal */
  _numericValue(
    value: number | bigint | Rational | BigNum | NumericValueData
  ): NumericValue;

  /** If the precision is set to `machine`, floating point numbers
   * are represented internally as a 64-bit floating point number (as
   * per IEEE 754-2008), with a 52-bit mantissa, which gives about 15
   * digits of precision.
   *
   * If the precision is set to `auto`, the precision is set to 300 digits.
   *
   */
  set precision(p: number | 'machine' | 'auto');
  get precision(): number;

  tolerance: number;

  angularUnit: AngularUnit;

  costFunction: (expr: BoxedExpression) => number;

  strict: boolean;

  box(
    expr:
      | NumericValue
      | BigNum
      | [num: number, denom: number]
      | SemiBoxedExpression,
    options?: { canonical?: CanonicalOptions; structural?: boolean }
  ): BoxedExpression;

  function(
    name: string,
    ops: ReadonlyArray<SemiBoxedExpression>,
    options?: {
      metadata?: Metadata;
      canonical?: CanonicalOptions;
      structural?: boolean;
    }
  ): BoxedExpression;

  number(
    value:
      | number
      | bigint
      | string
      | NumericValue
      | MathJsonNumber
      | BigNum
      | Complex
      | Rational,
    options?: { metadata?: Metadata; canonical?: CanonicalOptions }
  ): BoxedExpression;

  symbol(
    sym: string,
    options?: { metadata?: Metadata; canonical?: CanonicalOptions }
  ): BoxedExpression;

  string(s: string, metadata?: Metadata): BoxedExpression;

  domain(
    domain: BoxedDomain | DomainExpression,
    metadata?: Metadata
  ): BoxedDomain;

  error(
    message:
      | MathJsonIdentifier
      | [MathJsonIdentifier, ...ReadonlyArray<SemiBoxedExpression>],
    where?: SemiBoxedExpression
  ): BoxedExpression;

  domainError(
    expectedDomain: BoxedDomain | DomainLiteral,
    actualDomain: undefined | BoxedDomain,
    where?: SemiBoxedExpression
  ): BoxedExpression;

  hold(expr: SemiBoxedExpression): BoxedExpression;

  tuple(...elements: ReadonlyArray<number>): BoxedExpression;
  tuple(...elements: ReadonlyArray<BoxedExpression>): BoxedExpression;

  rules(
    rules:
      | Rule
      | ReadonlyArray<Rule | BoxedRule>
      | BoxedRuleSet
      | undefined
      | null
  ): BoxedRuleSet;

  /**
   * Return a set of built-in rules.
   */
  getRuleSet(
    id?: 'harmonization' | 'solve-univariate' | 'standard-simplification'
  ): BoxedRuleSet | undefined;

  /**
   * This is a primitive to create a boxed function.
   *
   * In general, consider using `ce.box()` or `ce.function()` or
   * `canonicalXXX()` instead.
   *
   * The caller must ensure that the arguments are in canonical form:
   * - arguments are `canonical()`
   * - arguments are sorted
   * - arguments are flattened and desequenced
   *
   * @internal
   */
  _fn(
    name: string,
    ops: ReadonlyArray<BoxedExpression>,
    options?: Metadata & { canonical?: boolean }
  ): BoxedExpression;

  parse(
    latex: null,
    options?: Partial<ParseLatexOptions> & { canonical?: CanonicalOptions }
  ): null;
  parse(
    latex: LatexString,
    options?: Partial<ParseLatexOptions> & { canonical?: CanonicalOptions }
  ): BoxedExpression;
  parse(
    latex: LatexString | null,
    options?: Partial<ParseLatexOptions> & { canonical?: CanonicalOptions }
  ): BoxedExpression | null;

  pushScope(scope?: Partial<Scope>): IComputeEngine;

  popScope(): IComputeEngine;

  swapScope(scope: RuntimeScope | null): RuntimeScope | null;

  resetContext(): void;

  defineSymbol(name: string, def: SymbolDefinition): BoxedSymbolDefinition;
  lookupSymbol(
    name: string,
    wikidata?: string,
    scope?: RuntimeScope
  ): undefined | BoxedSymbolDefinition;

  defineFunction(
    name: string,
    def: FunctionDefinition
  ): BoxedFunctionDefinition;
  lookupFunction(
    name: string,
    scope?: RuntimeScope | null
  ): undefined | BoxedFunctionDefinition;

  assign(ids: { [id: string]: AssignValue }): IComputeEngine;
  assign(id: string, value: AssignValue): IComputeEngine;
  assign(
    arg1: string | { [id: string]: AssignValue },
    arg2?: AssignValue
  ): IComputeEngine;

  declare(identifiers: {
    [id: string]:
      | BoxedDomain
      | DomainExpression
      | SymbolDefinition
      | FunctionDefinition;
  }): IComputeEngine;
  declare(
    id: string,
    def: BoxedDomain | DomainExpression | SymbolDefinition | FunctionDefinition
  ): IComputeEngine;
  declare(
    arg1:
      | string
      | {
          [id: string]:
            | BoxedDomain
            | DomainExpression
            | SymbolDefinition
            | FunctionDefinition;
        },
    arg2?:
      | BoxedDomain
      | DomainExpression
      | SymbolDefinition
      | FunctionDefinition
  ): IComputeEngine;

  assume(predicate: SemiBoxedExpression): AssumeResult;

  forget(symbol?: string | string[]): void;

  get assumptions(): ExpressionMapInterface<boolean>;

  ask(pattern: SemiBoxedExpression): BoxedSubstitution[];

  verify(query: SemiBoxedExpression): boolean;

  /** @internal */
  shouldContinueExecution(): boolean;

  /** @internal */
  checkContinueExecution(): void;

  /** @internal */
  cache<T>(name: string, build: () => T, purge?: (t: T) => T | undefined): T;

  /** @internal */
  readonly stats: ComputeEngineStats;

  /** @internal */
  reset(): void;

  /** @internal */
  _register(expr: BoxedExpression): void;

  /** @internal */
  _unregister(expr: BoxedExpression): void;
}

/** @internal */
export interface ComputeEngineStats {
  symbols: Set<BoxedExpression>;
  expressions: null | Set<BoxedExpression>;
  highwaterMark: number;
}

/**
 * Options to control the serialization to MathJSON when using `BoxedExpression.toMathJson()`.
 *
 * @category Compute Engine
 */
export type JsonSerializationOptions = {
  /** If true, the serialization applies some transformations to make
   * the JSON more readable. For example, `["Power", "x", 2]` is serialized
   * as `["Square", "x"]`.
   */
  prettify: boolean;

  /** A list of space separated function names that should be excluded from
   * the JSON output.
   *
   * Those functions are replaced with an equivalent, for example, `Square` with
   * `Power`, etc...
   *
   * Possible values include `Sqrt`, `Root`, `Square`, `Exp`, `Subtract`,
   * `Rational`, `Complex`
   *
   * **Default**: `[]` (none)
   */
  exclude: string[];

  /** A list of space separated keywords indicating which MathJSON expressions
   * can use a shorthand.
   *
   * **Default**: `["all"]`
   */
  shorthands: ('all' | 'number' | 'symbol' | 'function' | 'string')[];

  /** A list of space separated keywords indicating which metadata should be
   * included in the MathJSON. If metadata is included, shorthand notation
   * is not used.
   *
   * **Default**: `[]`  (none)
   */
  metadata: ('all' | 'wikidata' | 'latex')[];

  /** If true, repeating decimals are detected and serialized accordingly
   * For example:
   * - `1.3333333333333333` \( \to \) `1.(3)`
   * - `0.142857142857142857142857142857142857142857142857142` \( \to \) `0.(1428571)`
   *
   * **Default**: `true`
   */
  repeatingDecimal: boolean;

  /**
   * The maximum number of significant digits in serialized numbers.
   * - `"max"`: all availabe digits are serialized.
   * - `"auto"`: use the same precision as the compute engine.
   *
   * **Default**: `"auto"`
   */
  fractionalDigits: 'auto' | 'max' | number;
};

/** A LaTeX string starts and end with `$`, for example
 * `"$\frac{\pi}{2}$"`.
 *
 * @category Latex Parsing and Serialization
 */
export type LatexString = string;

/**
 * Control how a pattern is matched to an expression.
 *
 * - `substitution`: if present, assumes these values for the named wildcards,
 *    and ensure that subsequent occurrence of the same wildcard have the same
 *    value.
 * - `recursive`: if true, match recursively, otherwise match only the top
 *    level.
 * - `exact`: if true, only match expressions that are structurally identical.
 *    If false, match expressions that are structurally identical or equivalent.
 *
 *    For example, when false, `["Add", '_a', 2]` matches `2`, with a value of
 *    `_a` of `0`. If true, the expression does not match. **Default**: `true`
 *
 * @category Pattern Matching
 *
 */
export type PatternMatchOptions = {
  substitution?: BoxedSubstitution;
  recursive?: boolean;
  useVariations?: boolean;
};

/**
 * @category Boxed Expression
 *
 */
export type ReplaceOptions = {
  /**
   * If `true`, apply replacement rules to all sub-expressions.
   *
   * If `false`, only consider the top-level expression.
   *
   * **Default**: `false`
   */
  recursive: boolean;

  /**
   * If `true`, stop after the first rule that matches.
   *
   * If `false`, apply all the remaining rules even after the first match.
   *
   * **Default**: `false`
   */
  once: boolean;

  /**
   * If `true` the rule will use some equivalent variations to match.
   *
   * For example when `useVariations` is true:
   * - `x` matches `a + x` with a = 0
   * - `x` matches `ax` with a = 1
   * - etc...
   *
   * Setting this to `true` can save time by condensing multiple rules
   * into one. This can be particularly useful when describing equations
   * solutions. However, it can lead to infinite recursion and should be
   * used with caution.
   *
   */
  useVariations: boolean;

  /**
   * If `iterationLimit` > 1, the rules will be repeatedly applied
   * until no rules apply, up to `maxIterations` times.
   *
   * Note that if `once` is true, `iterationLimit` has no effect.
   *
   * **Default**: `1`
   */
  iterationLimit: number;

  /**
   * Indicate if the expression should be canonicalized after the replacement.
   * If not provided, the expression is canonicalized if the the expression
   * that matched the pattern is canonical.
   */
  canonical: CanonicalOptions;
};

/**
 * A substitution describes the values of the wildcards in a pattern so that
 * the pattern is equal to a target expression.
 *
 * A substitution can also be considered a more constrained version of a
 * rule whose `match` is always a symbol.

* @category Boxed Expression
 */
export type Substitution<T = SemiBoxedExpression> = {
  [symbol: string]: T;
};

/** @category Assumptions */
export interface ExpressionMapInterface<U> {
  has(expr: BoxedExpression): boolean;
  get(expr: BoxedExpression): U | undefined;
  set(expr: BoxedExpression, value: U): void;
  delete(expr: BoxedExpression): void;
  clear(): void;
  [Symbol.iterator](): IterableIterator<[BoxedExpression, U]>;
  entries(): IterableIterator<[BoxedExpression, U]>;
}

/**
 * The entries have been validated and optimized for faster evaluation.
 *
 * When a new scope is created with `pushScope()` or when creating a new
 * engine instance, new instances of this type are created as needed.
 *
 * @category Definitions
 */
export type RuntimeIdentifierDefinitions = Map<
  string,
  BoxedSymbolDefinition | BoxedFunctionDefinition
>;

/**
 * A scope is a set of names in a dictionary that are bound (defined) in
 * a MathJSON expression.
 *
 * Scopes are arranged in a stack structure. When an expression that defined
 * a new scope is evaluated, the new scope is added to the scope stack.
 * Outside of the expression, the scope is removed from the scope stack.
 *
 * The scope stack is used to resolve symbols, and it is possible for
 * a scope to 'mask' definitions from previous scopes.
 *
 * Scopes are lexical (also called a static scope): they are defined based on
 * where they are in an expression, they are not determined at runtime.
 *
 * @category Compute Engine
 */
export type Scope = {
  /** Signal `timeout` when the execution time for this scope is exceeded.
   *
   * Time in seconds, default 2s.
   *
   * @experimental
   */
  timeLimit: number;

  /** Signal `out-of-memory` when the memory usage for this scope is exceeded.
   *
   * Memory is in Megabytes, default: 1Mb.
   *
   * @experimental
   */
  memoryLimit: number;

  /** Signal `recursion-depth-exceeded` when the recursion depth for this
   * scope is exceeded.
   *
   * @experimental
   */
  recursionLimit: number;

  /** Signal `iteration-limit-exceeded` when the iteration limit
   * in a loop is exceeded. Default: no limits.
   *
   * @experimental
   */
  iterationLimit: number;
};

/** @category Compute Engine */
export type RuntimeScope = Scope & {
  parentScope?: RuntimeScope;

  ids?: RuntimeIdentifierDefinitions;

  assumptions: undefined | ExpressionMapInterface<boolean>;

  /** The location of the call site that created this scope */
  // origin?: {
  //   name?: string;
  //   line?: number;
  //   column?: number;
  // };

  /** Free memory should not go below this level for execution to proceed */
  // lowWaterMark?: number;
};

/**
 * A bound symbol (i.e. one with an associated definition) has either a domain
 * (e.g. ∀ x ∈ ℝ), a value (x = 5) or both (π: value = 3.14... domain = RealNumbers)
 * @category Definitions
 */
export type SymbolDefinition = BaseDefinition &
  Partial<SymbolAttributes> & {
    domain?: DomainLiteral | BoxedDomain;

    /** If true, the domain is inferred, and could be adjusted later
     * as more information becomes available or if the symbol is explicitly
     * declared.
     */
    inferred?: boolean;

    /** `value` can be a JS function since for some constants, such as
     * `Pi`, the actual value depends on the `precision` setting of the
     * `ComputeEngine` and possible other environment settings */
    value?:
      | LatexString
      | SemiBoxedExpression
      | ((ce: IComputeEngine) => SemiBoxedExpression | null);

    flags?: Partial<NumericFlags>;
  };

/**
 * Definition record for a function.
 * @category Definitions
 *
 */
export type FunctionDefinition = BaseDefinition &
  Partial<CollectionHandlers> &
  Partial<FunctionDefinitionFlags> & {
    /**
     * A number used to order arguments.
     *
     * Argument with higher complexity are placed after arguments with lower
     * complexity when ordered canonically in commutative functions.
     *
     * - Additive functions: 1000-1999
     * - Multiplicative functions: 2000-2999
     * - Root and power functions: 3000-3999
     * - Log functions: 4000-4999
     * - Trigonometric functions: 5000-5999
     * - Hypertrigonometric functions: 6000-6999
     * - Special functions (factorial, Gamma, ...): 7000-7999
     * - Collections: 8000-8999
     * - Inert and styling:  9000-9999
     * - Logic: 10000-10999
     * - Relational: 11000-11999
     *
     * **Default**: 100,000
     */
    complexity?: number;

    /**
     * - `"none"` Each of the arguments is evaluated (default)
     * - `"all"` None of the arguments are evaluated and they are passed as is
     * - `"first"` The first argument is not evaluated, the others are
     * - `"rest"` The first argument is evaluated, the others aren't
     * - `"last"`: The last argument is not evaluated, the others are
     * - `"most"`: All the arguments are evaluated, except the last one
     *
     * **Default**: `"none"`
     */

    hold?: Hold;

    signature: FunctionSignature;

    flags?: Partial<NumericFlags>;
  };

/**
 * @category Definitions
 *
 */
export type BaseDefinition = {
  /** A short (about 1 line) description. May contain Markdown. */
  description?: string | string[];

  /** A URL pointing to more information about this symbol or operator. */
  url?: string;

  /**
   * A short string representing an entry in a wikibase.
   *
   * For example `Q167` is the [wikidata entry](https://www.wikidata.org/wiki/Q167)
   * for the `Pi` constant.
   */
  wikidata?: string;
};

/**
 * @category Definitions
 *
 */

export type FunctionSignature = {
  /** The domain of this signature, a domain compatible with the `Functions`
   * domain).
   *
   * @deprecated Use params, optParams, restParam and result instead
   */
  domain?: DomainExpression;

  params?: DomainExpression[];
  optParams?: DomainExpression[];
  restParam?: DomainExpression;

  /** The domain of the result of the function. Either a domain
   * expression, or a function that returns a boxed domain.
   */
  result?:
    | DomainExpression
    | ((
        ce: IComputeEngine,
        args: BoxedDomain[]
      ) => BoxedDomain | null | undefined);

  /**
   * Return the canonical form of the expression with the arguments `args`.
   *
   * The arguments (`args`) may not be in canonical form. If necessary, they
   * can be put in canonical form.
   *
   * This handler should validate the domain and number of the arguments.
   *
   * If a required argument is missing, it should be indicated with a
   * `["Error", "'missing"]` expression. If more arguments than expected
   * are present, this should be indicated with an
   * ["Error", "'unexpected-argument'"]` error expression
   *
   * If the domain of an argument is not compatible, it should be indicated
   * with an `incompatible-domain` error.
   *
   * `["Sequence"]` expressions are not folded and need to be handled
   *  explicitly.
   *
   * If the function is associative, idempotent or an involution,
   * this handler should account for it. Notably, if it is commutative, the
   * arguments should be sorted in canonical order.
   *
   *
   * Values of symbols should not be substituted, unless they have
   * a `holdUntil` attribute of `"never"`.
   *
   * The handler should not consider the value or any assumptions about any
   * of the arguments that are symbols or functions (i.e. `arg.isZero`,
   * `arg.isInteger`, etc...) since those may change over time.
   *
   * The result of the handler should be a canonical expression.
   *
   * If the arguments do not match, they should be replaced with an appropriate
   * `["Error"]` expression. If the expression cannot be put in canonical form,
   * the handler should return `null`.
   *
   */
  canonical?: (
    ce: IComputeEngine,
    args: ReadonlyArray<BoxedExpression>
  ) => BoxedExpression | null;

  /**
   * Evaluate a function expression.
   *
   * The arguments have been evaluated, except the arguments to which a
   * `hold` applied.
   *
   * It is not necessary to further simplify or evaluate the arguments.
   *
   * If performing numerical calculations and `options.numericalApproximation`
   * is `false` return an exact numeric value, for example return a rational
   * number or a square root, rather than a floating point approximation.
   * Use `ce.number()` to create the numeric value.
   *
   * When `numericalApproximation` is `false`, return a floating point number:
   * - do not reduce rational numbers to decimal (floating point approximation)
   * - do not reduce square roots of rational numbers
   *
   * If the expression cannot be evaluated, due to the values, domains, or
   * assumptions about its arguments, for example, return `undefined` or
   * an `["Error"]` expression.
   */
  evaluate?:
    | SemiBoxedExpression
    | ((
        args: ReadonlyArray<BoxedExpression>,
        options: EvaluateOptions & { engine: IComputeEngine }
      ) => BoxedExpression | undefined);

  /** Dimensional analysis
   * @experimental
   */
  evalDimension?: (
    ce: IComputeEngine,
    args: ReadonlyArray<BoxedExpression>
  ) => BoxedExpression;

  /** Return the sign of the function expression. */
  sgn?: (
    args: ReadonlyArray<BoxedExpression>,
    options: { engine: IComputeEngine }
  ) => -1 | 0 | 1 | undefined | typeof NaN;

  /** Return a compiled (optimized) expression. */
  compile?: (expr: BoxedExpression) => CompiledExpression;
};
