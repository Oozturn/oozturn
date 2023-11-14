import { debounce } from "lodash"
import { useEffect, useMemo, useState } from "react"
import { client } from "../../lib/gql/client"
import { isClientError } from "../../lib/gql/error/error"
import useSWR from "swr"


interface SyncedInputProps<T> {
  type: "input" | "textarea"
  label?: String
  placeholder?: string
  query: string
  valueSelector: (s: T) => string
  mutationQuery: string
  mutationVariableName: string
  baseMutationVariable?: any
  controlClasses?: string
}

export function SyncedInput<T extends unknown>({ type, placeholder, query, valueSelector, mutationQuery, mutationVariableName, baseMutationVariable, controlClasses }: SyncedInputProps<T>) {
  const { data, error, isLoading, mutate } = useSWR<T>(query)
  const [value, setValue] = useState<string>("")

  const triggerUpdate = useMemo(() => debounce(
    async (value: string) => {
      let params = { ...baseMutationVariable, ...{ [mutationVariableName]: value || "" } }
      await client.request(mutationQuery, params)
      await mutate()
    }, 1000), [baseMutationVariable, mutationVariableName, mutationQuery, mutate]);

  const handleOnInput = useMemo(() => async (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
    setValue(e.target.value)
    await triggerUpdate(e.target.value)
  }, [triggerUpdate]);


  useEffect(() => {
    return () => {
      triggerUpdate.cancel();
    }
  }, [triggerUpdate])

  useEffect(() => {
    if (data) {
      let value = valueSelector(data)
      setValue(value)
    }
  }, [data, valueSelector])

  return (
    <>
      {type == "input" &&
        <p className={`control ${controlClasses} ${isLoading ? 'is-loading' : ''}`}>
          <input id="field" className="input" type="text" placeholder={placeholder} value={value} onInput={handleOnInput} />
        </p>
      }
      {type == "textarea" &&
        <p className={`control ${controlClasses} ${isLoading ? 'is-loading' : ''}`}>
          <textarea id="field" className="textarea" placeholder={placeholder} value={value} onInput={handleOnInput} />
        </p>
      }
    </>
  )
}