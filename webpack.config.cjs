const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const ffmpegBuildType = process.env.FFMPEG_BUILD_TYPE || 'system';

if (!['bundled', 'system'].includes(ffmpegBuildType)) {
    throw new Error(`Unknown FFMPEG_BUILD_TYPE: ${ffmpegBuildType}`);
}

module.exports = {
    target: 'node',
    entry: './src/app.js',
    output: {
        filename: 'bundle.cjs',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2'
    },
    
    // not include dependencies
    externals: [nodeExternals()],

    experiments: {
        // commonjs output
        outputModule: false
    },

    plugins: [
        new webpack.DefinePlugin({
            __FFMPEG_BUILD_TYPE__: JSON.stringify(ffmpegBuildType)
        })
    ],

    module: {
        rules: [
            {
                test: /\.js$/,
                // not include node_modules
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        // preset to conver es modules to commonjs
                        presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
                    }
                }
            }
        ]
    }
};