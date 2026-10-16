import { defineConfig } from '@tarojs/cli'

export default defineConfig<'webpack5'>(async (merge) => {
  const base = {
    projectName: '名邦汽车',
    date: '2026-10-16',
    designWidth: 390,
    deviceRatio: { 320: 1.21875, 375: 1.04, 390: 1, 430: 0.90698 },
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5',
    plugins: ['@tarojs/plugin-framework-react', '@tarojs/plugin-platform-weapp', '@tarojs/plugin-platform-h5'],
    mini: { postcss: { pxtransform: { enable: true, config: {} } } },
    h5: { publicPath: '/', staticDirectory: 'static', esnextModules: ['@tarojs/components'], postcss: { pxtransform: { enable: false } } },
  }
  return merge({}, base)
})
