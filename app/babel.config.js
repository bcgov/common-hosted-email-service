/*
 * Jest can't handle ESM modules, so we need to translate them back to CommonJS using Babel,
 * 
 * If there are future package updates that also switch to ESM (which will break the current setup), 
 *  update jest.transformIgnorePatterns in package.json as necessary so that they also get passed to Babel.
 * 
 * This setup will also break if any dependencies start using ESM features with no CommonJS equivalent.
 *  (e.g. top-level `await`s)
 * 
 * If so, there may be a need to downgrade such dependencies to a version that doesn't use them.
 */
module.exports = {
  plugins: [['babel-plugin-transform-import-meta', { module: 'ES6' }]],
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
};
