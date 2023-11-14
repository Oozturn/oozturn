import { toast } from 'react-toastify'
import { isClientError } from '../gql/error/error';

export function dealWithError(error: any) {
    console.error(error)
    if (isClientError(error)) {
        const operation = error.response.errors?.at(0)?.path?.join('.')
        const message = error.response.errors?.at(0)?.message || ""
        notifyError(message ? `${message}` : `Erreur GraphQL à l'appel de '${operation}'`)
    } else if(typeof error === "string") {
        notifyError(`Erreur : ${error}`)
    } else {
        notifyError('Erreur')
    }
}

function notifyError(message: string) {

    toast.error(message, {
        toastId: message,
        autoClose: 5000,
        progressStyle:{background: "transparent"},
        closeButton: false
    });
}