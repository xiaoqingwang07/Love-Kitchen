# 临期提醒流程

## 概览

```
用户开启提醒 → register API 登记 openid + 临期食材
     ↓
Vercel Cron（每日）→ reminder-cron 合并同日临期项
     ↓
微信订阅消息（page 带 expiring 参数）
     ↓
落地 /pages/result/index?from=meal&source=reminder&expiring=…
     ↓
mealPlanBuilder 生成方案 → 烹饪扣减 → 客户端 sync 更新 schedule
```

## 服务端

| 文件 | 职责 |
|------|------|
| `api/reminder-register.js` | 客户端登记 openid、模板 ID、临期 items |
| `api/reminder-cron.js` | 扫描 schedule，合并窗口内临期，推送 1 条/用户/次 |
| `lib/reminder/store.js` | 持久化 schedule（Upstash / KV） |
| `lib/reminder/wx.js` | access_token、subscribeMessage.send |

**推送 page 约定：**

```
pages/result/index?from=meal&source=reminder&expiring={names}&ingredients={names}
```

**模板字段（示例，需与公众平台一致）：**

- `thing1`：临期食材名（最多 3 个合并）
- `date2`：最近到期日
- `thing3`：「点击查看今晚方案」

## 客户端

| 文件 | 职责 |
|------|------|
| `src/utils/subscribeReminder.ts` | 授权、登记、扣减后 sync |
| `src/app.ts` | 冷启动若带 `from=meal&source=reminder` 则跳转结果页 |
| `src/pages/result/index.tsx` | meal 模式展示方案；无方案时给采购/清掉建议 |

## 环境变量

- `CRON_SECRET`：保护 cron 端点
- `WX_APPID` / `WX_SECRET`：发订阅消息
- `TARO_APP_REMINDER_API_URL`：客户端登记地址

## 验收

- [ ] 合并提醒：同日多项只发 1 条
- [ ] 点击落地 meal 页且带 expiring
- [ ] 无可推荐方案时有降级文案
- [ ] 一次性订阅发完消耗 schedule 中已推送项
