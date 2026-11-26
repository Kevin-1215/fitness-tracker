import {onRequestPost as register} from "../functions/api/auth/register";
import {onRequestPost as login} from "../functions/api/auth/login";
import {onRequestPost as logout} from "../functions/api/auth/logout";
import {onRequestGet as me} from "../functions/api/auth/me";
import * as profile from "../functions/api/profile";
import * as workouts from "../functions/api/workouts";
import * as nutrition from "../functions/api/nutrition";
import {authError,json} from "../lib/auth";
import {allowedOrigin} from "../lib/origins";
import type {AppContext,Env} from "../lib/env";

const routes:Record<string,Record<string,(context:AppContext)=>Promise<Response>>>={
  "/api/auth/register":{POST:register},"/api/auth/login":{POST:login},"/api/auth/logout":{POST:logout},"/api/auth/me":{GET:me},
  "/api/profile":{GET:profile.onRequestGet,POST:profile.onRequestPost},
  "/api/workouts":{GET:workouts.onRequestGet,POST:workouts.onRequestPost,DELETE:workouts.onRequestDelete},
  "/api/nutrition":{GET:nutrition.onRequestGet,POST:nutrition.onRequestPost,DELETE:nutrition.onRequestDelete},
};
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    let response:Response;
    try {
      const origin=request.headers.get("Origin"),trusted=origin!==null&&allowedOrigin(request,env);
      if(origin!==null&&!trusted)return json({error:"不允許此來源。"},403);
      const route=routes[new URL(request.url).pathname];
      if(request.method==="OPTIONS"){
        const requested=request.headers.get("Access-Control-Request-Method")??"";
        const headers=(request.headers.get("Access-Control-Request-Headers")??"").toLowerCase().split(",").map(value=>value.trim()).filter(Boolean);
        response=!trusted?json({error:"需要有效的 Origin。"},403):!route?json({error:"找不到 API。"},404):!route[requested]||headers.some(header=>header!=="content-type")?json({error:"不支援此預檢請求。"},403):new Response(null,{status:204,headers:{"Access-Control-Allow-Methods":Object.keys(route).join(", "),"Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"600","Cache-Control":"private, no-store"}});
      }else if(!route)response=json({error:"找不到 API。"},404);
      else if(!route[request.method]){response=json({error:"不支援此 HTTP 方法。"},405);response.headers.set("Allow",Object.keys(route).join(", "));}
      else response=await route[request.method]({request,env});
      if(trusted){response.headers.set("Access-Control-Allow-Origin",origin!);response.headers.set("Access-Control-Allow-Credentials","true");}
      response.headers.set("Vary","Origin, Cookie");
      return response;
    }catch(error){return authError(error);}
  },
};
