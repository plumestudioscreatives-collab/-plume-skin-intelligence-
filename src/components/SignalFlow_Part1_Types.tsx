// SignalFlow_Part1_Types.tsx
// Plume Studios — Signal Flow™ · PART 1 of 3
import React, { useState } from 'react';

export const T = {
  gold: '#C8A882', green: '#7CB87C', blue: '#7C9CB8', red: '#B87C7C',
  pink: '#C87C9C', lime: '#B8C87C', purple: '#9C7CB8', orange: '#C8A07C',
  teal: '#7CB8B0', bg: '#0a0a0a', card: '#0f0f0f', border: '#1a1a1a',
  border2: '#2a2a2a', text: '#e8e0d5', faint: '#555', muted: '#888',
  font: "'DM Sans','Helvetica Neue',sans-serif",
};

export const inp: React.CSSProperties = {
  width: '100%', background: '#141414', border: `1px solid ${T.border2}`,
  borderRadius: 8, padding: '11px 14px', fontSize: 13, color: T.text,
  outline: 'none', fontFamily: T.font, boxSizing: 'border-box',
};

export type SeasonType = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Year-round';
export type SentimentType = 'love' | 'like' | 'neutral' | 'dislike' | 'hate';
export type UserType = 'beauty_lover' | 'clinic' | 'brand';

export interface ProductReview {
  id: string; userId: string; userType: 'beauty_lover'; productId: string;
  productName: string; brandName: string; sentiment: SentimentType;
  skinConcernsAddressed: string[]; seasonsUsed: SeasonType[];
  usageContext: 'standalone' | 'with_clinic_treatment' | 'home_protocol';
  pairedWith: string[]; whyTheyLoveIt: string; improvements: string;
  skinScoreBefore: number | null; skinScoreAfter: number | null;
  weeksUsed: number; wouldRepurchase: boolean; verifiedPurchase: boolean;
  clinicRecommended: boolean; createdAt: string; updatedAt: string;
}

export interface TreatmentOutcomeLog {
  id: string; clinicId: string; clientRef: string; treatment: string;
  productPrescribed: string; skinConcern: string;
  skinScoreBefore: number | null; skinScoreAfter: number | null;
  satisfactionScore: number; didRebook: boolean; daysToRebook: number | null;
  season: SeasonType; staffId: string; createdAt: string;
}

export interface BrandProductSignal {
  productId: string; productName: string; brandId: string; brandName: string;
  category: string; totalReviews: number; avgSentiment: number;
  avgSkinImprovement: number; repurchaseRate: number; clinicPrescriptionCount: number;
  topConcernsAddressed: string[]; topTreatmentPairings: string[];
  topSeasons: SeasonType[]; trend: 'rising' | 'stable' | 'declining'; trendDelta: number;
}

export interface OutcomeIntelligence {
  treatmentProductCombos: {
    treatment: string; product: string; avgImprovement: number;
    retentionRate: number; rebookingRate: number; repurchaseRate: number;
    satisfactionScore: number; clientCount: number; topConcern: string; confidence: number;
  }[];
}

export interface TreatmentIntelligence {
  treatments: {
    name: string; category: string; retentionRate: number; satisfactionScore: number;
    rebookingRate: number; avgSkinImprovement: number; clientCount: number;
    topProducts: string[]; trend: 'rising' | 'stable' | 'declining'; trendDelta: number;
  }[];
}

export interface ProductIntelligence { products: BrandProductSignal[]; }

export interface TrendIntelligence {
  searchTrends: {
    term: string; category: 'treatment' | 'ingredient' | 'concern' | 'product_type';
    direction: 'rising' | 'stable' | 'declining'; percentChange: number;
    dataPoints: number; region: string; relatedTerms: string[];
  }[];
  emergingConcerns: string[];
  decliningTrends: string[];
  seasonalSignals: { season: SeasonType; topConcern: string; topTreatment: string; topProduct: string }[];
}

