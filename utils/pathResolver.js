const fs = require('fs-extra');
const path = require('path');

exports.resolvePath = (inputPath) => {
    return path.resolve(process.cwd(), inputPath);
};


exports.getTemplatePath = (defaultPath) => {
    const cwdTemplatePath = path.join(process.cwd(), '.stylescribe', 'templates', defaultPath);
    if (fs.existsSync(cwdTemplatePath)) {
        return cwdTemplatePath;
    }
    return path.join(__dirname, '..', 'templates', defaultPath);
};