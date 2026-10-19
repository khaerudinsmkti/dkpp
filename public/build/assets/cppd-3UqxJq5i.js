import{r as e}from"./rolldown-runtime-hePW80VL.js";import{i as t,m as n,o as ee,p as r,r as i}from"./wayfinder-7wgaPZBE.js";import{t as a}from"./createLucideIcon-D4dEr_8L.js";import{a as te,i as ne,n as o,r as re,t as ie}from"./cppd-map-BJOvW5Zb.js";import{n as ae,t as oe}from"./portal-navbar-Cp5fb8N2.js";import{t as se}from"./arrow-up-right-DrVGOIOn.js";import{t as ce}from"./calendar-C7UW5oz5.js";import{c as le,i as ue,n as de,s as fe,t as pe}from"./select-CjENQVzz.js";import{t as me}from"./clock-uVz2PVtb.js";import{t as he}from"./file-text-piHLWOfC.js";import{t as ge}from"./filter-Crkh8EQd.js";import{t as _e}from"./search-BBWCeCTq.js";import{Bt as ve,Dt as ye,Lt as be,Nt as xe,Ot as Se,Ut as Ce,Vt as we,zt as Te}from"./app-BCBgOlON.js";import{t as s}from"./badge-DW5H1JLc.js";import{a as Ee,i as De,n as Oe,t as ke}from"./card-CqNlQLCS.js";var Ae=a(`Building2`,[[`path`,{d:`M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z`,key:`1b4qmf`}],[`path`,{d:`M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2`,key:`i71pzd`}],[`path`,{d:`M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2`,key:`10jefs`}],[`path`,{d:`M10 6h4`,key:`1itunk`}],[`path`,{d:`M10 10h4`,key:`tcdvrf`}],[`path`,{d:`M10 14h4`,key:`kelpxr`}],[`path`,{d:`M10 18h4`,key:`1ulq68`}]]),je=a(`ListFilter`,[[`path`,{d:`M3 6h18`,key:`d0wm0j`}],[`path`,{d:`M7 12h10`,key:`b7w52i`}],[`path`,{d:`M10 18h4`,key:`1ulq68`}]]),Me=a(`Map`,[[`path`,{d:`M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z`,key:`169xi5`}],[`path`,{d:`M15 5.764v15`,key:`1pn4in`}],[`path`,{d:`M9 3.236v15`,key:`1uimfh`}]]),Ne=t(),Pe=e(r(),1),c=i();function l(e){let t=(0,Ne.c)(218),{selectedYear:n,availableYears:r,summary:i,recipientVillages:a,recentTransactions:l,territory:He}=e,[u,Ue]=(0,Pe.useState)(`map`),[d,We]=(0,Pe.useState)(``),[f,Ge]=(0,Pe.useState)(`all`),[p,Ke]=(0,Pe.useState)(null),qe=Ve,Je;if(t[0]!==a||t[1]!==d||t[2]!==f){let e;t[4]!==d||t[5]!==f?(e=e=>{let t=f===`all`||e.kecamatan.toUpperCase()===f.toUpperCase(),n=d.toLowerCase().trim(),ee=n===``||e.desa.toLowerCase().includes(n)||e.kecamatan.toLowerCase().includes(n)||e.keterangan_list&&e.keterangan_list.some(e=>e.keterangan.toLowerCase().includes(n));return t&&ee},t[4]=d,t[5]=f,t[6]=e):e=t[6],Je=a.filter(e),t[0]=a,t[1]=d,t[2]=f,t[3]=Je}else Je=t[3];let m=Je,Ye;t[7]===m?Ye=t[8]:(Ye=m.reduce(Be,0),t[7]=m,t[8]=Ye);let Xe=Ye,Ze;bb0:{if(!p){Ze=null;break bb0}let e;t[9]!==a||t[10]!==p?(e=a.find(e=>e.key===p)||null,t[9]=a,t[10]=p,t[11]=e):e=t[11],Ze=e}let h=Ze,Qe;t[12]!==l||t[13]!==n||t[14]!==i.stok_akhir||t[15]!==i.stok_awal||t[16]!==i.total_addendum||t[17]!==i.total_pengadaan||t[18]!==i.total_penyaluran?(Qe=()=>{let e=window.open(``,`_blank`);if(!e){alert(`Mohon izinkan pop-up browser untuk mencetak atau mengunduh PDF.`);return}let t=new Intl.DateTimeFormat(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`}).format(new Date),ee=``;l.forEach((e,t)=>{let n=e.status===`penyaluran`?`<span style="color:#e11d48;font-weight:bold">Penyaluran</span>`:e.status===`pengadaan`?`<span style="color:#059669;font-weight:bold">Pengadaan</span>`:`<span style="color:#d97706;font-weight:bold">Addendum</span>`,r=e.status===`penyaluran`?`− `:`+ `;ee+=`
                <tr>
                    <td style="text-align:center">${t+1}</td>
                    <td style="white-space:nowrap">${e.tanggal}</td>
                    <td style="text-align:center">${n}</td>
                    <td>${e.kecamatan}</td>
                    <td>${e.desa}</td>
                    <td style="text-align:right;font-weight:bold;white-space:nowrap">${r}${o(e.jumlah)}</td>
                    <td>${e.keterangan||`-`}</td>
                </tr>
            `}),l.length===0&&(ee=`
                <tr>
                    <td colspan="7" style="text-align:center;padding:16px;color:#64748b;font-style:italic">
                        Tidak ada riwayat transaksi yang tercatat untuk Tahun Anggaran ${n}.
                    </td>
                </tr>
            `);let r=`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Laporan Transaksi CPPD Tahun ${n} - DKPP Kabupaten Indramayu</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 12mm 10mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0;
                    padding: 10px;
                    color: #0f172a;
                    font-size: 8.5pt;
                    line-height: 1.4;
                }
                .no-print {
                    margin-bottom: 16px;
                    padding: 10px 14px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .btn {
                    background: #006565;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 9pt;
                    cursor: pointer;
                }
                .btn:hover {
                    background: #004d4d;
                }
                .header-kop {
                    text-align: center;
                    border-bottom: 3px double #0f172a;
                    padding-bottom: 8px;
                    margin-bottom: 14px;
                }
                .header-kop h2 {
                    margin: 0;
                    font-size: 13pt;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                .header-kop h3 {
                    margin: 2px 0;
                    font-size: 11pt;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .header-kop p {
                    margin: 2px 0 0 0;
                    font-size: 8pt;
                    color: #475569;
                }
                .doc-title {
                    text-align: center;
                    margin: 14px 0 10px 0;
                }
                .doc-title h4 {
                    margin: 0;
                    font-size: 11pt;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #006565;
                }
                .doc-title p {
                    margin: 3px 0 0 0;
                    font-size: 8.5pt;
                    color: #475569;
                }
                .summary-box {
                    margin: 12px 0;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .summary-table th, .summary-table td {
                    padding: 6px 8px;
                    border: 1px solid #e2e8f0;
                    font-size: 8pt;
                }
                .summary-table th {
                    background: #f8fafc;
                    color: #334155;
                    font-weight: 700;
                    text-align: center;
                }
                .summary-table td {
                    text-align: center;
                    font-weight: 800;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .data-table th, .data-table td {
                    border: 1px solid #cbd5e1;
                    padding: 6px 8px;
                    font-size: 8pt;
                }
                .data-table th {
                    background: #006565;
                    color: #ffffff;
                    font-weight: 700;
                    text-align: center;
                }
                .data-table tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .sig-box {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                }
                .sig-inner {
                    text-align: center;
                    width: 240px;
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
                <div>
                    <button class="btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
                    <span style="font-size:8pt;color:#334155;margin-left:8px">Tips: Pada printer tujuan, pilih <strong>Save as PDF (Simpan sebagai PDF)</strong>.</span>
                </div>
                <button class="btn" style="background:#64748b" onclick="window.close()">Tutup</button>
            </div>

            <div class="header-kop">
                <h2>Pemerintah Daerah Kabupaten Indramayu</h2>
                <h3>Dinas Ketahanan Pangan dan Pertanian</h3>
                <p>Jl. MT. Haryono No. 12, Indramayu, Jawa Barat 45214 • Telp: (0234) 272211 • Email: dkpp@indramayukab.go.id</p>
            </div>

            <div class="doc-title">
                <h4>Laporan Riwayat Mutasi Cadangan Pangan Pemerintah Daerah (CPPD)</h4>
                <p>Tahun Anggaran ${n} | Tanggal Cetak: ${t}</p>
            </div>

            <div class="summary-box">
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Stok Awal Tahun</th>
                            <th>Total Pengadaan</th>
                            <th>Total Penyaluran</th>
                            <th>Total Addendum</th>
                            <th style="background:#e0f2fe;color:#0369a1">Stok Akhir CPPD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${o(i.stok_awal)}</td>
                            <td style="color:#059669">+ ${o(i.total_pengadaan)}</td>
                            <td style="color:#e11d48">− ${o(i.total_penyaluran)}</td>
                            <td style="color:#d97706">+ ${o(i.total_addendum)}</td>
                            <td style="color:#0284c7;font-size:9pt">${o(i.stok_akhir)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:28px">No</th>
                        <th style="width:75px">Tanggal</th>
                        <th style="width:85px">Jenis Mutasi</th>
                        <th>Kecamatan</th>
                        <th>Desa</th>
                        <th style="width:95px">Volume (Kg)</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${ee}
                </tbody>
            </table>

            <div class="sig-box">
                <div class="sig-inner">
                    <p style="margin:0">Indramayu, ${t}</p>
                    <p style="margin:4px 0 54px 0;font-weight:bold">Kepala Dinas Ketahanan Pangan dan Pertanian<br/>Kabupaten Indramayu</p>
                    <p style="margin:0;font-weight:bold;text-decoration:underline">Drs. H. Sugeng Heryanto, M.Si</p>
                    <p style="margin:2px 0 0 0;font-size:7.5pt;color:#64748b">Pembina Utama Muda (IV/c)</p>
                </div>
            </div>
        </body>
        </html>
        `;e.document.open(),e.document.write(r),e.document.close(),setTimeout(()=>{e.focus(),e.print()},300)},t[12]=l,t[13]=n,t[14]=i.stok_akhir,t[15]=i.stok_awal,t[16]=i.total_addendum,t[17]=i.total_pengadaan,t[18]=i.total_penyaluran,t[19]=Qe):Qe=t[19];let $e=Qe,et=`Cadangan Pangan Pemerintah Daerah (CPPD) Tahun ${n} - DKPP Indramayu`,g;t[20]===et?g=t[21]:(g=(0,c.jsx)(ee,{title:et}),t[20]=et,t[21]=g);let tt;t[22]===Symbol.for(`react.memo_cache_sentinel`)?(tt=(0,c.jsx)(oe,{activePage:`cppd`}),t[22]=tt):tt=t[22];let nt,rt,it;t[23]===Symbol.for(`react.memo_cache_sentinel`)?(rt=(0,c.jsx)(`div`,{className:`absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none`}),it=(0,c.jsx)(`div`,{className:`absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none`}),nt=(0,c.jsx)(`div`,{className:`absolute left-1/4 -top-20 w-80 h-80 rounded-full bg-teal-300/15 blur-2xl pointer-events-none`}),t[23]=nt,t[24]=rt,t[25]=it):(nt=t[23],rt=t[24],it=t[25]);let at;t[26]===Symbol.for(`react.memo_cache_sentinel`)?(at=(0,c.jsxs)(`div`,{className:`max-w-3xl space-y-3`,children:[(0,c.jsxs)(`div`,{className:`inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-md border border-white/20`,children:[(0,c.jsx)(xe,{className:`h-3.5 w-3.5 text-emerald-300`}),(0,c.jsx)(`span`,{children:`Cadangan Pangan Pemerintah Daerah (CPPD)`}),(0,c.jsx)(`span`,{className:`text-white/40`,children:`•`}),(0,c.jsx)(`span`,{className:`text-emerald-200`,children:`Kabupaten Indramayu`})]}),(0,c.jsx)(`h1`,{className:`text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl`,children:`Transparansi Stok & Penyaluran Cadangan Beras Daerah`}),(0,c.jsx)(`p`,{className:`text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal`,children:`Pemantauan saldo stok awal, pengadaan beras APBD, addendum volume, serta peta persebaran distribusi bantuan cadangan pangan pokok ke desa-desa di seluruh wilayah Kabupaten Indramayu.`})]}),t[26]=at):at=t[26];let ot;t[27]===Symbol.for(`react.memo_cache_sentinel`)?(ot=(0,c.jsxs)(`span`,{className:`flex items-center gap-1.5`,children:[(0,c.jsx)(ce,{className:`h-4 w-4 text-emerald-300`}),(0,c.jsx)(`span`,{children:`Pilih Tahun Anggaran`})]}),t[27]=ot):ot=t[27];let _;t[28]===n?_=t[29]:(_=(0,c.jsxs)(`div`,{className:`flex items-center justify-between gap-2 text-xs font-bold text-emerald-100`,children:[ot,(0,c.jsxs)(s,{className:`bg-emerald-400 text-slate-900 font-extrabold text-[10px] px-2`,children:[`Tahun `,n]})]}),t[28]=n,t[29]=_);let st=String(n),ct;t[30]===Symbol.for(`react.memo_cache_sentinel`)?(ct=e=>qe(Number(e)),t[30]=ct):ct=t[30];let lt;t[31]===Symbol.for(`react.memo_cache_sentinel`)?(lt=(0,c.jsx)(fe,{className:`h-10 w-full rounded-xl bg-white/95 text-slate-900 border-white/30 font-bold text-xs sm:text-sm shadow-md hover:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700 cursor-pointer`,children:(0,c.jsx)(le,{placeholder:`Pilih Tahun`})}),t[31]=lt):lt=t[31];let v;t[32]===r?v=t[33]:(v=r.map(ze),t[32]=r,t[33]=v);let y;t[34]===v?y=t[35]:(y=(0,c.jsx)(de,{className:`rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50`,children:v}),t[34]=v,t[35]=y);let b;t[36]!==st||t[37]!==y?(b=(0,c.jsxs)(pe,{value:st,onValueChange:ct,children:[lt,y]}),t[36]=st,t[37]=y,t[38]=b):b=t[38];let x;t[39]!==_||t[40]!==b?(x=(0,c.jsxs)(`section`,{className:`relative overflow-hidden bg-gradient-to-br from-[#004e4e] via-[#006565] to-emerald-800 text-white shadow-xl`,children:[rt,it,nt,(0,c.jsx)(`div`,{className:`relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8`,children:(0,c.jsxs)(`div`,{className:`flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between`,children:[at,(0,c.jsxs)(`div`,{className:`flex flex-col gap-2 rounded-2xl bg-white/10 p-3 sm:p-4 backdrop-blur-md border border-white/20 shadow-lg shrink-0 w-full sm:w-64`,children:[_,b]})]})})]}),t[39]=_,t[40]=b,t[41]=x):x=t[41];let ut;t[42]===Symbol.for(`react.memo_cache_sentinel`)?(ut=(0,c.jsx)(Te,{className:`h-5 w-5 text-[#006565] dark:text-emerald-400`}),t[42]=ut):ut=t[42];let S;t[43]===n?S=t[44]:(S=(0,c.jsxs)(`h2`,{className:`text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl flex items-center gap-2`,children:[ut,(0,c.jsxs)(`span`,{children:[`Ringkasan Neraca Cadangan Pangan (Tahun `,n,`)`]})]}),t[43]=n,t[44]=S);let dt;t[45]===Symbol.for(`react.memo_cache_sentinel`)?(dt=(0,c.jsx)(`p`,{className:`text-xs text-slate-500 dark:text-slate-400`,children:`Dasar perhitungan: Stok Akhir = (Stok Awal + Total Pengadaan + Total Addendum) − Total Penyaluran`}),t[45]=dt):dt=t[45];let C;t[46]===S?C=t[47]:(C=(0,c.jsx)(`div`,{className:`mb-4 flex items-center justify-between`,children:(0,c.jsxs)(`div`,{children:[S,dt]})}),t[46]=S,t[47]=C);let ft;t[48]===Symbol.for(`react.memo_cache_sentinel`)?(ft=(0,c.jsx)(`span`,{className:`text-xs font-bold uppercase tracking-wider`,children:`1. Stok Awal Tahun`}),t[48]=ft):ft=t[48];let pt;t[49]===Symbol.for(`react.memo_cache_sentinel`)?(pt=(0,c.jsxs)(`div`,{className:`flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2`,children:[ft,(0,c.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`,children:(0,c.jsx)(te,{className:`h-4 w-4`})})]}),t[49]=pt):pt=t[49];let w;t[50]===i.stok_awal?w=t[51]:(w=o(i.stok_awal),t[50]=i.stok_awal,t[51]=w);let T;t[52]===w?T=t[53]:(T=(0,c.jsx)(`div`,{className:`text-xl font-black text-slate-900 dark:text-white sm:text-2xl tracking-tight`,children:w}),t[52]=w,t[53]=T);let mt=i.initial_stock_note||`Penetapan saldo awal tahun`,E;t[54]===mt?E=t[55]:(E=(0,c.jsx)(`p`,{className:`mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1`,children:mt}),t[54]=mt,t[55]=E);let D;t[56]!==T||t[57]!==E?(D=(0,c.jsxs)(`div`,{className:`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900`,children:[pt,T,E]}),t[56]=T,t[57]=E,t[58]=D):D=t[58];let ht;t[59]===Symbol.for(`react.memo_cache_sentinel`)?(ht=(0,c.jsx)(`span`,{className:`text-xs font-bold uppercase tracking-wider`,children:`2. Total Pengadaan`}),t[59]=ht):ht=t[59];let gt;t[60]===Symbol.for(`react.memo_cache_sentinel`)?(gt=(0,c.jsxs)(`div`,{className:`flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-2`,children:[ht,(0,c.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-900/60 dark:text-emerald-300`,children:(0,c.jsx)(se,{className:`h-4 w-4`})})]}),t[60]=gt):gt=t[60];let O;t[61]===i.total_pengadaan?O=t[62]:(O=o(i.total_pengadaan),t[61]=i.total_pengadaan,t[62]=O);let k;t[63]===O?k=t[64]:(k=(0,c.jsxs)(`div`,{className:`text-xl font-black text-[#006565] dark:text-emerald-400 sm:text-2xl tracking-tight`,children:[`+ `,O]}),t[63]=O,t[64]=k);let A;t[65]===n?A=t[66]:(A=(0,c.jsxs)(`p`,{className:`mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80`,children:[`Pengadaan beras APBD tahun `,n]}),t[65]=n,t[66]=A);let j;t[67]!==k||t[68]!==A?(j=(0,c.jsxs)(`div`,{className:`relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white p-4 shadow-sm hover:shadow-md transition-all dark:border-emerald-900/60 dark:from-emerald-950/20 dark:to-slate-900`,children:[gt,k,A]}),t[67]=k,t[68]=A,t[69]=j):j=t[69];let _t;t[70]===Symbol.for(`react.memo_cache_sentinel`)?(_t=(0,c.jsx)(`span`,{className:`text-xs font-bold uppercase tracking-wider`,children:`3. Total Penyaluran`}),t[70]=_t):_t=t[70];let vt;t[71]===Symbol.for(`react.memo_cache_sentinel`)?(vt=(0,c.jsxs)(`div`,{className:`flex items-center justify-between text-rose-800 dark:text-rose-300 mb-2`,children:[_t,(0,c.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300`,children:(0,c.jsx)(re,{className:`h-4 w-4`})})]}),t[71]=vt):vt=t[71];let M;t[72]===i.total_penyaluran?M=t[73]:(M=o(i.total_penyaluran),t[72]=i.total_penyaluran,t[73]=M);let N;t[74]===M?N=t[75]:(N=(0,c.jsxs)(`div`,{className:`text-xl font-black text-rose-600 dark:text-rose-400 sm:text-2xl tracking-tight`,children:[`− `,M]}),t[74]=M,t[75]=N);let P;t[76]===a.length?P=t[77]:(P=(0,c.jsxs)(`p`,{className:`mt-1 text-[11px] text-rose-700/80 dark:text-rose-400/80`,children:[`Bantuan ke `,a.length,` desa penerima`]}),t[76]=a.length,t[77]=P);let F;t[78]!==N||t[79]!==P?(F=(0,c.jsxs)(`div`,{className:`relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 to-white p-4 shadow-sm hover:shadow-md transition-all dark:border-rose-900/60 dark:from-rose-950/20 dark:to-slate-900`,children:[vt,N,P]}),t[78]=N,t[79]=P,t[80]=F):F=t[80];let yt;t[81]===Symbol.for(`react.memo_cache_sentinel`)?(yt=(0,c.jsx)(`span`,{className:`text-xs font-bold uppercase tracking-wider`,children:`4. Total Addendum`}),t[81]=yt):yt=t[81];let bt;t[82]===Symbol.for(`react.memo_cache_sentinel`)?(bt=(0,c.jsxs)(`div`,{className:`flex items-center justify-between text-amber-800 dark:text-amber-300 mb-2`,children:[yt,(0,c.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300`,children:(0,c.jsx)(ne,{className:`h-4 w-4`})})]}),t[82]=bt):bt=t[82];let I;t[83]===i.total_addendum?I=t[84]:(I=o(i.total_addendum),t[83]=i.total_addendum,t[84]=I);let L;t[85]===I?L=t[86]:(L=(0,c.jsxs)(`div`,{className:`text-xl font-black text-amber-600 dark:text-amber-400 sm:text-2xl tracking-tight`,children:[`+ `,I]}),t[85]=I,t[86]=L);let xt;t[87]===Symbol.for(`react.memo_cache_sentinel`)?(xt=(0,c.jsx)(`p`,{className:`mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80`,children:`Penyesuaian volume kontrak CPPD`}),t[87]=xt):xt=t[87];let R;t[88]===L?R=t[89]:(R=(0,c.jsxs)(`div`,{className:`relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white p-4 shadow-sm hover:shadow-md transition-all dark:border-amber-900/60 dark:from-amber-950/20 dark:to-slate-900`,children:[bt,L,xt]}),t[88]=L,t[89]=R);let St;t[90]===Symbol.for(`react.memo_cache_sentinel`)?(St=(0,c.jsx)(`span`,{className:`text-xs font-bold uppercase tracking-wider`,children:`5. Stok Akhir CPPD`}),t[90]=St):St=t[90];let Ct;t[91]===Symbol.for(`react.memo_cache_sentinel`)?(Ct=(0,c.jsxs)(`div`,{className:`flex items-center justify-between text-emerald-200 mb-2`,children:[St,(0,c.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white`,children:(0,c.jsx)(be,{className:`h-4 w-4`})})]}),t[91]=Ct):Ct=t[91];let z;t[92]===i.stok_akhir?z=t[93]:(z=o(i.stok_akhir),t[92]=i.stok_akhir,t[93]=z);let B;t[94]===z?B=t[95]:(B=(0,c.jsx)(`div`,{className:`text-xl font-black sm:text-2xl tracking-tight text-white`,children:z}),t[94]=z,t[95]=B);let wt;t[96]===Symbol.for(`react.memo_cache_sentinel`)?(wt=(0,c.jsx)(`p`,{className:`mt-1 text-[11px] text-emerald-200/90 font-medium`,children:`Saldo cadangan pangan siap pakai`}),t[96]=wt):wt=t[96];let Tt;t[97]===B?Tt=t[98]:(Tt=(0,c.jsxs)(`div`,{className:`relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-[#006565] to-[#004e4e] p-4 text-white shadow-md hover:shadow-lg transition-all`,children:[Ct,B,wt]}),t[97]=B,t[98]=Tt);let V;t[99]!==D||t[100]!==j||t[101]!==F||t[102]!==R||t[103]!==Tt?(V=(0,c.jsxs)(`div`,{className:`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5`,children:[D,j,F,R,Tt]}),t[99]=D,t[100]=j,t[101]=F,t[102]=R,t[103]=Tt,t[104]=V):V=t[104];let H;t[105]!==C||t[106]!==V?(H=(0,c.jsxs)(`section`,{children:[C,V]}),t[105]=C,t[106]=V,t[107]=H):H=t[107];let Et;t[108]===Symbol.for(`react.memo_cache_sentinel`)?(Et=(0,c.jsx)(`span`,{children:`Penyaluran Cadangan Pangan Daerah`}),t[108]=Et):Et=t[108];let U;t[109]===a.length?U=t[110]:(U=(0,c.jsxs)(`h3`,{className:`text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2`,children:[Et,(0,c.jsxs)(s,{className:`bg-emerald-100 text-[#006565] border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300`,children:[a.length,` Desa`]})]}),t[109]=a.length,t[110]=U);let Dt;t[111]===Symbol.for(`react.memo_cache_sentinel`)?(Dt=(0,c.jsx)(`p`,{className:`text-xs text-slate-500 dark:text-slate-400`,children:`Pilih tampilan tata letak untuk menganalisis peta sebaran marker atau daftar tabel rincian desa.`}),t[111]=Dt):Dt=t[111];let W;t[112]===U?W=t[113]:(W=(0,c.jsxs)(`div`,{children:[U,Dt]}),t[112]=U,t[113]=W);let Ot;t[114]===Symbol.for(`react.memo_cache_sentinel`)?(Ot=()=>Ue(`map`),t[114]=Ot):Ot=t[114];let kt=`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${u===`map`?`bg-[#006565] text-white shadow-xs`:`text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}`,At,jt;t[115]===Symbol.for(`react.memo_cache_sentinel`)?(At=(0,c.jsx)(Me,{className:`h-4 w-4`}),jt=(0,c.jsx)(`span`,{children:`Layout 1: Peta Sebaran`}),t[115]=At,t[116]=jt):(At=t[115],jt=t[116]);let G;t[117]===kt?G=t[118]:(G=(0,c.jsxs)(`button`,{type:`button`,onClick:Ot,className:kt,children:[At,jt]}),t[117]=kt,t[118]=G);let Mt;t[119]===Symbol.for(`react.memo_cache_sentinel`)?(Mt=()=>Ue(`list`),t[119]=Mt):Mt=t[119];let Nt=`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${u===`list`?`bg-[#006565] text-white shadow-xs`:`text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}`,Pt,Ft;t[120]===Symbol.for(`react.memo_cache_sentinel`)?(Pt=(0,c.jsx)(je,{className:`h-4 w-4`}),Ft=(0,c.jsx)(`span`,{children:`Layout 2: Daftar Desa`}),t[120]=Pt,t[121]=Ft):(Pt=t[120],Ft=t[121]);let K;t[122]===Nt?K=t[123]:(K=(0,c.jsxs)(`button`,{type:`button`,onClick:Mt,className:Nt,children:[Pt,Ft]}),t[122]=Nt,t[123]=K);let It;t[124]===Symbol.for(`react.memo_cache_sentinel`)?(It=()=>Ue(`both`),t[124]=It):It=t[124];let Lt=`hidden lg:inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${u===`both`?`bg-[#006565] text-white shadow-xs`:`text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}`,Rt,zt;t[125]===Symbol.for(`react.memo_cache_sentinel`)?(Rt=(0,c.jsx)(we,{className:`h-4 w-4`}),zt=(0,c.jsx)(`span`,{children:`Berdampingan`}),t[125]=Rt,t[126]=zt):(Rt=t[125],zt=t[126]);let q;t[127]===Lt?q=t[128]:(q=(0,c.jsxs)(`button`,{type:`button`,onClick:It,className:Lt,children:[Rt,zt]}),t[127]=Lt,t[128]=q);let J;t[129]!==G||t[130]!==K||t[131]!==q?(J=(0,c.jsxs)(`div`,{className:`inline-flex rounded-2xl border border-slate-200/80 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900 shrink-0`,children:[G,K,q]}),t[129]=G,t[130]=K,t[131]=q,t[132]=J):J=t[132];let Y;t[133]!==W||t[134]!==J?(Y=(0,c.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-3 dark:border-slate-800`,children:[W,J]}),t[133]=W,t[134]=J,t[135]=Y):Y=t[135];let Bt;t[136]===Symbol.for(`react.memo_cache_sentinel`)?(Bt=(0,c.jsx)(_e,{className:`absolute left-3 top-2.5 h-4 w-4 text-slate-400`}),t[136]=Bt):Bt=t[136];let Vt;t[137]===Symbol.for(`react.memo_cache_sentinel`)?(Vt=e=>We(e.target.value),t[137]=Vt):Vt=t[137];let X;t[138]===d?X=t[139]:(X=(0,c.jsxs)(`div`,{className:`relative flex-1 min-w-[220px]`,children:[Bt,(0,c.jsx)(ye,{type:`text`,placeholder:`Cari desa atau kecamatan...`,value:d,onChange:Vt,className:`pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700`})]}),t[138]=d,t[139]=X);let Ht;t[140]===Symbol.for(`react.memo_cache_sentinel`)?(Ht=(0,c.jsxs)(`span`,{className:`text-xs font-bold text-slate-500 flex items-center gap-1`,children:[(0,c.jsx)(ge,{className:`h-3.5 w-3.5`}),(0,c.jsx)(`span`,{children:`Kecamatan:`})]}),t[140]=Ht):Ht=t[140];let Ut;t[141]===Symbol.for(`react.memo_cache_sentinel`)?(Ut=e=>Ge(e),t[141]=Ut):Ut=t[141];let Wt;t[142]===Symbol.for(`react.memo_cache_sentinel`)?(Wt=(0,c.jsx)(fe,{className:`w-[180px] h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700`,children:(0,c.jsx)(le,{placeholder:`Semua Kecamatan`})}),t[142]=Wt):Wt=t[142];let Gt;t[143]===Symbol.for(`react.memo_cache_sentinel`)?(Gt=(0,c.jsx)(ue,{value:`all`,children:`Semua Kecamatan`}),t[143]=Gt):Gt=t[143];let Z;t[144]===He.kecamatanList?Z=t[145]:(Z=He.kecamatanList.map(Re),t[144]=He.kecamatanList,t[145]=Z);let Q;t[146]===Z?Q=t[147]:(Q=(0,c.jsxs)(de,{className:`max-h-60`,children:[Gt,Z]}),t[146]=Z,t[147]=Q);let Kt;t[148]!==f||t[149]!==Q?(Kt=(0,c.jsxs)(`div`,{className:`flex items-center gap-2`,children:[Ht,(0,c.jsxs)(pe,{value:f,onValueChange:Ut,children:[Wt,Q]})]}),t[148]=f,t[149]=Q,t[150]=Kt):Kt=t[150];let qt;t[151]!==d||t[152]!==f?(qt=(d||f!==`all`)&&(0,c.jsx)(Se,{variant:`ghost`,size:`sm`,onClick:()=>{We(``),Ge(`all`)},className:`h-9 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50`,children:`Reset Filter`}),t[151]=d,t[152]=f,t[153]=qt):qt=t[153];let Jt;t[154]!==X||t[155]!==Kt||t[156]!==qt?(Jt=(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800`,children:[X,Kt,qt]}),t[154]=X,t[155]=Kt,t[156]=qt,t[157]=Jt):Jt=t[157];let Yt;t[158]!==u||t[159]!==h||t[160]!==m||t[161]!==f||t[162]!==p||t[163]!==n?(Yt=(u===`map`||u===`both`)&&(0,c.jsx)(`div`,{className:`space-y-4`,children:(0,c.jsxs)(`div`,{className:`grid grid-cols-1 lg:grid-cols-4 gap-4 items-start`,children:[(0,c.jsx)(`div`,{className:u===`both`?`lg:col-span-2`:`lg:col-span-3`,children:(0,c.jsx)(ie,{recipientVillages:m,selectedVillageKey:p,onSelectVillage:e=>Ke(e?e.key:null),year:n,selectedKecamatanFilter:f===`all`?null:f,onSelectKecamatanFilter:e=>Ge(e||`all`)})}),(0,c.jsxs)(`div`,{className:u===`both`?`lg:col-span-2 space-y-4`:`lg:col-span-1 space-y-4`,children:[h?(0,c.jsxs)(ke,{className:`rounded-3xl border border-emerald-300 bg-emerald-50/50 p-4 shadow-md dark:border-emerald-800 dark:bg-emerald-950/30`,children:[(0,c.jsx)(De,{className:`p-0 pb-3 border-b border-emerald-200/60 dark:border-emerald-800`,children:(0,c.jsxs)(`div`,{className:`flex items-start justify-between gap-2`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`span`,{className:`text-[10px] font-black uppercase tracking-wider text-[#006565] dark:text-emerald-400`,children:`Detail Titik Penyaluran`}),(0,c.jsxs)(Ee,{className:`text-base font-black text-slate-900 dark:text-white`,children:[`Desa `,h.desa]}),(0,c.jsxs)(`span`,{className:`text-xs font-bold text-slate-600 dark:text-slate-300`,children:[`Kecamatan `,h.kecamatan]})]}),(0,c.jsx)(Se,{variant:`ghost`,size:`sm`,onClick:()=>Ke(null),className:`h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600`,children:`Tutup`})]})}),(0,c.jsxs)(Oe,{className:`p-0 pt-3 space-y-2.5 text-xs`,children:[(0,c.jsxs)(`div`,{className:`flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-900`,children:[(0,c.jsx)(`span`,{className:`text-slate-500`,children:`Total Bantuan:`}),(0,c.jsx)(`span`,{className:`font-black text-sm text-[#006565] dark:text-emerald-400`,children:o(h.total_penyaluran)})]}),(0,c.jsxs)(`div`,{className:`flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-900`,children:[(0,c.jsx)(`span`,{className:`text-slate-500`,children:`Jumlah Tahap:`}),(0,c.jsxs)(`span`,{className:`font-bold text-slate-800 dark:text-slate-200`,children:[h.transaksi_count,` Kali`]})]}),(0,c.jsxs)(`div`,{className:`flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-900`,children:[(0,c.jsx)(`span`,{className:`text-slate-500`,children:`Tanggal Terakhir:`}),(0,c.jsx)(`span`,{className:`font-bold text-slate-800 dark:text-slate-200`,children:h.latest_tanggal})]}),h.keterangan_list&&h.keterangan_list.length>0&&(0,c.jsxs)(`div`,{className:`pt-2`,children:[(0,c.jsx)(`span`,{className:`text-[10px] font-black uppercase text-slate-400 block mb-1`,children:`Riwayat Penyaluran:`}),(0,c.jsx)(`div`,{className:`space-y-1.5 max-h-48 overflow-y-auto pr-1`,children:h.keterangan_list.map(Le)})]})]})]}):(0,c.jsx)(ke,{className:`rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60`,children:(0,c.jsxs)(Oe,{className:`p-4 flex flex-col items-center justify-center space-y-2`,children:[(0,c.jsx)(`div`,{className:`flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#006565] dark:bg-slate-800 dark:text-emerald-400`,children:(0,c.jsx)(ve,{className:`h-5 w-5 animate-bounce`})}),(0,c.jsx)(`h4`,{className:`text-sm font-bold text-slate-800 dark:text-slate-200`,children:`Pilih Titik Marker`}),(0,c.jsx)(`p`,{className:`text-xs text-slate-500 max-w-xs`,children:`Klik salah satu marker desa di peta untuk meninjau rincian penyaluran bantuan pangan daerah.`})]})}),(0,c.jsxs)(`div`,{className:`rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900`,children:[(0,c.jsxs)(`div`,{className:`flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800`,children:[(0,c.jsx)(`span`,{className:`text-xs font-black uppercase tracking-wider text-slate-500`,children:`Penyaluran Terbanyak`}),(0,c.jsx)(s,{variant:`outline`,className:`text-[10px]`,children:`Top Desa`})]}),(0,c.jsxs)(`div`,{className:`mt-3 space-y-2`,children:[m.slice(0,5).map((e,t)=>(0,c.jsxs)(`button`,{type:`button`,onClick:()=>Ke(e.key),className:`w-full text-left rounded-xl p-2 transition-all flex items-center justify-between cursor-pointer ${p===e.key?`bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40`:`hover:bg-slate-50 dark:hover:bg-slate-800`}`,children:[(0,c.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,c.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,c.jsx)(`span`,{className:`flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400`,children:t+1}),(0,c.jsx)(`span`,{className:`text-xs font-bold text-slate-900 dark:text-white truncate`,children:e.desa})]}),(0,c.jsxs)(`span`,{className:`text-[10px] text-slate-400 pl-5.5 block`,children:[`Kec. `,e.kecamatan]})]}),(0,c.jsx)(`span`,{className:`text-xs font-black text-[#006565] dark:text-emerald-400 shrink-0`,children:o(e.total_penyaluran)})]},e.key)),m.length===0&&(0,c.jsx)(`p`,{className:`text-xs text-slate-400 py-3 text-center`,children:`Tidak ada data desa penyaluran pada filter ini.`})]})]})]})]})}),t[158]=u,t[159]=h,t[160]=m,t[161]=f,t[162]=p,t[163]=n,t[164]=Yt):Yt=t[164];let Xt;t[165]!==u||t[166]!==Xe||t[167]!==m||t[168]!==n?(Xt=(u===`list`||u===`both`)&&(0,c.jsx)(`div`,{className:`space-y-4`,children:(0,c.jsxs)(`div`,{className:`rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-6`,children:[(0,c.jsxs)(`div`,{className:`mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsxs)(`h3`,{className:`text-base font-black text-slate-900 dark:text-white sm:text-lg flex items-center gap-2`,children:[(0,c.jsx)(Ae,{className:`h-5 w-5 text-[#006565] dark:text-emerald-400`}),(0,c.jsxs)(`span`,{children:[`Daftar Desa Penerima Bantuan CPPD (Tahun `,n,`)`]})]}),(0,c.jsx)(`p`,{className:`text-xs text-slate-500 dark:text-slate-400`,children:`Daftar lengkap seluruh desa penerima distribusi beras cadangan pangan beserta akumulasi total bantuan.`})]}),(0,c.jsx)(`div`,{className:`flex items-center gap-2`,children:(0,c.jsxs)(s,{className:`bg-emerald-100 text-[#006565] border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 px-3 py-1 text-xs font-extrabold`,children:[`Total Volume: `,o(Xe)]})})]}),(0,c.jsx)(`div`,{className:`overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800`,children:(0,c.jsxs)(`table`,{className:`w-full text-left text-xs`,children:[(0,c.jsx)(`thead`,{className:`bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700`,children:(0,c.jsxs)(`tr`,{children:[(0,c.jsx)(`th`,{className:`py-3 px-3.5 w-12 text-center`,children:`No`}),(0,c.jsx)(`th`,{className:`py-3 px-3.5`,children:`Desa`}),(0,c.jsx)(`th`,{className:`py-3 px-3.5`,children:`Kecamatan`}),(0,c.jsx)(`th`,{className:`py-3 px-3.5 text-right`,children:`Total Penyaluran (kg)`}),(0,c.jsx)(`th`,{className:`py-3 px-3.5 text-center`,children:`Frekuensi`}),(0,c.jsx)(`th`,{className:`py-3 px-3.5`,children:`Penyaluran Terakhir`}),(0,c.jsx)(`th`,{className:`py-3 px-3.5`,children:`Catatan Bantuan`})]})}),(0,c.jsxs)(`tbody`,{className:`divide-y divide-slate-100 dark:divide-slate-800`,children:[m.map(Ie),m.length===0&&(0,c.jsx)(`tr`,{children:(0,c.jsx)(`td`,{colSpan:7,className:`py-12 text-center text-slate-400 font-medium`,children:`Tidak ada data desa penerima bantuan cadangan pangan yang sesuai dengan filter pencarian.`})})]}),m.length>0&&(0,c.jsx)(`tfoot`,{className:`bg-slate-100/80 font-black text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-t-2 border-slate-200 dark:border-slate-700`,children:(0,c.jsxs)(`tr`,{children:[(0,c.jsxs)(`td`,{colSpan:3,className:`py-3 px-3.5 uppercase tracking-wider text-xs`,children:[`Total Akumulasi (`,m.length,` Desa)`]}),(0,c.jsx)(`td`,{className:`py-3 px-3.5 text-right text-sm text-[#006565] dark:text-emerald-400 font-black`,children:o(Xe)}),(0,c.jsx)(`td`,{colSpan:3,className:`py-3 px-3.5 text-xs text-slate-500 font-normal`,children:`Bantuan Beras CPPD Kabupaten Indramayu`})]})})]})})]})}),t[165]=u,t[166]=Xe,t[167]=m,t[168]=n,t[169]=Xt):Xt=t[169];let Zt;t[170]!==Y||t[171]!==Jt||t[172]!==Yt||t[173]!==Xt?(Zt=(0,c.jsxs)(`section`,{className:`space-y-4`,children:[Y,Jt,Yt,Xt]}),t[170]=Y,t[171]=Jt,t[172]=Yt,t[173]=Xt,t[174]=Zt):Zt=t[174];let Qt;t[175]===Symbol.for(`react.memo_cache_sentinel`)?(Qt=(0,c.jsx)(me,{className:`h-4 w-4 text-[#006565] dark:text-emerald-400`}),t[175]=Qt):Qt=t[175];let $t;t[176]===n?$t=t[177]:($t=(0,c.jsxs)(`h3`,{className:`text-base font-black text-slate-900 dark:text-white flex items-center gap-2`,children:[Qt,(0,c.jsxs)(`span`,{children:[`Riwayat Transaksi CPPD Terkini (`,n,`)`]})]}),t[176]=n,t[177]=$t);let en;t[178]===Symbol.for(`react.memo_cache_sentinel`)?(en=(0,c.jsx)(`p`,{className:`text-xs text-slate-500 dark:text-slate-400`,children:`Log histori seluruh aktivitas mutasi pengadaan, penyaluran, dan addendum cadangan pangan.`}),t[178]=en):en=t[178];let tn;t[179]===$t?tn=t[180]:(tn=(0,c.jsxs)(`div`,{children:[$t,en]}),t[179]=$t,t[180]=tn);let nn;t[181]===l.length?nn=t[182]:(nn=l.length>5&&(0,c.jsxs)(`span`,{className:`text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full`,children:[l.length,` aktivitas`]}),t[181]=l.length,t[182]=nn);let rn,an;t[183]===Symbol.for(`react.memo_cache_sentinel`)?(an=(0,c.jsx)(he,{className:`h-3.5 w-3.5 text-rose-600`}),rn=(0,c.jsx)(`span`,{children:`Unduh PDF`}),t[183]=rn,t[184]=an):(rn=t[183],an=t[184]);let on;t[185]===$e?on=t[186]:(on=(0,c.jsxs)(Se,{type:`button`,variant:`outline`,size:`sm`,onClick:$e,className:`h-8 gap-1.5 rounded-xl border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer shadow-xs`,title:`Unduh / Cetak Dokumen PDF`,children:[an,rn]}),t[185]=$e,t[186]=on);let sn=`/cppd/export-excel?year=${n}`,cn,ln;t[187]===Symbol.for(`react.memo_cache_sentinel`)?(cn=(0,c.jsx)(Ce,{className:`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400`}),ln=(0,c.jsx)(`span`,{children:`Unduh Excel`}),t[187]=cn,t[188]=ln):(cn=t[187],ln=t[188]);let un;t[189]===sn?un=t[190]:(un=(0,c.jsxs)(`a`,{href:sn,download:!0,className:`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors shadow-xs`,title:`Unduh Berkas Excel (.xlsx)`,children:[cn,ln]}),t[189]=sn,t[190]=un);let dn;t[191]!==on||t[192]!==un||t[193]!==nn?(dn=(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[nn,on,un]}),t[191]=on,t[192]=un,t[193]=nn,t[194]=dn):dn=t[194];let fn;t[195]!==dn||t[196]!==tn?(fn=(0,c.jsxs)(`div`,{className:`mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800`,children:[tn,dn]}),t[195]=dn,t[196]=tn,t[197]=fn):fn=t[197];let pn;t[198]===l?pn=t[199]:(pn=l.map(Fe),t[198]=l,t[199]=pn);let mn;t[200]!==l.length||t[201]!==n?(mn=l.length===0&&(0,c.jsxs)(`p`,{className:`text-xs text-slate-400 text-center py-6`,children:[`Belum ada transaksi yang tercatat untuk tahun `,n,`.`]}),t[200]=l.length,t[201]=n,t[202]=mn):mn=t[202];let hn;t[203]!==pn||t[204]!==mn?(hn=(0,c.jsxs)(`div`,{className:`max-h-[365px] overflow-y-auto overscroll-contain pr-1.5 space-y-2 scrollbar-thin`,children:[pn,mn]}),t[203]=pn,t[204]=mn,t[205]=hn):hn=t[205];let gn;t[206]!==fn||t[207]!==hn?(gn=(0,c.jsxs)(`section`,{className:`rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 sm:p-6`,children:[fn,hn]}),t[206]=fn,t[207]=hn,t[208]=gn):gn=t[208];let $;t[209]!==gn||t[210]!==H||t[211]!==Zt?($=(0,c.jsxs)(`main`,{className:`mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8`,children:[H,Zt,gn]}),t[209]=gn,t[210]=H,t[211]=Zt,t[212]=$):$=t[212];let _n;t[213]===Symbol.for(`react.memo_cache_sentinel`)?(_n=(0,c.jsx)(ae,{}),t[213]=_n):_n=t[213];let vn;return t[214]!==$||t[215]!==x||t[216]!==g?(vn=(0,c.jsxs)(`div`,{className:`min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans`,children:[g,tt,x,$,_n]}),t[214]=$,t[215]=x,t[216]=g,t[217]=vn):vn=t[217],vn}function Fe(e){let t=`bg-slate-100 text-slate-700 border-slate-200`;return e.status===`pengadaan`?t=`bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300`:e.status===`penyaluran`?t=`bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300`:e.status===`addendum`&&(t=`bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300`),(0,c.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200/70 p-3 hover:bg-slate-50/80 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/60`,children:[(0,c.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,c.jsx)(s,{className:`rounded-xl px-2.5 py-1 text-[10px] font-black border ${t}`,children:e.status_label}),(0,c.jsxs)(`div`,{children:[(0,c.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,c.jsxs)(`span`,{className:`text-xs font-black text-slate-900 dark:text-white`,children:[`Desa `,e.desa,`, Kec. `,e.kecamatan]}),(0,c.jsxs)(`span`,{className:`text-[10px] text-slate-400`,children:[`• `,e.tanggal]})]}),e.keterangan&&(0,c.jsx)(`p`,{className:`text-[11px] text-slate-500 dark:text-slate-400 italic`,children:e.keterangan})]})]}),(0,c.jsx)(`div`,{className:`text-right shrink-0`,children:(0,c.jsxs)(`span`,{className:`text-sm font-black ${e.status===`penyaluran`?`text-rose-600 dark:text-rose-400`:e.status===`pengadaan`?`text-[#006565] dark:text-emerald-400`:`text-amber-600 dark:text-amber-400`}`,children:[e.status===`penyaluran`?`− `:`+ `,o(e.jumlah)]})})]},e.id)}function Ie(e,t){return(0,c.jsxs)(`tr`,{className:`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors`,children:[(0,c.jsx)(`td`,{className:`py-3 px-3.5 text-center font-bold text-slate-400`,children:t+1}),(0,c.jsx)(`td`,{className:`py-3 px-3.5 font-black text-slate-900 dark:text-white`,children:e.desa}),(0,c.jsx)(`td`,{className:`py-3 px-3.5 font-bold text-slate-600 dark:text-slate-300`,children:e.kecamatan}),(0,c.jsx)(`td`,{className:`py-3 px-3.5 text-right font-black text-[#006565] dark:text-emerald-400 text-sm`,children:o(e.total_penyaluran)}),(0,c.jsx)(`td`,{className:`py-3 px-3.5 text-center`,children:(0,c.jsxs)(s,{variant:`secondary`,className:`font-extrabold text-[10px]`,children:[e.transaksi_count,` Kali`]})}),(0,c.jsx)(`td`,{className:`py-3 px-3.5 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap`,children:e.latest_tanggal}),(0,c.jsx)(`td`,{className:`py-3 px-3.5 text-slate-600 dark:text-slate-300 italic max-w-xs truncate`,children:e.keterangan_list?.[0]?.keterangan||`-`})]},e.key)}function Le(e,t){return(0,c.jsxs)(`div`,{className:`rounded-xl border border-slate-200/80 bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-900`,children:[(0,c.jsxs)(`div`,{className:`flex items-center justify-between text-slate-400 text-[10px] mb-0.5`,children:[(0,c.jsx)(`span`,{children:e.tanggal}),(0,c.jsx)(`span`,{className:`font-bold text-[#006565] dark:text-emerald-400`,children:o(e.jumlah)})]}),(0,c.jsx)(`p`,{className:`text-slate-700 dark:text-slate-300`,children:e.keterangan})]},t)}function Re(e){return(0,c.jsx)(ue,{value:e,children:e},e)}function ze(e){return(0,c.jsxs)(ue,{value:String(e),className:`text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer`,children:[`Tahun Anggaran `,e]},e)}function Be(e,t){return e+t.total_penyaluran}function Ve(e){n.get(`/cppd`,{year:e},{preserveState:!0,preserveScroll:!0})}export{l as default};