const SYMBOLS = "#?!@$%^&*+/()_=.,;:~|-"

const PASSWORD_RULES = [
    {
        regex: new RegExp(`^[A-Za-z0-9${SYMBOLS}]*$`),
        message: "Le mot de passe ne peut contenir que des lettres sans accents, des chiffres et des symboles (pas d'espaces ni d'emojis).",
    },
    { regex: /^.{8,18}$/, message: "Le mot de passe doit contenir entre 8 et 18 caractères." },
    { regex: /[A-Z]/, message: "Le mot de passe doit contenir au moins une majuscule." },
    { regex: /[a-z]/, message: "Le mot de passe doit contenir au moins une minuscule." },
    { regex: /[0-9]/, message: "Le mot de passe doit contenir au moins un chiffre." },
    { regex: new RegExp(`[${SYMBOLS}]`), message: "Le mot de passe doit contenir au moins un symbole." },
]

export function validate(password: string, confirmPassword: string) {
    const errors: { password?: string | undefined } = {}

    if (!password) {
        errors.password = "Mot de passe requis."
    } else if (password !== confirmPassword) {
        errors.password = "La confirmation ne correspond pas au mot de passe."
    } else if (process.env.UNSAFE_DISABLE_STRONG_PASSWORDS !== "true") {
        errors.password = PASSWORD_RULES.find(({ regex }) => !regex.test(password))?.message
    }

    return errors.password ? errors : null
}