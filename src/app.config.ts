export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/pick/index',
    'pages/pantry/index',
    'pages/profile/index',
    'pages/result/index',
    'pages/detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FAF9F7',
    navigationBarTitleText: '爱心厨房',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: 'rgba(18,17,15,0.35)',
    selectedColor: '#A67B5B',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/pick/index',
        text: '选菜'
      },
      {
        pagePath: 'pages/pantry/index',
        text: '冰箱'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
