import { Rule } from './public';

/**
 * @todo: a set to "tidy" an expression. Different from a canonical form, but
 * inline with the user's expectations.
 *
 * Example:
 *
 * - a^n * a^m -> a^(n+m)
 * - a / √b -> (a * √b) / b
 *
 */

/**
 * A set of simplification rules.
 *
 * The rules are expressed as
 *
 *    `[lhs, rhs, condition]`
 *
 * where `lhs` is rewritten as `rhs` if `condition` is true.
 *
 * `lhs` and `rhs` can be either an Expression or a LaTeX string.
 *
 * If using an Expression, the expression is *not* canonicalized before being
 * used. Therefore in some cases using Expression, while more verbose,
 * may be necessary as the expression could be simplified by the canonicalization.
 */
export const SIMPLIFY_RULES: Rule[] = [
  '\\frac{x}{x} -> 1', // Note this is not true for x = 0

  '\\frac{x^n}{x^m} -> x^{n-m}', // Note this is not always true
  'x^n * x^m -> x^{n+m}',
  'x^a * x^b -> x^{a+b}',
  'x^n^m -> x^{n * m}',

  //Duplicate Simplifications
  '\\log(\\exp(x)^y) -> y * x', //from '\\log(\\exp(x)) -> x' and '\\log(x^n) -> n \\log(x)'
  '\\log(\\exp(x) * y) -> x + \\log(y)', //from   '\\log(xy) -> \\log(x) + \\log(y)' and '\\log(\\exp(x)) -> x',
  '\\log(\\exp(x) / y) -> x - \\log(y)', //from   '\log(\frac{x}{y}) -> \log(x) - \log(y)' and '\\log(\\exp(x)) -> x',
  '\\exp(\\log(x) * \\log(y)) -> x^\\log(y)', //from '\\exp(\\log(x) * y) -> x^y',
  '\\exp(\\log(x) / \\log(y)) -> x^{1/\\log(y)}', //from '\\exp(\\log(x) / y) -> x^(1/y)',

  // Exponential and logarithms
  '\\log(xy) -> \\log(x) + \\log(y)',
  '\\log(x^n) -> n \\log(x)',
  '\\log(\\frac{x}{y}) -> \\log(x) - \\log(y)',
  '\\log(\\exp(x)) -> x',
  '\\log(0) -> NaN',
  '\\log(1) -> 0',
  '\\log(\\sqrt{x})->\\frac{1}{2}\\log(x)',
  '\\log(\\sqrt[y]{x})->\\frac{1}{y}\\log(x)',

  '\\exp(x) * \\exp(y) -> \\exp(x + y)',
  '\\exp(x)/\\exp(y) -> \\exp(x-y)',
  '\\exp(x)^n -> \\exp(n x)',
  '\\exp(\\log(x)) -> x',
  '\\exp(\\log(x) * y) -> x^y',
  '\\exp(\\log(x) / y) -> x^(1/y)',

  //Miscellaneous
  {match:'(\\frac{a}{x})^{-1}',replace:'\\frac{x}{a}',condition:'x!=0'},
  {match:'x^n/x',replace:'x^{n-1}',condition:'x!=0'},
  {match:'x^n/x',replace:'x^{n-1}',condition:'x!=0'},
  {match:'x^n/x',replace:'x^{n+1}',condition:'n<1'},
  {match:'x^nx',replace:'x^{n+1}',condition:'x!=0'},
  {match:'x^nx',replace:'x^{n+1}',condition:'n>0'},
  {match:'x^nx',replace:'x^{n+1}',condition:'n<-1'},
  'xx->x^2',
  {match:'\\frac{a}{b}',replace:'NaN',condition:'b==0'},

  //Minus Signs
  '(-a)/b->-(a/b)',
  '-(-a)/b->a/b',
  '(-x)(-y)->xy',

  //Powers with Base 0
  '0^0->NaN',
  {match:'0^a',replace:'0',condition:'a>0'},
  // {match:'0^n',replace:'\\infty',condition:'n<0 and n is an even integer'},
  {match:'0^n',replace:'\\infty',condition:'n<0 and n a rational number with even numerator and odd denominator'},
  {match:'0^n',replace:'NaN',condition:'n<0 and n is not a rational number'},
  {match:'0^n',replace:'NaN',condition:'n<0 and n is a rational number with and odd numerator'},

  //ABSOLUTE VALUE

  //Basic
  '|-x|->|x|',
  {match:'|x|',replace:'x',condition:'x>=0'},
  {match:'|x|',replace:'-x',condition:'x<=0'},
  {match:'|xy|',replace:'x|y|',condition:'x>=0'},
  {match:'|xy|',replace:'-x|y|',condition:'x<=0'},
  {match:'|\\frac{x}{y}|',replace:'\\frac{x}{|y|}',condition:'x>=0'},
  {match:'|\\frac{x}{y}|',replace:'-\\frac{x}{|y|}',condition:'x<=0'},

  //Powers and Absolute Value
  //{match:'|x|^n',replace:'x^n',condition:'n is an even integer'}, commented out because don't know how to test for even integer
  // {match:'|x|^{\frac{n}{m}}',replace:'x^{\frac{n}{m}}',condition:'n is an even integer and m is an odd integer'}
  // {match:'|x^n|', replace:'|x|^n',condition:'n is not an even integer or a rational with even numerator and odd denominator'},

  //Even Functions and Absolute Value
  '\\cos(|x|)->\\cos(x)',
  '\\sec(|x|)->\\sec(x)',
  '\\cosh(|x|)->\\cosh(x)',
  '\\sech(|x|)->\\sech(x)',

  //Odd functions and Absolute Value
  '|\\sin(x)|->\\sin(|x|)',
  '|\\tan(x)|->\\tan(|x|)',
  '|\\cot(x)|->\\cot(|x|)',
  '|\\csc(x)|->\\csc(|x|)',
  '|\\arcsin(x)|->\\arcsin(|x|)',
  '|\\arctan(x)|->\\arctan(|x|)',
  '|\\arccot(x)|->\\arccot(|x|)',
  '|\\arccsc(x)|->\\arccsc(|x|)',
  '|\\sinh(x)|->\\sinh(|x|)',
  '|\\tanh(x)|->\\tanh(|x|)',
  '|\\coth(x)|->\\coth(|x|)',
  '|\\csch(x)|->\\csch(|x|)',
  '|\\arcsinh(x)|->\\arcsinh(|x|)',
  '|\\arctanh(x)|->\\arctanh(|x|)',
  '|\\arccoth(x)|->\\arccoth(|x|)',
  '|\\arccsch(x)|->\\arccsch(|x|)',

  //COMMON DENOMINATOR
  '\\frac{a}{b}+\\frac{c}{d}->\\frac{ad+bc}{bd}',
  '\\frac{a}{b}-\\frac{c}{d}->\\frac{ad-bc}{bd}',
  '-\\frac{a}{b}-\\frac{c}{d}->\\frac{-ad-bc}{bd}',
  '\\frac{a}{b}+\\frac{c}{b}->\\frac{a+c}{b}',
  '\\frac{a}{b}-\\frac{c}{b}->\\frac{a-c}{b}',
  '\\frac{a}{b}+c->\\frac{a+bc}{b}',
  '-\\frac{a}{b}+c->\\frac{-a+bc}{b}',

  //INFINITY
  //Base of Infinity
  {match:'\\infty^a',replace:'\\infty',condition:'a>0'},
  {match:'\\infty^a',replace:'0',condition:'a<0'},
  {match:'(-\\infty)^a',replace:'0',condition:'a<0'},
  '\\infty^0->NaN',
  // {match:'(-\infty)^n',replace:'\infty',condition:'a is a even integer'},
  // {match:'(-\infty)^{n/m}',replace:'\infty',condition:'n is an even integer and m is an odd integer'},
  // {match:'(-\infty)^n',replace:'-\infty',condition:'a is an odd integer'},
  // {match:'(-\infty)^{n/m}',replace:'\infty',condition:'n is an odd integer and m is an odd integer'},

  //Division Involving Infinity
  '\\frac{\\infty}{\\infty}->NaN',
  '\\frac{-\\infty}{\\infty}->NaN', //might be duplicate
  '\\frac{\\infty}{-\\infty}->NaN', //might be duplicate
  '\\frac{-\\infty}{-\\infty}->NaN', //might be duplicate

  //Multiplication Involving Infinity
  {match:'\\infty\\cdot a',replace:'\\infty',condition:'a>0'},
  {match:'\\infty\\cdot a',replace:'=\\infty',condition:'a<0'},
  {match:'\\infty\\cdot a',replace:'NaN',condition:'a==0'},

  //Division Involving Infinity
  {match:'\\frac{\\infty}{a}',replace:'\\infty',condition:'a>0'},
  {match:'\\frac{\\infty}{a}',replace:'-\\infty',condition:'a<0'},
  {match:'\\frac{-\\infty}{a}',replace:'-\\infty',condition:'a>0'},
  {match:'\\frac{-\\infty}{a}',replace:'\\infty',condition:'a<0'},

  //Power of Infinity
  {match:'a^\\infty',replace:'\\infty',condition:'a>1'},
  {match:'a^\\infty',replace:'0',condition:'0<a<1'},
  {match:'a^{-\\infty}',replace:'0',condition:'a>1'},
  {match:'a^{-\\infty}',replace:'\\infty',condition:'0<a<1'},
  '1^\\infty->NaN',
  '\\exp(\\infty)->\\infty',
  '\\exp(-\\infty)->0',

  //Log of Infinity
  '\\log(\\infty)->\\infty',
  '\\ln(\\infty)->\\infty',

  //Trig Functions at Infinity
  '\\sin(\\infty)->NaN',
  '\\cos(\\infty)->NaN',
  '\\tan(\\infty)->NaN',
  '\\cot(\\infty)->NaN',
  '\\sec(\\infty)->NaN',
  '\\csc(\\infty)->NaN',
  '\\sin(-\\infty)->NaN',
  '\\cos(-\\infty)->NaN',
  '\\tan(-\\infty)->NaN',
  '\\cot(-\\infty)->NaN',
  '\\sec(-\\infty)->NaN',
  '\\csc(-\\infty)->NaN',

  //Inverse Trig Functions at Infinity
  '\\arcsin(\\infty)->NaN',
  '\\arccos(\\infty)->NaN',
  '\\arcsin(-\\infty)->NaN',
  '\\arccos(-\\infty)->NaN',
  '\\arctan(\\infty)->\\frac{\\pi}{2}',
  '\\arctan(-\\infty)->-\\frac{\\pi}{2}',
  '\\arccot(\\infty)->0',
  '\\arccot(-\\infty)->\\pi',
  '\\arcsec(\\infty)->\\frac{\\pi}{2}',
  '\\arcsec(-\\infty)->\\frac{\\pi}{2}',
  '\\arccsc(\\infty)->0',
  '\\arccsc(-\\infty)->0',

  //Hyperbolic Trig Functions At Infinity
  '\\sinh(\\infty)->\\infty',
  '\\sinh(-\\infty)->-\\infty',
  '\\cosh(\\infty)->\\infty',
  '\\cosh(-\\infty)->\\infty',
  '\\tanh(\\infty)->1',
  '\\tanh(-\\infty)->-1',
  '\\coth(\\infty)->1',
  '\\coth(-\\infty)->-1',
  '\\sech(\\infty)->0',
  '\\sech(-\\infty)->0',
  '\\csch(\\infty)->0',
  '\\csch(-\\infty)->0',

  //Inverse Hyeperbolic Trig Functions At Infinity
  '\\arcsinh(\\infty)->\\infty',
  '\\arcsinh(-\\infty)->-\\infty',
  '\\arccosh(\\infty)->\\infty',
  '\\arccosh(-\\infty)->NaN',
  '\\arctanh(\\infty)->NaN',
  '\\arctanh(-\\infty)->NaN',
  '\\arccoth(\\infty)->NaN',
  '\\arccoth(-\\infty)->NaN',
  '\\arcsech(\\infty)->NaN',
  '\\arcsech(-\\infty)->NaN',
  '\\arccsch(\\infty)->0',
  '\\arccsch(-\\infty)->0',

  //LOGS OF BASE NOT E

  //Undefined
  {match:'\\log_c(a)',replace:'NaN',condition:'c==1'},
  {match:'\\log_c(a)',replace:'NaN',condition:'c<=0'},
  '\\log_c(0)->NaN',

  //Simple
  '\\log_c(c)->1',
  '\\log_c(c^a)->a',

  //Base of C
  'c^{\\log_c(a)}->a',
  'c^{b\\log_c(a)}->a^b',
  'c^{\\log_c(a)+b}->a\\cdot c^b',
  'c^{\\log_c(a)-b}->\\frac{a}{c^b}',
  'c^{d\\log_c(a)+b}->a^d\\cdot c^b',
  'c^{\\log_c(a)-b}->\\frac{a^d}{c^b}',
  'c^{-\\log_c(a)-b}->\\frac{1}{a^dc^b}',
  'c^{-\\log_c(a)+b}->\\frac{b^c}{a^d}',

  //Log Properties
  '\\log_c(ab)->\\log_c(a)+\\log_c(b)',
  '\\log_c(\\frac{a}{b})->\\log_c(a)-\\log_c(b)',
  '\\log_c(\\frac{1}{b})=-\\log_c(b)',
  '\\log_c(c^ab)->a+\\log_c(b)',
  '\\log_c(\\frac{c^a}{b})->a-\\log_c(b)',
  '\\log_c(\\frac{b}{c^a})->\\log_c(b)-a',
  '\\log_c(b^a)->a\\log_c(b)',

  //Change of Base
  '\\log_c(b)\\ln(c)->\\ln(b)',
  '\\frac{\\log_c(b)}{\\log_d(b)}->\\frac{\\ln(d)}{\\ln(c)}',
  '\\log_{1/c}(b)->-\\log_c(b)',


  //At Infinity
  {match:'\\log_c(\\infty)',replace:'\\infty',condition:'c>1'},
  {match:'\\log_c(\\infty)',replace:'-\\infty',condition:'0<c<1'},

  // Trigonometric
  '\\sin(-x) -> -\\sin(x)',
  '\\cos(-x) -> \\cos(x)',
  '\\tan(-x) -> -\\tan(x)',
  '\\cot(-x) -> -\\cot(x)',
  '\\sec(-x) -> \\sec(x)',
  '\\csc(-x) -> -\\csc(x)',
  '\\sin(\\pi - x) -> \\sin(x)',
  '\\cos(\\pi - x) -> -\\cos(x)',
  '\\tan(\\pi - x) -> -\\tan(x)',
  '\\cot(\\pi - x) -> -\\cot(x)',
  '\\sec(\\pi - x) -> -\\sec(x)',
  '\\csc(\\pi - x) -> \\csc(x)',
  '\\sin(\\pi + x) -> -\\sin(x)',
  '\\cos(\\pi + x) -> -\\cos(x)',
  '\\tan(\\pi + x) -> \\tan(x)',
  '\\cot(\\pi + x) -> -\\cot(x)',
  '\\sec(\\pi + x) -> -\\sec(x)',
  '\\csc(\\pi + x) -> \\csc(x)',

  '\\sin(\\frac{\\pi}{2} - x) -> \\cos(x)',
  '\\cos(\\frac{\\pi}{2} - x) -> \\sin(x)',
  '\\tan(\\frac{\\pi}{2} - x) -> \\cot(x)',
  '\\cot(\\frac{\\pi}{2} - x) -> \\tan(x)',
  '\\sec(\\frac{\\pi}{2} - x) -> \\csc(x)',
  '\\csc(\\frac{\\pi}{2} - x) -> \\sec(x)',
  '\\sin(x) * \\cos(x) -> \\frac{1}{2} \\sin(2x)',
  '\\sin(x) * \\sin(y) -> \\frac{1}{2} (\\cos(x-y) - \\cos(x+y))',
  '\\cos(x) * \\cos(y) -> \\frac{1}{2} (\\cos(x-y) + \\cos(x+y))',
  '\\tan(x) * \\cot(x) -> 1',
  // '\\sin(x)^2 + \\cos(x)^2 -> 1',
  '\\sin(x)^2 -> \\frac{1 - \\cos(2x)}{2}',
  '\\cos(x)^2 -> \\frac{1 + \\cos(2x)}{2}',
];
//  [
//   // `Subtract`
//   ['$\\_ - \\_$', 0],
//   [['Subtract', '\\_x', 0], 'x'],
//   [['Subtract', 0, '\\_x'], '$-x$'],

