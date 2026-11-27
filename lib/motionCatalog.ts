/** Only explicitly reconstructed variants may use the new motion renderer.
 * Sharing an old animationType is never enough to enable a different exercise. */
export type ControlledMotionKind='bench'|'curl'|'hammer'|'alternate'|'lateral'|'front'|'squat'|'hinge'|'chest_machine'|'pushup'|'fly'|'cable_fly'|'row'|'row_single'|'pulldown'|'pullup'|'row_seated'|'pullover'|'inverted_row'|'overhead_press'|'face_pull'|'reverse_fly'|'pike'|'pushdown'|'reverse_curl'|'overhead_extension'|'deadlift'|'goblet'|'lunge'|'calf'|'bridge'|'hip_thrust'|'leg_press'|'rollout'|'side_bend'|'crunch'|'plank'|'dead_bug'|'bird_dog'|'hanging_knee'|'pallof';
export interface ControlledMotionSpec {
 kind:ControlledMotionKind; benchAngle?:number; gripHalfWidth?:number;
 label:string; jointLabel:string; cue:string; support:string; loweringFirst:boolean;
 gear?:'bar'|'rope'|'handles'|'none'|'single';dumbbellHands?:readonly number[];alternateSides?:boolean;isHold?:boolean;peakLabel?:string;
}
const bench=(angle=0,grip=.62):ControlledMotionSpec=>({kind:'bench',benchAngle:angle,gripHalfWidth:grip,label:'推舉拆解',jointLabel:'肘屈曲',cue:'前臂承托重量；下放至肩部舒服的位置，推回後不撞鈴或猛鎖手肘。',support:'雙腳、臀部、上背與頭部保持支撐',loweringFirst:true});
const curl=(kind:'curl'|'hammer'|'alternate'='curl'):ControlledMotionSpec=>({kind,label:'彎舉拆解',jointLabel:'肘屈曲',cue:'上臂留在身側，只讓前臂繞手肘彎曲；身體保持穩定。',support:'雙腳固定，上臂不向前甩',loweringFirst:false});
const motion=(kind:ControlledMotionKind,label:string,jointLabel:string,cue:string,support:string,options:Partial<ControlledMotionSpec>={}):ControlledMotionSpec=>({kind,label,jointLabel,cue,support,loweringFirst:false,...options});
export const controlledMotions:Readonly<Record<string,ControlledMotionSpec>>={
 bench_press:bench(),dumbbell_bench_press:bench(),close_grip_bench_press:bench(0,.44),
 incline_dumbbell_press:bench(45,.58),incline_barbell_press:bench(45,.62),
 barbell_biceps_curl:curl(),dumbbell_hammer_curl:curl('hammer'),alternating_dumbbell_curl:curl('alternate'),
 dumbbell_lateral_raise:{kind:'lateral',label:'側平舉拆解',jointLabel:'肩抬起',cue:'手肘維持微彎，手臂沿側前方抬至肩高附近；不以聳肩或甩身體增加高度。',support:'雙腳與軀幹固定，兩側同步',loweringFirst:false},
 dumbbell_front_raise:{kind:'front',label:'前平舉拆解',jointLabel:'肩抬起',cue:'手肘角度保持微彎，向前抬到肩高附近，再沿相同弧線回放。',support:'雙腳固定，肋骨與骨盆對齊',loweringFirst:false},
 barbell_back_squat:{kind:'squat',label:'深蹲拆解',jointLabel:'膝屈曲',cue:'髖膝一起屈伸，膝蓋朝腳尖方向移動；腳掌保持接觸地面。',support:'腳跟、大腳趾根、小腳趾根持續支撐',loweringFirst:true},
 dumbbell_romanian_deadlift:{kind:'hinge',label:'髖鉸鏈拆解',jointLabel:'髖屈曲',cue:'膝蓋只保留小幅彎曲，髖部向後移；背部維持原本形狀，啞鈴靠近腿。',support:'雙腳固定，軀幹與骨盆作為整體傾斜',loweringFirst:true},
 machine_chest_press:motion('chest_machine','坐姿胸推','肘屈曲','背部貼靠墊，握把沿連桿軌跡向前；不抬臀或聳肩。','臀部、背部與雙腳',{gear:'handles'}),
 push_up:motion('pushup','伏地挺身','肘屈曲','身體保持一直線，肘斜向身後彎曲，胸口靠近地面後推回。','雙掌與前腳掌',{loweringFirst:true}),
 diamond_push_up:motion('pushup','窄距伏地挺身','肘屈曲','雙手較窄但不強迫指尖相碰；肘沿身側彎曲。','雙掌與前腳掌',{loweringFirst:true}),
 dumbbell_chest_fly:motion('fly','仰臥飛鳥','肩展開','肘保持微彎，手臂向兩側展開至肩部舒適範圍，再抱回上方。','頭、上背、臀部與雙腳',{loweringFirst:true}),
 standing_cable_fly:motion('cable_fly','滑輪夾胸','肩合攏','軀幹穩定、肘角度不變，兩手在胸前合攏並保留間距。','雙腳',{gear:'handles'}),
 barbell_row:motion('row','俯身划船','肘屈曲','折髖姿勢固定，肘往後拉，槓接近下胸與上腹；不站起借力。','雙腳全掌'),
 one_arm_dumbbell_row:motion('row_single','單臂划船','肘屈曲','一手與同側膝支撐平凳，另一手把啞鈴拉往腰側；胸口朝地。','非動作手、同側膝與另一腳',{dumbbellHands:[1]}),
 lat_pulldown:motion('pulldown','正握下拉','肘屈曲','手肘朝側下方拉，橫桿在頭前方下到上胸；軀幹保持穩定。','臀部、雙腳與大腿固定墊',{gear:'bar'}),
 reverse_grip_lat_pulldown:motion('pulldown','反握下拉','肘屈曲','前臂旋後、握距較窄，肘向前下再靠近身側；不靠後仰拉桿。','臀部、雙腳與大腿固定墊',{gear:'bar'}),
 neutral_grip_lat_pulldown:motion('pulldown','對握下拉','肘屈曲','掌心相對，窄握把在臉前通過，下拉到上胸前。','臀部、雙腳與大腿固定墊',{gear:'handles'}),
 pull_up:motion('pullup','引體向上','肘屈曲','雙手與單槓不動，身體向上拉；頭頸自然，不踢腿追槓。','固定單槓上的雙手',{gear:'none'}),
 seated_machine_row:motion('row_seated','寬距對握划船','肘屈曲','臀部保持坐穩，手肘向斜後方拉；不反覆前後甩腰。','臀部與雙腳踏板',{gear:'handles'}),
 straight_arm_pulldown:motion('pullover','直臂下拉','肩伸展','肘維持微彎，以上臂帶動握桿走弧線到大腿前，軀幹不跟著鞠躬。','雙腳',{gear:'bar'}),
 inverted_row:motion('inverted_row','反向划船','肘屈曲','腳跟與雙手保持支撐，身體作為整體向槓拉近。','雙腳跟與固定橫槓',{gear:'none'}),
 barbell_overhead_press:motion('overhead_press','槓鈴肩推','肘屈曲','槓在臉前通過，上推至肩線上方；腹臀穩住、不屈膝借力。','雙腳全掌'),
 dumbbell_shoulder_press:motion('overhead_press','啞鈴肩推','肘屈曲','肘略朝前，兩鈴向上略內收，保持前臂承托且不互撞。','雙腳全掌'),
 machine_shoulder_press:motion('overhead_press','機械肩推','肘屈曲','臀與背貼靠墊，握把沿連桿上推；手肘保留柔軟。','臀部、背部與雙腳',{gear:'handles'}),
 cable_face_pull:motion('face_pull','繩索面拉','肘屈曲','手肘往外後方，繩尾分開到臉兩側；頭頸不前伸。','雙腳',{gear:'rope'}),
 bent_over_reverse_fly:motion('reverse_fly','俯身反向飛鳥','肩展開','折髖固定，肘角度不變，雙臂展開至軀幹平面附近。','雙腳全掌'),
 pike_push_up:motion('pike','派克伏地肩推','肘屈曲','保持髖部抬高，頭朝雙手前方的地面下降，再推離地面。','雙掌與前腳掌',{loweringFirst:true}),
 cable_triceps_pushdown:motion('pushdown','三頭下壓','肘屈曲','上臂固定在身旁，只伸展手肘向下壓；手腕保持平直。','雙腳',{gear:'bar'}),
 reverse_barbell_curl:motion('reverse_curl','反握彎舉','肘屈曲','前臂維持旋前、手腕平直，上臂不前甩，沿肘中心弧線彎舉。','雙腳全掌'),
 overhead_dumbbell_extension:motion('overhead_extension','過頭三頭伸展','肘屈曲','上臂留在耳側，雙手托同一顆啞鈴，屈肘讓重量移到頭後。','雙腳全掌',{gear:'single',dumbbellHands:[],loweringFirst:true}),
 barbell_deadlift:motion('deadlift','傳統硬舉','膝屈曲','雙手與槓保持連接，髖膝協調伸展；槓沿腿前上升，不後仰。','雙腳全掌',{loweringFirst:true}),
 goblet_squat:motion('goblet','高腳杯深蹲','膝屈曲','直立啞鈴靠胸，膝蓋朝腳尖方向，腳跟不抬起。','雙腳全掌',{gear:'single',dumbbellHands:[],loweringFirst:true}),
 dumbbell_reverse_lunge:motion('lunge','後跨弓箭步','前膝屈曲','先後跨再下降；前腳固定，後腳前掌支撐，回站穩後換側。','前腳全掌與後腳前掌',{alternateSides:true,loweringFirst:true}),
 standing_calf_raise:motion('calf','站姿提踵','踝蹠屈','前腳掌不滑動，抬起腳跟，再控制回到地面；不屈膝蹲起。','雙腳前掌'),
 glute_bridge:motion('bridge','徒手臀橋','髖伸展','上背與雙腳留地，髖部抬起至肩、髖、膝接近一直線；不拱腰。','上背、雙腳與手臂'),
 barbell_hip_thrust:motion('hip_thrust','槓鈴臀推','髖伸展','下肩胛以凳邊為支點，槓墊在髖摺，抬髖時不把腰後折。','上背凳邊與雙腳'),
 leg_press:motion('leg_press','機械腿推','膝屈曲','頭背與骨盆貼墊，雙腳與踏板一起沿導軌移動；膝不反折。','背墊、座墊與踏板',{loweringFirst:true,gear:'handles'}),
 barbell_ab_rollout:motion('rollout','跪姿滾輪','肩前伸','膝保持原位、肘保持伸展，將槓沿地面前滾；腰不下塌。','雙膝與槓片',{loweringFirst:true}),
 dumbbell_side_bend:motion('side_bend','單側側屈','胸廓側屈','骨盆不橫移，胸廓小幅向持鈴側側屈，再回到直立。','雙腳全掌',{dumbbellHands:[0],loweringFirst:true}),
 kneeling_cable_crunch:motion('crunch','跪姿捲腹','胸廓前屈','雙膝不動，胸廓往骨盆捲近；手留頭側，不用手臂下拉。','雙膝與小腿',{gear:'rope'}),
 forearm_plank:motion('plank','前臂棒式','肘屈曲','肘在肩下，前臂貼地，頭到腳跟保持穩定；此動作是等長保持。','雙前臂與前腳掌',{isHold:true,peakLabel:'保持姿勢'}),
 dead_bug:motion('dead_bug','死蟲式','動作腿膝屈曲','一手與對側腿延伸到地面上方，腰背保持貼地，回收再換側。','頭與軀幹',{alternateSides:true,peakLabel:'延伸位'}),
 bird_dog:motion('bird_dog','鳥狗式','動作腿膝屈曲','伸出一手與對側腿至軀幹高度，胸口與骨盆仍朝地面。','非動作手與對側膝',{alternateSides:true,peakLabel:'延伸位'}),
 hanging_knee_raise:motion('hanging_knee','懸垂抬膝','髖屈曲','雙手與上半身穩定，將彎曲的膝抬向身前；不踢腿擺盪。','固定單槓上的雙手',{gear:'none'}),
 standing_pallof_press:motion('pallof','抗旋轉推','肘屈曲','滑輪在身體側方，雙手向正前推出，胸廓與骨盆不跟著旋轉。','雙腳全掌',{gear:'handles'}),
};
export const controlledMotionFor=(id?:string):ControlledMotionSpec|undefined=>id&&Object.hasOwn(controlledMotions,id)?controlledMotions[id]:undefined;
export const CONTROLLED_MOTION_COUNT=Object.keys(controlledMotions).length;
export function cycleDepth(progress:number){
 const t=Math.max(0,Math.min(1,progress));
 const smooth=(value:number)=>value*value*(3-2*value);
 if(t<.08||t>.94)return 0;
 if(t<.5)return smooth((t-.08)/.42);
 if(t<.58)return 1;
 return 1-smooth((t-.58)/.36);
}
export function motionPhase(progress:number,spec:ControlledMotionSpec){
 if(spec.isHold)return '等長保持';
 if(progress<.08||progress>.94)return '起始位置';
 if(progress>=.5&&progress<.58)return spec.peakLabel??(spec.loweringFirst?'底點停留':'收縮停留');
 const first=progress<.5;
 if(['dead_bug','bird_dog','rollout'].includes(spec.kind))return first?'控制延伸':'穩定回收';
 if(spec.kind==='pallof')return first?'推出控制':'收回控制';
 return spec.loweringFirst?(first?'離心控制':'向心推回'):(first?'向心發力':'離心回放');
}
