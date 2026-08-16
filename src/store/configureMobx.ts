import { configure } from 'mobx'

// 必须在 makeAutoObservable 之前执行。微信基础库 Proxy 不完整，
// MobX 6 默认走 Proxy 时 observer 页面会整页空白、只剩 tabBar。
configure({ useProxies: 'never', enforceActions: 'never' })