//   // `Add`
//   [['Add', '_x', ['Negate', '_x']], 0],

//   // `Multiply`
//   ['$\\_ \\times \\_ $', '$\\_^2$'],

//   // `Divide`
//   [['Divide', '_x', 1], { sym: '_x' }],
//   [['Divide', '_x', '_x'], 1, { condition: (sub) => sub.x.isNotZero ?? false }],
//   [
//     ['Divide', '_x', 0],
//     { num: '+Infinity' },
//     { condition: (sub) => sub.x.isPositive ?? false },
//   ],
//   [
//     ['Divide', '_x', 0],
//     { num: '-Infinity' },
//     { condition: (sub) => sub.x.isNegative ?? false },
//   ],
//   [['Divide', 0, 0], NaN],

//   // `Power`
//   [['Power', '_x', 'Half'], '$\\sqrt{x}$'],
//   [
//     ['Power', '_x', 2],
//     ['Square', '_x'],
//   ],

//   // Complex
//   [
//     ['Divide', ['Complex', '_re', '_im'], '_x'],
//     ['Add', ['Divide', ['Complex', 0, '_im'], '_x'], ['Divide', '_re', '_x']],
//     {
//       condition: (sub: Substitution): boolean =>
//         (sub.re.isNotZero ?? false) &&
//         (sub.re.isInteger ?? false) &&
//         (sub.im.isInteger ?? false),
//     },
//   ],

