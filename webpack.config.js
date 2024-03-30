const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './version/1.5/index.js',
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
        })]
};

