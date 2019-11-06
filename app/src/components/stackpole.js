/** @module stackpole
 *
 *  https://www.whitehousehistory.org/ushers-and-stewards-since-1800
 *  ... As precursors to ushers, stewards were responsible for greeting guests
 *  and those with appointments to see the president, appropriating necessary
 *  items from merchants, and directing routine housekeeping duties ...
 *
 *  ... Mr. Stackpole’s authority was obviously diversified again over the
 *  following years, because it has been noted that the
 *  “first duty of Mrs. Lincoln’s day was a consultation with the steward Stackpole”
 *  regarding the daily activities of the household ...
 *
 *  @exports stackpole - direct routine housekeeping duties (event handling, such as log errors, log stats).
 */

const isFunction = (fn) => {
  return fn && {}.toString.call(fn) === '[object Function]';
};

const isAsyncFunction = (fn) => {
  return fn && {}.toString.call(fn) === '[object AsyncFunction]';
};

class Stackpole {

  /** @method register
   *
   *  register will add a named method to stackpole that other modules can call.
   *  The execute functions will be called when this named method is called.
   *  If a transform function is provided, this will be call before we call the executors.
   *
   *  ex.
   *  const logToFile = (s) => { process.stdout.write(`${s}\n`); };
   *  const numsToSentence = (a, b, c) => { return `Sum of numbers = ${a + b + c}`; };
   *  stackpole.register('foo', logToFile, numsToSentence);
   *
   *  stackpole.foo(4, 5, 6);
   *
   *  @param {string} name - the name of the method added to stackpole.
   *  @param {function|array} executeFns - a function or array of functions to be called when named method is called.
   *  @param {function} transformerFn - a function called before execute functions, transform arguments into data the executors understand
   */
  register(name, executeFns, transformerFn) {
    try {
      Stackpole.prototype[name] = function (...args) {
        let transformedArgs = undefined;
        if (isFunction(transformerFn)) {
          transformedArgs = transformerFn(...args);
        }
        let fns = Array.isArray(executeFns) ? executeFns : [executeFns];

        if (fns.every((h) => { return isFunction(h) || isAsyncFunction(h); })) {
          fns.forEach((fn) => {
            if (transformedArgs) {
              if (!Array.isArray(transformedArgs)) transformedArgs = [transformedArgs];
              try {
                fn(...transformedArgs);
              } catch (err1) {
                process.stderr.write(`stackpole call fn error ${JSON.stringify(err1, null, 2)}\n`);
              }
            } else {
              try {
                fn(...args);
              } catch (err2) {
                process.stderr.write(`stackpole call fn error ${JSON.stringify(err2, null, 2)}\n`);
              }
            }
          });
        }
      };
    } catch (err) {
      process.stderr.write(`stackpole register ${JSON.stringify(err, null, 2)}\n`);
    }

  }
}

const stackpole = new Stackpole();
module.exports = stackpole;