//   // `Abs`
//   [
//     ['Abs', '_x'],
//     { sym: '_x' },
//     {
//       condition: (sub: Substitution): boolean => sub.x.isNonNegative ?? false,
//     },
//   ],
//   [
//     ['Abs', '_x'],
//     ['Negate', '_x'],
//     {
//       condition: (sub: Substitution): boolean => sub.x.isNegative ?? false,
//     },
//   ],

//   //
//   // Boolean
//   //
//   [['Not', ['Not', '_x']], '_x'], // @todo Since Not is an involution, should not be needed
//   [['Not', 'True'], 'False'],
//   [['Not', 'False'], 'True'],
//   [['Not', 'OptArg'], 'OptArg'],

//   [['And'], 'True'],
//   [['And', '__x'], '__x'],
//   [['And', '__x', 'True'], '_x'],
//   [['And', '__', 'False'], 'False'],
//   [['And', '__', 'OptArg'], 'OptArg'],
//   [['And', '__x', ['Not', '__x']], 'False'],
//   [['And', ['Not', '__x'], '__x'], 'False'],

//   [['Or'], 'False'],
//   [['Or', '__x'], '__x'],
//   [['Or', '__', 'True'], 'True'],
//   [['Or', '__x', 'False'], '__x'],
//   [
//     ['Or', '__x', 'OptArg'],
//     ['Or', '__x'],
//   ],

