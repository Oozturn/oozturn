import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";


export async function loader({
    params,
}: LoaderFunctionArgs) {
    return { id: params.id };
}

export default function Tournament() {
    const data = useLoaderData<typeof loader>();

    return `Tournament ${data.id}`
}