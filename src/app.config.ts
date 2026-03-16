export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/fridge/index',
    'pages/result/index',
    'pages/detail/index',
    'pages/favorites/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '爱心厨房',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#ea580c',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/fridge/index',
        text: '清冰箱'
      },
      {
        pagePath: 'pages/favorites/index',
        text: '收藏'
      }
    ]
  }
})
