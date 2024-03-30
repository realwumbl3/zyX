const path = require('path');

module.exports = {
    entry: './zyX.js',
    output: {
        libraryTarget: 'module',
        path: path.resolve(__dirname, 'dist'),
        filename: 'zyXbundle.js'
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