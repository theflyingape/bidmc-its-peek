/**
 *  Authored by Robert Hurst <rhurst@bidmc.harvard.edu>
 */

import path = require('path')
import webpack = require('webpack')

const config: webpack.Configuration = {
    mode: 'production',
    entry: './monitor.js',
    output: {
        path: path.resolve(__dirname, 'assets'),
        filename: 'bundle.js'
    }
}

export default config