//   [
//     ['NotEqual', '__x'],
//     ['Not', ['Equal', '__x']],
//   ],
//   [
//     ['NotElement', '__x'],
//     ['Not', ['Element', '__x']],
//   ],
//   [
//     ['NotLess', '__x'],
//     ['Not', ['Less', '__x']],
//   ],
//   [
//     ['NotLessNotEqual', '__x'],
//     ['Not', ['LessEqual', '__x']],
//   ],
//   [
//     ['NotTildeFullEqual', '__x'],
//     ['Not', ['TildeFullEqual', '__x']],
//   ],
//   [
//     ['NotApprox', '__x'],
//     ['Not', ['Approx', '__x']],
//   ],
//   [
//     ['NotApproxEqual', '__x'],
//     ['Not', ['ApproxEqual', '__x']],
//   ],
//   [
//     ['NotGreater', '__x'],
//     ['Not', ['Greater', '__x']],
//   ],
//   [
//     ['NotApproxNotEqual', '__x'],
//     ['Not', ['GreaterEqual', '__x']],
//   ],
//   [
//     ['NotPrecedes', '__x'],
//     ['Not', ['Precedes', '__x']],
//   ],
//   [
//     ['NotSucceeds', '__x'],
//     ['Not', ['Succeeds', '__x']],
//   ],
//   [
//     ['NotSubset', '__x'],
//     ['Not', ['Subset', '__x']],
//   ],
//   [
//     ['NotSuperset', '__x'],
//     ['Not', ['Superset', '__x']],
//   ],
//   [
//     ['NotSubsetNotEqual', '__x'],
//     ['Not', ['SubsetEqual', '__x']],
//   ],
//   [
//     ['NotSupersetEqual', '__x'],
//     ['Not', ['SupersetEqual', '__x']],
//   ],