export interface ConsumerIntelligence {
  journey: {
    date: string; type: 'treatment' | 'product_review' | 'skin_scan' | 'milestone';
    title: string; detail: string; skinScoreChange: number | null;
    sentiment: SentimentType | null; products: string[]; treatments: string[];
  }[];
  currentSkinScore: number; baselineSkinScore: number; totalImprovement: number;
  topProducts: string[]; topTreatments: string[]; activeConcerns: string[]; resolvedConcerns: string[];
}

export interface PredictiveIntelligence {
  predictions: {
    id: string; category: 'treatment' | 'product' | 'concern' | 'lifestyle';
    title: string; rationale: string; confidence: number;
    urgency: 'now' | 'soon' | 'consider'; actionable: string; basedOn: string[];
  }[];
}

export const SKIN_CONCERNS = [
  'Redness / Sensitivity','Dehydration','Fine Lines','Wrinkles','Pigmentation',
  'Acne / Breakouts','Texture','Enlarged Pores','Sagging / Laxity','Dullness',
  'Scarring','Sun Damage','Barrier Damage','Post-Treatment Recovery','Hyperpigmentation',
];

export const TREATMENTS = [
  'RF Microneedling','Fractional Laser','Chemical Peel','HIFU / Ultraformer',
  'Botulinum Toxin','Dermal Fillers','HydraFacial','Microneedling','Dermaplaning',
  'LED Therapy','PDO Thread Lift','PRP Facial','Mesotherapy','Profhilo',
  'IPL Treatment','CO2 Laser','Exosome Therapy','Polynucleotides',
];

export const PRODUCT_CATEGORIES = [
  'Post-Treatment Serum','Barrier Cream','SPF','Cleanser','Hydrating Serum',
  'Retinol / Retinoid','Vitamin C','AHA / BHA','Eye Cream','Mask','Toner',
  'Lip Treatment','Supplement',
];

export const SEASONS: SeasonType[] = ['Spring','Summer','Autumn','Winter','Year-round'];

export const SENTIMENT_CONFIG: Record<SentimentType, { color: string; icon: string; label: string; score: number }> = {
  love:    { color: T.gold,   icon: '❤️', label: 'Love it',   score:  2 },
  like:    { color: T.green,  icon: '👍', label: 'Like it',   score:  1 },
  neutral: { color: T.muted,  icon: '😐', label: 'Neutral',   score:  0 },
  dislike: { color: T.orange, icon: '👎', label: 'Dislike',   score: -1 },
  hate:    { color: T.red,    icon: '💔', label: 'Not for me',score: -2 },
};

type ComboBucket = { improvements: number[]; satisfactions: number[]; rebooks: number; total: number; repurchases: number; concerns: string[]; };
type TreatBucket = { improvements: number[]; satisfactions: number[]; rebooks: number; total: number; products: string[]; };
type ProdBucket  = { reviews: ProductReview[]; treatmentLogs: TreatmentOutcomeLog[]; };

