/*! `swift` grammar compiled for Highlight.js 11.11.1 */
(()=>{var e=(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function n(e){return t("(?=",e,")")}
function t(...n){return n.map((n=>e(n))).join("")}function a(...n){const t=(e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(n);return"("+(t.capture?"":"?:")+n.map((n=>e(n))).join("|")+")"}
const s=e=>t(/\b/,e,/\w$/.test(e)?/\b/:/\B/),i=["Protocol","Type"].map(s),c=["init","self"].map(s),o=["Any","Self"],u=["actor","any","associatedtype","async","await",/as\?/,/as!/,"as","borrowing","break","case","catch","class","consume","consuming","continue","convenience","copy","default","defer","deinit","didSet","distributed","do","dynamic","each","else","enum","extension","fallthrough",/fileprivate\(set\)/,"fileprivate","final","for","func","get","guard","if","import","indirect","infix",/init\?/,/init!/,"inout",/internal\(set\)/,"internal","in","is","isolated","nonisolated","lazy","let","macro","mutating","nonmutating",/open\(set\)/,"open","operator","optional","override","package","postfix","precedencegroup","prefix",/private\(set\)/,"private","protocol",/public\(set\)/,"public","repeat","required","rethrows","return","set","some","static","struct","subscript","super","switch","throws","throw",/try\?/,/try!/,"try","typealias",/unowned\(safe\)/,/unowned\(unsafe\)/,"unowned","var","weak","where","while","willSet"],r=["false","nil","true"],l=["assignment","associativity","higherThan","left","lowerThan","none","right"],m=["#colorLiteral","#column","#dsohandle","#else","#elseif","#endif","#error","#file","#fileID","#fileLiteral","#filePath","#function","#if","#imageLiteral","#keyPath","#line","#selector","#sourceLocation","#warning"],p=["abs","all","any","assert","assertionFailure","debugPrint","dump","fatalError","getVaList","isKnownUniquelyReferenced","max","min","numericCast","pointwiseMax","pointwiseMin","precondition","preconditionFailure","print","readLine","repeatElement","sequence","stride","swap","swift_unboxFromSwiftValueWithType","transcode","type","unsafeBitCast","unsafeDowncast","withExtendedLifetime","withUnsafeMutablePointer","withUnsafePointer","withVaList","withoutActuallyEscaping","zip"],d=a(/[/=\-+!*%<>&|^~?]/,/[\u00A1-\u00A7]/,/[\u00A9\u00AB]/,/[\u00AC\u00AE]/,/[\u00B0\u00B1]/,/[\u00B6\u00BB\u00BF\u00D7\u00F7]/,/[\u2016-\u2017]/,/[\u2020-\u2027]/,/[\u2030-\u203E]/,/[\u2041-\u2053]/,/[\u2055-\u205E]/,/[\u2190-\u23FF]/,/[\u2500-\u2775]/,/[\u2794-\u2BFF]/,/[\u2E00-\u2E7F]/,/[\u3001-\u3003]/,/[\u3008-\u3020]/,/[\u3030]/),b=a(d,/[\u0300-\u036F]/,/[\u1DC0-\u1DFF]/,/[\u20D0-\u20FF]/,/[\uFE00-\uFE0F]/,/[\uFE20-\uFE2F]/),F=t(d,b,"*"),h=a(/[a-zA-Z_]/,/[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,/[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,/[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,/[\u1E00-\u1FFF]/,/[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,/[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,/[\u2C00-\u2DFF\u2E80-\u2FFF]/,/[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,/[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,/[\uFE47-\uFEFE\uFF00-\uFFFD]/),w=a(h,/\d/,/[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/),f=t(h,w,"*"),y=t(/[A-Z]/,w,"*"),g=["attached","autoclosure",t(/convention\(/,a("swift","block","c"),/\)/),"discardableResult","dynamicCallable","dynamicMemberLookup","escaping","freestanding","frozen","GKInspectable","IBAction","IBDesignable","IBInspectable","IBOutlet","IBSegueAction","inlinable","main","nonobjc","NSApplicationMain","NSCopying","NSManaged",t(/objc\(/,f,/\)/),"objc","objcMembers","propertyWrapper","requires_stored_property_inits","resultBuilder","Sendable","testable","UIApplicationMain","unchecked","unknown","usableFromInline","warn_unqualified_access"],v=["iOS","iOSApplicationExtension","macOS","macOSApplicationExtension","macCatalyst","macCatalystApplicationExtension","watchOS","watchOSApplicationExtension","tvOS","tvOSApplicationExtension","swift"]
;return e=>{const d={match:/\s+/,relevance:0},h=e.COMMENT("/\\*","\\*/",{
contains:["self"]}),A=[e.C_LINE_COMMENT_MODE,h],E={match:[/\./,a(...i,...c)],
className:{2:"keyword"}},k={match:t(/\./,a(...u)),relevance:0
},C=u.filter((e=>"string"==typeof e)).concat(["_|0"]),N={variants:[{
className:"keyword",
match:a(...u.filter((e=>"string"!=typeof e)).concat(o).map(s),...c)}]},S={
$pattern:a(/\b\w+/,/#\w+/),keyword:C.concat(m),literal:r},B=[E,k,N],D=[{
match:t(/\./,a(...p)),relevance:0},{className:"built_in",
match:t(/\b/,a(...p),/(?=\()/)}],_={match:/->/,relevance:0},M=[_,{
className:"operator",relevance:0,variants:[{match:F},{match:`\\.(\\.|${b})+`}]
}],x="([0-9]_*)+",L="([0-9a-fA-F]_*)+",$={className:"number",relevance:0,
variants:[{match:`\\b(${x})(\\.(${x}))?([eE][+-]?(${x}))?\\b`},{
match:`\\b0x(${L})(\\.(${L}))?([pP][+-]?(${x}))?\\b`},{match:/\b0o([0-7]_*)+\b/
},{match:/\b0b([01]_*)+\b/}]},I=(e="")=>({className:"subst",variants:[{
match:t(/\\/,e,/[0\\tnr"']/)},{match:t(/\\/,e,/u\{[0-9a-fA-F]{1,8}\}/)}]
}),O=(e="")=>({className:"subst",match:t(/\\/,e,/[\t ]*(?:[\r\n]|\r\n)/)
}),P=(e="")=>({className:"subst",label:"interpol",begin:t(/\\/,e,/\(/),end:/\)/
}),j=(e="")=>({begin:t(e,/"""/),end:t(/"""/,e),contains:[I(e),O(e),P(e)]
}),K=(e="")=>({begin:t(e,/"/),end:t(/"/,e),contains:[I(e),P(e)]}),T={
className:"string",
variants:[j(),j("#"),j("##"),j("###"),K(),K("#"),K("##"),K("###")]
},z=[e.BACKSLASH_ESCAPE,{begin:/\[/,end:/\]/,relevance:0,
contains:[e.BACKSLASH_ESCAPE]}],q={begin:/\/[^\s](?=[^/\n]*\/)/,end:/\//,
contains:z},U=e=>{const n=t(e,/\//),a=t(/\//,e);return{begin:n,end:a,
contains:[...z,{scope:"comment",begin:`#(?!.*${a})`,end:/$/}]}},Z={
scope:"regexp",variants:[U("###"),U("##"),U("#"),q]},V={match:t(/`/,f,/`/)
},W=[V,{className:"variable",match:/\$\d+/},{className:"variable",
match:`\\$${w}+`}],G=[{match:/(@|#(un)?)available/,scope:"keyword",starts:{
contains:[{begin:/\(/,end:/\)/,keywords:v,contains:[...M,$,T]}]}},{
scope:"keyword",match:t(/@/,a(...g),n(a(/\(/,/\s+/)))},{scope:"meta",
match:t(/@/,f)}],H={match:n(/\b[A-Z]/),relevance:0,contains:[{className:"type",
match:t(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/,w,"+")
},{className:"type",match:y,relevance:0},{match:/[?!]+/,relevance:0},{
match:/\.\.\./,relevance:0},{match:t(/\s+&\s+/,n(y)),relevance:0}]},R={
begin:/</,end:/>/,keywords:S,contains:[...A,...B,...G,_,H]};H.contains.push(R)
;const X={begin:/\(/,end:/\)/,relevance:0,keywords:S,contains:["self",{
match:t(f,/\s*:/),keywords:"_|0",relevance:0
},...A,Z,...B,...D,...M,$,T,...W,...G,H]},J={begin:/</,end:/>/,
keywords:"repeat each",contains:[...A,H]},Q={begin:/\(/,end:/\)/,keywords:S,
contains:[{begin:a(n(t(f,/\s*:/)),n(t(f,/\s+/,f,/\s*:/))),end:/:/,relevance:0,
contains:[{className:"keyword",match:/\b_\b/},{className:"params",match:f}]
},...A,...B,...M,$,T,...G,H,X],endsParent:!0,illegal:/["']/},Y={
match:[/(func|macro)/,/\s+/,a(V.match,f,F)],className:{1:"keyword",
3:"title.function"},contains:[J,Q,d],illegal:[/\[/,/%/]},ee={
match:[/\b(?:subscript|init[?!]?)/,/\s*(?=[<(])/],className:{1:"keyword"},
contains:[J,Q,d],illegal:/\[|%/},ne={match:[/operator/,/\s+/,F],className:{
1:"keyword",3:"title"}},te={begin:[/precedencegroup/,/\s+/,y],className:{
1:"keyword",3:"title"},contains:[H],keywords:[...l,...r],end:/}/},ae={
begin:[/(struct|protocol|class|extension|enum|actor)/,/\s+/,f,/\s*/],
beginScope:{1:"keyword",3:"title.class"},keywords:S,contains:[J,...B,{begin:/:/,
end:/\{/,keywords:S,contains:[{scope:"title.class.inherited",match:y},...B],
relevance:0}]};for(const e of T.variants){
const n=e.contains.find((e=>"interpol"===e.label));n.keywords=S
;const t=[...B,...D,...M,$,T,...W];n.contains=[...t,{begin:/\(/,end:/\)/,
contains:["self",...t]}]}return{name:"Swift",keywords:S,contains:[...A,Y,ee,{
match:[/class\b/,/\s+/,/func\b/,/\s+/,/\b[A-Za-z_][A-Za-z0-9_]*\b/],scope:{
1:"keyword",3:"keyword",5:"title.function"}},{match:[/class\b/,/\s+/,/var\b/],
scope:{1:"keyword",3:"keyword"}},ae,ne,te,{beginKeywords:"import",end:/$/,
contains:[...A],relevance:0},Z,...B,...D,...M,$,T,...W,...G,H,X]}}})()
;hljs.registerLanguage("swift",e)})();