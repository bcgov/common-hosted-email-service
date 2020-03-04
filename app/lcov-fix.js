const fs = require('fs');

const file = './coverage/lcov.info';

fs.readFile(file, 'utf8', function (err,data) {
  if (err) {
    return console.error(err);
  }
  const result = data.replace(/src/g, `${process.cwd()}/src`);

  fs.writeFile(file, result, 'utf8', function (err) {
    if (err) return console.error(err);
  });
});
