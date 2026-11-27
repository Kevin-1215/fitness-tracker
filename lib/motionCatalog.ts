/** Only explicitly reconstructed variants may use the new motion renderer.
 * Sharing an old animationType is never enough to enable a different exercise. */
export type ControlledMotionKind='bench'|'curl'|'hammer'|'alternate'|'lateral'|'front'|'squat'|'hinge';
export interface ControlledMotionSpec {
 kind:ControlledMotionKind; benchAngle?:number; gripHalfWidth?:number;
 label:string; jointLabel:string; cue:string; support:string; loweringFirst:boolean;
}
const bench=(angle=0,grip=.62):ControlledMotionSpec=>({kind:'bench',benchAngle:angle,gripHalfWidth:grip,label:'推舉拆解',jointLabel:'肘屈曲',cue:'前臂承托重量；下放至肩部舒服的位置，推回後不撞鈴或猛鎖手肘。',support:'雙腳、臀部、上背與頭部保持支撐',loweringFirst:true});
const curl=(kind:'curl'|'hammer'|'alternate'='curl'):ControlledMotionSpec=>({kind,label:'彎舉拆解',jointLabel:'肘屈曲',cue:'上臂留在身側，只讓前臂繞手肘彎曲；身體保持穩定。',support:'雙腳固定，上臂不向前甩',loweringFirst:false});
export const controlledMotions:Readonly<Record<string,ControlledMotionSpec>>={
 bench_press:bench(),dumbbell_bench_press:bench(),close_grip_bench_press:bench(0,.44),
 incline_dumbbell_press:bench(45,.58),incline_barbell_press:bench(45,.62),
 barbell_biceps_curl:curl(),dumbbell_hammer_curl:curl('hammer'),alternating_dumbbell_curl:curl('alternate'),
 dumbbell_lateral_raise:{kind:'lateral',label:'側平舉拆解',jointLabel:'肩抬起',cue:'手肘維持微彎，手臂沿側前方抬至肩高附近；不以聳肩或甩身體增加高度。',support:'雙腳與軀幹固定，兩側同步',loweringFirst:false},
 dumbbell_front_raise:{kind:'front',label:'前平舉拆解',jointLabel:'肩抬起',cue:'手肘角度保持微彎，向前抬到肩高附近，再沿相同弧線回放。',support:'雙腳固定，肋骨與骨盆對齊',loweringFirst:false},
 barbell_back_squat:{kind:'squat',label:'深蹲拆解',jointLabel:'膝屈曲',cue:'髖膝一起屈伸，膝蓋朝腳尖方向移動；腳掌保持接觸地面。',support:'腳跟、大腳趾根、小腳趾根持續支撐',loweringFirst:true},
 dumbbell_romanian_deadlift:{kind:'hinge',label:'髖鉸鏈拆解',jointLabel:'髖屈曲',cue:'膝蓋只保留小幅彎曲，髖部向後移；背部維持原本形狀，啞鈴靠近腿。',support:'雙腳固定，軀幹與骨盆作為整體傾斜',loweringFirst:true},
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
 if(progress<.08||progress>.94)return '起始位置';
 if(progress>=.5&&progress<.58)return spec.loweringFirst?'底點停留':'頂端停留';
 const first=progress<.5;
 return spec.kind==='bench'||spec.kind==='squat'||spec.kind==='hinge'?(first?'離心控制':'向心推回'):(first?'向心抬起':'離心回放');
}
