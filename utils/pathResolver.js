const path = require('path');

exports.resolvePath = (inputPath) => {
    return path.resolve(process.cwd(), inputPath);
};
