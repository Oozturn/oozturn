export function clickorkey(callback: () => void, key?: string) {
    const keys = key ? [key] : ["Space", " "]
    return {
        onClick: () => callback(),
        role: "button",
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => { keys.includes(event.key) && callback() }
    }
}