export function computeSignalFlow(productReviews: ProductReview[], treatmentLogs: TreatmentOutcomeLog[]) {
  const comboMap: Record<string, ComboBucket> = {};
  treatmentLogs.forEach(log => {
    if (!log.productPrescribed) return;
    const key = `${log.treatment}||${log.productPrescribed}`;
    if (!comboMap[key]) comboMap[key] = { improvements:[], satisfactions:[], rebooks:0, total:0, repurchases:0, concerns:[] };
    if (log.skinScoreBefore !== null && log.skinScoreAfter !== null) comboMap[key].improvements.push(log.skinScoreAfter - log.skinScoreBefore);
    comboMap[key].satisfactions.push(log.satisfactionScore);
    comboMap[key].total++;
    if (log.didRebook) comboMap[key].rebooks++;
    if (log.skinConcern) comboMap[key].concerns.push(log.skinConcern);
  });
  productReviews.forEach(review => {
    review.pairedWith.forEach(pt => {
      const key = `${pt}||${review.productName}`;
      if (!comboMap[key]) comboMap[key] = { improvements:[], satisfactions:[], rebooks:0, total:0, repurchases:0, concerns:[] };
      if (review.skinScoreBefore !== null && review.skinScoreAfter !== null) comboMap[key].improvements.push(review.skinScoreAfter - review.skinScoreBefore);
      if (review.wouldRepurchase) comboMap[key].repurchases++;
      comboMap[key].total++;
      comboMap[key].concerns.push(...review.skinConcernsAddressed);
    });
  });

  const outcomeCombos = Object.entries(comboMap).map(([key, data]) => {
    const [treatment, product] = key.split('||');
    const avgImprovement = data.improvements.length > 0 ? Math.round(data.improvements.reduce((a,b) => a+b,0) / data.improvements.length) : 0;
    const avgSatisfaction = data.satisfactions.length > 0 ? Number((data.satisfactions.reduce((a,b) => a+b,0) / data.satisfactions.length).toFixed(1)) : 0;
    const concernCounts: Record<string,number> = {};
    data.concerns.forEach(c => { concernCounts[c] = (concernCounts[c]||0)+1; });
    const topConcern = Object.entries(concernCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
    return { treatment, product, avgImprovement, retentionRate: data.total>0?Math.round((data.rebooks/data.total)*100):0, rebookingRate: data.total>0?Math.round((data.rebooks/data.total)*100):0, repurchaseRate: data.total>0?Math.round((data.repurchases/data.total)*100):0, satisfactionScore: avgSatisfaction, clientCount: data.total, topConcern, confidence: Math.min(98, 50+data.total*3) };
  }).sort((a,b) => b.avgImprovement-a.avgImprovement).slice(0,10);

  const treatMap: Record<string, TreatBucket> = {};
  treatmentLogs.forEach(log => {
    if (!treatMap[log.treatment]) treatMap[log.treatment] = { improvements:[], satisfactions:[], rebooks:0, total:0, products:[] };
    if (log.skinScoreBefore !== null && log.skinScoreAfter !== null) treatMap[log.treatment].improvements.push(log.skinScoreAfter - log.skinScoreBefore);
    treatMap[log.treatment].satisfactions.push(log.satisfactionScore);
    treatMap[log.treatment].total++;
    if (log.didRebook) treatMap[log.treatment].rebooks++;
    if (log.productPrescribed) treatMap[log.treatment].products.push(log.productPrescribed);
  });

  const treatments = Object.entries(treatMap).map(([name, data]) => {
    const avgImprovement = data.improvements.length>0 ? Math.round(data.improvements.reduce((a,b)=>a+b,0)/data.improvements.length) : 0;
    const avgSat = data.satisfactions.length>0 ? Number((data.satisfactions.reduce((a,b)=>a+b,0)/data.satisfactions.length).toFixed(1)) : 0;
    const prodCounts: Record<string,number> = {};
    data.products.forEach(p => { prodCounts[p]=(prodCounts[p]||0)+1; });
    const topProducts = Object.entries(prodCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([p])=>p);
    const retention = data.total>0 ? Math.round((data.rebooks/data.total)*100) : 0;
    return { name, category:'Clinic Treatment', retentionRate:retention, satisfactionScore:avgSat, rebookingRate:retention, avgSkinImprovement:avgImprovement, clientCount:data.total, topProducts, trend:(retention>70?'rising':retention>45?'stable':'declining') as 'rising'|'stable'|'declining', trendDelta:Math.round(Math.random()*20-5) };
  }).sort((a,b)=>b.avgSkinImprovement-a.avgSkinImprovement);

  const prodMap: Record<string, ProdBucket> = {};
  productReviews.forEach(r => { const key=`${r.productName}||${r.brandName}`; if(!prodMap[key]) prodMap[key]={reviews:[],treatmentLogs:[]}; prodMap[key].reviews.push(r); });

  const products: BrandProductSignal[] = Object.entries(prodMap).map(([key, data]) => {
    const [productName, brandName] = key.split('||');
    const reviews = data.reviews;
    const sentimentScores = reviews.map(r => SENTIMENT_CONFIG[r.sentiment].score);
    const avgSentiment = sentimentScores.length>0 ? sentimentScores.reduce((a,b)=>a+b,0)/sentimentScores.length : 0;
    const withScores = reviews.filter(r => r.skinScoreBefore!==null && r.skinScoreAfter!==null);
    const avgImprovement = withScores.length>0 ? Math.round(withScores.reduce((a,b)=>a+(b.skinScoreAfter!-b.skinScoreBefore!),0)/withScores.length) : 0;
    const repurchaseRate = reviews.length>0 ? Math.round((reviews.filter(r=>r.wouldRepurchase).length/reviews.length)*100) : 0;
    const allConcerns = reviews.flatMap(r=>r.skinConcernsAddressed);
    const concernCounts: Record<string,number> = {};
    allConcerns.forEach(c=>{concernCounts[c]=(concernCounts[c]||0)+1;});
    const topConcerns = Object.entries(concernCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c])=>c);
    const allPairings = reviews.flatMap(r=>r.pairedWith);
    const pairingCounts: Record<string,number> = {};
    allPairings.forEach(p=>{pairingCounts[p]=(pairingCounts[p]||0)+1;});
    const topTreatmentPairings = Object.entries(pairingCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([p])=>p);
    const seasonCounts: Record<string,number> = {};
    reviews.flatMap(r=>r.seasonsUsed).forEach(s=>{seasonCounts[s]=(seasonCounts[s]||0)+1;});
    const topSeasons = Object.entries(seasonCounts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([s])=>s as SeasonType);
    return { productId:key, productName, brandId:(brandName||'').toLowerCase().replace(/\s/g,'_'), brandName:brandName||'Unknown', category:reviews[0]?.usageContext||'Home Care', totalReviews:reviews.length, avgSentiment, avgSkinImprovement:avgImprovement, repurchaseRate, clinicPrescriptionCount:data.treatmentLogs.length, topConcernsAddressed:topConcerns, topTreatmentPairings, topSeasons, trend:(avgSentiment>1?'rising':avgSentiment>0?'stable':'declining') as 'rising'|'stable'|'declining', trendDelta:Math.round(avgSentiment*15) };
  }).sort((a,b)=>b.avgSkinImprovement-a.avgSkinImprovement);

  const concernTrends = (() => { const counts: Record<string,number>={}; productReviews.forEach(r=>{r.skinConcernsAddressed.forEach(c=>{counts[c]=(counts[c]||0)+1;})}); treatmentLogs.forEach(l=>{if(l.skinConcern) counts[l.skinConcern]=(counts[l.skinConcern]||0)+1;}); return Object.entries(counts).sort((a,b)=>b[1]-a[1]); })();
  const treatmentTrends = (() => { const counts: Record<string,number>={}; treatmentLogs.forEach(l=>{counts[l.treatment]=(counts[l.treatment]||0)+1;}); return Object.entries(counts).sort((a,b)=>b[1]-a[1]); })();

  const trend: TrendIntelligence = {
    searchTrends: [
      ...concernTrends.slice(0,4).map(([term,count])=>({term,category:'concern' as const,direction:(count>5?'rising':'stable') as 'rising'|'stable'|'declining',percentChange:Math.min(80,count*8),dataPoints:count,region:'All markets',relatedTerms:concernTrends.slice(1,3).map(([t])=>t)})),
      ...treatmentTrends.slice(0,3).map(([term,count])=>({term,category:'treatment' as const,direction:(count>3?'rising':'stable') as 'rising'|'stable'|'declining',percentChange:Math.min(70,count*10),dataPoints:count,region:'Clinic network',relatedTerms:[] as string[]})),
    ],
    emergingConcerns: concernTrends.slice(0,3).map(([c])=>c),
    decliningTrends: concernTrends.length>6 ? concernTrends.slice(-2).map(([c])=>c) : [],
    seasonalSignals: SEASONS.slice(0,4).map(season => ({
      season,
      topConcern: productReviews.filter(r=>r.seasonsUsed.includes(season))[0]?.skinConcernsAddressed[0]||concernTrends[0]?.[0]||'—',
      topTreatment: treatmentLogs.filter(l=>l.season===season)[0]?.treatment||treatmentTrends[0]?.[0]||'—',
      topProduct: productReviews.filter(r=>r.seasonsUsed.includes(season))[0]?.productName||'—',
    })),
  };

  const predictions: PredictiveIntelligence['predictions'] = [];
  if (productReviews.length>0||treatmentLogs.length>0) {
    const barrierConcerns = productReviews.filter(r=>r.skinConcernsAddressed.includes('Barrier Damage')||r.skinConcernsAddressed.includes('Post-Treatment Recovery'));
    if (barrierConcerns.length>0) predictions.push({ id:'pred_barrier', category:'product', title:'Barrier support may improve your outcomes', rationale:`${barrierConcerns.length} people with similar skin profiles saw improved recovery when adding barrier repair serum post-treatment.`, confidence:Math.min(88,55+barrierConcerns.length*3), urgency:'soon', actionable:'Ask your clinic about a post-treatment barrier protocol', basedOn:['Treatment recovery patterns','Similar skin profiles','Product review data'] });
    if (outcomeCombos.length>0 && outcomeCombos[0].avgImprovement>5) { const best=outcomeCombos[0]; predictions.push({ id:'pred_top_combo', category:'treatment', title:`${best.treatment} shows strong results for your concern`, rationale:`Clients using ${best.treatment} + ${best.product} saw an average +${best.avgImprovement} point skin improvement.`, confidence:best.confidence, urgency:'consider', actionable:`Discuss ${best.treatment} at your next clinic visit`, basedOn:[`${best.clientCount} similar clients`,'Clinic outcome data','Product review signals'] }); }
  }
  if (predictions.length===0) predictions.push({ id:'pred_empty', category:'lifestyle', title:'Start logging your skin journey to unlock predictions', rationale:'Signal Flow needs at least 3 product reviews or treatment outcomes to generate meaningful predictions.', confidence:0, urgency:'now', actionable:'Review a product or log a treatment outcome', basedOn:[] });

  return { outcome:{treatmentProductCombos:outcomeCombos}, treatment:{treatments}, product:{products}, trend, consumer:null as ConsumerIntelligence|null, predictive:{predictions} };
}

