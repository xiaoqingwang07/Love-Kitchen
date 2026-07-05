/** Webpack defineConstants 注入，见 config/index.js */
declare const TARO_APP_LLM_PROXY_URL: string
/** catalog 云端根目录（含 meta.json / index.json / chunks/）；为空时回退 legacy 200 道 */
declare const TARO_APP_CATALOG_BASE_URL: string
/** 临期提醒：微信订阅消息模板 id；为空则功能不可用 */
declare const TARO_APP_EXPIRY_TMPL_ID: string
/** 临期提醒：服务端登记接口 URL；为空则只授权不登记 */
declare const TARO_APP_REMINDER_API_URL: string
/** 家庭厨房同步 API；为空则仅本地家庭模式 */
declare const TARO_APP_HOUSEHOLD_API_URL: string
/** 设为 true 时启用微信同声传译插件（须先在公众平台添加插件授权） */
declare const TARO_APP_ENABLE_WECHAT_SI: string
