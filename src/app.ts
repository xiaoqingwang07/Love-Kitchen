import { createElement, PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { StoreContext, rootStore } from './store/context'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initCatalog } from './data/catalogLoader'
import { setNavPayload, setPendingJoinCode } from './utils/navigationPayload'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
    useLaunch((options) => {
        // launched
        void initCatalog()
        const query = options?.query || {}
        const joinCode = query.joinCode
        if (joinCode) {
            setPendingJoinCode(String(joinCode))
        }
        if (query.from === 'meal' && query.source === 'reminder') {
            setNavPayload('mealNavQuery', query)
            const params = Object.entries(query)
                .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
                .join('&')
            setTimeout(() => {
                Taro.navigateTo({ url: `/pages/result/index?${params}` }).catch(() => {})
            }, 0)
        }
    })

    return createElement(
        ErrorBoundary,
        {},
        createElement(StoreContext.Provider, { value: rootStore }, children)
    )
}

export default App