export const SFLabel: React.FC<{label:string;title:string;subtitle?:string}> = ({label,title,subtitle}) => (
  <div style={{marginBottom:18}}>
    <div style={{fontSize:10,letterSpacing:2,color:T.gold,marginBottom:6}}>{label}</div>
    <div style={{fontSize:22,color:T.text,fontWeight:500,letterSpacing:-0.3}}>{title}</div>
    {subtitle && <div style={{fontSize:13,color:T.muted,marginTop:6,lineHeight:1.6}}>{subtitle}</div>}
  </div>
);

export const SFMetricCard: React.FC<{icon:string;label:string;value:string|number;sub:string;color?:string;delta?:number}> = ({icon,label,value,sub,color=T.gold,delta}) => (
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:18}}>
    <div style={{fontSize:18,marginBottom:8}}>{icon}</div>
    <div style={{fontSize:10,letterSpacing:1.5,color:T.faint,marginBottom:6}}>{label.toUpperCase()}</div>
    <div style={{fontSize:26,color,fontWeight:600,display:'flex',alignItems:'baseline',gap:8}}>
      <span>{value}</span>
      {delta!==undefined && <span style={{fontSize:12,color:delta>=0?T.green:T.red,fontWeight:600}}>{delta>=0?'↑':'↓'} {Math.abs(delta)}%</span>}
    </div>
    <div style={{fontSize:11,color:T.muted,marginTop:6}}>{sub}</div>
  </div>
);

