const { merge } = require('webpack-merge');
const path = require('path'); // 👈 asegúrate de requerir 'path'
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');

module.exports = merge(common, {
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'), // ✅ define la carpeta de salida
        publicPath: '/'
    },
    plugins: [
        new Dotenv({
            systemvars: true,
            allowEmptyValues: true,
            path: null
        })
    ]
});
