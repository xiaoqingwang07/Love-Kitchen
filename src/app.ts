import { createElement, PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { StoreContext, rootStore } from './store/context'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initCatalog } from './data/catalogLoader'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
    useLaunch(() => {
        console.log('App launched.')
        void initCatalog()
    })

    return createElement(
        ErrorBoundary,
        {},
        createElement(StoreContext.Provider, { value: rootStore }, children)
    )
}

export default App
