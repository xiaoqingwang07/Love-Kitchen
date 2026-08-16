const path = require('path');
const fs = require('fs');

function loadDotEnvLocal() {
    const p = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(p)) return {};
    const out = {};
    fs.readFileSync(p, 'utf8').split('\n').forEach((line) => {
        const t = line.trim();
        if (!t || t.startsWith('#')) return;
        const i = t.indexOf('=');
        if (i <= 0) return;
        const k = t.slice(0, i).trim();
        let v = t.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
            v = v.slice(1, -1);
        out[k] = v;
    });
    return out;
}

const _dotLocal = loadDotEnvLocal();
const _llmProxyUrl =
    process.env.TARO_APP_LLM_PROXY_URL || _dotLocal.TARO_APP_LLM_PROXY_URL || '';
const _catalogBaseUrl =
    process.env.TARO_APP_CATALOG_BASE_URL || _dotLocal.TARO_APP_CATALOG_BASE_URL || '';
const _expiryTmplId =
    process.env.TARO_APP_EXPIRY_TMPL_ID || _dotLocal.TARO_APP_EXPIRY_TMPL_ID || '';
const _reminderApiUrl =
    process.env.TARO_APP_REMINDER_API_URL || _dotLocal.TARO_APP_REMINDER_API_URL || '';
const _householdApiUrl =
    process.env.TARO_APP_HOUSEHOLD_API_URL || _dotLocal.TARO_APP_HOUSEHOLD_API_URL || '';
const _enableWechatSi =
    process.env.TARO_APP_ENABLE_WECHAT_SI === 'true' ||
    _dotLocal.TARO_APP_ENABLE_WECHAT_SI === 'true';

const config = {
    projectName: 'love-kitchen',
    date: '2026-01-15',
    designWidth: 750,
    deviceRatio: {
        640: 2.34 / 2,
        750: 1,
        828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-platform-weapp'],
    defineConstants: {
        TARO_APP_LLM_PROXY_URL: JSON.stringify(_llmProxyUrl),
        TARO_APP_CATALOG_BASE_URL: JSON.stringify(_catalogBaseUrl),
        TARO_APP_EXPIRY_TMPL_ID: JSON.stringify(_expiryTmplId),
        TARO_APP_REMINDER_API_URL: JSON.stringify(_reminderApiUrl),
        TARO_APP_HOUSEHOLD_API_URL: JSON.stringify(_householdApiUrl),
        TARO_APP_ENABLE_WECHAT_SI: JSON.stringify(_enableWechatSi ? 'true' : ''),
    },
    copy: {
        patterns: [
        ],
        options: {
        }
    },
    framework: 'react',
    compiler: 'webpack5',
    cache: {
        enable: false // Webpack5 cache
    },
    // 默认不编译 node_modules。zod/mobx 的 ESM 含 ?. ( 微信上传压缩会报 Unexpected token: punc (
    compile: {
        include: [
            (modulePath) => /node_modules[\\/](zod|mobx|use-sync-external-store)[\\/]/.test(modulePath)
        ]
    },
    mini: {
        compile: {
            include: [
                (modulePath) => /node_modules[\\/](zod|mobx|use-sync-external-store)[\\/]/.test(modulePath)
            ]
        },
        webpackChain(chain) {
            // Taro 默认 exclude 掉整个 node_modules；必须放行 zod，否则 ?. ( 会原样打进 vendors.js
            chain.module
                .rule('script')
                .exclude
                .clear()
                .add((filename) => {
                    if (/css-loader/.test(filename)) return true
                    if (/node_modules[\\/](zod|mobx|use-sync-external-store)[\\/]/.test(filename)) return false
                    return /node_modules/.test(filename) && !/taro/.test(filename)
                })
        },
        optimizeMainPackage: {
            enable: true,
        },
        postcss: {
            pxtransform: {
                enable: true,
                config: {

                }
            },
            url: {
                enable: true,
                config: {
                    limit: 1024 // 设定转换尺寸上限
                }
            },
            cssModules: {
                enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
                config: {
                    namingPattern: 'module', // 转换模式，取值为 global/module
                    generateScopedName: '[name]__[local]___[hash:base64:5]'
                }
            }
        }
    },
    h5: {
        /** 与 weapp 的 dist/ 分离，避免 build:h5 覆盖小程序产物 */
        outputRoot: 'dist-h5',
        publicPath: '/',
        staticDirectory: 'static',
        devServer: {
            client: {
                overlay: false
            }
        },
        // Taro 会先 merge 用户 devServer 再 merge chain，chain 里默认 overlay:true 会盖住上面；在 chain 末尾再关一次
        webpackChain(chain) {
            chain.devServer.merge({
                client: {
                    overlay: false
                }
            })
        },
        postcss: {
            autoprefixer: {
                enable: true,
                config: {
                }
            },
            cssModules: {
                enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
                config: {
                    namingPattern: 'module', // 转换模式，取值为 global/module
                    generateScopedName: '[name]__[local]___[hash:base64:5]'
                }
            }
        }
    }
}

module.exports = function (merge) {
    if (process.env.NODE_ENV === 'development') {
        return merge({}, config, require('./dev'))
    }
    return merge({}, config, require('./prod'))
}
