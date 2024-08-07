const path = require('path');
const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    entry: './version/1.6/index.js',
    output: {
        libraryTarget: 'module',
        path: path.resolve(__dirname, 'version/1.6/dist'),
        filename: 'zyX-es6.js'
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
            }],
        parser: {
            javascript: {
                importMeta: false, // disable parsing of `importMeta` syntax
            },
        },
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `
_____ZZZZZZZ..Y     Y--X     X / /   /     /  
_________Z.....Y  Y-----X  X/   /  /   /
_______Z........Y--------X/ / /   /
_____Z.........Y-------X  X  \       \      
___ZZZZZZ.....Y------X     X    \      \      \

https://github.com/realwumbl3/zyX/
`
        }),
        new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240, // Only compress files larger than 10kb
            minRatio: 0.8 // Only compress files if compression is at least 80% smaller
        }),
    ]
};

