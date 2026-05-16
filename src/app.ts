import { createElement, PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { StoreContext, rootStore } from './store/context'
import { ErrorBoundary } from './components/ErrorBoundary'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
    useLaunch(() => {
        console.log('App launched.')
    })

    return createElement(
        ErrorBoundary,
        {},
        createElement(StoreContext.Provider, { value: rootStore }, children)
    )
}

export default App
