/*! `typescript` grammar compiled for Highlight.js 11.11.1 */
(()=>{var e=(()=>{"use strict"
;const e="[A-Za-z$_][0-9A-Za-z$_]*",n=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],a=["true","false","null","undefined","NaN","Infinity"],t=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],s=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],c=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],r=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],i=[].concat(c,t,s)
;function o(o){const l=o.regex,d=e,b={begin:/<[A-Za-z0-9\\._:-]+/,
end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(e,n)=>{
const a=e[0].length+e.index,t=e.input[a]
;if("<"===t||","===t)return void n.ignoreMatch();let s
;">"===t&&(((e,{after:n})=>{const a="</"+e[0].slice(1)
;return-1!==e.input.indexOf(a,n)})(e,{after:a})||n.ignoreMatch())
;const c=e.input.substring(a)
;((s=c.match(/^\s*=/))||(s=c.match(/^\s+extends\s+/))&&0===s.index)&&n.ignoreMatch()
}},g={$pattern:e,keyword:n,literal:a,built_in:i,"variable.language":r
},u="[0-9](_?[0-9])*",m=`\\.(${u})`,E="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",A={
className:"number",variants:[{
begin:`(\\b(${E})((${m})|\\.)?|(${m}))[eE][+-]?(${u})\\b`},{
begin:`\\b(${E})\\b((${m})\\b|\\.)?|(${m})\\b`},{
begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{
begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{
begin:"\\b0[0-7]+n?\\b"}],relevance:0},y={className:"subst",begin:"\\$\\{",
end:"\\}",keywords:g,contains:[]},p={begin:".?html`",end:"",starts:{end:"`",
returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,y],subLanguage:"xml"}},N={
begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,
contains:[o.BACKSLASH_ESCAPE,y],subLanguage:"css"}},f={begin:".?gql`",end:"",
starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,y],
subLanguage:"graphql"}},_={className:"string",begin:"`",end:"`",
contains:[o.BACKSLASH_ESCAPE,y]},h={className:"comment",
variants:[o.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{
begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,
excludeBegin:!0,relevance:0},{className:"variable",begin:d+"(?=\\s*(-)|$)",
endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]
}),o.C_BLOCK_COMMENT_MODE,o.C_LINE_COMMENT_MODE]
},S=[o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,p,N,f,_,{match:/\$\d+/},A]
;y.contains=S.concat({begin:/\{/,end:/\}/,keywords:g,contains:["self"].concat(S)
});const v=[].concat(h,y.contains),w=v.concat([{begin:/(\s*)\(/,end:/\)/,
keywords:g,contains:["self"].concat(v)}]),R={className:"params",begin:/(\s*)\(/,
end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:g,contains:w},k={variants:[{
match:[/class/,/\s+/,d,/\s+/,/extends/,/\s+/,l.concat(d,"(",l.concat(/\./,d),")*")],
scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{
match:[/class/,/\s+/,d],scope:{1:"keyword",3:"title.class"}}]},x={relevance:0,
match:l.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),
className:"title.class",keywords:{_:[...t,...s]}},O={variants:[{
match:[/function/,/\s+/,d,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],
className:{1:"keyword",3:"title.function"},label:"func.def",contains:[R],
illegal:/%/},I={
match:l.concat(/\b/,(C=[...c,"super","import"].map((e=>e+"\\s*\\(")),
l.concat("(?!",C.join("|"),")")),d,l.lookahead(/\s*\(/)),
className:"title.function",relevance:0};var C;const T={
begin:l.concat(/\./,l.lookahead(l.concat(d,/(?![0-9A-Za-z$_(])/))),end:d,
excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},M={
match:[/get|set/,/\s+/,d,/(?=\()/],className:{1:"keyword",3:"title.function"},
contains:[{begin:/\(\)/},R]
},B="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+o.UNDERSCORE_IDENT_RE+")\\s*=>",$={
match:[/const|var|let/,/\s+/,d,/\s*/,/=\s*/,/(async\s*)?/,l.lookahead(B)],
keywords:"async",className:{1:"keyword",3:"title.function"},contains:[R]}
;return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:g,exports:{
PARAMS_CONTAINS:w,CLASS_REFERENCE:x},illegal:/#(?![$_A-z])/,
contains:[o.SHEBANG({label:"shebang",binary:"node",relevance:5}),{
label:"use_strict",className:"meta",relevance:10,
begin:/^\s*['"]use (strict|asm)['"]/
},o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,p,N,f,_,h,{match:/\$\d+/},A,x,{
scope:"attr",match:d+l.lookahead(":"),relevance:0},$,{
begin:"("+o.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",
keywords:"return throw case",relevance:0,contains:[h,o.REGEXP_MODE,{
className:"function",begin:B,returnBegin:!0,end:"\\s*=>",contains:[{
className:"params",variants:[{begin:o.UNDERSCORE_IDENT_RE,relevance:0},{
className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:g,contains:w}]}]},{begin:/,/,relevance:0
},{match:/\s+/,relevance:0},{variants:[{begin:"<>",end:"</>"},{
match:/<[A-Za-z0-9\\._:-]+\s*\/>/},{begin:b.begin,
"on:begin":b.isTrulyOpeningTag,end:b.end}],subLanguage:"xml",contains:[{
begin:b.begin,end:b.end,skip:!0,contains:["self"]}]}]},O,{
beginKeywords:"while if switch catch for"},{
begin:"\\b(?!function)"+o.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
returnBegin:!0,label:"func.def",contains:[R,o.inherit(o.TITLE_MODE,{begin:d,
className:"title.function"})]},{match:/\.\.\./,relevance:0},T,{match:"\\$"+d,
relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},
contains:[R]},I,{relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,
className:"variable.constant"},k,M,{match:/\$[(.]/}]}}return t=>{
const s=t.regex,c=o(t),l=e,d=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],b={
begin:[/namespace/,/\s+/,t.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}
},g={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{
keyword:"interface extends",built_in:d},contains:[c.exports.CLASS_REFERENCE]
},u={$pattern:e,
keyword:n.concat(["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"]),
literal:a,built_in:i.concat(d),"variable.language":r},m={className:"meta",
begin:"@"+l},E=(e,n,a)=>{const t=e.contains.findIndex((e=>e.label===n))
;if(-1===t)throw Error("can not find mode to replace");e.contains.splice(t,1,a)}
;Object.assign(c.keywords,u),c.exports.PARAMS_CONTAINS.push(m)
;const A=c.contains.find((e=>"attr"===e.scope)),y=Object.assign({},A,{
match:s.concat(l,s.lookahead(/\s*\?:/))})
;return c.exports.PARAMS_CONTAINS.push([c.exports.CLASS_REFERENCE,A,y]),
c.contains=c.contains.concat([m,b,g,y]),
E(c,"shebang",t.SHEBANG()),E(c,"use_strict",{className:"meta",relevance:10,
begin:/^\s*['"]use strict['"]/
}),c.contains.find((e=>"func.def"===e.label)).relevance=0,Object.assign(c,{
name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),c}})()
;hljs.registerLanguage("typescript",e)})();