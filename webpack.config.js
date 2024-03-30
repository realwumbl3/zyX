const path = require('path');

module.exports = {
    entry: './version/1.5/zyX.js',
    output: {
        libraryTarget: 'module',
        path: path.resolve(__dirname, 'version/1.5/dist'),
        filename: 'bundle.js'
    },
    experiments: {
        outputModule: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }]
    },
};