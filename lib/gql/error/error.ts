import { ClientError } from "graphql-request";


export function isClientError(error: any): error is ClientError {
    return error.response;
}