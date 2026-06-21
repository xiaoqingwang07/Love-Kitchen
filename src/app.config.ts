export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/pick/index',
    'pages/pantry/index',
    'pages/profile/index',
    'pages/result/index',
    'pages/detail/index'
  ],
  plugins: {
    WechatSI: {
      version: '0.3.5',
      provider: 'wx069ba97219f66d99'
    }
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F6F8F5',
    navigationBarTitleText: '爱心厨房',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: 'rgba(16,19,15,0.35)',
    selectedColor: '#1AA251',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home_active.png'
      },
      {
        pagePath: 'pages/pick/index',
        text: '选菜',
        iconPath: 'assets/tabbar/pick.png',
        selectedIconPath: 'assets/tabbar/pick_active.png'
      },
      {
        pagePath: 'pages/pantry/index',
        text: '冰箱',
        iconPath: 'assets/tabbar/pantry.png',
        selectedIconPath: 'assets/tabbar/pantry_active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile_active.png'
      }
    ]
  },
  requiredPrivateInfos: [
    'getLocation'
  ],
  permission: {
    'scope.userLocation': {
      desc: '用于获取当地天气，推荐时令菜谱'
    },
    'scope.record': {
      desc: '用于语音记录食材，便于快速整理冰箱库存'
    }
  }
})