export const TrendArrow: React.FC<{direction:'rising'|'stable'|'declining';delta?:number}> = ({direction,delta}) => {
  const c = {rising:{color:T.green,icon:'↑',label:'Rising'},stable:{color:T.gold,icon:'→',label:'Stable'},declining:{color:T.red,icon:'↓',label:'Declining'}}[direction];
  return <span style={{fontSize:11,color:c.color,fontWeight:600}}>{c.icon} {c.label}{delta!==undefined?` ${Math.abs(delta)}%`:''}</span>;
};

export const ConfidenceBar: React.FC<{confidence:number}> = ({confidence}) => (
  <div style={{marginTop:8}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.faint,marginBottom:4}}>
      <span>AI confidence</span>
      <span style={{color:confidence>=75?T.green:confidence>=50?T.gold:T.faint,fontWeight:600}}>{confidence}%</span>
    </div>
    <div style={{height:4,background:T.border,borderRadius:2,overflow:'hidden'}}>
      <div style={{width:`${confidence}%`,height:'100%',background:confidence>=75?T.green:confidence>=50?T.gold:T.faint,borderRadius:2,transition:'width 0.8s ease'}}/>
    </div>
  </div>
);

export const SentimentBar: React.FC<{sentiment:SentimentType;count:number;total:number}> = ({sentiment,count,total}) => {
  const cfg = SENTIMENT_CONFIG[sentiment];
  const pct = total>0 ? Math.round((count/total)*100) : 0;
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
      <span style={{fontSize:14,width:20}}>{cfg.icon}</span>
      <span style={{fontSize:11,color:T.faint,width:70}}>{cfg.label}</span>
      <div style={{flex:1,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:cfg.color,borderRadius:3,transition:'width 0.6s ease'}}/>
      </div>
      <span style={{fontSize:11,color:T.muted,width:36,textAlign:'right'}}>{pct}%</span>
    </div>
  );
};

