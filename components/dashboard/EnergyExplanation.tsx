import {Info} from "lucide-react";
import type {ProfileResponse} from "../../lib/fitness";

export default function EnergyExplanation({data}:{data:ProfileResponse|null}){
  const metrics=data?.metrics,profile=data?.profile;
  return <details className="energy-explainer"><summary><Info size={17}/><span>每日目標與飲食熱量，怎麼算？</span></summary>
    <div className="energy-explainer__grid"><article><h3>每日目標：填好身體數據後自動估算</h3>
      <p>BMR＝10 × 體重 kg＋6.25 × 身高 cm－5 × 年齡＋公式係數（男性 +5／女性 −161）。TDEE＝BMR × 活動量係數。</p>
      <p>本應用的每日目標：減脂為 TDEE × 85%，維持為 100%，增肌為 110%。這是成人估算與應用預設，可隨體重與活動量更新。</p>
      {metrics&&profile&&<p className="energy-explainer__example">目前：BMR {metrics.bmr.toLocaleString()} → × {profile.activity_level} 活動係數 → TDEE {metrics.tdee.toLocaleString()} → 每日目標 {metrics.target_calories.toLocaleString()} kcal。</p>}
    </article><article><h3>飲食攝取：依食物與份量加總</h3>
      <p>選擇下方食物捷徑，再調整份數，會自動帶入熱量與蛋白質／碳水／脂肪。自訂餐點需填入實際包裝或店家的營養標示，單填名稱不會自動辨識。</p>
      <p>若只有三大營養素，可按「依營養素估算熱量」：蛋白質 × 4＋碳水 × 4＋脂肪 × 9。這是概算，可能因纖維與標示進位等因素與包裝不同，優先使用實際標示。</p>
      <p>目前沒有拍照辨識，也不會把重量 × 次數換成運動消耗熱量或從飲食總量扣除。</p>
    </article></div>
  </details>;
}
