
const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,18}$/

export async function validate(password: string, confirmPassword: string) {
    const errors: { password?: string } = {}

    if (!password) {
        errors.password = "Mot de passe requis"
    } else if (password !== confirmPassword) {
        errors.password = "La confirmation ne correspond pas au mot de passe"
    } else if (!PASSWORD_REGEX.test(password)) {
        errors.password = "Mot de passe de 8 à 18 caractères avec au minimum une majuscule, une minuscule, un chiffre et un caractère special (#?!@$%^&*-)"
    }

    return Object.keys(errors).length ? errors : null
}