const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');

module.exports = merge(common, {
    mode: 'production',
    output: {
        publicPath: '/'
    },
    plugins: [
        new Dotenv({
            systemvars: true,        // Usa variables del entorno del sistema (como en Vercel)
            allowEmptyValues: true,  // No falla si una variable está vacía
            path: null               // No busca un .env local (opcional pero explícito)
        })
    ]
});
