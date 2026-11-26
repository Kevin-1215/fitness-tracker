'use client';
import {useState} from 'react';
import {ExternalLink,Play,Repeat2} from 'lucide-react';
import type {ExerciseSource} from '../lib/exerciseSources';

export function videoWatchUrl(source:ExerciseSource):string {
 const video=source.video;
 return video.provider==='youtube'?`https://www.youtube.com/watch?v=${video.id}`:video.provider==='vimeo'?source.url:video.url;
}
export default function ExerciseVideo({source,name}:{source:ExerciseSource;name:string}) {
 const [loaded,setLoaded]=useState(false),[loop,setLoop]=useState(false);
 const video=source.video,watch=videoWatchUrl(source);
 // M&S Vimeo players restrict embedding to the publisher's domain. Open the
 // original exercise page instead of displaying a player that rejects our site.
 const embed=video.provider==='youtube'?`https://www.youtube-nocookie.com/embed/${video.id}?playsinline=1&rel=0${loop?`&loop=1&playlist=${video.id}`:''}`:null;
 return <section className="exercise-video" aria-label="實人示範影片">
  <header><div><span className="eyebrow">WATCH THE MOVEMENT</span><h3>先看一次，再開始練習</h3></div><span className="pill">{source.publisher}</span></header>
  <div className="exercise-video__frame">{loaded&&embed?<iframe key={embed} title={`${name}｜${source.publisher} 示範`} src={embed} allow="fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<div className="exercise-video__poster"><Play size={35}/><strong>{name.split(' (')[0]}</strong><p>{source.title}</p>{embed?<button type="button" className="primary-button" onClick={()=>setLoaded(true)}><Play size={17}/>載入實人示範</button>:<a className="primary-button" href={watch} target="_blank" rel="noreferrer">前往原作者示範 <ExternalLink size={16}/></a>}<small>{embed?'點擊後載入外部播放器；可在影片內暫停、調速或全螢幕。':video.provider==='vimeo'?'作者限制影片僅在原網站播放，點擊後會開啟該動作的教學與影片。':'影片在原作者網站播放。'}</small></div>}</div>
  <div className="exercise-video__links">{embed&&<button type="button" className="text-button" aria-pressed={loop} onClick={()=>setLoop(value=>!value)}><Repeat2 size={16}/>{loop?'循環播放已開啟':'循環播放'}</button>}<a href={watch} target="_blank" rel="noreferrer">{video.provider==='youtube'?'在 YouTube 觀看':'在原作者網站觀看'} <ExternalLink size={14}/></a></div>
  {source.variantNote&&<p className="exercise-video__variant"><strong>版本差異</strong>{source.variantNote}</p>}
  <p className="exercise-video__source"><a href={source.url} target="_blank" rel="noreferrer">教學來源：{source.publisher} ↗</a> · 連結整理 {source.reviewedAt}<br/>播放器若未提供字幕、無法內嵌或地區受限，請開啟原始影片；下方有中文步驟。</p>
 </section>;
}
