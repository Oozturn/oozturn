export interface Mode {
    name: string
    primary: string
    secondary: string
    text: string
    genericGame: string
}

export const modesList : Mode[] = [
    { name: "Dark", primary: "#333539", secondary: "#4B4C50", text: "#FFFFFF", genericGame: 'url(/../genericGameDark.jpg)'},
    { name: "Light", primary: "#E5E5E5", secondary: "#F9F9F9", text: "#3A3A3A", genericGame: 'url(/../genericGameLight.jpg)'},
]

export interface Accent {
    name: string
    primary: string
    secondary: string
}

export const accentsList : Accent[] = [
    { name: "Switch", primary: "#FF6666", secondary: "#7171FF"},
    { name: "Neon", primary: "#FF66C1", secondary: "#47DFB7"},
    { name: "Pumpkin", primary: "#FF8366", secondary: "#A72BFF"},
    { name: "Tropik", primary: "#8ADA8A", secondary: "#FF8736"},
    { name: "Alien", primary: "#B3CA6A", secondary: "#AD6EFF"},
]