export const BeautyLoverReviewForm: React.FC<{onSubmit:(r:ProductReview)=>void;onClose:()=>void}> = ({onSubmit,onClose}) => {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState<Partial<ProductReview>>({productName:'',brandName:'',sentiment:undefined,skinConcernsAddressed:[],seasonsUsed:[],usageContext:'standalone',pairedWith:[],whyTheyLoveIt:'',improvements:'',skinScoreBefore:null,skinScoreAfter:null,weeksUsed:4,wouldRepurchase:true,clinicRecommended:false});
  const set=(f:string,v:any)=>setForm(p=>({...p,[f]:v}));
  const toggleArr=(field:string,val:string)=>{const curr=((form as any)[field] as string[])||[];set(field,curr.includes(val)?curr.filter((x:string)=>x!==val):[...curr,val]);};
  const chipStyle=(active:boolean,color=T.gold):React.CSSProperties=>({fontSize:12,padding:'6px 12px',borderRadius:20,cursor:'pointer',border:`1px solid ${active?color:T.border2}`,background:active?`${color}18`:'transparent',color:active?color:T.faint,transition:'all 0.15s',display:'inline-block'});
  const submit=()=>{
    if(!form.productName||!form.brandName||!form.sentiment)return;
    onSubmit({id:`rv_${Date.now()}`,userId:'current_user',userType:'beauty_lover',productId:`${form.productName}_${form.brandName}`.toLowerCase().replace(/\s/g,'_'),productName:form.productName!,brandName:form.brandName!,sentiment:form.sentiment!,skinConcernsAddressed:form.skinConcernsAddressed||[],seasonsUsed:form.seasonsUsed||[],usageContext:form.usageContext||'standalone',pairedWith:form.pairedWith||[],whyTheyLoveIt:form.whyTheyLoveIt||'',improvements:form.improvements||'',skinScoreBefore:form.skinScoreBefore??null,skinScoreAfter:form.skinScoreAfter??null,weeksUsed:form.weeksUsed||4,wouldRepurchase:form.wouldRepurchase??true,verifiedPurchase:false,clinicRecommended:form.clinicRecommended??false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    onClose();
  };
  const STEPS=['Product','Your Experience','Details','Pairings'];
  const canNext=step===1?!!(form.productName&&form.brandName&&form.sentiment):true;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:T.font}}>
      <div style={{width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:26,color:T.text}}>
        <div style={{display:'flex',gap:6,marginBottom:18}}>{STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<step?T.gold:T.border2}}/>)}</div>
        <div style={{fontSize:10,letterSpacing:2,color:T.gold,marginBottom:6}}>STEP {step} OF {STEPS.length}</div>
        <div style={{fontSize:22,fontWeight:500,marginBottom:20}}>{STEPS[step-1]}</div>
        {step===1&&(<div>
          <div style={{marginBottom:16}}><div style={{fontSize:11,color:T.faint,marginBottom:8}}>PRODUCT NAME *</div><input value={form.productName||''} onChange={e=>set('productName',e.target.value)} placeholder="e.g. Barrier Restore Complex" style={inp}/></div>
          <div style={{marginBottom:16}}><div style={{fontSize:11,color:T.faint,marginBottom:8}}>BRAND *</div><input value={form.brandName||''} onChange={e=>set('brandName',e.target.value)} placeholder="e.g. Medik8" style={inp}/></div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:T.faint,marginBottom:8}}>HOW DO YOU FEEL ABOUT THIS PRODUCT? *</div>
            <div style={{display:'flex',gap:6}}>
              {(Object.entries(SENTIMENT_CONFIG) as [SentimentType,typeof SENTIMENT_CONFIG[SentimentType]][]).map(([s,cfg])=>(
                <div key={s} onClick={()=>set('sentiment',s)} style={{flex:1,...chipStyle(form.sentiment===s,cfg.color),textAlign:'center',padding:'10px 4px'}}>
                  <div style={{fontSize:18}}>{cfg.icon}</div>
                  <div style={{fontSize:10,marginTop:4}}>{cfg.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>)}
        {step===2&&(<div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:T.faint,marginBottom:10}}>SKIN CONCERNS ADDRESSED?</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{SKIN_CONCERNS.map(c=><span key={c} onClick={()=>toggleArr('skinConcernsAddressed',c)} style={chipStyle((form.skinConcernsAddressed||[]).includes(c))}>{c}</span>)}</div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:T.faint,marginBottom:10}}>WHICH SEASONS DO YOU USE IT?</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{SEASONS.map(s=><span key={s} onClick={()=>toggleArr('seasonsUsed',s)} style={chipStyle((form.seasonsUsed||[]).includes(s),T.blue)}>{s}</span>)}</div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:T.faint,marginBottom:8}}>SKIN SCORE BEFORE / AFTER (optional)</div>
            <div style={{display:'flex',gap:10}}>
              <input type="number" value={form.skinScoreBefore??''} onChange={e=>set('skinScoreBefore',e.target.value?Number(e.target.value):null)} placeholder="Before" style={{...inp,flex:1}}/>
              <input type="number" value={form.skinScoreAfter??''} onChange={e=>set('skinScoreAfter',e.target.value?Number(e.target.value):null)} placeholder="After" style={{...inp,flex:1}}/>
            </div>
          </div>
        </div>)}
        {step===3&&(<div>
          <div style={{marginBottom:16}}><div style={{fontSize:11,color:T.faint,marginBottom:8}}>WHY DO YOU LOVE IT (OR NOT)?</div><textarea value={form.whyTheyLoveIt||''} onChange={e=>set('whyTheyLoveIt',e.target.value)} rows={4} placeholder="Be specific..." style={{...inp,resize:'none'} as React.CSSProperties}/></div>
          <div style={{marginBottom:16}}><div style={{fontSize:11,color:T.faint,marginBottom:8}}>WHAT COULD BE IMPROVED?</div><textarea value={form.improvements||''} onChange={e=>set('improvements',e.target.value)} rows={3} style={{...inp,resize:'none'} as React.CSSProperties}/></div>
        </div>)}
        {step===4&&(<div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:T.faint,marginBottom:10}}>CLINIC TREATMENTS YOU USE THIS WITH?</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{TREATMENTS.slice(0,12).map(t=><span key={t} onClick={()=>toggleArr('pairedWith',t)} style={chipStyle((form.pairedWith||[]).includes(t),T.blue)}>{t}</span>)}</div>
          </div>
        </div>)}
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button onClick={()=>step>1?setStep(step-1):onClose()} style={{flex:1,background:'transparent',color:T.faint,border:`1px solid ${T.border2}`,borderRadius:8,padding:12,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{step>1?'← Back':'Cancel'}</button>
          {step<4?<button onClick={()=>setStep(step+1)} disabled={!canNext} style={{flex:2,background:canNext?T.gold:T.border2,color:canNext?'#0a0a0a':T.faint,border:'none',borderRadius:8,padding:12,fontSize:13,fontWeight:600,cursor:canNext?'pointer':'not-allowed',fontFamily:T.font}}>Continue →</button>
          :<button onClick={submit} style={{flex:2,background:T.gold,color:'#0a0a0a',border:'none',borderRadius:8,padding:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Submit Review</button>}
        </div>
      </div>
    </div>
  );
};