//   // DeMorgan's Laws
//   [
//     ['Not', ['And', ['Not', '_a'], ['Not', '_b']]],
//     ['Or', '_a', '_b'],
//   ],
//   [
//     ['And', ['Not', '_a'], ['Not', '_b']],
//     ['Not', ['Or', '_a', '_b']],
//   ],
//   [
//     ['Not', ['Or', ['Not', '_a'], ['Not', '_b']]],
//     ['And', '_a', '_b'],
//   ],
//   [
//     ['Or', ['Not', '_a'], ['Not', '_b']],
//     ['Not', ['And', '_a', '_b']],
//   ],

//   // Implies

//   [['Implies', 'True', 'False'], 'False'],
//   [['Implies', '_', 'OptArg'], 'True'],
//   [['Implies', '_', 'True'], 'True'],
//   [['Implies', 'False', '_'], 'True'],
//   [
//     ['Or', ['Not', '_p'], '_q'],
//     ['Implies', '_p', '_q'],
//   ], // p => q := (not p) or q
//   // if           Q=F & P= T      F
//   // otherwise                    T

//   //  Equivalent

//   [
//     ['Or', ['And', '_p', '_q'], ['And', ['Not', '_p'], ['Not', '_q']]],
//     ['Equivalent', '_p', '_q'],
//   ], // p <=> q := (p and q) or (not p and not q), aka `iff`
//   //   if (q = p), T. Otherwise, F
//   [['Equivalent', 'True', 'True'], 'True'],
//   [['Equivalent', 'False', 'False'], 'True'],
//   [['Equivalent', 'OptArg', 'OptArg'], 'True'],
//   [['Equivalent', 'True', 'False'], 'False'],
//   [['Equivalent', 'False', 'True'], 'False'],
//   [['Equivalent', 'True', 'OptArg'], 'False'],
//   [['Equivalent', 'False', 'OptArg'], 'False'],
//   [['Equivalent', 'OptArg', 'True'], 'False'],
//   [['Equivalent', 'OptArg', 'False'], 'False'],
// ];

