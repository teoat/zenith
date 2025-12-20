const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  // ... existing webpack config ...

  plugins: [
    // ... existing plugins ...

    // Bundle analyzer for production builds
    process.env.ANALYZE === 'true' && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
      reportFilename: 'bundle-report.html'
    }),

    // Performance monitoring
    new webpack.DefinePlugin({
      __PERFORMANCE_MONITORING__: JSON.stringify(process.env.NODE_ENV === 'production'),
    })
  ].filter(Boolean),

  // Performance budgets
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 512000, // 512KB
    maxAssetSize: 256000, // 256KB
  },

  // Code splitting optimization
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        three: {
          test: /[\\/]node_modules[\\/]three[\\/]/,
          name: 'three',
          chunks: 'async',
          priority: 5
        },
        ui: {
          test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          name: 'ui-components',
          chunks: 'all',
          priority: 15
        }
      }
    }
  }
};