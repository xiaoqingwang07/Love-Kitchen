module.exports = {
    content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
    theme: {
        extend: {},
    },
    plugins: [],
    corePlugins: {
        preflight: false, // Taro usually handles reset or doesn't need standard web preflight which might conflict
    }
}