// export function internalSimplify(
//   ce: ComputeEngine,
//   expr: BoxedExpression | null,
//   simplifications?: Simplification[]
// ): BoxedExpression | null {
//   if (expr === null) return null;

//   //
//   // 1/ Apply simplification rules
//   //
//   simplifications = simplifications ?? ['simplify-all'];
//   if (simplifications.length === 1 && simplifications[0] === 'simplify-all') {
//     simplifications = [
//       'simplify-arithmetic',
//       // 'simplify-logarithmic',
//       // 'simplify-trigonometric',
//     ];
//   }
//   for (const simplification of simplifications) {
//     expr = ce.replace(
//       expr,
//       ce.cache<RuleSet>(
//         simplification,
//         (): RuleSet => compileRules(ce, SIMPLIFY_RULES[simplification])
//       )
//     );
//   }

//   //
//   // 2/ Numeric simplifications
//   //
//   // expr = simplifyNumber(ce, expr!) ?? expr;

//   //
//   // 3/ Simplify boolean expressions, using assumptions.
//   //
//   //
//   expr = simplifyBoolean(expr);

//   if (isAtomic(expr!)) return expr;

//   //
//   // 4/ Simplify Dictionary
//   //
//   // if (getDictionary(expr!) !== null) {
//   //   return applyRecursively(
//   //     expr!,
//   //     (x) => internalSimplify(ce, x, simplifications) ?? x
//   //   );
//   // }

//   //
//   // 5/ It's a function (not a dictionary and not atomic)
//   //

//   const head = internalSimplify(
//     ce,
//     getFunctionHead(expr) ?? 'Missing',
//     simplifications
//   );
//   if (typeof head === 'string') {
//     const def = ce.getFunctionDefinition(head);
//     if (def) {
//       // Simplify the arguments, except those affected by `hold`
//       const args: BoxedExpression[] = [];
//       const tail = getTail(expr);
//       for (let i = 0; i < tail.length; i++) {
//         const name = getFunctionName(tail[i]);
//         if (name === 'Evaluate') {
//           args.push(internalSimplify(ce, tail[i], simplifications) ?? tail[i]);
//         } else if (name === 'Hold') {
//           args.push(getArg(tail[i], 1) ?? 'Missing');
//         } else if (
//           (i === 0 && def.hold === 'first') ||
//           (i > 0 && def.hold === 'rest') ||
//           def.hold === 'all'
//         ) {
//           args.push(tail[i]);
//         } else {
//           args.push(internalSimplify(ce, tail[i], simplifications) ?? tail[i]);
//         }
//       }
//       const result =
//         typeof def.simplify === 'function'
//           ? def.simplify(ce, ...args) ?? expr
//           : [head, ...args];
//       return ce.cost(result) <= ce.cost(expr) ? result : expr;
//     }
//   }
//   if (head !== null) {
//     // If we can't identify the function, we don't know how to process
//     // the arguments (they may be Hold...), so don't attempt to process them.
//     return [head, ...getTail(expr)];
//   }
//   return expr;
// }
