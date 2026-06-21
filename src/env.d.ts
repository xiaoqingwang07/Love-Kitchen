/** Webpack defineConstants 注入，见 config/index.js */
declare const TARO_APP_LLM_PROXY_URL: string
/** catalog 云端根目录（含 meta.json / index.json / chunks/）；为空时回退 legacy 200 道 */
declare const TARO_APP_CATALOG_BASE_URL: string
/** 临期提醒：微信订阅消息模板 id；为空则功能不可用 */
declare const TARO_APP_EXPIRY_TMPL_ID: string
/** 临期提醒：服务端登记接口 URL；为空则只授权不登记 */
declare const TARO_APP_REMINDER_API_URL: string
