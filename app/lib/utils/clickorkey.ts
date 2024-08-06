export function clickorkey(callback: (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => void, key?: string) {
    const keys = key ? [key] : ["Space", " "]
    return {
        onClick: (event: React.MouseEvent<HTMLDivElement>) => callback(event),
        role: "button",
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => { keys.includes(event.key) && callback(event) }
    }
}