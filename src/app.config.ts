export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/pick/index',
    'pages/pantry/index',
    'pages/profile/index',
    'pages/result/index',
    'pages/detail/index'
  ],
  // 微信同声传译插件默认不声明：未在公众平台授权时会导致模拟器无法启动。
  // 语音 ASR 见 voiceAsr.ts，不可用时自动降级为录音备忘。
  // 上线前在公众平台添加插件后，取消下方注释并 rebuild：
  // plugins: {
  //   WechatSI: { version: '0.3.5', provider: 'wx069ba97219f66d99' },
  // },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FDFCFB',
    navigationBarTitleText: '爱心厨房',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    // 对比度：未选中 2.92:1、选中 3.13:1（原 #C6BFB8/#E89562 仅 1.78/2.30，看不清）
    color: '#9C948B',
    selectedColor: '#D4783F',
    backgroundColor: '#FDFCFB',
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
        // 不叫「选菜」也不叫「今晚」：前者像点单，后者把使用场景限死在晚饭
        text: '搭配',
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
    }
  }
})
