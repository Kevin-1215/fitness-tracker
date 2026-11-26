import { useCallback, useEffect, useState } from "react";

export class ApiError extends Error { constructor(public status:number,message:string) { super(message); } }
const apiOrigin=import.meta.env.VITE_API_ORIGIN?.replace(/\/$/,"")??"";
export async function api<T>(path:string, options:{method?:string;body?:unknown;signal?:AbortSignal} = {}):Promise<T> {
  const response = await fetch(apiOrigin+path, { method:options.method ?? "GET", signal:options.signal, credentials:"include", cache:"no-store",
    headers:options.body === undefined ? undefined : {"Content-Type":"application/json"}, body:options.body === undefined ? undefined : JSON.stringify(options.body) });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/api/auth/")) window.dispatchEvent(new Event("fitness:unauthorized"));
    throw new ApiError(response.status,data?.error ?? "連線暫時失敗，請稍後再試。");
  }
  return data as T;
}
export function useApi<T>(url:string) {
  const [version,setVersion] = useState(0), [state,setState] = useState<{data:T|null;loading:boolean;error:string|null}>({data:null,loading:true,error:null});
  const refresh = useCallback(() => setVersion((last) => last+1),[]);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setState({data:null,loading:true,error:null});
    api<T>(url,{signal:controller.signal}).then((data) => { if (active) setState({data,loading:false,error:null}); })
      .catch((error) => { if (active && !controller.signal.aborted) setState({data:null,loading:false,error:error instanceof Error ? error.message : "載入失敗。"}); });
    return () => { active=false;controller.abort(); };
  },[url,version]);
  return {...state,refresh};
}
