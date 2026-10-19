import{r as e}from"./rolldown-runtime-hePW80VL.js";import{_ as t,d as n,et as r,l as i,nn as a,u as o}from"./CartesianChart-DDRj083K.js";import{i as s,m as c,o as l,p as u,r as d}from"./wayfinder-7wgaPZBE.js";import{t as f}from"./arrow-down-D16dNC6_.js";import{n as p,t as m}from"./portal-navbar-CO-wBdQb.js";import{t as h}from"./calendar-C7UW5oz5.js";import{t as g}from"./chart-column-BnZZd6lQ.js";import{c as _,i as v,n as y,s as b,t as x}from"./select-BlAcDvqx.js";import{t as S}from"./circle-alert-DMqBy2N6.js";import{t as C}from"./circle-check-C779U4DW.js";import{t as w}from"./printer-D2cwVIlf.js";import{t as T}from"./search-BBWCeCTq.js";import{t as E}from"./trending-down-Bv52zOBg.js";import{t as D}from"./triangle-alert-DB1t6xrZ.js";import{Dt as ee,Ht as O,Lt as te,Ot as k,Pt as A,Ut as j}from"./app-CrWMtFsL.js";import{t as ne}from"./badge-Cgg02bv3.js";import{a as M,i as N,n as P,t as F}from"./card-CqNlQLCS.js";import{n as re,o as ie,t as ae}from"./ComposedChart-Dgj9lNvc.js";import{t as I}from"./ReferenceLine-p5Kzm_mW.js";import{t as oe}from"./BarChart-CFRHMv-A.js";var L=s(),R=e(u(),1),z=d(),B=[{value:1,label:`Januari`},{value:2,label:`Februari`},{value:3,label:`Maret`},{value:4,label:`April`},{value:5,label:`Mei`},{value:6,label:`Juni`},{value:7,label:`Juli`},{value:8,label:`Agustus`},{value:9,label:`September`},{value:10,label:`Oktober`},{value:11,label:`November`},{value:12,label:`Desember`}];function V(e){return B.find(t=>t.value===e)?.label??`Bulan ${e}`}function H(e){return e==null?`-`:Number(e).toLocaleString(`id-ID`,{minimumFractionDigits:0,maximumFractionDigits:2})}function U(e){let t=Math.abs(e);return t>=1e6?`${(e/1e6).toFixed(1)}M`:t>=1e3?`${(e/1e3).toFixed(0)}k`:String(Math.round(e))}function se(e){let t=(0,L.c)(43),{active:n,payload:r,year:i,unit:a}=e;if(!n||!r||!r.length)return null;let o=r[0]?.payload;if(!o)return null;let s=o.selisih>=0,c;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(c=(0,z.jsx)(h,{className:`size-3.5 text-emerald-600`}),t[0]=c):c=t[0];let l;t[1]!==o.month_name||t[2]!==i?(l=(0,z.jsxs)(`div`,{className:`font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5`,children:[c,(0,z.jsxs)(`span`,{children:[o.month_name,` `,i]})]}),t[1]=o.month_name,t[2]=i,t[3]=l):l=t[3];let u;t[4]!==o.has_data||t[5]!==s?(u=o.has_data?(0,z.jsx)(`span`,{className:`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${s?`bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`:`bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300`}`,children:s?(0,z.jsxs)(z.Fragment,{children:[(0,z.jsx)(C,{className:`size-2.5`}),` Surplus`]}):(0,z.jsxs)(z.Fragment,{children:[(0,z.jsx)(S,{className:`size-2.5`}),` Defisit`]})}):(0,z.jsx)(`span`,{className:`rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500`,children:`Belum Ada Data`}),t[4]=o.has_data,t[5]=s,t[6]=u):u=t[6];let d;t[7]!==l||t[8]!==u?(d=(0,z.jsxs)(`div`,{className:`flex items-center justify-between border-b border-slate-100 pb-2 mb-2 dark:border-slate-800`,children:[l,u]}),t[7]=l,t[8]=u,t[9]=d):d=t[9];let f;t[10]===Symbol.for(`react.memo_cache_sentinel`)?(f=(0,z.jsxs)(`span`,{className:`flex items-center gap-1.5 text-slate-600 dark:text-slate-400`,children:[(0,z.jsx)(`span`,{className:`size-2.5 rounded-sm bg-emerald-600 inline-block`}),`Ketersediaan:`]}),t[10]=f):f=t[10];let p;t[11]!==o.has_data||t[12]!==o.ketersediaan||t[13]!==a?(p=o.has_data?`${H(o.ketersediaan)} ${a}`:`-`,t[11]=o.has_data,t[12]=o.ketersediaan,t[13]=a,t[14]=p):p=t[14];let m;t[15]===p?m=t[16]:(m=(0,z.jsxs)(`div`,{className:`flex items-center justify-between`,children:[f,(0,z.jsx)(`span`,{className:`font-mono font-semibold text-slate-900 dark:text-slate-100`,children:p})]}),t[15]=p,t[16]=m);let g;t[17]===Symbol.for(`react.memo_cache_sentinel`)?(g=(0,z.jsxs)(`span`,{className:`flex items-center gap-1.5 text-slate-600 dark:text-slate-400`,children:[(0,z.jsx)(`span`,{className:`size-2.5 rounded-sm bg-blue-500 inline-block`}),`Kebutuhan:`]}),t[17]=g):g=t[17];let _;t[18]!==o.has_data||t[19]!==o.kebutuhan||t[20]!==a?(_=o.has_data?`${H(o.kebutuhan)} ${a}`:`-`,t[18]=o.has_data,t[19]=o.kebutuhan,t[20]=a,t[21]=_):_=t[21];let v;t[22]===_?v=t[23]:(v=(0,z.jsxs)(`div`,{className:`flex items-center justify-between`,children:[g,(0,z.jsx)(`span`,{className:`font-mono font-semibold text-slate-900 dark:text-slate-100`,children:_})]}),t[22]=_,t[23]=v);let y;t[24]!==o.produksi||t[25]!==a?(y=o.produksi>0&&(0,z.jsxs)(`div`,{className:`flex items-center justify-between text-slate-500`,children:[(0,z.jsxs)(`span`,{className:`flex items-center gap-1.5`,children:[(0,z.jsx)(`span`,{className:`size-2.5 rounded-sm bg-slate-300 inline-block`}),`Produksi:`]}),(0,z.jsxs)(`span`,{className:`font-mono`,children:[H(o.produksi),` `,a]})]}),t[24]=o.produksi,t[25]=a,t[26]=y):y=t[26];let b;t[27]===Symbol.for(`react.memo_cache_sentinel`)?(b=(0,z.jsxs)(`span`,{className:`flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300`,children:[(0,z.jsx)(`span`,{className:`size-2.5 rounded-full bg-amber-500 inline-block`}),`Garis Neraca:`]}),t[27]=b):b=t[27];let x=`font-mono font-bold ${s?`text-emerald-600 dark:text-emerald-400`:`text-rose-600 dark:text-rose-400`}`,w;t[28]!==o.has_data||t[29]!==o.selisih||t[30]!==a?(w=o.has_data?(0,z.jsxs)(z.Fragment,{children:[o.selisih>=0?`+`:``,H(o.selisih),` `,a]}):`-`,t[28]=o.has_data,t[29]=o.selisih,t[30]=a,t[31]=w):w=t[31];let T;t[32]!==x||t[33]!==w?(T=(0,z.jsxs)(`div`,{className:`border-t border-slate-100 pt-1.5 mt-1.5 dark:border-slate-800 flex items-center justify-between`,children:[b,(0,z.jsx)(`span`,{className:x,children:w})]}),t[32]=x,t[33]=w,t[34]=T):T=t[34];let E;t[35]!==v||t[36]!==y||t[37]!==T||t[38]!==m?(E=(0,z.jsxs)(`div`,{className:`space-y-1.5`,children:[m,v,y,T]}),t[35]=v,t[36]=y,t[37]=T,t[38]=m,t[39]=E):E=t[39];let D;return t[40]!==E||t[41]!==d?(D=(0,z.jsxs)(`div`,{className:`rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 text-xs min-w-[230px]`,children:[d,E]}),t[40]=E,t[41]=d,t[42]=D):D=t[42],D}function W({items:e,selectedYear:s,selectedMonth:u,availableYears:d,monthlyTrends:L,statistics:W}){let[G,ce]=(0,R.useState)(``),[K,le]=(0,R.useState)(`all`),[q,ue]=(0,R.useState)(`all`),[J,de]=(0,R.useState)(`dual`),fe=(e,t)=>{c.get(`/neraca-pangan`,{year:e,month:t},{preserveState:!0,preserveScroll:!0})},pe=()=>{window.location.href=`/neraca-pangan/export-excel?year=${s}&month=${u}`},me=()=>{let t=window.open(``,`_blank`);if(!t){alert(`Mohon izinkan pop-up browser untuk mencetak / mendownload PDF.`);return}let n=V(u),r=new Date().toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`}),i=X.length>0?X:e,a=``;i.forEach((e,t)=>{let n=e.selisih!==null&&e.selisih>=0,r=e.is_recorded?e.keterangan===`Surplus`?`<span style="color:#065f46;background:#d1fae5;padding:2px 8px;border-radius:99px;font-weight:bold;font-size:7pt;">Surplus</span>`:`<span style="color:#991b1b;background:#fee2e2;padding:2px 8px;border-radius:99px;font-weight:bold;font-size:7pt;">Defisit</span>`:`<span style="color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:99px;font-size:7pt;">Belum Ada Data</span>`,i=e.is_recorded&&e.selisih!==null?`<span style="font-weight:bold;color:${n?`#059669`:`#dc2626`}">${e.selisih>=0?`+`:``}${H(e.selisih)}</span>`:`-`;a+=`
                <tr>
                    <td style="text-align:center;color:#64748b;">${t+1}</td>
                    <td style="font-weight:bold;color:#0f172a;">${e.name}</td>
                    <td style="text-align:center;color:#475569;">${e.unit}</td>
                    <td style="text-align:right;">${e.is_recorded?H(e.produksi):`-`}</td>
                    <td style="text-align:right;font-weight:600;">${e.is_recorded?H(e.ketersediaan):`-`}</td>
                    <td style="text-align:right;font-weight:600;">${e.is_recorded?H(e.kebutuhan):`-`}</td>
                    <td style="text-align:right;">${i}</td>
                    <td style="text-align:center;">${r}</td>
                    <td style="color:#64748b;font-size:7pt;">${e.notes||`-`}</td>
                </tr>
            `});let o=`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Neraca_Pangan_Indramayu_${n}_${s}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 10mm 10mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0;
                    padding: 15px;
                    color: #0f172a;
                    font-size: 8pt;
                    background-color: #fff;
                }
                .no-print {
                    margin-bottom: 16px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    background: #f8fafc;
                    padding: 10px 16px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                }
                .btn {
                    background: #047857;
                    color: white;
                    border: none;
                    padding: 7px 16px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 9pt;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn-close {
                    background: #64748b;
                }
                .kop-container {
                    text-align: center;
                    margin-bottom: 12px;
                    border-bottom: 3px double #047857;
                    padding-bottom: 8px;
                }
                .kop-sub {
                    font-size: 9pt;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #334155;
                    margin: 0;
                }
                .kop-main {
                    font-size: 14pt;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    color: #047857;
                    margin: 2px 0;
                }
                .kop-address {
                    font-size: 7.5pt;
                    color: #64748b;
                    margin: 0;
                }
                .title-section {
                    text-align: center;
                    margin: 12px 0 16px 0;
                }
                .title-section h1 {
                    margin: 0;
                    font-size: 12pt;
                    font-weight: 800;
                    color: #0f172a;
                    text-transform: uppercase;
                }
                .title-section p {
                    margin: 3px 0 0 0;
                    font-size: 9pt;
                    font-weight: 600;
                    color: #047857;
                }
                .summary-cards {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .card {
                    flex: 1;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 6px 10px;
                    background: #f8fafc;
                }
                .card-title {
                    font-size: 7pt;
                    text-transform: uppercase;
                    font-weight: 700;
                    color: #64748b;
                }
                .card-value {
                    font-size: 11pt;
                    font-weight: 800;
                    margin-top: 2px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 16px;
                }
                th, td {
                    border: 1px solid #cbd5e1;
                    padding: 4.5px 6px;
                    font-size: 7.5pt;
                }
                th {
                    background-color: #047857;
                    color: white;
                    font-weight: 700;
                    text-align: center;
                    vertical-align: middle;
                }
                tbody tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                tfoot tr td {
                    font-weight: bold;
                    background-color: #f1f5f9;
                    padding: 5px 6px;
                }
                .signatures {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                    page-break-inside: avoid;
                }
                .sign-box {
                    text-align: center;
                    width: 250px;
                    font-size: 8pt;
                }
                .sign-space {
                    height: 55px;
                }
                .footer-info {
                    margin-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 6px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 7pt;
                    color: #94a3b8;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button class="btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
                <button class="btn btn-close" onclick="window.close()">Tutup</button>
                <span style="font-size: 8pt; color: #475569;">
                    Tips: Pada dialog print browser, pilih printer <strong>Save as PDF (Simpan sebagai PDF)</strong> dan orientasi <strong>Landscape</strong>.
                </span>
            </div>

            <div class="kop-container">
                <p class="kop-sub">Pemerintah Kabupaten Indramayu</p>
                <h2 class="kop-main">Dinas Ketahanan Pangan dan Pertanian</h2>
                <p class="kop-address">Jl. Pasar Baru No.445, Kel. Karangmalang, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45213 | Laman: dkpp.indramayukab.go.id</p>
            </div>

            <div class="title-section">
                <h1>Laporan Neraca Pangan Bulanan</h1>
                <p>Periode: Bulan ${n} ${s}</p>
            </div>

            <div class="summary-cards">
                <div class="card">
                    <div class="card-title">Komoditas Dipantau</div>
                    <div class="card-value" style="color:#0f172a;">${W.total_commodities} Komoditas</div>
                </div>
                <div class="card" style="background:#ecfdf5;border-color:#a7f3d0;">
                    <div class="card-title" style="color:#065f46;">Komoditas Surplus</div>
                    <div class="card-value" style="color:#059669;">${W.surplus_count} Komoditas</div>
                </div>
                <div class="card" style="background:#fff1f2;border-color:#fecdd3;">
                    <div class="card-title" style="color:#9f1239;">Komoditas Defisit</div>
                    <div class="card-value" style="color:#e11d48;">${W.defisit_count} Komoditas</div>
                </div>
                <div class="card">
                    <div class="card-title">Total Neraca Pangan</div>
                    <div class="card-value" style="color:${W.total_selisih>=0?`#059669`:`#dc2626`};">
                        ${W.total_selisih>=0?`+`:``}${H(W.total_selisih)} Ton
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 30px;">No</th>
                        <th>Nama Komoditas</th>
                        <th style="width: 60px;">Satuan</th>
                        <th style="width: 90px; text-align: right;">Produksi</th>
                        <th style="width: 100px; text-align: right;">Ketersediaan</th>
                        <th style="width: 100px; text-align: right;">Kebutuhan</th>
                        <th style="width: 100px; text-align: right;">Selisih</th>
                        <th style="width: 85px; text-align: center;">Status</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody>
                    ${a}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: center;">TOTAL KUMULATIF</td>
                        <td style="text-align: right;">${H(W.total_produksi)}</td>
                        <td style="text-align: right;">${H(W.total_ketersediaan)}</td>
                        <td style="text-align: right;">${H(W.total_kebutuhan)}</td>
                        <td style="text-align: right; color: ${W.total_selisih>=0?`#059669`:`#dc2626`};">
                            ${W.total_selisih>=0?`+`:``}${H(W.total_selisih)}
                        </td>
                        <td style="text-align: center;">
                            ${W.total_selisih>=0?`Surplus`:`Defisit`}
                        </td>
                        <td>-</td>
                    </tr>
                </tfoot>
            </table>

            <div class="signatures">
                <div class="sign-box">
                    <div>Indramayu, ${r}</div>
                    <div style="font-weight: 600; margin-top: 4px;">Kepala Dinas Ketahanan Pangan dan Pertanian<br/>Kabupaten Indramayu</div>
                    <div class="sign-space"></div>
                    <div style="font-weight: bold; text-decoration: underline;">( .................................................... )</div>
                    <div style="color: #64748b; font-size: 7pt; margin-top: 2px;">NIP. ....................................................</div>
                </div>
            </div>

            <div class="footer-info">
                <span>Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu &copy; ${new Date().getFullYear()}</span>
                <span>Dicetak dari Sistem Informasi DKPP pada: ${new Date().toLocaleString(`id-ID`)}</span>
            </div>
        </body>
        </html>
        `;t.document.open(),t.document.write(o),t.document.close(),setTimeout(()=>{t.print()},400)},he=e=>{let t=document.getElementById(e);t&&t.scrollIntoView({behavior:`smooth`,block:`start`})},Y=(0,R.useMemo)(()=>e.filter(e=>e.is_recorded&&e.selisih!==null&&e.selisih<0),[e]);(0,R.useMemo)(()=>e.filter(e=>e.is_recorded&&e.selisih!==null&&e.selisih>=0),[e]);let X=(0,R.useMemo)(()=>e.filter(e=>{let t=G===``||e.name.toLowerCase().includes(G.toLowerCase()),n=K===`all`||K===`surplus`&&e.keterangan===`Surplus`||K===`defisit`&&e.keterangan===`Defisit`;return t&&n}),[e,G,K]),ge=(0,R.useMemo)(()=>e.filter(e=>e.is_recorded).map(e=>({name:e.name,Ketersediaan:e.ketersediaan||0,Kebutuhan:e.kebutuhan||0,Selisih:e.selisih||0})),[e]),Z=(0,R.useMemo)(()=>{if(q===`all`)return{id:0,name:`Semua Komoditas (Kumulatif)`,unit:`Ton`};let t=e.find(e=>e.id===Number(q));return{id:t?.id??0,name:t?.name??`Komoditas`,unit:t?.unit??`Ton`}},[q,e]),Q=(0,R.useMemo)(()=>L?q===`all`?L.all||[]:L.by_commodity?.[Number(q)]||[]:[],[L,q]),$=(0,R.useMemo)(()=>{let e=Q.filter(e=>e.has_data),t=e.reduce((e,t)=>e+t.ketersediaan,0),n=e.reduce((e,t)=>e+t.kebutuhan,0);return{totalKet:t,totalKbt:n,totalDiff:t-n,avgKet:e.length>0?t/e.length:0,avgKbt:e.length>0?n/e.length:0,surplusMonthsCount:e.filter(e=>e.selisih>=0).length,defisitMonthsCount:e.filter(e=>e.selisih<0).length,recordedMonthsCount:e.length}},[Q]);return(0,z.jsxs)(`div`,{className:`min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white dark:bg-slate-950 dark:text-slate-100`,children:[(0,z.jsx)(l,{title:`Neraca Pangan Bulanan (${V(u)} ${s}) - DKPP Indramayu`}),(0,z.jsx)(m,{activePage:`neraca-pangan`}),(0,z.jsxs)(`main`,{className:`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6`,children:[(0,z.jsxs)(`div`,{className:`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-emerald-950/25 border border-white/10`,children:[(0,z.jsx)(`div`,{className:`pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl`}),(0,z.jsx)(`div`,{className:`pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl`}),(0,z.jsx)(`div`,{className:`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-500/10 blur-2xl`}),(0,z.jsxs)(`div`,{className:`relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center`,children:[(0,z.jsxs)(`div`,{className:`lg:col-span-7 xl:col-span-7 space-y-4`,children:[(0,z.jsxs)(`div`,{className:`inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md shadow-inner`,children:[(0,z.jsxs)(`span`,{className:`relative flex h-2 w-2`,children:[(0,z.jsx)(`span`,{className:`absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75`}),(0,z.jsx)(`span`,{className:`relative inline-flex h-2 w-2 rounded-full bg-emerald-400`})]}),(0,z.jsx)(`span`,{children:`SATU DATA KETAHANAN PANGAN KABUPATEN INDRAMAYU`})]}),(0,z.jsxs)(`h1`,{className:`text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-tight sm:leading-tight`,children:[`Neraca Pangan Strategis`,` `,(0,z.jsx)(`span`,{className:`bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 bg-clip-text text-transparent`,children:`Kabupaten Indramayu`})]}),(0,z.jsx)(`p`,{className:`text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed max-w-2xl`,children:`Pantau ketersediaan pasokan, estimasi kebutuhan pangan masyarakat, dan deteksi dini status surplus/defisit pangan pokok secara akurat dan transparan setiap periode bulanan.`}),(0,z.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3 pt-2`,children:[(0,z.jsxs)(`button`,{type:`button`,onClick:()=>he(`tabel-neraca`),className:`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] cursor-pointer`,children:[(0,z.jsx)(O,{className:`size-4`}),(0,z.jsx)(`span`,{children:`Lihat Tabel Neraca`}),(0,z.jsx)(f,{className:`size-3.5 opacity-80`})]}),(0,z.jsxs)(`button`,{type:`button`,onClick:()=>he(`grafik-tren-tahunan`),className:`inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer`,children:[(0,z.jsx)(A,{className:`size-4 text-emerald-300`}),(0,z.jsx)(`span`,{children:`Grafik Tren Bulanan (Jan - Des)`})]})]}),(0,z.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs text-emerald-100/80`,children:[(0,z.jsxs)(`div`,{className:`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs`,children:[(0,z.jsx)(te,{className:`size-3.5 text-emerald-300`}),(0,z.jsx)(`span`,{children:`11 Komoditas Utama`})]}),(0,z.jsxs)(`div`,{className:`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs`,children:[(0,z.jsx)(g,{className:`size-3.5 text-cyan-300`}),(0,z.jsx)(`span`,{children:`Analisis Real-Time`})]}),(0,z.jsxs)(`div`,{className:`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs`,children:[(0,z.jsx)(j,{className:`size-3.5 text-teal-300`}),(0,z.jsx)(`span`,{children:`Ekspor PDF & Excel Resmi`})]})]})]}),(0,z.jsx)(`div`,{className:`lg:col-span-5 xl:col-span-5`,children:(0,z.jsxs)(`div`,{className:`rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 space-y-4`,children:[(0,z.jsxs)(`div`,{className:`flex items-center justify-between border-b border-white/15 pb-3`,children:[(0,z.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,z.jsx)(h,{className:`size-4 text-emerald-300`}),(0,z.jsx)(`span`,{className:`text-xs font-bold text-white uppercase tracking-wider`,children:`Panel Periode Pantau`})]}),W.total_selisih>=0?(0,z.jsxs)(`span`,{className:`inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200`,children:[(0,z.jsx)(C,{className:`size-3 text-emerald-300`}),(0,z.jsx)(`span`,{children:`Surplus Aman`})]}):(0,z.jsxs)(`span`,{className:`inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/25 px-2.5 py-0.5 text-[11px] font-bold text-rose-200`,children:[(0,z.jsx)(S,{className:`size-3 text-rose-300`}),(0,z.jsx)(`span`,{children:`Defisit Waspada`})]})]}),(0,z.jsxs)(`div`,{className:`space-y-2`,children:[(0,z.jsx)(`label`,{className:`text-[11px] font-medium text-emerald-100/75`,children:`Pilih Periode Neraca:`}),(0,z.jsxs)(`div`,{className:`grid grid-cols-2 gap-2`,children:[(0,z.jsxs)(x,{value:String(u),onValueChange:e=>fe(s,parseInt(e,10)),children:[(0,z.jsx)(b,{className:`w-full h-9 text-xs bg-white text-slate-900 border-none font-semibold shadow-sm`,children:(0,z.jsx)(_,{})}),(0,z.jsx)(y,{children:B.map(e=>(0,z.jsx)(v,{value:String(e.value),children:e.label},e.value))})]}),(0,z.jsxs)(x,{value:String(s),onValueChange:e=>fe(parseInt(e,10),u),children:[(0,z.jsx)(b,{className:`w-full h-9 text-xs bg-white text-slate-900 border-none font-semibold shadow-sm`,children:(0,z.jsx)(_,{})}),(0,z.jsx)(y,{children:d.map(e=>(0,z.jsx)(v,{value:String(e),children:e},e))})]})]})]}),(0,z.jsxs)(`div`,{className:`grid grid-cols-3 gap-2 text-center pt-1`,children:[(0,z.jsxs)(`div`,{className:`rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs`,children:[(0,z.jsx)(`div`,{className:`text-[10px] font-bold text-emerald-200/80 uppercase`,children:`Surplus`}),(0,z.jsx)(`div`,{className:`text-lg font-black text-emerald-300 mt-0.5`,children:W.surplus_count}),(0,z.jsx)(`div`,{className:`text-[10px] text-emerald-100/60`,children:`komoditas`})]}),(0,z.jsxs)(`div`,{className:`rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs`,children:[(0,z.jsx)(`div`,{className:`text-[10px] font-bold text-rose-200/80 uppercase`,children:`Defisit`}),(0,z.jsx)(`div`,{className:`text-lg font-black text-rose-300 mt-0.5`,children:W.defisit_count}),(0,z.jsx)(`div`,{className:`text-[10px] text-emerald-100/60`,children:`komoditas`})]}),(0,z.jsxs)(`div`,{className:`rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs`,children:[(0,z.jsx)(`div`,{className:`text-[10px] font-bold text-teal-200/80 uppercase`,children:`Net Neraca`}),(0,z.jsxs)(`div`,{className:`text-sm font-black mt-1 font-mono truncate ${W.total_selisih>=0?`text-emerald-300`:`text-rose-300`}`,children:[W.total_selisih>=0?`+`:``,U(W.total_selisih),` Ton`]}),(0,z.jsx)(`div`,{className:`text-[10px] text-emerald-100/60`,children:`kumulatif`})]})]}),(0,z.jsx)(`div`,{className:`rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed`,children:Y.length>0?(0,z.jsxs)(`div`,{className:`flex items-start gap-2 text-rose-200`,children:[(0,z.jsx)(D,{className:`size-4 shrink-0 text-rose-300 mt-0.5`}),(0,z.jsxs)(`div`,{children:[(0,z.jsx)(`strong`,{className:`text-rose-100`,children:`Perhatian Defisit:`}),` `,`Terdapat `,Y.length,` komoditas dengan kebutuhan melebihi ketersediaan (`,Y.map(e=>e.name).slice(0,3).join(`, `),Y.length>3?`...`:``,`).`]})]}):(0,z.jsxs)(`div`,{className:`flex items-start gap-2 text-emerald-200`,children:[(0,z.jsx)(C,{className:`size-4 shrink-0 text-emerald-300 mt-0.5`}),(0,z.jsxs)(`div`,{children:[(0,z.jsx)(`strong`,{className:`text-emerald-100`,children:`Pasokan Aman:`}),` `,`Seluruh komoditas pangan pokok Kabupaten Indramayu berada dalam status surplus pada periode ini.`]})]})})]})})]})]}),(0,z.jsxs)(`div`,{className:`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4`,children:[(0,z.jsxs)(F,{className:`border-slate-200/80 shadow-sm dark:border-slate-800`,children:[(0,z.jsx)(N,{className:`pb-2`,children:(0,z.jsx)(M,{className:`text-xs font-semibold uppercase tracking-wider text-slate-500`,children:`Komoditas Dipantau`})}),(0,z.jsxs)(P,{children:[(0,z.jsxs)(`div`,{className:`text-2xl font-bold text-slate-900 dark:text-slate-100`,children:[W.total_commodities,` Komoditas`]}),(0,z.jsxs)(`p`,{className:`text-xs text-slate-500 mt-1`,children:[W.recorded_count,` komoditas memiliki data tercatat`]})]})]}),(0,z.jsxs)(F,{className:`border-emerald-200 bg-emerald-50/40 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20`,children:[(0,z.jsx)(N,{className:`pb-2`,children:(0,z.jsx)(M,{className:`text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400`,children:`Komoditas Surplus`})}),(0,z.jsxs)(P,{children:[(0,z.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,z.jsx)(A,{className:`size-5 text-emerald-600`}),(0,z.jsxs)(`div`,{className:`text-2xl font-bold text-emerald-700 dark:text-emerald-300`,children:[W.surplus_count,` Komoditas`]})]}),(0,z.jsx)(`p`,{className:`text-xs text-emerald-600/80 mt-1`,children:`Pasokan ketersediaan melebihi kebutuhan`})]})]}),(0,z.jsxs)(F,{className:`border-rose-200 bg-rose-50/40 shadow-sm dark:border-rose-900 dark:bg-rose-950/20`,children:[(0,z.jsx)(N,{className:`pb-2`,children:(0,z.jsx)(M,{className:`text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400`,children:`Komoditas Defisit`})}),(0,z.jsxs)(P,{children:[(0,z.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,z.jsx)(E,{className:`size-5 text-rose-600`}),(0,z.jsxs)(`div`,{className:`text-2xl font-bold text-rose-700 dark:text-rose-300`,children:[W.defisit_count,` Komoditas`]})]}),(0,z.jsx)(`p`,{className:`text-xs text-rose-600/80 mt-1`,children:`Perlu intervensi / pasokan tambahan dari luar`})]})]}),(0,z.jsxs)(F,{className:`border-slate-200/80 shadow-sm dark:border-slate-800`,children:[(0,z.jsx)(N,{className:`pb-2`,children:(0,z.jsx)(M,{className:`text-xs font-semibold uppercase tracking-wider text-slate-500`,children:`Total Neraca Pangan`})}),(0,z.jsxs)(P,{children:[(0,z.jsxs)(`div`,{className:`text-2xl font-bold ${W.total_selisih<0?`text-rose-600 dark:text-rose-400`:`text-emerald-600 dark:text-emerald-400`}`,children:[W.total_selisih>=0?`+`:``,H(W.total_selisih),` Ton`]}),(0,z.jsx)(`p`,{className:`text-xs text-slate-500 mt-1`,children:`Selisih kumulatif seluruh komoditas`})]})]})]}),ge.length>0&&(0,z.jsxs)(F,{className:`border-slate-200/80 shadow-sm dark:border-slate-800`,children:[(0,z.jsx)(N,{className:`pb-2`,children:(0,z.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,z.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,z.jsx)(g,{className:`size-4 text-emerald-600`}),(0,z.jsxs)(M,{className:`text-sm font-bold text-slate-800 dark:text-slate-100`,children:[`Grafik Perbandingan Ketersediaan vs Kebutuhan (`,V(u),` `,s,`)`]})]}),(0,z.jsx)(`span`,{className:`text-xs text-slate-400`,children:`Satuan: Ton`})]})}),(0,z.jsx)(P,{className:`pt-4`,children:(0,z.jsx)(`div`,{className:`h-80 w-full`,children:(0,z.jsx)(a,{width:`100%`,height:`100%`,children:(0,z.jsxs)(oe,{data:ge,margin:{top:10,right:20,left:10,bottom:40},children:[(0,z.jsx)(t,{strokeDasharray:`3 3`,vertical:!1,opacity:.3}),(0,z.jsx)(o,{dataKey:`name`,angle:-30,textAnchor:`end`,interval:0,height:50,tick:{fontSize:11}}),(0,z.jsx)(i,{tickFormatter:e=>e>=1e3?`${(e/1e3).toFixed(0)}k`:e,tick:{fontSize:11}}),(0,z.jsx)(r,{formatter:e=>[H(Number(e))+` Ton`]}),(0,z.jsx)(ie,{verticalAlign:`top`,height:36}),(0,z.jsx)(n,{dataKey:`Ketersediaan`,fill:`#059669`,radius:[4,4,0,0]}),(0,z.jsx)(n,{dataKey:`Kebutuhan`,fill:`#3b82f6`,radius:[4,4,0,0]})]})})})})]}),(0,z.jsxs)(`div`,{className:`flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900`,children:[(0,z.jsxs)(`div`,{className:`relative flex-1 max-w-sm`,children:[(0,z.jsx)(T,{className:`absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400`}),(0,z.jsx)(ee,{type:`text`,placeholder:`Cari komoditas...`,value:G,onChange:e=>ce(e.target.value),className:`pl-9 h-9 border-slate-200 dark:border-slate-700`})]}),(0,z.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2.5`,children:[(0,z.jsxs)(x,{value:K,onValueChange:le,children:[(0,z.jsx)(b,{className:`w-36 h-9 border-slate-200 dark:border-slate-700`,children:(0,z.jsx)(_,{placeholder:`Status`})}),(0,z.jsxs)(y,{children:[(0,z.jsx)(v,{value:`all`,children:`Semua Status`}),(0,z.jsx)(v,{value:`surplus`,children:`Surplus`}),(0,z.jsx)(v,{value:`defisit`,children:`Defisit`})]})]}),(0,z.jsx)(`div`,{className:`h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block`}),(0,z.jsxs)(k,{variant:`outline`,size:`sm`,onClick:pe,className:`h-9 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/80 font-medium text-xs shadow-sm`,title:`Download data neraca pangan format Microsoft Excel (.xlsx)`,children:[(0,z.jsx)(j,{className:`size-4 text-emerald-600 dark:text-emerald-400`}),(0,z.jsx)(`span`,{children:`Download Excel`})]}),(0,z.jsxs)(k,{variant:`outline`,size:`sm`,onClick:me,className:`h-9 gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/80 font-medium text-xs shadow-sm`,title:`Download atau cetak dokumen laporan neraca pangan resmi sebagai PDF`,children:[(0,z.jsx)(w,{className:`size-4 text-rose-600 dark:text-rose-400`}),(0,z.jsx)(`span`,{children:`Download PDF`})]})]})]}),(0,z.jsxs)(F,{id:`tabel-neraca`,className:`border-slate-200/80 shadow-sm overflow-hidden dark:border-slate-800 scroll-mt-20`,children:[(0,z.jsx)(N,{className:`border-b border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60`,children:(0,z.jsxs)(`div`,{className:`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`,children:[(0,z.jsxs)(`div`,{children:[(0,z.jsxs)(M,{className:`text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2`,children:[(0,z.jsx)(O,{className:`size-4 text-emerald-600`}),`Tabel Neraca Pangan Bulanan (`,V(u),` `,s,`)`]}),(0,z.jsx)(`p`,{className:`text-xs text-slate-500 mt-0.5`,children:`Informasi produksi, ketersediaan, kebutuhan, dan posisi neraca pangan komoditas strategis`})]}),(0,z.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,z.jsxs)(k,{variant:`outline`,size:`sm`,onClick:pe,className:`h-8 gap-1.5 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-950 text-xs font-semibold`,children:[(0,z.jsx)(j,{className:`size-3.5 text-emerald-600 dark:text-emerald-400`}),(0,z.jsx)(`span`,{children:`Download Excel`})]}),(0,z.jsxs)(k,{variant:`outline`,size:`sm`,onClick:me,className:`h-8 gap-1.5 border-rose-300 bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950 text-xs font-semibold`,children:[(0,z.jsx)(w,{className:`size-3.5 text-rose-600 dark:text-rose-400`}),(0,z.jsx)(`span`,{children:`Download PDF`})]})]})]})}),(0,z.jsx)(`div`,{className:`overflow-x-auto`,children:(0,z.jsxs)(`table`,{className:`w-full text-left text-sm text-slate-700 dark:text-slate-300`,children:[(0,z.jsx)(`thead`,{className:`bg-slate-50 border-b border-slate-200/80 text-xs uppercase text-slate-500 font-semibold dark:bg-slate-800/50 dark:border-slate-700`,children:(0,z.jsxs)(`tr`,{children:[(0,z.jsx)(`th`,{className:`py-3.5 px-4 w-12 text-center`,children:`No`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4`,children:`Nama Komoditas`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4 w-24 text-center`,children:`Satuan`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4 text-right`,children:`Produksi`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4 text-right`,children:`Ketersediaan`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4 text-right`,children:`Kebutuhan`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4 text-right`,children:`Selisih`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4 w-32 text-center`,children:`Status Neraca`}),(0,z.jsx)(`th`,{className:`py-3.5 px-4`,children:`Catatan`})]})}),(0,z.jsx)(`tbody`,{className:`divide-y divide-slate-100 dark:divide-slate-800`,children:X.length===0?(0,z.jsx)(`tr`,{children:(0,z.jsx)(`td`,{colSpan:9,className:`py-8 text-center text-slate-400`,children:`Tidak ada data komoditas ditemukan.`})}):X.map((e,t)=>(0,z.jsxs)(`tr`,{className:`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors`,children:[(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-center text-slate-400 font-mono text-xs`,children:t+1}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100`,children:e.name}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-center`,children:(0,z.jsx)(ne,{variant:`secondary`,className:`bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`,children:e.unit})}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300`,children:e.is_recorded?H(e.produksi):`-`}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-right font-mono text-xs font-medium text-slate-800 dark:text-slate-200`,children:e.is_recorded?H(e.ketersediaan):`-`}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-right font-mono text-xs font-medium text-slate-800 dark:text-slate-200`,children:e.is_recorded?H(e.kebutuhan):`-`}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-right font-mono text-xs font-semibold`,children:e.is_recorded?(0,z.jsxs)(`span`,{className:e.selisih!==null&&e.selisih<0?`text-rose-600 dark:text-rose-400`:`text-emerald-600 dark:text-emerald-400`,children:[e.selisih!==null&&e.selisih>=0?`+`:``,H(e.selisih)]}):`-`}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-center`,children:e.is_recorded?e.keterangan===`Surplus`?(0,z.jsxs)(`span`,{className:`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`,children:[(0,z.jsx)(C,{className:`size-3`}),`Surplus`]}):(0,z.jsxs)(`span`,{className:`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300`,children:[(0,z.jsx)(S,{className:`size-3`}),`Defisit`]}):(0,z.jsx)(`span`,{className:`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500`,children:`Belum Ada Data`})}),(0,z.jsx)(`td`,{className:`py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate`,children:e.notes||`-`})]},e.id))}),(0,z.jsx)(`tfoot`,{className:`bg-slate-50 border-t border-slate-200/90 font-semibold text-xs text-slate-800 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200`,children:(0,z.jsxs)(`tr`,{children:[(0,z.jsx)(`td`,{colSpan:3,className:`py-3 px-4 text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400`,children:`Total Kumulatif`}),(0,z.jsx)(`td`,{className:`py-3 px-4 text-right font-mono`,children:H(W.total_produksi)}),(0,z.jsx)(`td`,{className:`py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100`,children:H(W.total_ketersediaan)}),(0,z.jsx)(`td`,{className:`py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100`,children:H(W.total_kebutuhan)}),(0,z.jsx)(`td`,{className:`py-3 px-4 text-right font-mono font-bold`,children:(0,z.jsxs)(`span`,{className:W.total_selisih<0?`text-rose-600 dark:text-rose-400`:`text-emerald-600 dark:text-emerald-400`,children:[W.total_selisih>=0?`+`:``,H(W.total_selisih)]})}),(0,z.jsx)(`td`,{className:`py-3 px-4 text-center`,children:(0,z.jsx)(`span`,{className:`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${W.total_selisih<0?`bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300`:`bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`}`,children:W.total_selisih>=0?`Surplus`:`Defisit`})}),(0,z.jsx)(`td`,{className:`py-3 px-4 text-xs text-slate-400`,children:`-`})]})})]})})]}),(0,z.jsxs)(F,{id:`grafik-tren-tahunan`,className:`border-slate-200/80 shadow-sm dark:border-slate-800 scroll-mt-20`,children:[(0,z.jsx)(N,{className:`border-b border-slate-100 pb-4 dark:border-slate-800`,children:(0,z.jsxs)(`div`,{className:`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`,children:[(0,z.jsx)(`div`,{className:`space-y-1`,children:(0,z.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,z.jsx)(`div`,{className:`flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`,children:(0,z.jsx)(A,{className:`size-4`})}),(0,z.jsxs)(`div`,{children:[(0,z.jsxs)(M,{className:`text-base font-bold text-slate-800 dark:text-slate-100`,children:[`Grafik Ketersediaan, Kebutuhan & Garis Neraca (`,s,`)`]}),(0,z.jsx)(`p`,{className:`text-xs text-slate-500`,children:`Tren bulanan ketersediaan, kebutuhan, dan posisi surplus/defisit dari Januari sampai Desember`})]})]})}),(0,z.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2.5`,children:[(0,z.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,z.jsx)(`span`,{className:`text-xs font-medium text-slate-500`,children:`Komoditas:`}),(0,z.jsxs)(x,{value:q,onValueChange:ue,children:[(0,z.jsx)(b,{className:`w-56 h-8 text-xs border-slate-200 dark:border-slate-700`,children:(0,z.jsx)(_,{})}),(0,z.jsxs)(y,{children:[(0,z.jsx)(v,{value:`all`,children:`Semua Komoditas (Kumulatif)`}),e.map(e=>(0,z.jsxs)(v,{value:String(e.id),children:[e.name,` (`,e.unit,`)`]},e.id))]})]})]}),(0,z.jsxs)(`div`,{className:`flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800/80`,children:[(0,z.jsx)(`button`,{type:`button`,onClick:()=>de(`dual`),className:`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${J===`dual`?`bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100`:`text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200`}`,title:`Skala ganda: Volume bar di sumbu kiri, Garis Neraca di sumbu kanan`,children:`Skala Ganda`}),(0,z.jsx)(`button`,{type:`button`,onClick:()=>de(`single`),className:`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${J===`single`?`bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100`:`text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200`}`,title:`Skala tunggal: Semua metrik dalam satu sumbu nilai`,children:`Skala Tunggal`})]})]})]})}),(0,z.jsx)(P,{className:`pt-6`,children:Q.length===0||!Q.some(e=>e.has_data)?(0,z.jsxs)(`div`,{className:`flex flex-col items-center justify-center py-12 text-center text-slate-400`,children:[(0,z.jsx)(S,{className:`size-8 text-slate-300 mb-2`}),(0,z.jsxs)(`p`,{className:`text-sm font-medium text-slate-600 dark:text-slate-400`,children:[`Belum ada data neraca pangan tercatat untuk tahun `,s,`.`]}),(0,z.jsx)(`p`,{className:`text-xs text-slate-400 mt-1`,children:`Data akan otomatis muncul di grafik setelah data bulanan disimpan di sistem.`})]}):(0,z.jsxs)(`div`,{className:`space-y-6`,children:[(0,z.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3 text-xs`,children:[(0,z.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,z.jsxs)(`div`,{className:`flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300`,children:[(0,z.jsx)(`span`,{className:`size-3 rounded-sm bg-emerald-600`}),(0,z.jsx)(`span`,{children:`Batang Hijau: Ketersediaan`})]}),(0,z.jsxs)(`div`,{className:`flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300`,children:[(0,z.jsx)(`span`,{className:`size-3 rounded-sm bg-blue-500`}),(0,z.jsx)(`span`,{children:`Batang Biru: Kebutuhan`})]}),(0,z.jsxs)(`div`,{className:`flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300`,children:[(0,z.jsx)(`span`,{className:`h-0.5 w-4 bg-amber-500 rounded-full`}),(0,z.jsx)(`span`,{children:`Garis Oranye: Neraca (Surplus/Defisit)`})]})]}),(0,z.jsxs)(`div`,{className:`text-xs text-slate-400 font-medium`,children:[`Satuan: `,(0,z.jsx)(`span`,{className:`font-semibold text-slate-600 dark:text-slate-300`,children:Z.unit})]})]}),(0,z.jsx)(`div`,{className:`h-80 sm:h-96 w-full`,children:(0,z.jsx)(a,{width:`100%`,height:`100%`,children:(0,z.jsxs)(ae,{data:Q,margin:{top:15,right:J===`dual`?25:15,left:10,bottom:10},children:[(0,z.jsx)(t,{strokeDasharray:`3 3`,vertical:!1,opacity:.25}),(0,z.jsx)(o,{dataKey:`month_short`,tick:{fontSize:12,fill:`#64748b`},axisLine:{stroke:`#cbd5e1`},tickLine:!1}),(0,z.jsx)(i,{yAxisId:`left`,orientation:`left`,tickFormatter:e=>U(Number(e)),tick:{fontSize:11,fill:`#64748b`},axisLine:!1,tickLine:!1}),J===`dual`&&(0,z.jsx)(i,{yAxisId:`right`,orientation:`right`,tickFormatter:e=>e>0?`+${U(Number(e))}`:U(Number(e)),tick:{fontSize:11,fill:`#d97706`},axisLine:!1,tickLine:!1}),J===`dual`?(0,z.jsx)(I,{yAxisId:`right`,y:0,stroke:`#94a3b8`,strokeDasharray:`3 3`}):(0,z.jsx)(I,{yAxisId:`left`,y:0,stroke:`#94a3b8`,strokeDasharray:`3 3`}),(0,z.jsx)(r,{content:(0,z.jsx)(se,{year:s,unit:Z.unit})}),(0,z.jsx)(ie,{verticalAlign:`top`,height:36,iconType:`circle`,wrapperStyle:{fontSize:`12px`,paddingBottom:`8px`}}),(0,z.jsx)(n,{yAxisId:`left`,dataKey:`ketersediaan`,name:`Ketersediaan`,fill:`#059669`,radius:[4,4,0,0],maxBarSize:36}),(0,z.jsx)(n,{yAxisId:`left`,dataKey:`kebutuhan`,name:`Kebutuhan`,fill:`#3b82f6`,radius:[4,4,0,0],maxBarSize:36}),(0,z.jsx)(re,{yAxisId:J===`dual`?`right`:`left`,type:`monotone`,dataKey:`selisih`,name:`Garis Neraca (Surplus/Defisit)`,stroke:`#f59e0b`,strokeWidth:3,dot:{r:4,fill:`#f59e0b`,strokeWidth:2,stroke:`#ffffff`},activeDot:{r:6,fill:`#d97706`,strokeWidth:2,stroke:`#ffffff`}})]})})}),(0,z.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-slate-100 dark:border-slate-800`,children:[(0,z.jsxs)(`div`,{className:`rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60`,children:[(0,z.jsx)(`span`,{className:`text-[11px] font-medium text-slate-500 uppercase tracking-wider`,children:`Total Ketersediaan`}),(0,z.jsxs)(`div`,{className:`text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono`,children:[H($.totalKet),` `,Z.unit]}),(0,z.jsxs)(`span`,{className:`text-[11px] text-slate-400`,children:[`Rata-rata: `,H($.avgKet),` / bln`]})]}),(0,z.jsxs)(`div`,{className:`rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60`,children:[(0,z.jsx)(`span`,{className:`text-[11px] font-medium text-slate-500 uppercase tracking-wider`,children:`Total Kebutuhan`}),(0,z.jsxs)(`div`,{className:`text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono`,children:[H($.totalKbt),` `,Z.unit]}),(0,z.jsxs)(`span`,{className:`text-[11px] text-slate-400`,children:[`Rata-rata: `,H($.avgKbt),` / bln`]})]}),(0,z.jsxs)(`div`,{className:`rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60`,children:[(0,z.jsx)(`span`,{className:`text-[11px] font-medium text-slate-500 uppercase tracking-wider`,children:`Akumulasi Garis Neraca`}),(0,z.jsxs)(`div`,{className:`text-base font-bold mt-1 font-mono ${$.totalDiff>=0?`text-emerald-600 dark:text-emerald-400`:`text-rose-600 dark:text-rose-400`}`,children:[$.totalDiff>=0?`+`:``,H($.totalDiff),` `,Z.unit]}),(0,z.jsx)(`span`,{className:`text-[11px] text-slate-400`,children:`Kumulatif Jan - Des`})]}),(0,z.jsxs)(`div`,{className:`rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60`,children:[(0,z.jsx)(`span`,{className:`text-[11px] font-medium text-slate-500 uppercase tracking-wider`,children:`Status Periode Bulanan`}),(0,z.jsxs)(`div`,{className:`flex items-center gap-2 mt-1`,children:[(0,z.jsxs)(`span`,{className:`inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400`,children:[(0,z.jsx)(A,{className:`size-3.5`}),$.surplusMonthsCount,` Surplus`]}),(0,z.jsx)(`span`,{className:`text-slate-300`,children:`/`}),(0,z.jsxs)(`span`,{className:`inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400`,children:[(0,z.jsx)(E,{className:`size-3.5`}),$.defisitMonthsCount,` Defisit`]})]}),(0,z.jsxs)(`span`,{className:`text-[11px] text-slate-400`,children:[`Dari `,$.recordedMonthsCount,` bulan tercatat`]})]})]})]})})]}),(0,z.jsxs)(`div`,{className:`rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600 space-y-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400`,children:[(0,z.jsxs)(`div`,{className:`font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5`,children:[(0,z.jsx)(O,{className:`size-4 text-emerald-600`}),`Tentang Neraca Pangan Bulanan Kabupaten Indramayu`]}),(0,z.jsxs)(`p`,{className:`leading-relaxed`,children:[`Neraca Pangan merupakan instrumen analisis untuk mengetahui gambaran ketersediaan, kebutuhan, dan cadangan pangan suatu wilayah dalam periode bulanan. Selisih positif menandakan `,(0,z.jsx)(`strong`,{children:`Surplus`}),` pangan, sedangkan selisih negatif menandakan `,(0,z.jsx)(`strong`,{children:`Defisit`}),` yang memerlukan langkah antisipatif seperti pasokan antar daerah atau operasi pasar.`]})]})]}),(0,z.jsx)(p,{})]})}export{W as default};