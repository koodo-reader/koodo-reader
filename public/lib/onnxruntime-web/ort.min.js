/*!
 * ONNX Runtime Web v1.23.2
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
"use strict";var ort=(()=>{var wn=Object.defineProperty;var Vu=Object.getOwnPropertyDescriptor;var Nu=Object.getOwnPropertyNames;var Lu=Object.prototype.hasOwnProperty;var $n=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var k=(e,t)=>()=>(e&&(t=e(e=0)),t);var nt=(e,t)=>{for(var n in t)wn(e,n,{get:t[n],enumerable:!0})},Wu=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of Nu(t))!Lu.call(e,o)&&o!==n&&wn(e,o,{get:()=>t[o],enumerable:!(r=Vu(t,o))||r.enumerable});return e};var dt=e=>Wu(wn({},"__esModule",{value:!0}),e);var xt,je,We,Gu,yr,vn=k(()=>{"use strict";xt=new Map,je=[],We=(e,t,n)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let r=xt.get(e);if(r===void 0)xt.set(e,{backend:t,priority:n});else{if(r.priority>n)return;if(r.priority===n&&r.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${n}`)}if(n>=0){let o=je.indexOf(e);o!==-1&&je.splice(o,1);for(let i=0;i<je.length;i++)if(xt.get(je[i]).priority<=n){je.splice(i,0,e);return}je.push(e)}return}throw new TypeError("not a valid backend")},Gu=async e=>{let t=xt.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let n=!!t.initPromise;try{return n||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(r){return n||(t.error=`${r}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},yr=async e=>{let t=e.executionProviders||[],n=t.map(u=>typeof u=="string"?u:u.name),r=n.length===0?je:n,o,i=[],s=new Set;for(let u of r){let d=await Gu(u);typeof d=="string"?i.push({name:u,err:d}):(o||(o=d),o===d&&s.add(u))}if(!o)throw new Error(`no available backend found. ERR: ${i.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:d}of i)n.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${d}`);let a=t.filter(u=>s.has(typeof u=="string"?u:u.name));return[o,new Proxy(e,{get:(u,d)=>d==="executionProviders"?a:Reflect.get(u,d)})]}});var br=k(()=>{"use strict";vn()});var _r,wr=k(()=>{"use strict";_r="1.23.2"});var $r,le,xn=k(()=>{"use strict";wr();$r="warning",le={wasm:{},webgl:{},webgpu:{},versions:{common:_r},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);$r=e}},get logLevel(){return $r}};Object.defineProperty(le,"logLevel",{enumerable:!0})});var te,vr=k(()=>{"use strict";xn();te=le});var xr,Sr,Tr=k(()=>{"use strict";xr=(e,t)=>{let n=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);n.width=e.dims[3],n.height=e.dims[2];let r=n.getContext("2d");if(r!=null){let o,i;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(o=e.dims[2],i=e.dims[3]):(o=e.dims[3],i=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",a=t?.norm,u,d;a===void 0||a.mean===void 0?u=[255,255,255,255]:typeof a.mean=="number"?u=[a.mean,a.mean,a.mean,a.mean]:(u=[a.mean[0],a.mean[1],a.mean[2],0],a.mean[3]!==void 0&&(u[3]=a.mean[3])),a===void 0||a.bias===void 0?d=[0,0,0,0]:typeof a.bias=="number"?d=[a.bias,a.bias,a.bias,a.bias]:(d=[a.bias[0],a.bias[1],a.bias[2],0],a.bias[3]!==void 0&&(d[3]=a.bias[3]));let l=i*o,c=0,p=l,f=l*2,m=-1;s==="RGBA"?(c=0,p=l,f=l*2,m=l*3):s==="RGB"?(c=0,p=l,f=l*2):s==="RBG"&&(c=0,f=l,p=l*2);for(let h=0;h<i;h++)for(let b=0;b<o;b++){let y=(e.data[c++]-d[0])*u[0],g=(e.data[p++]-d[1])*u[1],_=(e.data[f++]-d[2])*u[2],w=m===-1?255:(e.data[m++]-d[3])*u[3];r.fillStyle="rgba("+y+","+g+","+_+","+w+")",r.fillRect(b,h,1,1)}if("toDataURL"in n)return n.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Sr=(e,t)=>{let n=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),r;if(n!=null){let o,i,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(o=e.dims[2],i=e.dims[1],s=e.dims[3]):(o=e.dims[3],i=e.dims[2],s=e.dims[1]);let a=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t?.norm,d,l;u===void 0||u.mean===void 0?d=[255,255,255,255]:typeof u.mean=="number"?d=[u.mean,u.mean,u.mean,u.mean]:(d=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(d[3]=u.mean[3])),u===void 0||u.bias===void 0?l=[0,0,0,0]:typeof u.bias=="number"?l=[u.bias,u.bias,u.bias,u.bias]:(l=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(l[3]=u.bias[3]));let c=i*o;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let p=4,f=0,m=1,h=2,b=3,y=0,g=c,_=c*2,w=-1;a==="RGBA"?(y=0,g=c,_=c*2,w=c*3):a==="RGB"?(y=0,g=c,_=c*2):a==="RBG"&&(y=0,_=c,g=c*2),r=n.createImageData(o,i);for(let v=0;v<i*o;f+=p,m+=p,h+=p,b+=p,v++)r.data[f]=(e.data[y++]-l[0])*d[0],r.data[m]=(e.data[g++]-l[1])*d[1],r.data[h]=(e.data[_++]-l[2])*d[2],r.data[b]=w===-1?255:(e.data[w++]-l[3])*d[3]}else throw new Error("Can not access image data");return r}});var Sn,Ir,Cr,Ar,Er,kr,Pr=k(()=>{"use strict";St();Sn=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:n,width:r}=t,o=t.norm??{mean:255,bias:0},i,s;typeof o.mean=="number"?i=[o.mean,o.mean,o.mean,o.mean]:i=[o.mean[0],o.mean[1],o.mean[2],o.mean[3]??255],typeof o.bias=="number"?s=[o.bias,o.bias,o.bias,o.bias]:s=[o.bias[0],o.bias[1],o.bias[2],o.bias[3]??0];let a=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",d=n*r,l=u==="RGBA"?new Float32Array(d*4):new Float32Array(d*3),c=4,p=0,f=1,m=2,h=3,b=0,y=d,g=d*2,_=-1;a==="RGB"&&(c=3,p=0,f=1,m=2,h=-1),u==="RGBA"?_=d*3:u==="RBG"?(b=0,g=d,y=d*2):u==="BGR"&&(g=0,y=d,b=d*2);for(let v=0;v<d;v++,p+=c,m+=c,f+=c,h+=c)l[b++]=(e[p]+s[0])/i[0],l[y++]=(e[f]+s[1])/i[1],l[g++]=(e[m]+s[2])/i[2],_!==-1&&h!==-1&&(l[_++]=(e[h]+s[3])/i[3]);return u==="RGBA"?new me("float32",l,[1,4,n,r]):new me("float32",l,[1,3,n,r])},Ir=async(e,t)=>{let n=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,r=typeof ImageData<"u"&&e instanceof ImageData,o=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,i=typeof e=="string",s,a=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},d=l=>typeof HTMLCanvasElement<"u"&&l instanceof HTMLCanvasElement||l instanceof OffscreenCanvas?l.getContext("2d"):null;if(n){let l=u();l.width=e.width,l.height=e.height;let c=d(l);if(c!=null){let p=e.height,f=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(p=t.resizedHeight,f=t.resizedWidth),t!==void 0){if(a=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");a.tensorFormat="RGBA",a.height=p,a.width=f}else a.tensorFormat="RGBA",a.height=p,a.width=f;c.drawImage(e,0,0),s=c.getImageData(0,0,f,p).data}else throw new Error("Can not access image data")}else if(r){let l,c;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(l=t.resizedHeight,c=t.resizedWidth):(l=e.height,c=e.width),t!==void 0&&(a=t),a.format="RGBA",a.height=l,a.width=c,t!==void 0){let p=u();p.width=c,p.height=l;let f=d(p);if(f!=null)f.putImageData(e,0,0),s=f.getImageData(0,0,c,l).data;else throw new Error("Can not access image data")}else s=e.data}else if(o){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let l=u();l.width=e.width,l.height=e.height;let c=d(l);if(c!=null){let p=e.height,f=e.width;return c.drawImage(e,0,0,f,p),s=c.getImageData(0,0,f,p).data,a.height=p,a.width=f,Sn(s,a)}else throw new Error("Can not access image data")}else{if(i)return new Promise((l,c)=>{let p=u(),f=d(p);if(!e||!f)return c();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{p.width=m.width,p.height=m.height,f.drawImage(m,0,0,p.width,p.height);let h=f.getImageData(0,0,p.width,p.height);a.height=p.height,a.width=p.width,l(Sn(h.data,a))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return Sn(s,a);throw new Error("Input data provided is not supported - aborted tensor creation")},Cr=(e,t)=>{let{width:n,height:r,download:o,dispose:i}=t,s=[1,r,n,4];return new me({location:"texture",type:"float32",texture:e,dims:s,download:o,dispose:i})},Ar=(e,t)=>{let{dataType:n,dims:r,download:o,dispose:i}=t;return new me({location:"gpu-buffer",type:n??"float32",gpuBuffer:e,dims:r,download:o,dispose:i})},Er=(e,t)=>{let{dataType:n,dims:r,download:o,dispose:i}=t;return new me({location:"ml-tensor",type:n??"float32",mlTensor:e,dims:r,download:o,dispose:i})},kr=(e,t,n)=>new me({location:"cpu-pinned",type:e,data:t,dims:n??[t.length]})});var Ze,lt,zr,Br,Dr=k(()=>{"use strict";Ze=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),lt=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),zr=!1,Br=()=>{if(!zr){zr=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,n=globalThis.Float16Array,r=typeof n<"u"&&n.from;e&&(Ze.set("int64",BigInt64Array),lt.set(BigInt64Array,"int64")),t&&(Ze.set("uint64",BigUint64Array),lt.set(BigUint64Array,"uint64")),r?(Ze.set("float16",n),lt.set(n,"float16")):Ze.set("float16",Uint16Array)}}});var Or,Mr,Ur=k(()=>{"use strict";St();Or=e=>{let t=1;for(let n=0;n<e.length;n++){let r=e[n];if(typeof r!="number"||!Number.isSafeInteger(r))throw new TypeError(`dims[${n}] must be an integer, got: ${r}`);if(r<0)throw new RangeError(`dims[${n}] must be a non-negative integer, got: ${r}`);t*=r}return t},Mr=(e,t)=>{switch(e.location){case"cpu":return new me(e.type,e.data,t);case"cpu-pinned":return new me({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new me({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new me({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new me({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}});var me,St=k(()=>{"use strict";Tr();Pr();Dr();Ur();me=class{constructor(t,n,r){Br();let o,i;if(typeof t=="object"&&"location"in t)switch(this.dataLocation=t.location,o=t.type,i=t.dims,t.location){case"cpu-pinned":{let a=Ze.get(o);if(!a)throw new TypeError(`unsupported type "${o}" to create tensor from pinned buffer`);if(!(t.data instanceof a))throw new TypeError(`buffer should be of type ${a.name}`);this.cpuData=t.data;break}case"texture":{if(o!=="float32")throw new TypeError(`unsupported type "${o}" to create tensor from texture`);this.gpuTextureData=t.texture,this.downloader=t.download,this.disposer=t.dispose;break}case"gpu-buffer":{if(o!=="float32"&&o!=="float16"&&o!=="int32"&&o!=="int64"&&o!=="uint32"&&o!=="uint8"&&o!=="bool"&&o!=="uint4"&&o!=="int4")throw new TypeError(`unsupported type "${o}" to create tensor from gpu buffer`);this.gpuBufferData=t.gpuBuffer,this.downloader=t.download,this.disposer=t.dispose;break}case"ml-tensor":{if(o!=="float32"&&o!=="float16"&&o!=="int32"&&o!=="int64"&&o!=="uint32"&&o!=="uint64"&&o!=="int8"&&o!=="uint8"&&o!=="bool"&&o!=="uint4"&&o!=="int4")throw new TypeError(`unsupported type "${o}" to create tensor from MLTensor`);this.mlTensorData=t.mlTensor,this.downloader=t.download,this.disposer=t.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let a,u;if(typeof t=="string")if(o=t,u=r,t==="string"){if(!Array.isArray(n))throw new TypeError("A string tensor's data must be a string array.");a=n}else{let d=Ze.get(t);if(d===void 0)throw new TypeError(`Unsupported tensor type: ${t}.`);if(Array.isArray(n)){if(t==="float16"&&d===Uint16Array||t==="uint4"||t==="int4")throw new TypeError(`Creating a ${t} tensor from number array is not supported. Please use ${d.name} as data.`);t==="uint64"||t==="int64"?a=d.from(n,BigInt):a=d.from(n)}else if(n instanceof d)a=n;else if(n instanceof Uint8ClampedArray)if(t==="uint8")a=Uint8Array.from(n);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(t==="float16"&&n instanceof Uint16Array&&d!==Uint16Array)a=new globalThis.Float16Array(n.buffer,n.byteOffset,n.length);else throw new TypeError(`A ${o} tensor's data must be type of ${d}`)}else if(u=n,Array.isArray(t)){if(t.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let d=typeof t[0];if(d==="string")o="string",a=t;else if(d==="boolean")o="bool",a=Uint8Array.from(t);else throw new TypeError(`Invalid element type of data array: ${d}.`)}else if(t instanceof Uint8ClampedArray)o="uint8",a=Uint8Array.from(t);else{let d=lt.get(t.constructor);if(d===void 0)throw new TypeError(`Unsupported type for tensor data: ${t.constructor}.`);o=d,a=t}if(u===void 0)u=[a.length];else if(!Array.isArray(u))throw new TypeError("A tensor's dims must be a number array");i=u,this.cpuData=a,this.dataLocation="cpu"}let s=Or(i);if(this.cpuData&&s!==this.cpuData.length&&!((o==="uint4"||o==="int4")&&Math.ceil(s/2)===this.cpuData.length))throw new Error(`Tensor's size(${s}) does not match data length(${this.cpuData.length}).`);this.type=o,this.dims=i,this.size=s}static async fromImage(t,n){return Ir(t,n)}static fromTexture(t,n){return Cr(t,n)}static fromGpuBuffer(t,n){return Ar(t,n)}static fromMLTensor(t,n){return Er(t,n)}static fromPinnedBuffer(t,n,r){return kr(t,n,r)}toDataURL(t){return xr(this,t)}toImageData(t){return Sr(this,t)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(t){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let n=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=n,t&&this.disposer&&(this.disposer(),this.disposer=void 0),n}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(t){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Mr(this,t)}}});var ve,Tn=k(()=>{"use strict";St();ve=me});var ct,Rr,he,fe,Ue,Re,In=k(()=>{"use strict";xn();ct=(e,t)=>{(typeof le.trace>"u"?!le.wasm.trace:!le.trace)||console.timeStamp(`${e}::ORT::${t}`)},Rr=(e,t)=>{let n=new Error().stack?.split(/\r\n|\r|\n/g)||[],r=!1;for(let o=0;o<n.length;o++){if(r&&!n[o].includes("TRACE_FUNC")){let i=`FUNC_${e}::${n[o].trim().split(" ")[1]}`;t&&(i+=`::${t}`),ct("CPU",i);return}n[o].includes("TRACE_FUNC")&&(r=!0)}},he=e=>{(typeof le.trace>"u"?!le.wasm.trace:!le.trace)||Rr("BEGIN",e)},fe=e=>{(typeof le.trace>"u"?!le.wasm.trace:!le.trace)||Rr("END",e)},Ue=e=>{(typeof le.trace>"u"?!le.wasm.trace:!le.trace)||console.time(`ORT::${e}`)},Re=e=>{(typeof le.trace>"u"?!le.wasm.trace:!le.trace)||console.timeEnd(`ORT::${e}`)}});var Tt,Vr=k(()=>{"use strict";vn();Tn();In();Tt=class e{constructor(t){this.handler=t}async run(t,n,r){he(),Ue("InferenceSession.run");let o={},i={};if(typeof t!="object"||t===null||t instanceof ve||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof n=="object"){if(n===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(n instanceof ve)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(n)){if(n.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let d of n){if(typeof d!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(d)===-1)throw new RangeError(`'fetches' contains invalid output name: ${d}.`);o[d]=null}if(typeof r=="object"&&r!==null)i=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else{let d=!1,l=Object.getOwnPropertyNames(n);for(let c of this.outputNames)if(l.indexOf(c)!==-1){let p=n[c];(p===null||p instanceof ve)&&(d=!0,s=!1,o[c]=p)}if(d){if(typeof r=="object"&&r!==null)i=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else i=n}}else if(typeof n<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let d of this.inputNames)if(typeof t[d]>"u")throw new Error(`input '${d}' is missing in 'feeds'.`);if(s)for(let d of this.outputNames)o[d]=null;let a=await this.handler.run(t,o,i),u={};for(let d in a)if(Object.hasOwnProperty.call(a,d)){let l=a[d];l instanceof ve?u[d]=l:u[d]=new ve(l.type,l.data,l.dims)}return Re("InferenceSession.run"),fe(),u}async release(){return this.handler.dispose()}static async create(t,n,r,o){he(),Ue("InferenceSession.create");let i,s={};if(typeof t=="string"){if(i=t,typeof n=="object"&&n!==null)s=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(i=t,typeof n=="object"&&n!==null)s=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let l=t,c=0,p=t.byteLength;if(typeof n=="object"&&n!==null)s=n;else if(typeof n=="number"){if(c=n,!Number.isSafeInteger(c))throw new RangeError("'byteOffset' must be an integer.");if(c<0||c>=l.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${l.byteLength}).`);if(p=t.byteLength-c,typeof r=="number"){if(p=r,!Number.isSafeInteger(p))throw new RangeError("'byteLength' must be an integer.");if(p<=0||c+p>l.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${l.byteLength-c}].`);if(typeof o=="object"&&o!==null)s=o;else if(typeof o<"u")throw new TypeError("'options' must be an object.")}else if(typeof r<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof n<"u")throw new TypeError("'options' must be an object.");i=new Uint8Array(l,c,p)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[a,u]=await yr(s),d=await a.createInferenceSessionHandler(i,u);return Re("InferenceSession.create"),fe(),new e(d)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}});var Nr,Lr=k(()=>{"use strict";Vr();Nr=Tt});var Wr=k(()=>{"use strict"});var Gr=k(()=>{"use strict"});var Hr=k(()=>{"use strict"});var qr=k(()=>{"use strict"});var Cn={};nt(Cn,{InferenceSession:()=>Nr,TRACE:()=>ct,TRACE_EVENT_BEGIN:()=>Ue,TRACE_EVENT_END:()=>Re,TRACE_FUNC_BEGIN:()=>he,TRACE_FUNC_END:()=>fe,Tensor:()=>ve,env:()=>te,registerBackend:()=>We});var ye=k(()=>{"use strict";br();vr();Lr();Tn();Wr();Gr();In();Hr();qr()});var It=k(()=>{"use strict"});var Zr={};nt(Zr,{default:()=>Hu});var Kr,jr,Hu,Qr=k(()=>{"use strict";An();Ge();Ct();Kr="ort-wasm-proxy-worker",jr=globalThis.self?.name===Kr;jr&&(self.onmessage=e=>{let{type:t,in:n}=e.data;try{switch(t){case"init-wasm":At(n.wasm).then(()=>{Et(n).then(()=>{postMessage({type:t})},r=>{postMessage({type:t,err:r})})},r=>{postMessage({type:t,err:r})});break;case"init-ep":{let{epName:r,env:o}=n;kt(o,r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})});break}case"copy-from":{let{buffer:r}=n,o=pt(r);postMessage({type:t,out:o});break}case"create":{let{model:r,options:o}=n;Pt(r,o).then(i=>{postMessage({type:t,out:i})},i=>{postMessage({type:t,err:i})});break}case"release":zt(n),postMessage({type:t});break;case"run":{let{sessionId:r,inputIndices:o,inputs:i,outputIndices:s,options:a}=n;Bt(r,o,i,s,new Array(s.length).fill(null),a).then(u=>{u.some(d=>d[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:u},Ot([...i,...u]))},u=>{postMessage({type:t,err:u})});break}case"end-profiling":Dt(n),postMessage({type:t});break;default:}}catch(r){postMessage({type:t,err:r})}});Hu=jr?null:e=>new Worker(e??be,{type:"classic",name:Kr})});var qu,Fu,be,Mt,En,Ku,ju,Jr,Zu,Xr,eo,Yr,to,Ct=k(()=>{"use strict";It();qu=typeof location>"u"?void 0:location.origin,Fu=()=>{if(!!1)return typeof document<"u"?document.currentScript?.src:typeof self<"u"?self.location?.href:void 0},be=Fu(),Mt=()=>{if(be&&!be.startsWith("blob:"))return be.substring(0,be.lastIndexOf("/")+1)},En=(e,t)=>{try{let n=t??be;return(n?new URL(e,n):new URL(e)).origin===qu}catch{return!1}},Ku=(e,t)=>{let n=t??be;try{return(n?new URL(e,n):new URL(e)).href}catch{return}},ju=(e,t)=>`${t??"./"}${e}`,Jr=async e=>{let n=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(n)},Zu=async e=>(await import(/*webpackIgnore:true*/e)).default,Xr=(Qr(),dt(Zr)).default,eo=async()=>{if(!be)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(En(be))return[void 0,Xr()];let e=await Jr(be);return[e,Xr(e)]},Yr=void 0,to=async(e,t,n,r)=>{let o=Yr&&!(e||t);if(o)if(be)o=En(be);else if(r&&!n)o=!0;else throw new Error("cannot determine the script source URL.");if(o)return[void 0,Yr];{let i="ort-wasm-simd-threaded.jsep.mjs",s=e??Ku(i,t),a=!!1&&n&&s&&!En(s,t),u=a?await Jr(s):s??ju(i,t);return[a?u:void 0,await Zu(u)]}}});var kn,Pn,Ut,no,Qu,Xu,Yu,At,ne,Ge=k(()=>{"use strict";Ct();Pn=!1,Ut=!1,no=!1,Qu=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Xu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Yu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},At=async e=>{if(Pn)return Promise.resolve();if(Ut)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(no)throw new Error("previous call to 'initializeWebAssembly()' failed.");Ut=!0;let t=e.initTimeout,n=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Yu())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Xu())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let r=Qu();n>1&&!r&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+n+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=n=1);let o=e.wasmPaths,i=typeof o=="string"?o:void 0,s=o?.mjs,a=s?.href??s,u=o?.wasm,d=u?.href??u,l=e.wasmBinary,[c,p]=await to(a,i,n>1,!!l||!!d),f=!1,m=[];if(t>0&&m.push(new Promise(h=>{setTimeout(()=>{f=!0,h()},t)})),m.push(new Promise((h,b)=>{let y={numThreads:n};if(l)y.wasmBinary=l;else if(d||i)y.locateFile=g=>d??i+g;else if(a&&a.indexOf("blob:")!==0)y.locateFile=g=>new URL(g,a).href;else if(c){let g=Mt();g&&(y.locateFile=_=>g+_)}p(y).then(g=>{Ut=!1,Pn=!0,kn=g,h(),c&&URL.revokeObjectURL(c)},g=>{Ut=!1,no=!0,b(g)})})),await Promise.race(m),f)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ne=()=>{if(Pn&&kn)return kn;throw new Error("WebAssembly is not initialized yet.")}});var _e,mt,Y,Rt=k(()=>{"use strict";Ge();_e=(e,t)=>{let n=ne(),r=n.lengthBytesUTF8(e)+1,o=n._malloc(r);return n.stringToUTF8(e,o,r),t.push(o),o},mt=(e,t,n,r)=>{if(typeof e=="object"&&e!==null){if(n.has(e))throw new Error("Circular reference in options");n.add(e)}Object.entries(e).forEach(([o,i])=>{let s=t?t+o:o;if(typeof i=="object")mt(i,s+".",n,r);else if(typeof i=="string"||typeof i=="number")r(s,i.toString());else if(typeof i=="boolean")r(s,i?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof i}`)})},Y=e=>{let t=ne(),n=t.stackSave();try{let r=t.PTR_SIZE,o=t.stackAlloc(2*r);t._OrtGetLastError(o,o+r);let i=Number(t.getValue(o,r===4?"i32":"i64")),s=t.getValue(o+r,"*"),a=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${i}, ERROR_MESSAGE: ${a}`)}finally{t.stackRestore(n)}}});var ro,oo=k(()=>{"use strict";Ge();Rt();ro=e=>{let t=ne(),n=0,r=[],o=e||{};try{if(e?.logSeverityLevel===void 0)o.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)o.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(o.terminate=!1);let i=0;return e?.tag!==void 0&&(i=_e(e.tag,r)),n=t._OrtCreateRunOptions(o.logSeverityLevel,o.logVerbosityLevel,!!o.terminate,i),n===0&&Y("Can't create run options."),e?.extra!==void 0&&mt(e.extra,"",new WeakSet,(s,a)=>{let u=_e(s,r),d=_e(a,r);t._OrtAddRunConfigEntry(n,u,d)!==0&&Y(`Can't set a run config entry: ${s} - ${a}.`)}),[n,r]}catch(i){throw n!==0&&t._OrtReleaseRunOptions(n),r.forEach(s=>t._free(s)),i}}});var Ju,ed,td,Vt,nd,io,so=k(()=>{"use strict";Ge();Rt();Ju=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},ed=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},td=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(n=>(typeof n=="string"?n:n.name)==="webgpu")&&(e.enableMemPattern=!1)},Vt=(e,t,n,r)=>{let o=_e(t,r),i=_e(n,r);ne()._OrtAddSessionConfigEntry(e,o,i)!==0&&Y(`Can't set a session config entry: ${t} - ${n}.`)},nd=async(e,t,n)=>{for(let r of t){let o=typeof r=="string"?r:r.name,i=[];switch(o){case"webnn":if(o="WEBNN",typeof r!="string"){let c=r?.deviceType;c&&Vt(e,"deviceType",c,n)}break;case"webgpu":if(o="JS",typeof r!="string"){let l=r;if(l?.preferredLayout){if(l.preferredLayout!=="NCHW"&&l.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${l.preferredLayout}`);Vt(e,"preferredLayout",l.preferredLayout,n)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${o}`)}let s=_e(o,n),a=i.length,u=0,d=0;if(a>0){u=ne()._malloc(a*ne().PTR_SIZE),n.push(u),d=ne()._malloc(a*ne().PTR_SIZE),n.push(d);for(let l=0;l<a;l++)ne().setValue(u+l*ne().PTR_SIZE,i[l][0],"*"),ne().setValue(d+l*ne().PTR_SIZE,i[l][1],"*")}await ne()._OrtAppendExecutionProvider(e,s,u,d,a)!==0&&Y(`Can't append execution provider: ${o}.`)}},io=async e=>{let t=ne(),n=0,r=[],o=e||{};td(o);try{let i=Ju(o.graphOptimizationLevel??"all"),s=ed(o.executionMode??"sequential"),a=typeof o.logId=="string"?_e(o.logId,r):0,u=o.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log severity level is not valid: ${u}`);let d=o.logVerbosityLevel??0;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log verbosity level is not valid: ${d}`);let l=typeof o.optimizedModelFilePath=="string"?_e(o.optimizedModelFilePath,r):0;if(n=t._OrtCreateSessionOptions(i,!!o.enableCpuMemArena,!!o.enableMemPattern,s,!!o.enableProfiling,0,a,u,d,l),n===0&&Y("Can't create session options."),o.executionProviders&&await nd(n,o.executionProviders,r),o.enableGraphCapture!==void 0){if(typeof o.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${o.enableGraphCapture}`);Vt(n,"enableGraphCapture",o.enableGraphCapture.toString(),r)}if(o.freeDimensionOverrides)for(let[c,p]of Object.entries(o.freeDimensionOverrides)){if(typeof c!="string")throw new Error(`free dimension override name must be a string: ${c}`);if(typeof p!="number"||!Number.isInteger(p)||p<0)throw new Error(`free dimension override value must be a non-negative integer: ${p}`);let f=_e(c,r);t._OrtAddFreeDimensionOverride(n,f,p)!==0&&Y(`Can't set a free dimension override: ${c} - ${p}.`)}return o.extra!==void 0&&mt(o.extra,"",new WeakSet,(c,p)=>{Vt(n,c,p,r)}),[n,r]}catch(i){throw n!==0&&t._OrtReleaseSessionOptions(n)!==0&&Y("Can't release session options."),r.forEach(s=>t._free(s)),i}}});var He,Ee,qe,rt,ft,Nt,Lt,zn,V=k(()=>{"use strict";He=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},Ee=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},qe=(e,t)=>{let n=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],r=typeof t=="number"?t:t.reduce((o,i)=>o*i,1);return n>0?Math.ceil(r*n):void 0},rt=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},ft=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Nt=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Lt=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",zn=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}});var ht,Bn=k(()=>{"use strict";It();ht=async e=>{if(typeof e=="string")if(!1)try{let{readFile:t}=$n("node:fs/promises");return new Uint8Array(await t(e))}catch(t){if(t.code==="ERR_FS_FILE_TOO_LARGE"){let{createReadStream:n}=$n("node:fs"),r=n(e),o=[];for await(let i of r)o.push(i);return new Uint8Array(Buffer.concat(o))}throw t}else{let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let n=t.headers.get("Content-Length"),r=n?parseInt(n,10):0;if(r<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let o=t.body.getReader(),i;try{i=new ArrayBuffer(r)}catch(a){if(a instanceof RangeError){let u=Math.ceil(r/65536);i=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw a}let s=0;for(;;){let{done:a,value:u}=await o.read();if(a)break;let d=u.byteLength;new Uint8Array(i,s,d).set(u),s+=d}return new Uint8Array(i,0,r)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}});var rd,od,ao,uo,Wt,id,j,ke=k(()=>{"use strict";V();rd=["V","I","W","E","F"],od=(e,t)=>{console.log(`[${rd[e]},${new Date().toISOString()}]${t}`)},Wt=(e,t)=>{ao=e,uo=t},id=(e,t)=>{let n=ft(e),r=ft(ao);n>=r&&od(n,typeof t=="function"?t():t)},j=(...e)=>{uo&&id(...e)}});var Dn,Pe,x,Xe,Gt,lo,co,q=k(()=>{"use strict";Dn=class{static calcMatMulShape(t,n){return t[1]!==n[0]?void 0:[t[0],n[1]]}},Pe=class{static calcShape(t,n,r=!1){let o=t.length,i=n.length;if(o===0)return n;if(i===0)return t;let s=Math.max(t.length,n.length),a=new Array(s);if(r){if(o<2||i<2)return;let u=Dn.calcMatMulShape([t[o-2],t[o-1]],[n[i-2],n[i-1]]);if(u===void 0)return;[a[s-2],a[s-1]]=u}for(let u=r?3:1;u<=s;u++){let d=o-u<0?1:t[o-u],l=i-u<0?1:n[i-u];if(d!==l&&d>1&&l>1)return;let c=Math.max(d,l);if(d&&l)a[s-u]=Math.max(d,l);else{if(c>1)return;a[s-u]=0}}return a}static isValidBroadcast(t,n){let r=t.length,o=n.length;if(r>o)return!1;for(let i=1;i<=r;i++)if(t[r-i]!==1&&t[r-i]!==n[o-i])return!1;return!0}},x=class e{static size(t){return e.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,n=4){let r=t.length;if(r===0)return[];let o=new Array(r),i=r-1;for(;i>=0;){if(t[i]%n===0){o[i]=t[i]/n;break}if(n%t[i]!==0)throw new Error("cannot convert shape");o[i]=1,n/=t[i],i--}for(i--;i>=0;i--)o[i]=t[i];return o}static sizeFromDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return e.getSizeFromDimensionRange(t,n,t.length)}static sizeToDimension(t,n){if(n<0||n>t.length)throw new Error(`invalid dimension of ${n} for sizeToDimension as Tensor has ${t.length} dimensions.`);return e.getSizeFromDimensionRange(t,0,n)}static getSizeFromDimensionRange(t,n,r){let o=1;for(let i=n;i<r;i++){if(t[i]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");o*=Number(t[i])}return o}static computeStrides(t){let n=t.length;if(n===0)return[];if(n===1)return[1];let r=new Array(n);r[n-1]=1,r[n-2]=t[n-1];for(let o=n-3;o>=0;--o)r[o]=r[o+1]*t[o+1];return r}static normalizeAxis(t,n){if(t<-n&&t>=n)throw new Error("unsupported axis for this operation.");return t<0?t+n:t}static normalizeAxes(t,n){return t.map(r=>this.normalizeAxis(r,n??t.length))}static sortBasedOnPerm(t,n){return n?n.map(r=>t[r]):t.slice().reverse()}static padShape(t,n){let r=t.length;return t.map((o,i)=>o+n[i]+n[i+r])}static areEqual(t,n){return t.length!==n.length?!1:t.every((r,o)=>r===n[o])}},Xe=class e{static adjustPoolAttributes(t,n,r,o,i,s){if(!t&&r.length!==n.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let a=0;a<n.length-2;a++)a>=r.length?r.push(n[a+2]):r[a]=n[a+2];for(let a=0;a<r.length;a++)if(a<o.length){if(o[a]<0)throw new Error("strides should be greater than or equal to 1")}else o.push(1);for(let a=0;a<r.length;a++)if(a<i.length){if(i[a]<0)throw new Error("dilations should be greater than or equal to 1")}else i.push(1);for(let a=0;a<r.length*2;a++)if(a<s.length){if(s[a]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let a=0;a<r.length;a++){if(r[a]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[a]>=r[a]||s[a+r.length]>=r[a])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,n,r,o,i,s,a){if(a){if(i.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(o.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)e.adjustPadAndReturnShape(t[u+(s?1:2)],n[u],r[u],o[u],i,u,u+t.length-2,a)}}static computePoolOutputShape(t,n,r,o,i,s,a){if(n.length<=0)throw new Error("input shape must be of size greater than 0");let u=[n[0],n[1]];return e.computeShapeHelper(t,n,u,r,o,i,s,a),u}static computeConvOutputShape(t,n,r,o,i,s,a){if(t.length<=0||n.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],n[0]];return e.computeShapeHelper(!1,t,u,r,o,i,s,a),u}static computeShapeHelper(t,n,r,o,i,s,a,u){if(t)for(let d=0;d<n.length-2;d++)r.push(1);else for(let d=0;d<n.length-2;d++)r.push(e.adjustPadAndReturnShape(n[d+2],o[d],i[d],s[d],a,d,d+n.length-2,u))}static adjustPadAndReturnShape(t,n,r,o,i,s,a,u){let d=r*(o-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return i[s]=0,i[a]=0,Math.floor((t-d)/n+1);case"SAME_LOWER":case"SAME_UPPER":if(r!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let c=((t+n-1)/n-1)*n+o-t;return i[s]=Math.floor(u==="SAME_LOWER"?(c+1)/2:c/2),i[a]=c-i[s],Math.floor((t+c-o)/n+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+i[s]+i[a]-d)/n+1)}},Gt=class{static getShapeOfGemmResult(t,n,r,o,i){if(t.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let s,a,u;n?(s=t[1],a=t[0]):(s=t[0],a=t[1]);let d=-1;if(o?(u=r[0],d=1):(u=r[1],d=0),r[d]!==a)throw new Error("dimension mismatch");if(s<=0||u<=0||a<=0)throw new Error("invalid shape specified");if(i&&!Pe.isValidBroadcast(i,[s,u]))throw new Error("gemm: invalid bias shape for broadcast");return[s,u,a]}},lo=-34028234663852886e22,co=34028234663852886e22});var Ht,On=k(()=>{"use strict";V();Ht=(e,t)=>new(rt(t))(e)});var mo,Un,fo,sd,po,ad,ho,qt,Ft,Mn,go,yo=k(()=>{"use strict";V();ke();mo=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),Un=(e,t)=>{if(t==="int32")return e;let n=mo.get(t);if(!n)throw new Error(`WebNN backend does not support data type: ${t}`);let r=n/8;if(e.byteLength%r!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${r}.`);let o=e.byteLength/r,i=new(rt(t))(e.buffer,e.byteOffset,o);switch(t){case"int64":case"uint64":{let s=new Int32Array(o);for(let a=0;a<o;a++){let u=i[a];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[a]=Number(u)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&i.some(a=>a>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(i,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},fo=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let n=e.byteLength/4,r=new Int32Array(e.buffer,e.byteOffset,n);switch(t){case"int64":{let o=BigInt64Array.from(r,BigInt);return new Uint8Array(o.buffer)}case"uint64":{if(r.some(i=>i<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let o=BigUint64Array.from(r,BigInt);return new Uint8Array(o.buffer)}case"int8":{if(r.some(i=>i<-128||i>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let o=Int8Array.from(r,Number);return new Uint8Array(o.buffer)}case"uint8":{if(r.some(o=>o<0||o>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(r,Number)}case"uint32":{if(r.some(i=>i<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let o=Uint32Array.from(r,Number);return new Uint8Array(o.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},sd=1,po=()=>sd++,ad=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),ho=(e,t)=>{let n=mo.get(e);if(!n)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((r,o)=>r*o)*n/8):0},qt=class{constructor(t){this.isDataConverted=!1;let{sessionId:n,context:r,tensor:o,dataType:i,shape:s,fallbackDataType:a}=t;this.sessionId=n,this.mlContext=r,this.mlTensor=o,this.dataType=i,this.tensorShape=s,this.fallbackDataType=a}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return ho(this.dataType,this.tensorShape)}destroy(){j("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(t){this.mlContext.writeTensor(this.mlTensor,t)}async read(t){if(this.fallbackDataType){let n=await this.mlContext.readTensor(this.mlTensor),r=fo(new Uint8Array(n),this.dataType);if(t){(t instanceof ArrayBuffer?new Uint8Array(t):new Uint8Array(t.buffer,t.byteOffset,t.byteLength)).set(r);return}else return r.buffer}else return t?this.mlContext.readTensor(this.mlTensor,t):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(t,n,r){return this.mlContext===t&&this.dataType===n&&this.tensorShape.length===r.length&&this.tensorShape.every((o,i)=>o===r[i])}setIsDataConverted(t){this.isDataConverted=t}},Ft=class{constructor(t,n){this.tensorManager=t;this.wrapper=n}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(t,n,r,o){let i=this.tensorManager.getMLContext(t),s;if(!i.opSupportLimits().input.dataTypes.includes(n)){if(s=ad.get(n),!s||!i.opSupportLimits().input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${n}`);j("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${n} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(i,n,r))return this.wrapper.tensor;if(o){if(this.wrapper.byteLength!==ho(n,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let a=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(t,n,r,a,!0,!0,s),o&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(t){let n=t;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")n=Un(t,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(t.byteLength===this.wrapper.byteLength){this.wrapper.write(n);return}else j("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(n):this.activeUpload=new Uint8Array(n)}async download(t){if(this.activeUpload){let n=this.wrapper?.isDataConverted?fo(this.activeUpload,this.wrapper?.type):this.activeUpload;if(t){t instanceof ArrayBuffer?new Uint8Array(t).set(n):new Uint8Array(t.buffer,t.byteOffset,t.byteLength).set(n);return}else return n.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return t?this.wrapper.read(t):this.wrapper.read()}},Mn=class{constructor(t){this.backend=t;this.tensorTrackersById=new Map;this.freeTensors=[];this.externalTensors=new Set}getMLContext(t){let n=this.backend.getMLContext(t);if(!n)throw new Error("MLContext not found for session.");return n}reserveTensorId(){let t=po();return this.tensorTrackersById.set(t,new Ft(this)),t}releaseTensorId(t){let n=this.tensorTrackersById.get(t);n&&(this.tensorTrackersById.delete(t),n.tensorWrapper&&this.releaseTensor(n.tensorWrapper))}async ensureTensor(t,n,r,o,i){j("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${n}, dataType: ${r}, shape: ${o}, copyOld: ${i}}`);let s=this.tensorTrackersById.get(n);if(!s)throw new Error("Tensor not found.");return s.ensureTensor(t,r,o,i)}upload(t,n){let r=this.tensorTrackersById.get(t);if(!r)throw new Error("Tensor not found.");r.upload(n)}async download(t,n){j("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${t}, dstBuffer: ${n?.byteLength}}`);let r=this.tensorTrackersById.get(t);if(!r)throw new Error("Tensor not found.");return r.download(n)}releaseTensorsForSession(t){for(let n of this.freeTensors)n.sessionId===t&&n.destroy();this.freeTensors=this.freeTensors.filter(n=>n.sessionId!==t)}registerTensor(t,n,r,o){let i=this.getMLContext(t),s=po(),a=new qt({sessionId:t,context:i,tensor:n,dataType:r,shape:o});return this.tensorTrackersById.set(s,new Ft(this,a)),this.externalTensors.add(a),s}async getCachedTensor(t,n,r,o,i,s,a){let u=this.getMLContext(t);for(let[l,c]of this.freeTensors.entries())if(c.canReuseTensor(u,n,r)){j("verbose",()=>`[WebNN] Reusing tensor {dataType: ${n}, ${a?`fallbackDataType: ${a},`:""} shape: ${r}`);let p=this.freeTensors.splice(l,1)[0];return p.sessionId=t,p}j("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${n}, ${a?`fallbackDataType: ${a},`:""} shape: ${r}}`);let d=await u.createTensor({dataType:a??n,shape:r,dimensions:r,usage:o,writable:i,readable:s});return new qt({sessionId:t,context:u,tensor:d,dataType:n,shape:r,fallbackDataType:a})}releaseTensor(t){this.externalTensors.has(t)&&this.externalTensors.delete(t),this.freeTensors.push(t)}},go=(...e)=>new Mn(...e)});var Kt,ud,jt,bo=k(()=>{"use strict";V();Ge();On();yo();ke();Kt=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),ud=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let n=Object.keys(e).sort(),r=Object.keys(t).sort();return n.length===r.length&&n.every((o,i)=>o===r[i]&&e[o]===t[o])},jt=class{constructor(t){this.tensorManager=go(this);this.mlContextBySessionId=new Map;this.sessionIdsByMLContext=new Map;this.mlContextCache=[];this.sessionGraphInputs=new Map;this.sessionGraphOutputs=new Map;this.temporaryGraphInputs=[];this.temporaryGraphOutputs=[];this.temporarySessionTensorIds=new Map;Wt(t.logLevel,!!t.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(t){j("verbose",()=>`[WebNN] onRunStart {sessionId: ${t}}`),this.activeSessionId=t}onRunEnd(t){j("verbose",()=>`[WebNN] onRunEnd {sessionId: ${t}}`);let n=this.temporarySessionTensorIds.get(t);if(n){for(let r of n)j("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(t),this.activeSessionId=void 0}}async createMLContext(t){if(t instanceof GPUDevice){let r=this.mlContextCache.findIndex(o=>o.gpuDevice===t);if(r!==-1)return this.mlContextCache[r].mlContext;{let o=await navigator.ml.createContext(t);return this.mlContextCache.push({gpuDevice:t,mlContext:o}),o}}else if(t===void 0){let r=this.mlContextCache.findIndex(o=>o.options===void 0&&o.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let o=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:o}),o}}let n=this.mlContextCache.findIndex(r=>ud(r.options,t));if(n!==-1)return this.mlContextCache[n].mlContext;{let r=await navigator.ml.createContext(t);return this.mlContextCache.push({options:t,mlContext:r}),r}}registerMLContext(t,n){this.mlContextBySessionId.set(t,n);let r=this.sessionIdsByMLContext.get(n);r||(r=new Set,this.sessionIdsByMLContext.set(n,r)),r.add(t),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(t,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(t,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(t){this.sessionGraphInputs.delete(t),this.sessionGraphOutputs.delete(t);let n=this.mlContextBySessionId.get(t);if(!n)return;this.tensorManager.releaseTensorsForSession(t),this.mlContextBySessionId.delete(t);let r=this.sessionIdsByMLContext.get(n);if(r.delete(t),r.size===0){this.sessionIdsByMLContext.delete(n);let o=this.mlContextCache.findIndex(i=>i.mlContext===n);o!==-1&&this.mlContextCache.splice(o,1)}}getMLContext(t){return this.mlContextBySessionId.get(t)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(t){j("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${t}}`),this.tensorManager.releaseTensorId(t)}async ensureTensor(t,n,r,o,i){let s=Kt.get(r);if(!s)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(t??this.currentSessionId,n,s,o,i)}async createTemporaryTensor(t,n,r){j("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${n}, shape: ${r}}`);let o=Kt.get(n);if(!o)throw new Error(`Unsupported ONNX data type: ${n}`);let i=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(t,i,o,r,!1);let s=this.temporarySessionTensorIds.get(t);return s?s.push(i):this.temporarySessionTensorIds.set(t,[i]),i}uploadTensor(t,n){if(!ne().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");j("verbose",()=>`[WebNN] uploadTensor {tensorId: ${t}, data: ${n.byteLength}}`),this.tensorManager.upload(t,n)}async downloadTensor(t,n){return this.tensorManager.download(t,n)}createMLTensorDownloader(t,n){return async()=>{let r=await this.tensorManager.download(t);return Ht(r,n)}}registerMLTensor(t,n,r,o){let i=Kt.get(r);if(!i)throw new Error(`Unsupported ONNX data type: ${r}`);let s=this.tensorManager.registerTensor(t,n,i,o);return j("verbose",()=>`[WebNN] registerMLTensor {tensor: ${n}, dataType: ${i}, dimensions: ${o}} -> {tensorId: ${s}}`),s}registerMLConstant(t,n,r,o,i,s,a=!1){if(!s)throw new Error("External mounted files are not available.");let u=t;t.startsWith("./")&&(u=t.substring(2));let d=s.get(u);if(!d)throw new Error(`File with name ${u} not found in preloaded files.`);if(n+r>d.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let l=d.slice(n,n+r).buffer,c;switch(i.dataType){case"float32":c=new Float32Array(l);break;case"float16":c=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(l):new Uint16Array(l);break;case"int32":c=new Int32Array(l);break;case"uint32":c=new Uint32Array(l);break;case"int64":if(a){let p=Un(new Uint8Array(l),"int64");c=new Int32Array(p.buffer),i.dataType="int32"}else c=new BigInt64Array(l);break;case"uint64":c=new BigUint64Array(l);break;case"int8":c=new Int8Array(l);break;case"int4":case"uint4":case"uint8":c=new Uint8Array(l);break;default:throw new Error(`Unsupported data type: ${i.dataType} in creating WebNN Constant from external data.`)}return j("verbose",()=>`[WebNN] registerMLConstant {dataType: ${i.dataType}, shape: ${i.shape}}} ${a?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),o.constant(i,c)}registerGraphInput(t){this.temporaryGraphInputs.push(t)}registerGraphOutput(t){this.temporaryGraphOutputs.push(t)}isGraphInput(t,n){let r=this.sessionGraphInputs.get(t);return r?r.includes(n):!1}isGraphOutput(t,n){let r=this.sessionGraphOutputs.get(t);return r?r.includes(n):!1}isGraphInputOutputTypeSupported(t,n,r=!0){let o=this.mlContextBySessionId.get(t),i=Kt.get(He(n));return typeof i>"u"?!1:r?!!o?.opSupportLimits().input.dataTypes.includes(i):!!o?.opSupportLimits().output.dataTypes.includes(i)}flush(){}}});var Zt=k(()=>{"use strict"});var _o,Rn,Vn,dd,ld,wo,Ln,Nn,vo,xo=k(()=>{"use strict";ke();Zt();_o=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Rn=[],Vn=e=>Math.ceil(Number(e)/16)*16,dd=e=>{for(let t=0;t<Rn.length;t++){let n=Rn[t];if(e<=n)return n}return Math.ceil(e/16)*16},ld=1,wo=()=>ld++,Ln=async(e,t,n,r)=>{let o=Vn(n),i=e.device.createBuffer({size:o,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,i,0,o),e.flush(),await i.mapAsync(GPUMapMode.READ);let a=i.getMappedRange();if(r){let u=r();return u.set(new Uint8Array(a,0,n)),u}else return new Uint8Array(a.slice(0,n))}finally{i.destroy()}},Nn=class{constructor(t){this.backend=t;this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[n]of _o)Rn.push(n),this.freeBuffers.set(n,[]),this.freeUniformBuffers.set(n,[]);this.sessionCount=0}upload(t,n){let r=n.buffer,o=n.byteOffset,i=n.byteLength,s=Vn(i),a=this.storageCache.get(t);if(!a)throw new Error("gpu data for uploading does not exist");if(Number(a.originalSize)!==i)throw new Error(`inconsistent data size. gpu data size=${a.originalSize}, data size=${i}`);let u=this.backend.device.createBuffer({mappedAtCreation:!0,size:s,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),d=u.getMappedRange();new Uint8Array(d).set(new Uint8Array(r,o,i)),u.unmap();let l=this.backend.device.createCommandEncoder();l.copyBufferToBuffer(u,0,a.gpuData.buffer,0,s),this.backend.device.queue.submit([l.finish()]),u.destroy(),j("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${t})`)}memcpy(t,n){let r=this.storageCache.get(t);if(!r)throw new Error("source gpu data for memcpy does not exist");let o=this.storageCache.get(n);if(!o)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==o.originalSize)throw new Error("inconsistent source and destination gpu data size");let i=Vn(r.originalSize),s=this.backend.getCommandEncoder();this.backend.endComputePass(),s.copyBufferToBuffer(r.gpuData.buffer,0,o.gpuData.buffer,0,i)}registerExternalBuffer(t,n,r){let o;if(r){if(o=r[0],t===r[1])return j("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${n}) => id=${o}, buffer is the same, skip.`),o;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else o=wo();return this.storageCache.set(o,{gpuData:{id:o,type:0,buffer:t},originalSize:n}),j("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${n}) => id=${o}, registered.`),o}unregisterExternalBuffer(t){t!==void 0&&(this.storageCache.delete(t),j("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${t}`))}create(t,n=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=dd(t),o,i=(n&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,s=(n&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(i||s){let d=(i?this.freeBuffers:this.freeUniformBuffers).get(r);d?d.length>0?o=d.pop():o=this.backend.device.createBuffer({size:r,usage:n}):o=this.backend.device.createBuffer({size:r,usage:n})}else o=this.backend.device.createBuffer({size:r,usage:n});let a={id:wo(),type:0,buffer:o};return this.storageCache.set(a.id,{gpuData:a,originalSize:Number(t)}),j("verbose",()=>`[WebGPU] GpuDataManager.create(size=${t}) => id=${a.id}`),a}get(t){return this.storageCache.get(t)?.gpuData}release(t){let n=typeof t=="bigint"?Number(t):t,r=this.storageCache.get(n);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return j("verbose",()=>`[WebGPU] GpuDataManager.release(id=${n}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(n),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(t,n){let r=this.storageCache.get(Number(t));if(!r)throw new Error("data does not exist");await Ln(this.backend,r.gpuData.buffer,r.originalSize,n)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let t of this.buffersPending){let n=_o.get(t.size);if((t.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(t.size)||[];n===void 0||r.length>=n?t.destroy():r.push(t)}else if((t.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(t.size)||[];n===void 0||r.length>=n?t.destroy():r.push(t)}else t.destroy()}this.buffersPending=[]}else{let t=this.capturedPendingBuffers.get(this.backend.currentSessionId);t||(t=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,t));for(let n of this.buffersPending)t.push(n);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(t=>{t.forEach(n=>{n.destroy()})}),this.freeUniformBuffers.forEach(t=>{t.forEach(n=>{n.destroy()})}),this.storageCache.forEach(t=>{t.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(t=>{t.forEach(n=>{n.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(t){let n=this.capturedPendingBuffers.get(t);n&&(n.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(t)),this.sessionCount-=1,this.sessionCount===0&&(j("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},vo=(...e)=>new Nn(...e)});var Wn,N,ie=k(()=>{"use strict";Wn=class{constructor(t){Object.assign(this,t)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(t=>`${this[t]}`).join(";")),this.key}},N=e=>new Wn(e)});var Ye,Hn,re,ce,P,X,qn,Je,Te,O,Qt,S,C,So,Xt,Gn,To,K=k(()=>{"use strict";V();q();Ye=64,Hn=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},re=(e,t=1)=>{let n=Hn(e,t);return typeof n=="string"?n:n[0]},ce=(e,t=1)=>{let n=Hn(e,t);return typeof n=="string"?n:n[1]},P=(...e)=>{let t=[];return e.forEach(n=>{n.length!==0&&t.push({type:12,data:n},{type:12,data:x.computeStrides(n)})}),t},X=e=>e%4===0?4:e%2===0?2:1,qn=(e="f32",t,n="0")=>!t||t===1?`${e}(${n})`:`vec${t}<${e}>(${n})`,Je=(e,t,n)=>e==="f32"?n:t===1?`f32(${n})`:`vec${t}<f32>(${n})`,Te=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,O=(e,t,n,r)=>e.startsWith("uniforms.")&&n>4?typeof t=="string"?r==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:r==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:n>1?`${e}[${t}]`:e,Qt=(e,t,n,r,o)=>{let i=typeof n=="number",s=i?n:n.length,a=[...new Array(s).keys()],u=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,d=Hn(t,o),l=typeof d=="string"?d:d[1],c=typeof d=="string"?d:d[0],p={indices:u,value:l,storage:c,tensor:t},f=E=>typeof E=="string"?E:`${E}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},h=i?"uniforms.":"",b=`${h}${e}_shape`,y=`${h}${e}_strides`,g="";for(let E=0;E<s-1;E++)g+=`
    let dim${E} = current / ${O(y,E,s)};
    let rest${E} = current % ${O(y,E,s)};
    indices[${E}] = dim${E};
    current = rest${E};
    `;g+=`indices[${s-1}] = current;`;let _=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${p.indices} {
    var indices: ${p.indices};
    var current = offset;
    ${g}
    return indices;
  }`,w=E=>(m.offsetToIndices=!0,s<2?E:`o2i_${e}(${E})`),v=[];if(s>=2)for(let E=s-1;E>=0;E--)v.push(`${O(y,E,s)} * (indices[${E}])`);let $=s<2?"":`
  fn i2o_${e}(indices: ${p.indices}) -> u32 {
    return ${v.join("+")};
  }`,T=E=>(m.indicesToOffset=!0,s<2?E:`i2o_${e}(${E})`),I=(...E)=>s===0?"0u":`${p.indices}(${E.map(f).join(",")})`,A=(E,L)=>s<2?`${E}`:`${O(E,L,s)}`,z=(E,L,oe)=>s<2?`${E}=${oe};`:`${O(E,L,s)}=${oe};`,M={},U=(E,L)=>{m.broadcastedIndicesToOffset=!0;let oe=`${L.name}broadcastedIndicesTo${e}Offset`;if(oe in M)return`${oe}(${E})`;let $e=[];for(let Se=s-1;Se>=0;Se--){let ue=L.indicesGet("outputIndices",Se+L.rank-s);$e.push(`${A(y,Se)} * (${ue} % ${A(b,Se)})`)}return M[oe]=`fn ${oe}(outputIndices: ${L.type.indices}) -> u32 {
             return ${$e.length>0?$e.join("+"):"0u"};
           }`,`${oe}(${E})`},G=(E,L)=>(()=>{if(p.storage===p.value)return`${e}[${E}]=${L};`;if(p.storage==="vec2<u32>"&&p.value==="i32")return`${e}[${E}]=vec2<u32>(u32(${L}), select(0u, 0xFFFFFFFFu, ${L} < 0));`;if(p.storage==="vec2<u32>"&&p.value==="u32")return`${e}[${E}]=vec2<u32>(u32(${L}), 0u);`;if(p.storage==="u32"&&p.value==="vec4<bool>")return`${e}[${E}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${L}));`;throw new Error(`not supported combination of storage type ${p.storage} and value type ${p.value} yet`)})(),B=E=>(()=>{if(p.storage===p.value)return`${e}[${E}]`;if(p.storage==="vec2<u32>"&&p.value==="i32")return`i32(${e}[${E}].x)`;if(p.storage==="vec2<u32>"&&p.value==="u32")return`u32(${e}[${E}].x)`;if(p.storage==="u32"&&p.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${E}] & 0xFFu), bool(${e}[${E}] & 0xFF00u), bool(${e}[${E}] & 0xFF0000u), bool(${e}[${E}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${p.storage} and value type ${p.value} yet`)})(),ee=s<2?"":`
  fn get_${e}ByIndices(indices: ${p.indices}) -> ${l} {
    return ${B(`i2o_${e}(indices)`)};
  }`,W=s<2?"":(()=>{let E=a.map(oe=>`d${oe}: u32`).join(", "),L=a.map(oe=>`d${oe}`).join(", ");return`
  fn get_${e}(${E}) -> ${l} {
    return get_${e}ByIndices(${I(L)});
  }`})(),D=(...E)=>{if(E.length!==s)throw new Error(`indices length must be ${s}`);let L=E.map(f).join(",");return s===0?B("0u"):s===1?B(L[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${L})`)},Z=E=>s<2?B(E):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${E})`),R=s<2?"":`
  fn set_${e}ByIndices(indices: ${p.indices}, value: ${l}) {
    ${G(`i2o_${e}(indices)`,"value")}
  }`,Q=s<2?"":(()=>{let E=a.map(oe=>`d${oe}: u32`).join(", "),L=a.map(oe=>`d${oe}`).join(", ");return`
  fn set_${e}(${E}, value: ${l}) {
    set_${e}ByIndices(${I(L)}, value);
  }`})();return{impl:()=>{let E=[],L=!1;return m.offsetToIndices&&(E.push(_),L=!0),m.indicesToOffset&&(E.push($),L=!0),m.broadcastedIndicesToOffset&&(Object.values(M).forEach(oe=>E.push(oe)),L=!0),m.set&&(E.push(Q),L=!0),m.setByIndices&&(E.push(R),L=!0),m.get&&(E.push(W),L=!0),m.getByIndices&&(E.push(ee),L=!0),!i&&L&&E.unshift(`const ${b} = ${p.indices}(${n.join(",")});`,`const ${y} = ${p.indices}(${x.computeStrides(n).join(",")});`),E.join(`
`)},type:p,offsetToIndices:w,indicesToOffset:T,broadcastedIndicesToOffset:U,indices:I,indicesGet:A,indicesSet:z,set:(...E)=>{if(E.length!==s+1)throw new Error(`indices length must be ${s}`);let L=E[s];if(typeof L!="string")throw new Error("value must be string");let oe=E.slice(0,s).map(f).join(",");return s===0?G("0u",L):s===1?G(oe[0],L):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${oe}, ${L})`)},setByOffset:G,setByIndices:(E,L)=>s<2?G(E,L):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${E}, ${L});`),get:D,getByOffset:B,getByIndices:Z,usage:r,name:e,strides:y,shape:b,rank:s}},S=(e,t,n,r=1)=>Qt(e,t,n,"input",r),C=(e,t,n,r=1)=>Qt(e,t,n,"output",r),So=(e,t,n)=>Qt(e,t,n,"atomicOutput",1),Xt=(e,t,n,r=1)=>Qt(e,t,n,"internal",r),Gn=class{constructor(t,n){this.normalizedDispatchGroup=t;this.limits=n;this.internalVariables=[];this.variables=[];this.uniforms=[];this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(t){return`if (global_idx >= ${typeof t=="number"?`${t}u`:t}) { return; }`}mainStart(t=Ye){let n=typeof t=="number"?t:t[0],r=typeof t=="number"?1:t[1],o=typeof t=="number"?1:t[2];if(n>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||o>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${n}, ${r}, ${o}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(n*r*o>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${n}, ${r}, ${o}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let i=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,s=i?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,a=i?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${n*r*o}u + local_idx;`;return`@compute @workgroup_size(${n}, ${r}, ${o})
  fn main(${s}) {
    ${a}
  `}appendVariableUniforms(t){t.rank!==0&&(t.shape.startsWith("uniforms.")&&this.uniforms.push({name:t.shape.replace("uniforms.",""),type:"u32",length:t.rank}),t.strides.startsWith("uniforms.")&&this.uniforms.push({name:t.strides.replace("uniforms.",""),type:"u32",length:t.rank}))}declareVariable(t,n){if(t.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(t),this.appendVariableUniforms(t);let r=t.usage==="input"?"read":"read_write",o=t.usage==="atomicOutput"?"atomic<i32>":t.type.storage;return`@group(0) @binding(${n}) var<storage, ${r}> ${t.name}: array<${o}>;`}declareVariables(...t){return t.map(n=>this.declareVariable(n,this.variableIndex++)).join(`
`)}registerInternalVariable(t){if(t.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(t),this.appendVariableUniforms(t)}registerInternalVariables(...t){return t.forEach(n=>this.registerInternalVariable(n)),this}registerUniform(t,n,r=1){return this.uniforms.push({name:t,type:n,length:r}),this}registerUniforms(t){return this.uniforms=this.uniforms.concat(t),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let t=[];for(let{name:n,type:r,length:o}of this.uniforms)if(o&&o>4)r==="f16"?t.push(`@align(16) ${n}:array<mat2x4<${r}>, ${Math.ceil(o/8)}>`):t.push(`${n}:array<vec4<${r}>, ${Math.ceil(o/4)}>`);else{let i=o==null||o===1?r:`vec${o}<${r}>`;t.push(`${n}:${i}`)}return`
      struct Uniforms { ${t.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(t=>t.impl()).join(`
`)+this.internalVariables.map(t=>t.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let t=n=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(n)];return this.uniforms.map(n=>[t(n.type),n.length??1])}},To=(e,t)=>new Gn(e,t)});var cd,Io,pd,md,fd,hd,pe,Co,Ao,Ve=k(()=>{"use strict";V();q();ie();K();cd=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Io=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),pd=(e,t)=>x.sortBasedOnPerm(e,Io(e.length,t)),md=(e,t,n,r)=>{let o=`fn perm(i: ${r.type.indices}) -> ${n.type.indices} {
    var a: ${n.type.indices};`;for(let i=0;i<t;++i)o+=`a[${e[i]}]=i[${i}];`;return o+="return a;}"},fd=(e,t)=>{let n=[],r=[];for(let o=0;o<e.length;++o)e[o]!==1&&n.push(e[o]),e[t[o]]!==1&&r.push(t[o]);return{newShape:n,newPerm:r}},hd=(e,t)=>{let n=0;for(let r=0;r<e.length;++r)if(t[e[r]]!==1){if(e[r]<n)return!1;n=e[r]}return!0},pe=(e,t)=>{let n=e.dataType,r=e.dims.length,o=Io(r,t),i=pd(e.dims,o),s=e.dims,a=i,u=r<2||hd(o,e.dims),d;if(u)return d=h=>{let b=S("input",n,s,4),y=C("output",n,a,4);return`
  ${h.registerUniform("output_size","u32").declareVariables(b,y)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let h=x.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(h/64/4)},programUniforms:[{type:12,data:Math.ceil(h/4)}]}},getShaderSource:d};let{newShape:l,newPerm:c}=fd(e.dims,o),p=x.areEqual(c,[2,3,1]),f=x.areEqual(c,[3,1,2]);if(l.length===2||p||f){s=p?[l[0],l[1]*l[2]]:f?[l[0]*l[1],l[2]]:l,a=[s[1],s[0]];let h=16;return d=b=>{let y=S("a",n,s.length),g=C("output",n,a.length);return`
  ${b.registerUniform("output_size","u32").declareVariables(y,g)}
  var<workgroup> tile : array<array<${g.type.value}, ${h+1}>, ${h}>;
  ${b.mainStart([h,h,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${h} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${h}u + local_id.x;
    let input_row = workgroup_id_x * ${h}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${y.getByIndices(`${y.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${h}u + local_id.x;
    let output_row = workgroup_id_y * ${h}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${g.setByIndices(`${g.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=x.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(a[1]/h),y:Math.ceil(a[0]/h)},programUniforms:[{type:12,data:b},...P(s,a)]}},getShaderSource:d}}return d=h=>{let b=S("a",n,s.length),y=C("output",n,a.length);return`
  ${h.registerUniform("output_size","u32").declareVariables(b,y)}

  ${md(o,r,b,y)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${y.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${y.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let h=x.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:[{type:12,data:h},...P(s,a)]}},getShaderSource:d}},Co=(e,t)=>{cd(e.inputs,t.perm),e.compute(pe(e.inputs[0],t.perm))},Ao=e=>N({perm:e.perm})});var gd,yd,bd,_d,wd,$d,vd,xd,Sd,Td,ze,Eo,ko,Po,zo,Bo,Do,Oo,Mo,Uo,Ro,Vo=k(()=>{"use strict";V();q();K();Yt();Ve();gd={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},yd={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},bd={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},_d={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},wd=(e,t)=>{let n=[];for(let r=t-e;r<t;++r)n.push(r);return n},$d=(e,t)=>{let n=[],r=e.length;for(let i=0;i<r;i++)t.indexOf(i)===-1&&n.push(e[i]);let o=t.map(i=>e[i]);return[n,o]},vd=(e,t)=>{let n=e.length+t.length,r=[],o=0;for(let i=0;i<n;i++)t.indexOf(i)===-1?r.push(e[o++]):r.push(1);return r},xd=(e,t)=>{for(let n=0;n<e.length;++n)if(e[e.length-n-1]!==t-1-n)return!1;return!0},Sd=(e,t)=>{let n=[];if(!xd(e,t)){for(let r=0;r<t;++r)e.indexOf(r)===-1&&n.push(r);e.forEach(r=>n.push(r))}return n},Td=(e,t,n,r,o,i,s)=>{let a=n[0].dims,u=x.size(i),d=x.size(s),l=S("_A",n[0].dataType,a),c=C("output",o,i),p=64;u===1&&(p=256);let f=`
          var<workgroup> aBestValues : array<f32, ${p}>;
       `,m=h=>`
        ${h.registerUniform("reduceSize","u32").declareVariables(l,c)}
        ${f}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${h.mainStart(p)}

          let outputIndex = global_idx / ${p};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${bd[r]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${p}) {
           let candidate = f32(${l.getByOffset("offset + k")});
           bestValue = ${gd[r]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${p}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${yd[r]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${c.setByOffset("outputIndex",`${r==="mean"?`${c.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${c.type.storage}(${_d[r]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${p}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:i,dataType:o}],dispatchGroup:{x:u},programUniforms:[{type:12,data:d}]})}},ze=(e,t,n,r)=>{let o=e.inputs.length===1?n:Fn(e.inputs,n),i=o.axes;i.length===0&&!o.noopWithEmptyAxes&&(i=e.inputs[0].dims.map((f,m)=>m));let s=x.normalizeAxes(i,e.inputs[0].dims.length),a=s,u=e.inputs[0],d=Sd(a,e.inputs[0].dims.length);d.length>0&&(u=e.compute(pe(e.inputs[0],d),{inputs:[0],outputs:[-1]})[0],a=wd(a.length,u.dims.length));let[l,c]=$d(u.dims,a),p=l;o.keepDims&&(p=vd(l,s)),e.compute(Td(t,o.cacheKey,[u],r,e.inputs[0].dataType,p,c),{inputs:[u]})},Eo=(e,t)=>{ze(e,"ReduceMeanShared",t,"mean")},ko=(e,t)=>{ze(e,"ReduceL1Shared",t,"l1")},Po=(e,t)=>{ze(e,"ReduceL2Shared",t,"l2")},zo=(e,t)=>{ze(e,"ReduceLogSumExpShared",t,"logSumExp")},Bo=(e,t)=>{ze(e,"ReduceMaxShared",t,"max")},Do=(e,t)=>{ze(e,"ReduceMinShared",t,"min")},Oo=(e,t)=>{ze(e,"ReduceProdShared",t,"prod")},Mo=(e,t)=>{ze(e,"ReduceSumShared",t,"sum")},Uo=(e,t)=>{ze(e,"ReduceSumSquareShared",t,"sumSquare")},Ro=(e,t)=>{ze(e,"ReduceLogSumShared",t,"logSum")}});var Be,Id,Jt,Fn,De,Cd,Ad,Ed,kd,Pd,zd,Bd,Dd,Od,Md,Oe,No,Lo,Wo,Go,Ho,qo,Fo,Ko,jo,Zo,Yt=k(()=>{"use strict";V();q();ie();K();Vo();Be=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Id=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Jt=(e,t,n,r,o,i,s=!1,a=!1)=>{let u=[],d=n[0].dims,l=d.length,c=x.normalizeAxes(o,l),p=!a&&c.length===0;d.forEach((b,y)=>{p||c.indexOf(y)>=0?s&&u.push(1):u.push(b)});let f=u.length,m=x.size(u);return{name:e,shaderCache:t,getShaderSource:b=>{let y=[],g=S("_A",n[0].dataType,l),_=C("output",i,f),w=r(g,_,c),v=w[2];for(let $=0,T=0;$<l;$++)p||c.indexOf($)>=0?(s&&T++,v=`for(var j${$}: u32 = 0; j${$} < ${d[$]}; j${$}++) {
                  ${w[2].includes("last_index")?`let last_index = j${$};`:""}
                  ${g.indicesSet("input_indices",$,`j${$}`)}
                  ${v}
                }`):(y.push(`${g.indicesSet("input_indices",$,_.indicesGet("output_indices",T))};`),T++);return`

        ${b.registerUniform("output_size","u32").declareVariables(g,_)}

        ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${g.type.indices};
          let output_indices = ${_.offsetToIndices("global_idx")};

          ${y.join(`
`)}
          ${w[0]}       // init ops for reduce max/min
          ${w[1]}
          ${v}
          ${w[3]}
          ${w.length===4?_.setByOffset("global_idx","value"):w.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:i}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...P(d,u)]})}},Fn=(e,t)=>{let n=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(r=>n.push(Number(r))),N({axes:n,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},De=(e,t,n,r)=>{let o=e.inputs,i=o.length===1?n:Fn(o,n);e.compute(Jt(t,{hint:i.cacheKey,inputDependencies:["rank"]},[o[0]],i.noopWithEmptyAxes&&i.axes.length===0?Id:r,i.axes,o[0].dataType,i.keepDims,i.noopWithEmptyAxes),{inputs:[0]})},Cd=(e,t)=>{Be(e.inputs),De(e,"ReduceLogSum",t,(r,o)=>[`var value = ${o.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},Ad=(e,t)=>{Be(e.inputs),De(e,"ReduceL1",t,(r,o)=>[`var value = ${o.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},Ed=(e,t)=>{Be(e.inputs),De(e,"ReduceL2",t,(r,o)=>[`var t = ${o.type.value}(0); var value = ${o.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},kd=(e,t)=>{Be(e.inputs),De(e,"ReduceLogSumExp",t,(r,o)=>[`var value = ${o.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},Pd=(e,t)=>{Be(e.inputs),De(e,"ReduceMax",t,(r,o,i)=>{let s=[];for(let a=0;a<r.rank;a++)(i.indexOf(a)>=0||i.length===0)&&s.push(r.indicesSet("input_indices",a,0));return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},zd=(e,t)=>{Be(e.inputs),De(e,"ReduceMean",t,(r,o,i)=>{let s=1;for(let a=0;a<r.rank;a++)(i.indexOf(a)>=0||i.length===0)&&(s*=e.inputs[0].dims[a]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${o.type.value}(sum / ${s});`]})},Bd=(e,t)=>{Be(e.inputs),De(e,"ReduceMin",t,(r,o,i)=>{let s=[];for(let a=0;a<r.rank;a++)(i.indexOf(a)>=0||i.length===0)&&s.push(`input_indices[${a}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},Dd=(e,t)=>{Be(e.inputs),De(e,"ReduceProd",t,(r,o)=>[`var value = ${o.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},Od=(e,t)=>{Be(e.inputs),De(e,"ReduceSum",t,(r,o)=>[`var value = ${o.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},Md=(e,t)=>{Be(e.inputs),De(e,"ReduceSumSquare",t,(r,o)=>[`var t = ${o.type.value}(0); var value = ${o.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Oe=(e,t,n)=>{if(t.length===0)return n;let r=1,o=1;for(let i=0;i<t.length;i++)t.indexOf(i)===-1?r*=e[i]:o*=e[i];return o<32&&r>1024},No=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?zd(e,t):Eo(e,t)},Lo=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ad(e,t):ko(e,t)},Wo=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ed(e,t):Po(e,t)},Go=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?kd(e,t):zo(e,t)},Ho=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Pd(e,t):Bo(e,t)},qo=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Bd(e,t):Do(e,t)},Fo=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Dd(e,t):Oo(e,t)},Ko=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Od(e,t):Mo(e,t)},jo=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Md(e,t):Uo(e,t)},Zo=(e,t)=>{Oe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cd(e,t):Ro(e,t)}});var Qo,Xo,Yo,Kn,Jo=k(()=>{"use strict";V();ie();Yt();Qo=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Xo=(e,t)=>{Qo(e.inputs);let n=(r,o,i)=>{let s=[];for(let a=0;a<r.rank;a++)(i.indexOf(a)>=0||i.length===0)&&s.push(`input_indices[${a}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${r.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${r.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",o.setByOffset("global_idx","best_index")]};e.compute(Jt("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],n,[t.axis],7,t.keepDims),{inputs:[0]})},Yo=(e,t)=>{Qo(e.inputs);let n=(r,o,i)=>{let s=[];for(let a=0;a<r.rank;a++)(i.indexOf(a)>=0||i.length===0)&&s.push(`input_indices[${a}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${r.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${r.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",o.setByOffset("global_idx","best_index")]};e.compute(Jt("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],n,[t.axis],7,t.keepDims),{inputs:[0]})},Kn=e=>N(e)});var Ud,jn,Rd,Vd,Nd,ot,Ld,ei,en=k(()=>{"use strict";V();q();Zt();K();Ud=(e,t)=>{let n=e[0],r=e[1],o=e[2],i=e[3],s=e[4],a=e[5];if(s&&a)throw new Error("Attention cannot have both past and attention_bias");if(n.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=n.dims[0],d=n.dims[1],l=n.dims[2];if(o.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(r.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(r.dims[0]!==l)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(o.dims[0]!==r.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let c=o.dims[0]/3,p=c,f=p;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let _ of t.qkvHiddenSizes)if(_%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");c=t.qkvHiddenSizes[0],p=t.qkvHiddenSizes[1],f=t.qkvHiddenSizes[2]}let m=d;if(c!==p)throw new Error("qkv_hidden_sizes first element should be same as the second");if(o.dims[0]!==c+p+f)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let h=0;if(s){if(p!==f)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==p/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(h=s.dims[3])}let b=m+h,y=-1,g=0;if(i)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(a){if(a.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(a.dims[0]!==u||a.dims[1]!==t.numHeads||a.dims[2]!==d||a.dims[3]!==b)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:d,pastSequenceLength:h,kvSequenceLength:m,totalSequenceLength:b,maxSequenceLength:y,inputHiddenSize:l,hiddenSize:c,vHiddenSize:f,headSize:Math.floor(c/t.numHeads),vHeadSize:Math.floor(f/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:g,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},jn=(e,t,n)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${n?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,Rd=(e,t,n,r,o,i,s,a)=>{let u=X(s?1:i),d=64,l=i/u;l<d&&(d=32);let c=Math.ceil(i/u/d),p=[{type:12,data:t},{type:12,data:n},{type:12,data:r},{type:12,data:o},{type:12,data:l},{type:12,data:c}],f=re(e.dataType,u),m=ce(1,u),h=["type"];s&&h.push("type"),a&&h.push("type");let b=y=>{let g=C("x",e.dataType,e.dims,u),_=[g],w=s?S("seq_lens",s.dataType,s.dims):void 0;w&&_.push(w);let v=a?S("total_sequence_length_input",a.dataType,a.dims):void 0;v&&_.push(v);let $=ce(e.dataType),T=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${d}>;
  var<workgroup> thread_sum: array<f32, ${d}>;
  ${y.registerUniforms(T).declareVariables(..._)}
  ${y.mainStart([d,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${jn(w,v,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${d}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${m}(-3.402823e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${m}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.402823e+38f);
    for (var i = 0u; i < ${d}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${m}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${m}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${d}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${g.type.value}(${$}(1.0) / ${$}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${m}(x[offset + i]);
        x[offset + i] = ${g.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${g.type.value}(${$}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${d};${f};${u}`,inputDependencies:h},getShaderSource:b,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:o,z:t*n},programUniforms:p})}},Vd=(e,t,n,r,o,i,s,a,u)=>{let d=s+i.kvSequenceLength,l=[i.batchSize,i.numHeads,i.sequenceLength,d],c=e>1&&r,p=i.kvNumHeads?i.kvNumHeads:i.numHeads,f=c?[i.batchSize,p,d,i.headSize]:void 0,m=i.nReps?i.nReps:1,h=i.scale===0?1/Math.sqrt(i.headSize):i.scale,b=X(i.headSize),y=i.headSize/b,g=12,_={x:Math.ceil(d/g),y:Math.ceil(i.sequenceLength/g),z:i.batchSize*i.numHeads},w=[{type:12,data:i.sequenceLength},{type:12,data:y},{type:12,data:d},{type:12,data:i.numHeads},{type:12,data:i.headSize},{type:1,data:h},{type:12,data:s},{type:12,data:i.kvSequenceLength},{type:12,data:m}],v=c&&r&&x.size(r.dims)>0,$=["type","type"];v&&$.push("type"),o&&$.push("type"),a&&$.push("type"),u&&$.push("type");let T=[{dims:l,dataType:t.dataType,gpuDataType:0}];c&&T.push({dims:f,dataType:t.dataType,gpuDataType:0});let I=A=>{let z=S("q",t.dataType,t.dims,b),M=S("key",n.dataType,n.dims,b),U=[z,M];if(v){let R=S("past_key",r.dataType,r.dims,b);U.push(R)}o&&U.push(S("attention_bias",o.dataType,o.dims));let G=a?S("seq_lens",a.dataType,a.dims):void 0;G&&U.push(G);let B=u?S("total_sequence_length_input",u.dataType,u.dims):void 0;B&&U.push(B);let ee=C("output",t.dataType,l),W=[ee];c&&W.push(C("present_key",t.dataType,f,b));let D=ce(1,b),Z=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${g}u;

  var<workgroup> tileQ: array<${z.type.storage}, ${g*g}>;
  var<workgroup> tileK: array<${z.type.storage}, ${g*g}>;
  ${A.registerUniforms(Z).declareVariables(...U,...W)}
  ${A.mainStart([g,g,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${jn(G,B,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${v&&c?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${c?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${D}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${v&&c?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${c?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${D}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(b){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${b}`)}})()};
        output[outputIdx] = ${ee.type.value} (sum * uniforms.alpha) + ${o?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${b};${o!==void 0};${r!==void 0};${e}`,inputDependencies:$},getRunData:()=>({outputs:T,dispatchGroup:_,programUniforms:w}),getShaderSource:I}},Nd=(e,t,n,r,o,i,s=void 0,a=void 0)=>{let u=i+o.kvSequenceLength,d=o.nReps?o.nReps:1,l=o.vHiddenSize*d,c=e>1&&r,p=o.kvNumHeads?o.kvNumHeads:o.numHeads,f=c?[o.batchSize,p,u,o.headSize]:void 0,m=[o.batchSize,o.sequenceLength,l],h=12,b={x:Math.ceil(o.vHeadSize/h),y:Math.ceil(o.sequenceLength/h),z:o.batchSize*o.numHeads},y=[{type:12,data:o.sequenceLength},{type:12,data:u},{type:12,data:o.vHeadSize},{type:12,data:o.numHeads},{type:12,data:o.headSize},{type:12,data:l},{type:12,data:i},{type:12,data:o.kvSequenceLength},{type:12,data:d}],g=c&&r&&x.size(r.dims)>0,_=["type","type"];g&&_.push("type"),s&&_.push("type"),a&&_.push("type");let w=[{dims:m,dataType:t.dataType,gpuDataType:0}];c&&w.push({dims:f,dataType:t.dataType,gpuDataType:0});let v=$=>{let T=S("probs",t.dataType,t.dims),I=S("v",n.dataType,n.dims),A=[T,I];g&&A.push(S("past_value",r.dataType,r.dims));let z=s?S("seq_lens",s.dataType,s.dims):void 0;s&&A.push(z);let M=a?S("total_sequence_length_input",a.dataType,a.dims):void 0;a&&A.push(M);let G=[C("output",t.dataType,m)];c&&G.push(C("present_value",t.dataType,f));let B=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${h}u;
  var<workgroup> tileQ: array<${T.type.value}, ${h*h}>;
  var<workgroup> tileV: array<${T.type.value}, ${h*h}>;
  ${$.registerUniforms(B).declareVariables(...A,...G)}
  ${$.mainStart([h,h,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${d===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${d===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${jn(z,M,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${g&&c?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${c?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${T.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${g&&c?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${c?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${r!==void 0};${e}`,inputDependencies:_},getRunData:()=>({outputs:w,dispatchGroup:b,programUniforms:y}),getShaderSource:v}},ot=(e,t,n,r,o,i,s,a,u,d,l=void 0,c=void 0)=>{let p=Math.min(e.outputCount,1+(s?1:0)+(a?1:0)),f=p>1?d.pastSequenceLength:0,m=f+d.kvSequenceLength,h=u&&x.size(u.dims)>0?u:void 0,b=[t,n];p>1&&s&&x.size(s.dims)>0&&b.push(s),h&&b.push(h),l&&b.push(l),c&&b.push(c);let y=e.compute(Vd(p,t,n,s,h,d,f,l,c),{inputs:b,outputs:p>1?[-1,1]:[-1]})[0];e.compute(Rd(y,d.batchSize,d.numHeads,f,d.sequenceLength,m,l,c),{inputs:l&&c?[y,l,c]:[y],outputs:[]});let g=[y,r];p>1&&a&&x.size(a.dims)>0&&g.push(a),l&&g.push(l),c&&g.push(c),e.compute(Nd(p,y,r,a,d,f,l,c),{inputs:g,outputs:p>1?[0,2]:[0]})},Ld=(e,t)=>{let n=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],r=t.sequenceLength,o=t.inputHiddenSize,i=t.headSize,s=12,a={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],d=[{type:12,data:r},{type:12,data:o},{type:12,data:i},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],l=c=>{let p=C("output_q",u[0].dataType,n),f=C("output_k",u[0].dataType,n),m=C("output_v",u[0].dataType,n),h=S("input",u[0].dataType,u[0].dims),b=S("weight",u[1].dataType,u[1].dims),y=S("bias",u[2].dataType,u[2].dims),g=h.type.storage,_=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${g}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${g}, ${s*s}>;
  var<workgroup> tileWeightK: array<${g}, ${s*s}>;
  var<workgroup> tileWeightV: array<${g}, ${s*s}>;
  ${c.registerUniforms(_).declareVariables(h,b,y,p,f,m)}
  ${c.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${g}(0);
    var valueK = ${g}(0);
    var valueV = ${g}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:n,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:a,programUniforms:d}),getShaderSource:l},{inputs:u,outputs:[-1,-1,-1]})},ei=(e,t)=>{let n=Ud(e.inputs,t),[r,o,i]=Ld(e,n);return ot(e,r,o,i,e.inputs[4],void 0,void 0,void 0,e.inputs[5],n)}});var Wd,Gd,Hd,ti,ni=k(()=>{"use strict";ye();V();q();ie();K();Wd=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let n=(r,o,i)=>{let s=o.length;if(s!==r.length)throw new Error(`${i}: num dimensions != ${s}`);o.forEach((a,u)=>{if(a!==r[u])throw new Error(`${i}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let r=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);n(e[1].dims,r,"Invalid input scale"),n(e[2].dims,r,"Invalid input B"),n(e[3].dims,r,"Invalid input mean"),n(e[4].dims,r,"Invalid input var")}else n(e[1].dims,[1],"Invalid input scale"),n(e[2].dims,[1],"Invalid input B"),n(e[3].dims,[1],"Invalid input mean"),n(e[4].dims,[1],"Invalid input var")},Gd=(e,t)=>{let{epsilon:n,spatial:r,format:o}=t,i=e[0].dims,s=r?X(i[i.length-1]):1,a=o==="NHWC"&&i.length>1?s:1,u=x.size(i)/s,d=r,l=d?i.length:i,c=S("x",e[0].dataType,e[0].dims,s),p=S("scale",e[1].dataType,e[1].dims,a),f=S("bias",e[2].dataType,e[2].dims,a),m=S("inputMean",e[3].dataType,e[3].dims,a),h=S("inputVar",e[4].dataType,e[4].dims,a),b=C("y",e[0].dataType,l,s),y=()=>{let _="";if(r)_=`let cOffset = ${i.length===1?"0u":o==="NHWC"?`outputIndices[${i.length-1}] / ${s}`:"outputIndices[1]"};`;else if(o==="NCHW")_=`
            ${b.indicesSet("outputIndices","0","0")}
            let cOffset = ${b.indicesToOffset("outputIndices")};`;else{_=`var cIndices = ${p.type.indices}(0);
                       cIndices[0] = outputIndices[${i.length-1}];`;for(let w=1;w<p.rank;w++)_+=`cIndices[${w}] = outputIndices[${w}];`;_+=`let cOffset = ${p.indicesToOffset("cIndices")};`}return _},g=_=>`
  const epsilon = ${n};
  ${_.registerUniform("outputSize","u32").declareVariables(c,p,f,m,h,b)}
  ${_.mainStart()}
  ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${b.offsetToIndices(`global_idx * ${s}`)};
    ${y()}
    let scale = ${p.getByOffset("cOffset")};
    let bias = ${f.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${h.getByOffset("cOffset")};
    let x = ${c.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${b.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${r}_${s}`,inputDependencies:d?["rank","type","type","type","type"]:void 0},getShaderSource:g,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d?[{type:12,data:u},...P(i)]:[{type:12,data:u}]})}},Hd=e=>N(e),ti=(e,t)=>{let{inputs:n,outputCount:r}=e,o=Hd({...t,outputCount:r});if(te.webgpu.validateInputContent&&Wd(n,o),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Gd(n,o))}});var qd,Fd,ri,oi=k(()=>{"use strict";q();K();qd=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Fd=e=>{let t=e[0].dims,n=e[0].dims[2],r=x.size(t)/4,o=e[0].dataType,i=S("input",o,t,4),s=S("bias",o,[n],4),a=S("residual",o,t,4),u=C("output",o,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)}}),getShaderSource:l=>`
  const channels = ${n}u / 4;
  ${l.declareVariables(i,s,a,u)}

  ${l.mainStart()}
    ${l.guardAgainstOutOfBoundsWorkgroupSizes(r)}
    let value = ${i.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${a.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},ri=e=>{qd(e.inputs),e.compute(Fd(e.inputs))}});var Kd,J,ii,si,ai,ui,di,li,ci,pi,mi,jd,fi,hi,gi,yi,gt,bi,tn,_i,wi,$i,vi,xi,Si,Ti,Ii,Ci,Ai,Ei,ki,Pi,zi,Bi,Di,Oi,Mi,Zn,Qn,Ui,Ri,Vi,Zd,Qd,Ni,nn=k(()=>{"use strict";V();q();ie();K();Kd=(e,t,n,r,o,i,s)=>{let a=Math.ceil(t/4),u="";typeof o=="string"?u=`${o}(a)`:u=o("a");let d=S("inputData",n,[a],4),l=C("outputData",r,[a],4),c=[{name:"vec_size",type:"u32"}];return s&&c.push(...s),`
      ${e.registerUniforms(c).declareVariables(d,l)}

  ${i??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${d.getByOffset("global_idx")};
    ${l.setByOffset("global_idx",u)}
  }`},J=(e,t,n,r,o,i=e.dataType,s,a)=>{let u=[{type:12,data:Math.ceil(x.size(e.dims)/4)}];return s&&u.push(...s),{name:t,shaderCache:{hint:o,inputDependencies:["type"]},getShaderSource:d=>Kd(d,x.size(e.dims),e.dataType,i,n,r,a),getRunData:d=>({outputs:[{dims:e.dims,dataType:i}],dispatchGroup:{x:Math.ceil(x.size(d[0].dims)/64/4)},programUniforms:u})}},ii=e=>{e.compute(J(e.inputs[0],"Abs","abs"))},si=e=>{e.compute(J(e.inputs[0],"Acos","acos"))},ai=e=>{e.compute(J(e.inputs[0],"Acosh","acosh"))},ui=e=>{e.compute(J(e.inputs[0],"Asin","asin"))},di=e=>{e.compute(J(e.inputs[0],"Asinh","asinh"))},li=e=>{e.compute(J(e.inputs[0],"Atan","atan"))},ci=e=>{e.compute(J(e.inputs[0],"Atanh","atanh"))},pi=e=>N(e),mi=(e,t)=>{let n;switch(t.to){case 10:n="vec4<f16>";break;case 1:n="vec4<f32>";break;case 12:n="vec4<u32>";break;case 6:n="vec4<i32>";break;case 9:n="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(J(e.inputs[0],"Cast",n,void 0,t.cacheKey,t.to))},jd=e=>{let t,n,r=e.length>=2&&e[1].data!==0,o=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=r?e[1].getFloat32Array()[0]:-34028234663852886e22,n=o?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=r?e[1].getUint16Array()[0]:64511,n=o?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return N({min:t,max:n})},fi=(e,t)=>{let n=t||jd(e.inputs),r=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"Clip",o=>`clamp(${o}, vec4<${r}>(uniforms.min), vec4<${r}>(uniforms.max))`,void 0,n.cacheKey,void 0,[{type:e.inputs[0].dataType,data:n.min},{type:e.inputs[0].dataType,data:n.max}],[{name:"min",type:r},{name:"max",type:r}]),{inputs:[0]})},hi=e=>{e.compute(J(e.inputs[0],"Ceil","ceil"))},gi=e=>{e.compute(J(e.inputs[0],"Cos","cos"))},yi=e=>{e.compute(J(e.inputs[0],"Cosh","cosh"))},gt=e=>N(e),bi=(e,t)=>{let n=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"Elu",r=>`elu_vf32(${r})`,`
  const elu_alpha_ = ${n}(${t.alpha});

  fn elu_f32(a: ${n}) -> ${n} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${n}>) -> vec4<${n}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},tn=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,_i=e=>{let t=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"Erf",n=>`erf_vf32(${n})`,tn(t)))},wi=e=>{e.compute(J(e.inputs[0],"Exp","exp"))},$i=e=>{e.compute(J(e.inputs[0],"Floor","floor"))},vi=e=>{let t=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"Gelu",n=>`0.5 * ${n} * (1.0 + erf_vf32(${n} * 0.7071067811865475))`,tn(t)))},xi=(e,t)=>{let n=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"LeakyRelu",r=>`select(leaky_relu_alpha_ * ${r}, ${r}, ${r} >= vec4<${n}>(0.0))`,`const leaky_relu_alpha_ = ${n}(${t.alpha});`,t.cacheKey))},Si=e=>{e.compute(J(e.inputs[0],"Not",t=>`!${t}`))},Ti=e=>{e.compute(J(e.inputs[0],"Neg",t=>`-${t}`))},Ii=e=>{e.compute(J(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Ci=e=>{let t=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"Relu",n=>`select(vec4<${t}>(0.0), ${n}, ${n} > vec4<${t}>(0.0))`))},Ai=e=>{e.compute(J(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Ei=e=>N(e),ki=(e,t)=>{let n=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"HardSigmoid",r=>`max(vec4<${n}>(0.0), min(vec4<${n}>(1.0), ${t.alpha} * ${r} + vec4<${n}>(${t.beta})))`,void 0,t.cacheKey))},Pi=e=>{e.compute(J(e.inputs[0],"Sin","sin"))},zi=e=>{e.compute(J(e.inputs[0],"Sinh","sinh"))},Bi=e=>{e.compute(J(e.inputs[0],"Sqrt","sqrt"))},Di=e=>{e.compute(J(e.inputs[0],"Tan","tan"))},Oi=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Mi=e=>{e.compute(J(e.inputs[0],"Tanh",Oi))},Zn=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Oi("v")};
}
`,Qn=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Ui=e=>{let t=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"FastGelu",Qn,Zn(t),void 0,e.inputs[0].dataType))},Ri=(e,t)=>{let n=ce(e.inputs[0].dataType);return e.compute(J(e.inputs[0],"ThresholdedRelu",r=>`select(vec4<${n}>(0.0), ${r}, ${r} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${n}>(${t.alpha});`,t.cacheKey)),0},Vi=e=>{e.compute(J(e.inputs[0],"Log","log"))},Zd=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,Qd=e=>`quick_gelu_impl(${e})`,Ni=(e,t)=>{let n=ce(e.inputs[0].dataType);e.compute(J(e.inputs[0],"QuickGelu",Qd,Zd(n,t.alpha),t.cacheKey,e.inputs[0].dataType))}});var Xd,Yd,Wi,Gi=k(()=>{"use strict";q();K();nn();Xd=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Yd=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let n=S("input",e[0].dataType,e[0].dims,4),r=S("bias",e[0].dataType,[e[0].dims[2]],4),o=C("output",e[0].dataType,t,4),i=x.size(t)/4,s=re(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:u=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${u.declareVariables(n,r,o)}

  ${tn(s)}

  ${u.mainStart()}
    ${u.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${o.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Wi=e=>{Xd(e.inputs),e.compute(Yd(e.inputs))}});var Jd,el,Me,Hi,qi,Fi,Ki,ji,Zi,Qi,Xi,Yi,Ji,es=k(()=>{"use strict";V();q();K();Jd=(e,t,n,r,o,i,s,a,u,d,l,c)=>{let p,f;typeof a=="string"?p=f=(g,_)=>`${a}((${g}),(${_}))`:typeof a=="function"?p=f=a:(p=a.scalar,f=a.vector);let m=C("outputData",l,r.length,4),h=S("aData",u,t.length,4),b=S("bData",d,n.length,4),y;if(o)if(i){let g=x.size(t)===1,_=x.size(n)===1,w=t.length>0&&t[t.length-1]%4===0,v=n.length>0&&n[n.length-1]%4===0;g||_?y=m.setByOffset("global_idx",f(g?`${h.type.value}(${h.getByOffset("0")}.x)`:h.getByOffset("global_idx"),_?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"))):y=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${h.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${b.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",f(s||w?h.getByOffset("offsetA / 4u"):`${h.type.value}(${h.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||v?b.getByOffset("offsetB / 4u"):`${b.type.value}(${b.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else y=m.setByOffset("global_idx",f(h.getByOffset("global_idx"),b.getByOffset("global_idx")));else{if(!i)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let g=(_,w,v="")=>{let $=`aData[indexA${w}][componentA${w}]`,T=`bData[indexB${w}][componentB${w}]`;return`
            let outputIndices${w} = ${m.offsetToIndices(`global_idx * 4u + ${w}u`)};
            let offsetA${w} = ${h.broadcastedIndicesToOffset(`outputIndices${w}`,m)};
            let offsetB${w} = ${b.broadcastedIndicesToOffset(`outputIndices${w}`,m)};
            let indexA${w} = offsetA${w} / 4u;
            let indexB${w} = offsetB${w} / 4u;
            let componentA${w} = offsetA${w} % 4u;
            let componentB${w} = offsetB${w} % 4u;
            ${_}[${w}] = ${v}(${p($,T)});
          `};l===9?y=`
            var data = vec4<u32>(0);
            ${g("data",0,"u32")}
            ${g("data",1,"u32")}
            ${g("data",2,"u32")}
            ${g("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:y=`
            ${g("outputData[global_idx]",0)}
            ${g("outputData[global_idx]",1)}
            ${g("outputData[global_idx]",2)}
            ${g("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(h,b,m)}

        ${c??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${y}
      }`},el=(e,t,n,r,o,i,s=n.dataType)=>{let a=n.dims.map(h=>Number(h)??1),u=r.dims.map(h=>Number(h)??1),d=!x.areEqual(a,u),l=a,c=x.size(a),p=!1,f=!1,m=[d];if(d){let h=Pe.calcShape(a,u,!1);if(!h)throw new Error("Can't perform binary op on the given tensors");l=h.slice(),c=x.size(l);let b=x.size(a)===1,y=x.size(u)===1,g=a.length>0&&a[a.length-1]%4===0,_=u.length>0&&u[u.length-1]%4===0;m.push(b),m.push(y),m.push(g),m.push(_);let w=1;for(let v=1;v<l.length;v++){let $=a[a.length-v],T=u[u.length-v];if($===T)w*=$;else break}w%4===0?(f=!0,p=!0):(b||y||g||_)&&(p=!0)}else p=!0;return m.push(p),{name:e,shaderCache:{hint:t+m.map(h=>h.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:h=>Jd(h,a,u,l,p,d,f,o,n.dataType,r.dataType,s,i),getRunData:()=>({outputs:[{dims:l,dataType:s}],dispatchGroup:{x:Math.ceil(c/64/4)},programUniforms:[{type:12,data:Math.ceil(x.size(l)/4)},...P(a,u,l)]})}},Me=(e,t,n,r,o,i)=>{e.compute(el(t,o??"",e.inputs[0],e.inputs[1],n,r,i))},Hi=e=>{Me(e,"Add",(t,n)=>`${t}+${n}`)},qi=e=>{Me(e,"Div",(t,n)=>`${t}/${n}`)},Fi=e=>{Me(e,"Equal",{scalar:(t,n)=>`u32(${t}==${n})`,vector:(t,n)=>`vec4<u32>(${t}==${n})`},void 0,void 0,9)},Ki=e=>{Me(e,"Mul",(t,n)=>`${t}*${n}`)},ji=e=>{let t=S("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Me(e,"Pow",{scalar:(r,o)=>`pow_custom(${r},${o})`,vector:(r,o)=>`pow_vector_custom(${r},${o})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},Zi=e=>{Me(e,"Sub",(t,n)=>`${t}-${n}`)},Qi=e=>{Me(e,"Greater",{scalar:(t,n)=>`u32(${t}>${n})`,vector:(t,n)=>`vec4<u32>(${t}>${n})`},void 0,void 0,9)},Xi=e=>{Me(e,"Less",{scalar:(t,n)=>`u32(${t}<${n})`,vector:(t,n)=>`vec4<u32>(${t}<${n})`},void 0,void 0,9)},Yi=e=>{Me(e,"GreaterOrEqual",{scalar:(t,n)=>`u32(${t}>=${n})`,vector:(t,n)=>`vec4<u32>(${t}>=${n})`},void 0,void 0,9)},Ji=e=>{Me(e,"LessOrEqual",{scalar:(t,n)=>`u32(${t}<=${n})`,vector:(t,n)=>`vec4<u32>(${t}<=${n})`},void 0,void 0,9)}});var nl,rl,ol,il,ts,ns,rs=k(()=>{"use strict";V();q();ie();K();nl=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let n=0,r=e[n],o=r.dataType,i=r.dims.length;e.forEach((s,a)=>{if(a!==n){if(s.dataType!==o)throw new Error("input tensors should be one type");if(s.dims.length!==i)throw new Error("input tensors should have the same shape");s.dims.forEach((u,d)=>{if(d!==t&&u!==r.dims[d])throw new Error("non concat dimensions must match")})}})},rl=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,ol=(e,t)=>{let n=e.length,r=[];for(let o=0;o<n;++o){let i=t.setByOffset("global_idx",e[o].getByIndices("indices"));n===1?r.push(i):o===0?r.push(`if (inputIndex == ${o}u) { ${i} }`):o===n-1?r.push(`else { ${i} }`):r.push(`else if (inputIndex == ${o}) { ${i} }`)}return r.join(`
`)},il=(e,t,n,r)=>{let o=x.size(n),i=new Array(e.length),s=new Array(e.length),a=0,u=[],d=[],l=[{type:12,data:o}];for(let h=0;h<e.length;++h)a+=e[h].dims[t],i[h]=a,d.push(e[h].dims.length),s[h]=S(`input${h}`,r,d[h]),u.push("rank"),l.push({type:12,data:i[h]});for(let h=0;h<e.length;++h)l.push(...P(e[h].dims));l.push(...P(n));let c=C("output",r,n.length),p=c.indicesGet("indices",t),f=Array.from(Array(i.length).keys()).map(h=>`uniforms.sizeInConcatAxis${h}`).join(","),m=h=>`

  ${(()=>{h.registerUniform("outputSize","u32");for(let b=0;b<e.length;b++)h.registerUniform(`sizeInConcatAxis${b}`,"u32");return h.declareVariables(...s,c)})()}

  ${rl(i.length,f)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${c.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${p});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${i.length}u>(${f});
      ${p} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${ol(s,c)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:n,dataType:r}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:l}),getShaderSource:m}},ts=(e,t)=>{let n=e.inputs,r=n[0].dims,o=x.normalizeAxis(t.axis,r.length);nl(n,o);let i=r.slice();i[o]=n.reduce((a,u)=>a+(u.dims.length>o?u.dims[o]:0),0);let s=n.filter(a=>x.size(a.dims)>0);e.compute(il(s,o,i,n[0].dataType),{inputs:s})},ns=e=>N({axis:e.axis})});var Ie,Ce,Ae,rn,Fe=k(()=>{"use strict";V();q();Ie=(e,t,n="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${n}(uniforms.clip_min)), ${t}(${n}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${n}(uniforms.alpha) * value + ${n}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${n}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Ce=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Ae=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},rn=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[n,r]=e?.activation_params||[.2,.5];return{activation:t,alpha:n,beta:r}}else if(t==="Clip"){let[n,r]=e?.activation_params||[lo,co];return{activation:t,clipMax:r,clipMin:n}}else if(t==="LeakyRelu"){let[n]=e?.activation_params||[.01];return{activation:t,alpha:n}}return{activation:t}}});var de,os,on=k(()=>{"use strict";de=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},os=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `});var is,ss=k(()=>{"use strict";is=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`});var yt,sn,an=k(()=>{"use strict";V();q();K();Fe();yt=(e,t,n,r,o)=>{let i=r-n;return`
      ${Array.from({length:n}).map((s,a)=>`
      if (${O(t.shape,a,t.rank)} != 1) {
        ${t.indicesSet(e,a,O(o,a+i,r))}
      } else {
        ${t.indicesSet(e,a,0)}
      }`).join("")}
`},sn=(e,t,n,r,o=!1,i)=>{let s=e[0].dims,a=e[1].dims,u=s[s.length-2],d=a[a.length-1],l=s[s.length-1],c=X(d),p=X(l),f=X(u),m=x.size(n)/c/f,h=e.length>2,b=r?r.slice(0,-2):n.slice(0,-2),g=[x.size(b),u,d],_=[{type:12,data:m},{type:12,data:u},{type:12,data:d},{type:12,data:l}];Ce(t,_),_.push(...P(b,s,a)),h&&_.push(...P(e[2].dims)),_.push(...P(g));let w=v=>{let $=Xt("batch_dims",e[0].dataType,b.length),T=S("a",e[0].dataType,s.length,p),I=S("b",e[1].dataType,a.length,c),A=C("output",e[0].dataType,g.length,c),z=re(A.type.tensor),M=Ie(t,A.type.value,z),U=[T,I],G="";if(h){let W=o?c:1;U.push(S("bias",e[2].dataType,e[2].dims.length,W)),G=`${o?`value += bias[col / ${W}];`:`value += ${A.type.value}(bias[row + i]);`}`}let B=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Ae(t,B);let ee=()=>{let W=`var a_data: ${T.type.value};`;for(let D=0;D<p;D++)W+=`
              let b_data${D} = b[(b_offset + (k + ${D}) * uniforms.N + col) / ${c}];`;for(let D=0;D<f;D++){W+=`a_data = a[(a_offset + (row + ${D}) * uniforms.K + k) / ${p}];`;for(let Z=0;Z<p;Z++)W+=`
            values[${D}] = fma(${I.type.value}(a_data${p===1?"":`[${Z}]`}), b_data${Z}, values[${D}]);
`}return W};return`
  ${v.registerUniforms(B).registerInternalVariables($).declareVariables(...U,A)}
  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${c})) * ${c};
    var index1 = global_idx / (uniforms.N / ${c});
    let stride1 = uniforms.M / ${f};
    let row = (index1 % stride1) * ${f};
    let batch = index1 / stride1;

    ${n.length===2?"":`let batch_indices = ${$.offsetToIndices("batch")};`}

    var a_indices: ${T.type.indices};
    ${yt("a_indices",T,T.rank-2,$.rank,"batch_indices")}
    ${T.indicesSet("a_indices",T.rank-2,0)}
    ${T.indicesSet("a_indices",T.rank-1,0)}
    let a_offset = ${T.indicesToOffset("a_indices")};

    var b_indices: ${I.type.indices};
    ${yt("b_indices",I,I.rank-2,$.rank,"batch_indices")}
    ${I.indicesSet("b_indices",I.rank-2,0)}
    ${I.indicesSet("b_indices",I.rank-1,0)}
    let b_offset = ${I.indicesToOffset("b_indices")};
    var values: array<${A.type.value}, ${f}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${p}) {
      ${ee()}
    }
    for (var i = 0u; i < ${f}u; i++) {
      var value = values[i];
      ${G}
      ${M}
      let cur_indices = ${A.type.indices}(batch, row + i, col);
      let offset = ${A.indicesToOffset("cur_indices")};
      ${A.setByOffset(`offset / ${c}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${c};${p};${f};${o}`,inputDependencies:h?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:_}),getShaderSource:w}}});var sl,al,Xn,as,ul,Yn,dl,bt,un=k(()=>{"use strict";V();q();K();Fe();an();on();sl=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,al=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,Xn=(e,t,n="f32",r,o=!1,i=32,s=!1,a=32)=>{let u=t[1]*e[1],d=t[0]*e[0],l=o?u:i,c=o?i:u,p=l/t[0],f=i/t[1];if(!((o&&p===4&&e[1]===4||!o&&(p===3||p===4))&&l%t[0]===0&&i%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${o} is true, innerElementSize ${p} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${p} must be 3 or 4.
  tileAWidth ${l} must be divisible by workgroupSize[0]${t[0]}. tileInner ${i} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${p}<${n}>, ${l/p}>, ${c}>;
var<workgroup> mm_Bsub: array<array<vec4<${n}>, ${d/e[0]}>, ${i}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${p};
const tileInner = ${i};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${r?`let batchIndices = ${r.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${u};

  let num_tiles = ${s?`${Math.ceil(a/i)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${a}`:"0"};

  var acc: array<vec4<${n}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${f};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${sl(o,r)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${f}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${r?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${p===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${al(o,p)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},as=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,ul=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",Yn=(e,t,n="f32",r,o=!1,i=32,s=!1,a=32,u=!1)=>{let d=e[1]*t[1],l=e[0]*t[0],c=o?d:i,p=o?i:d;if(!(p%t[1]===0&&c%t[0]===0&&i%t[1]===0))throw new Error(`tileAHight ${p} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}, tileInner ${i} must be divisible by workgroupSize[1]${t[1]}`);let f=p/t[1],m=c/t[0],h=i/t[1],b=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${d};
    let globalColStart = i32(workgroupId.x) * ${l};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${p}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          ${as(o,r)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${i}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${l}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${r?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${n}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${o?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${d};

let tileRowA = i32(localId.y) * ${f};
let tileColA = i32(localId.x) * ${m};
let tileRowB = i32(localId.y) * ${h};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${f}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${m}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${as(o,r)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${h}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${r?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${n}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${ul(o)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${n}, ${c}>, ${p}>;
  var<workgroup> mm_Bsub : array<array<${n}, ${l}>, ${i}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${i};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${r?`let batchIndices = ${r.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(a/i)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${a}`:"0"};

    var acc : array<array<${n}, colPerThread>, rowPerThread>;
    ${b}
  }
`},dl=(e,t,n,r,o=!1)=>{let[i,s,a,u]=r,d=re(r[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${i.type.indices}) -> ${de(e,d)} {
      var value = ${de(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${yt("aIndices",s,s.rank-2,i.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${i.type.indices}) -> ${de(e,d)} {
      var value = ${de(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${a.type.indices};
        ${yt("bIndices",a,a.rank-2,i.rank,"batchIndices")}
        ${a.indicesSet("bIndices",a.rank-2,"u32(row)")}
        ${a.indicesSet("bIndices",a.rank-1,"u32(colIn)")}
        value = ${a.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${de(e,d)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${o?"bias[colIn]":`${de(e,d)}(bias[row])`};`:""}
        ${n}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},bt=(e,t,n,r,o=!1,i)=>{let s=e[0].dims,a=e[1].dims,u=s.slice(0,-2),d=a.slice(0,-2),l=r?r.slice(0,-2):n.slice(0,-2),c=x.size(l),p=s[s.length-2],f=s[s.length-1],m=a[a.length-1],h=f%4===0&&m%4===0,b=p<=8?[4,1,1]:[4,4,1],y=[8,8,1],g=[Math.ceil(m/y[0]/b[0]),Math.ceil(p/y[1]/b[1]),Math.ceil(c/y[2]/b[2])],_=h?4:1,w=[...u,p,f/_],v=w.length,$=[...d,f,m/_],T=$.length,I=[c,p,m/_],A=[{type:6,data:p},{type:6,data:m},{type:6,data:f}];Ce(t,A),A.push(...P(l,w,$));let z=["rank","rank"],M=e.length>2;M&&(A.push(...P(e[2].dims)),z.push("rank")),A.push(...P(I));let U=G=>{let B=l.length,ee=Xt("batchDims",e[0].dataType,B,1),W=re(e[0].dataType),D=S("a",e[0].dataType,v,_),Z=S("b",e[1].dataType,T,_),R=C("result",e[0].dataType,I.length,_),Q=[D,Z];if(M){let L=o?_:1;Q.push(S("bias",e[2].dataType,e[2].dims.length,L))}let we=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Ae(t,we);let se=re(R.type.tensor),H=Ie(t,R.type.value,se),E=dl(_,M,H,[ee,D,Z,R],o);return`
  ${G.registerUniforms(we).registerInternalVariables(ee).declareVariables(...Q,R)}
  ${E}
  ${h?Xn(b,y,W,ee):Yn(b,y,W,ee)}
                   `};return{name:"MatMul",shaderCache:{hint:`${b};${t.activation};${h};${o}`,inputDependencies:z},getRunData:()=>({outputs:[{dims:i?i(n):n,dataType:e[0].dataType}],dispatchGroup:{x:g[0],y:g[1],z:g[2]},programUniforms:A}),getShaderSource:U}}});var ll,us,ds=k(()=>{"use strict";V();ke();K();Fe();on();ss();un();ll=(e,t,n,r,o=!1,i,s=4,a=4,u=4,d="f32")=>{let l=z=>{switch(z){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${d}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${z} is not supported.`)}},c=z=>{switch(z){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${z} is not supported.`)}},p=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,f=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",h=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",b=e?"row":"col",y=e?"col":"row",g=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${b} / outWidth;
    let outCol = ${b} % outWidth;

    let WRow = ${y} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${y} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${y} % inChannels;
    var resData = ${de(s,d)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${h}) {
      ${p}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${l(s)}
    }
    return resData;`,_=e?t&&r?`
    let col = colIn * ${s};
    ${g}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${g}
    }
    return ${de(s,d)}(0.0);`:r&&n?`
    let col = colIn * ${s};
    ${g}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${g}
    }
    return ${de(s,d)}(0.0);`,w=e?r&&n?c(a):`
    let col = colIn * ${a};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${c(a)}
    }
    return ${de(a,d)}(0.0);`:`
    let col = colIn * ${a};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${c(a)}
    }
    return ${de(a,d)}(0.0);`,v=de(u,d),$=e?de(s,d):de(a,d),T=e?de(a,d):de(s,d),I=Ie(i,v,d);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${$} {
      ${e?_:w}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${T} {
      ${e?w:_}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${v}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${f}
      ${os(o)}
      ${I}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},us=(e,t,n,r,o,i,s,a,u)=>{let d=t.format==="NHWC",l=d?e[0].dims[3]:e[0].dims[1],c=n[0],p=d?n[2]:n[3],f=d?n[1]:n[2],m=d?n[3]:n[1],h=d&&(l%4===0||l%3===0)&&m%4===0,b=d?m:p*f,y=d?p*f:m,g=[8,8,1],_=r<=8?[4,1,1]:[4,4,1],w=[Math.ceil(b/g[0]/_[0]),Math.ceil(y/g[1]/_[1]),Math.ceil(c/g[2]/_[2])];j("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${w}`);let v=h?d&&l%4!==0?3:4:1,$=g[1]*_[1],T=g[0]*_[0],I=Math.max(g[0]*v,g[1]),A=r%$===0,z=o%T===0,M=i%I===0,U=h?[v,4,4]:[1,1,1],G=[{type:6,data:r},{type:6,data:o},{type:6,data:i},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Ce(t,G),G.push(...P(e[0].dims,e[1].dims));let B=["rank","rank"];s&&(G.push(...P(e[2].dims)),B.push("rank")),G.push(...P(n));let ee=W=>{let D=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Ae(t,D);let Z=h?4:1,R=re(e[0].dataType),Q=`
      fn setOutputAtIndex(flatIndex : i32, value : ${h?`vec4<${R}>`:R}) {
        result[flatIndex] = ${h?`vec4<${R}>`:R}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${h?`vec4<${R}>`:R}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${h?"/ 4":""}, value);
      }`,we=S("x",e[0].dataType,e[0].dims.length,v===3?1:v),se=S("w",e[1].dataType,e[1].dims.length,Z),H=[we,se],E=C("result",e[0].dataType,n.length,Z);if(s){let L=S("bias",e[2].dataType,e[2].dims.length,Z);H.push(L),Q+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${h?`vec4<${R}>`:R} {
          return bias[coords.${d?"w":"y"}${h?"/ 4":""}];
        }`}return`
        ${is("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${W.registerUniforms(D).declareVariables(...H,E)}
        ${Q}
        ${ll(d,A,z,M,s,t,U[0],U[1],U[2],R)}
        ${h?Xn(_,g,R,void 0,!d,I):Yn(_,g,R,void 0,!d,I,!1,void 0,a)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${v};${h};${A};${z};${M};${$};${T};${I}`,inputDependencies:B},getRunData:()=>({outputs:[{dims:u?u(n):n,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:G}),getShaderSource:ee}}});var cl,ls,dn,pl,cs,ml,ps,ms,fs=k(()=>{"use strict";V();ke();q();K();Fe();on();cl=e=>{let t=1;for(let n=0;n<e.length;n++)t*=e[n];return t},ls=e=>typeof e=="number"?[e,e,e]:e,dn=(e,t)=>t<=1?e:e+(e-1)*(t-1),pl=(e,t,n,r=1)=>{let o=dn(t,r);return Math.floor((e[0]*(n-1)-n+o)/2)},cs=(e,t,n,r,o)=>{o==null&&(o=pl(e,t[0],r[0]));let i=[0,0,0,n];for(let s=0;s<3;s++)e[s]+2*o>=t[s]&&(i[s]=Math.trunc((e[s]-t[s]+2*o)/r[s]+1));return i},ml=(e,t,n,r,o,i,s,a,u,d)=>{let l,c,p,f;if(e==="VALID"&&(e=0),typeof e=="number"){l={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=cs([t,n,r,1],[a,u,d],1,[o,i,s],e);c=m[0],p=m[1],f=m[2]}else if(Array.isArray(e)){if(!e.every((h,b,y)=>h===y[0]))throw Error(`Unsupported padding parameter: ${e}`);l={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=cs([t,n,r,1],[a,u,d],1,[o,i,s],e[0]);c=m[0],p=m[1],f=m[2]}else if(e==="SAME_UPPER"){c=Math.ceil(t/o),p=Math.ceil(n/i),f=Math.ceil(r/s);let m=(c-1)*o+a-t,h=(p-1)*i+u-n,b=(f-1)*s+d-r,y=Math.floor(m/2),g=m-y,_=Math.floor(h/2),w=h-_,v=Math.floor(b/2),$=b-v;l={top:_,bottom:w,left:v,right:$,front:y,back:g}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:l,outDepth:c,outHeight:p,outWidth:f}},ps=(e,t,n,r,o,i=!1,s="channelsLast")=>{let a,u,d,l,c;if(s==="channelsLast")[a,u,d,l,c]=e;else if(s==="channelsFirst")[a,c,u,d,l]=e;else throw new Error(`Unknown dataFormat ${s}`);let[p,,f,m,h]=t,[b,y,g]=ls(n),[_,w,v]=ls(r),$=dn(f,_),T=dn(m,w),I=dn(h,v),{padInfo:A,outDepth:z,outHeight:M,outWidth:U}=ml(o,u,d,l,b,y,g,$,T,I),G=i?p*c:p,B=[0,0,0,0,0];return s==="channelsFirst"?B=[a,G,z,M,U]:s==="channelsLast"&&(B=[a,z,M,U,G]),{batchSize:a,dataFormat:s,inDepth:u,inHeight:d,inWidth:l,inChannels:c,outDepth:z,outHeight:M,outWidth:U,outChannels:G,padInfo:A,strideDepth:b,strideHeight:y,strideWidth:g,filterDepth:f,filterHeight:m,filterWidth:h,effectiveFilterDepth:$,effectiveFilterHeight:T,effectiveFilterWidth:I,dilationDepth:_,dilationHeight:w,dilationWidth:v,inShape:e,outShape:B,filterShape:t}},ms=(e,t,n,r,o,i)=>{let s=i==="channelsLast",a=s?e[0].dims[3]:e[0].dims[1],u=!1,d=[64,1,1],l={x:n.map((g,_)=>_)},c=[Math.ceil(cl(l.x.map(g=>n[g]))/d[0]),1,1];j("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${c}`);let p=u?s&&a%4!==0?3:4:1,f=x.size(n),m=[{type:12,data:f},{type:12,data:r},{type:12,data:o},{type:12,data:t.strides},{type:12,data:t.dilations}];Ce(t,m),m.push(...P(e[0].dims,e[1].dims));let h=["rank","rank"],b=e.length===3;b&&(m.push(...P(e[2].dims)),h.push("rank")),m.push(...P(n));let y=g=>{let _=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:r.length},{name:"pads",type:"u32",length:o.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Ae(t,_);let w=u?4:1,v=re(e[0].dataType),$=S("x",e[0].dataType,e[0].dims.length,p===3?1:p),T=S("W",e[1].dataType,e[1].dims.length,w),I=[$,T],A=C("result",e[0].dataType,n.length,w),z="";if(b){let G=S("bias",e[2].dataType,e[2].dims.length,w);I.push(G),z+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${u?`vec4<${v}>`:v} {
          return bias[${s?O("coords",4,5):O("coords",1,5)}${u?"/ 4":""}];
        }`}let M=de(p,v),U=Ie(t,M,v);return`
            ${z}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${$.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${T.getByIndices("aIndices")};
            }
          ${g.registerUniforms(_).declareVariables(...I,A)}
          ${g.mainStart()}
          ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${A.offsetToIndices("global_idx")};
              let batch = ${O("coords",0,$.rank)};
              let d2 = ${s?O("coords",$.rank-1,$.rank):O("coords",1,$.rank)};
              let xFRCCorner = vec3<u32>(${s?O("coords",1,$.rank):O("coords",2,$.rank)},
              ${s?O("coords",2,$.rank):O("coords",3,$.rank)},
              ${s?O("coords",3,$.rank):O("coords",4,$.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?O("uniforms.x_shape",1,$.rank):O("uniforms.x_shape",2,$.rank)};
              let xShapeZ = ${s?O("uniforms.x_shape",2,$.rank):O("uniforms.x_shape",3,$.rank)};
              let xShapeW = ${s?O("uniforms.x_shape",3,$.rank):O("uniforms.x_shape",4,$.rank)};
              let xShapeU = ${s?O("uniforms.x_shape",4,$.rank):O("uniforms.x_shape",1,$.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${b?"value = value + getBiasByOutputCoords(coords)":""};
              ${U}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${p};${b}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:c[0],y:c[1],z:c[2]},programUniforms:m}),getShaderSource:y}}});var hs,gs,ys=k(()=>{"use strict";V();q();K();Fe();hs=(e,t,n,r)=>{let o=e.length>2,i=o?"value += b[output_channel];":"",s=e[0].dims,a=e[1].dims,u=t.format==="NHWC",d=u?n[3]:n[1],l=d/t.group,c=u&&l>=4?X(d):1,p=x.size(n)/c,f=[{type:12,data:p},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:l}];Ce(t,f),f.push(...P(s,[a[0],a[1],a[2],a[3]/c]));let m=o?["rank","rank","rank"]:["rank","rank"];f.push(...P([n[0],n[1],n[2],n[3]/c]));let h=b=>{let y=C("output",e[0].dataType,n.length,c),g=re(y.type.tensor),_=Ie(t,y.type.value,g),w=S("x",e[0].dataType,s.length),v=S("w",e[1].dataType,a.length,c),$=[w,v];o&&$.push(S("b",e[2].dataType,e[2].dims,c));let T=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Ae(t,T);let I=u?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${w.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${v.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${w.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${v.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${b.registerUniforms(T).declareVariables(...$,y)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${y.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${u?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${c} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

    var value: ${y.type.value} = ${y.type.value}(0);
    ${I}
    ${i}
    ${_}
    ${y.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${c}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:r?r(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:f}),getShaderSource:h}},gs=(e,t,n,r)=>{let o=e.length>2,i=X(n[3]),s=X(n[2]),a=x.size(n)/i/s,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/i],d=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/i],l=[n[0],n[1],n[2],n[3]/i],c=[{type:12,data:a},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Ce(t,c),c.push(...P(u,d,l));let p=(s-1)*t.strides[1]+d[1],f=m=>{let h=C("output",e[0].dataType,l.length,i),b=re(h.type.tensor),y=Ie(t,h.type.value,b),g=S("x",e[0].dataType,u.length,i),_=S("w",e[1].dataType,d.length,i),w=[g,_];o&&w.push(S("b",e[2].dataType,e[2].dims,i));let v=o?"value += b[output_channel];":"",$=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Ae(t,$),`
  ${m.registerUniforms($).declareVariables(...w,h)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${g.type.value}, ${p}>;
    var values: array<${h.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${d[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${p}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${g.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${g.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${d[1]}; w_width++) {
          let w_val = ${_.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${v}
      ${y}
      ${h.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${i};${s};${p};${d[0]};${d[1]}`,inputDependencies:o?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:r?r(n):n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:c}),getShaderSource:f}}});var fl,Jn,hl,er,tr,bs,gl,yl,nr,_s=k(()=>{"use strict";q();ds();fs();un();ys();Fe();an();Ve();fl=(e,t,n,r,o,i)=>{let s=e[0],a=e.slice(i?1:2,i?3:4),u=a.length,d=t[0],c=t.slice(2).map((m,h)=>m+(m-1)*(n[h]-1)),f=a.map((m,h)=>m+r[h]+r[h+u]).map((m,h)=>Math.floor((m-c[h]+o[h])/o[h]));return f.splice(0,0,s),f.splice(i?3:1,0,d),f},Jn=[2,3,1,0],hl=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let n=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],r=e[1].dims[1]*t.group;if(n!==r)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let o=e[0].dims.length-2;if(t.dilations.length!==o)throw new Error(`dilations should be ${o}D`);if(t.strides.length!==o)throw new Error(`strides should be ${o}D`);if(t.pads.length!==o*2)throw new Error(`pads should be ${o*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},er=(e,t)=>{let n=e.kernelShape.slice();n.length<t[1].dims.length-2&&n.push(...Array(t[1].dims.length-2-n.length).fill(0));for(let i=2;i<t[1].dims.length;++i)n[i-2]===0&&(n[i-2]=t[1].dims[i]);let r=e.pads.slice();Xe.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,n,r,e.format==="NHWC",e.autoPad);let o=Object.assign({},e);return Object.assign(o,{kernelShape:n,pads:r}),o},tr=e=>{let t=rn(e),n=e.format,r=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],o=e.dilations,i=e.group,s=e.kernel_shape,a=e.pads,u=e.strides,d=e.w_is_const();return{autoPad:r,format:n,dilations:o,group:i,kernelShape:s,pads:a,strides:u,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},bs=(e,t,n,r)=>{let o=n.format==="NHWC",i=fl(t[0].dims,t[1].dims,n.dilations,n.pads,n.strides,o);if(n.group!==1){let $=[t[0]];if(o){let I=e.kernelCustomData.wT??e.compute(pe(t[1],Jn),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=I),$.push(I)}else $.push(t[1]);t.length===3&&$.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&o&&t[1].dims[0]===n.group&&t[1].dims[1]===1&&n.dilations[0]===1&&n.dilations[1]===1?e.compute(gs($,n,i,r),{inputs:$}):e.compute(hs($,n,i,r),{inputs:$});return}let s=t.length===3,a=t[0].dims[o?1:2],u=t[0].dims[o?2:3],d=t[0].dims[o?3:1],l=t[1].dims[2],c=t[1].dims[3],p=i[o?1:2],f=i[o?2:3],m=i[o?3:1],h=o&&l===a&&c===u&&n.pads[0]===0&&n.pads[1]===0;if(h||l===1&&c===1&&n.dilations[0]===1&&n.dilations[1]===1&&n.strides[0]===1&&n.strides[1]===1&&n.pads[0]===0&&n.pads[1]===0){let $=i[0],T,I,A,z=[];if(o){let G=e.kernelCustomData.wT??e.compute(pe(t[1],Jn),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];if(n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=G),h){let B=a*u*d;T=t[0].reshape([1,$,B]),I=G.reshape([1,B,m]),A=[1,$,m]}else T=t[0].reshape([$,a*u,d]),I=G.reshape([1,d,m]),A=[$,p*f,m];z.push(T),z.push(I)}else T=t[0].reshape([$,d,a*u]),I=t[1].reshape([1,m,d]),A=[$,m,p*f],z.push(I),z.push(T);s&&z.push(t[2]);let M=A[2],U=z[0].dims[z[0].dims.length-1];M<8&&U<8?e.compute(sn(z,n,i,A,o,r),{inputs:z}):e.compute(bt(z,n,i,A,o,r),{inputs:z});return}let b=!0,y=e.kernelCustomData.wT??e.compute(pe(t[1],Jn),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=y);let g=[t[0],y];s&&g.push(t[2]);let _=o?p*f:m,w=o?m:p*f,v=l*c*d;e.compute(us(g,n,i,_,w,v,s,b,r),{inputs:g})},gl=(e,t)=>{let n=t.format==="NHWC",r=[e.inputs[0].reshape(n?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&r.push(e.inputs[2]);let o=[0,t.pads[0],0,t.pads[1]],i=[1].concat(t.strides),s=[1].concat(t.dilations),a=[1].concat(t.kernelShape),u=er({...t,pads:o,strides:i,dilations:s,kernelShape:a},r);bs(e,r,u,d=>n?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},yl=(e,t,n)=>{let r=n.format==="NHWC"?"channelsLast":"channelsFirst",o=er(n,t),i=n.autoPad==="NOTSET"?n.pads:n.autoPad,s=ps(t[0].dims,t[1].dims,n.strides,n.dilations,i,!1,r);e.compute(ms(t,o,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],r))},nr=(e,t)=>{if(hl(e.inputs,t),e.inputs[0].dims.length===3)gl(e,t);else if(e.inputs[0].dims.length===5)yl(e,e.inputs,t);else{let n=er(t,e.inputs);bs(e,e.inputs,n)}}});var ws,$s=k(()=>{"use strict";V();ke();q();K();ws=(e,t,n)=>{let r=e.length>2,o=t.outputShape,i=t.format==="NHWC",s=t.group,a=e[1].dims,u=a[2]/s,d=a[3],l=i?X(u):1,c=i&&d===1&&u>=4,p=c?Math.floor(u/4)*4:Math.floor(u/l)*l,f=u-p,m=i?X(d):1,h=i?d===1?l:m:1,b=x.size(o)/m,y=[Math.ceil(b/64),1,1];j("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${y}`);let g=["rank","rank"],_=[t.strides[0],t.strides[1]],w=[t.kernelShape[i?1:2],t.kernelShape[i?2:3]],v=[t.dilations[0],t.dilations[1]],$=[w[0]+(t.dilations[0]<=1?0:(t.kernelShape[i?1:2]-1)*(t.dilations[0]-1)),w[1]+(t.dilations[1]<=1?0:(t.kernelShape[i?2:3]-1)*(t.dilations[1]-1))],T=[$[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),$[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],I=[{type:12,data:b},{type:12,data:_},{type:12,data:w},{type:12,data:v},{type:12,data:$},{type:6,data:T},{type:12,data:p},{type:12,data:u},{type:12,data:d},...P(e[0].dims,e[1].dims)];r&&(I.push(...P(e[2].dims)),g.push("rank")),I.push(...P(o));let A=z=>{let M=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:_.length},{name:"filter_dims",type:"u32",length:w.length},{name:"dilations",type:"u32",length:w.length},{name:"effective_filter_dims",type:"u32",length:$.length},{name:"pads",type:"i32",length:T.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],U=re(e[0].dataType),G=i?1:2,B=i?2:3,ee=i?3:1,W=S("W",e[1].dataType,e[1].dims.length,h),D=S("Dy",e[0].dataType,e[0].dims.length,l),Z=[D,W];r&&Z.push(S("bias",e[2].dataType,[o[ee]].length,m));let R=C("result",e[0].dataType,o.length,m),Q=()=>{let H="";if(c)l===4?H+=`
        let xValue = ${D.getByOffset("x_offset")};
        let wValue = ${W.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:l===2?H+=`
          dotProd = dotProd + dot(vec4<${U}>(${D.getByOffset("x_offset")}, ${D.getByOffset("x_offset + 1u")}), vec4<${U}>(${W.getByOffset("w_offset")}, ${W.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:l===1&&(H+=`
          dotProd = dotProd + dot(vec4<${U}>(${D.getByOffset("x_offset")}, ${D.getByOffset("x_offset + 1u")}, ${D.getByOffset("x_offset + 2u")}, ${D.getByOffset("x_offset + 3u")}), vec4<${U}>(${W.getByOffset("w_offset")}, ${W.getByOffset("w_offset + 1u")}, ${W.getByOffset("w_offset + 2u")}, ${W.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(H+=`
                  let xValue = ${i?D.getByOffset(`${D.indicesToOffset(`${D.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${l}`):D.get("batch","inputChannel","idyR","idyC")};
        `,l===1)H+=`
          let w_offset = ${W.indicesToOffset(`${W.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${W.getByOffset(`w_offset / ${h}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let E=0;E<l;E++)H+=`
            let wValue${E} = ${W.getByOffset(`${W.indicesToOffset(`${W.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${E}, wOutChannel)`)} / ${h}`)};
            dotProd = dotProd + xValue[${E}] * wValue${E};`;return H},we=()=>{if(f===0)return"";if(!c)throw new Error(`packInputAs4 ${c} is not true.`);let H="";if(l===1){H+="dotProd = dotProd";for(let E=0;E<f;E++)H+=`
            + ${D.getByOffset(`x_offset + ${E}`)} * ${W.getByOffset(`w_offset + ${E}`)}`;H+=";"}else if(l===2){if(f!==2)throw new Error(`Invalid inputChannelsRemainder ${f}.`);H+=`
          let xValue = ${D.getByOffset("x_offset")};
          let wValue = ${W.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return H},se=`
            let outputIndices = ${R.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${R.indicesGet("outputIndices",0)};
            let d1 = ${R.indicesGet("outputIndices",ee)};
            let r = ${R.indicesGet("outputIndices",G)};
            let c = ${R.indicesGet("outputIndices",B)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${R.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${U}(dyRCorner) + ${U}(wR)) / ${U}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${U}(uniforms.Dy_shape[${G}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${U}(dyCCorner) + ${U}(wC)) / ${U}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${U}(uniforms.Dy_shape[${B}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${c?`
                var x_offset = ${D.indicesToOffset(`${D.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${l};
                var w_offset = ${W.indicesToOffset(`${W.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${h};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${c?4:l}) {
                  ${Q()}
                  inputChannel = inputChannel + ${c?4:l};
                }
                ${we()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${r?` + bias[d1 / ${m}]`:""};
            ${R.setByOffset("global_idx","value")};
          `;return`
    ${z.registerUniforms(M).declareVariables(...Z,R)}
      ${z.mainStart()}
      ${z.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${se}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${l}${h}${m}${c}${f}`,inputDependencies:g},getRunData:()=>({dispatchGroup:{x:y[0],y:y[1],z:y[2]},outputs:[{dims:n?n(o):o,dataType:e[0].dataType}],programUniforms:I}),getShaderSource:A}}});var bl,_l,wl,vs,xs,$l,Ss,vl,Ts,Is=k(()=>{"use strict";$s();Fe();Ve();bl=(e,t,n,r,o,i)=>(e-1)*t+n+(r-1)*o+1-i,_l=(e,t,n,r,o)=>{let i=Math.floor(e/2);t==="SAME_UPPER"?(n[r]=i,n[o]=e-i):t==="SAME_LOWER"&&(n[r]=e-i,n[o]=i)},wl=(e,t,n,r,o,i,s,a,u,d)=>{let l=e.length-2,c=d.length===0;u.length<l&&u.push(...Array(l-u.length).fill(0));let p=e[0],f=t[a?3:1]*o;for(let m=0,h=e.length-l-(a?1:0);m<l;++m,++h){let b=e[h],y=c?b*s[m]:d[m],g=bl(b,s[m],i[m],t[h],n[m],y);_l(g,r,i,m,m+l),c&&d.push(s[m]*(b-1)+u[m]+(t[h]-1)*n[m]+1-i[m]-i[m+l])}d.splice(0,0,p),d.splice(a?3:1,0,f)},vs=(e,t)=>{let n=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((c,p)=>c*p,1)===0){n.length=0;for(let c=2;c<t[1].dims.length;++c)n.push(t[1].dims[c])}let r=e.format==="NHWC";n.splice(0,0,t[1].dims[0]),n.splice(r?3:1,0,t[1].dims[1]);let o=e.pads.slice(),i=e.outputShape.slice(),s=e.outputPadding.slice(),a=t[0].dims,u=e.dilations.slice();if(u.reduce((c,p)=>c+p,0)===0){let c=t[0].dims.length-2;u=new Array(c).fill(1)}let d=e.strides.slice();if(d.reduce((c,p)=>c+p,0)===0){let c=t[0].dims.length-2;d=new Array(c).fill(1)}wl(a,n,u,e.autoPad,e.group,o,d,r,s,i);let l=Object.assign({},e);return Object.assign(l,{kernelShape:n,pads:o,outputPadding:s,outputShape:i,dilations:u,strides:d}),l},xs=e=>{let t=rn(e),n=e.format,r=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],o=e.dilations,i=e.group,s=e.kernelShape,a=e.pads,u=e.strides,d=e.wIsConst(),l=e.outputPadding,c=e.outputShape;return{autoPad:r,format:n,dilations:o,group:i,kernelShape:s,outputPadding:l,outputShape:c,pads:a,strides:u,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},$l=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let n=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],r=e[1].dims[0];if(n!==r)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let o=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==o))throw new Error("invalid bias");let i=e[0].dims.length-2;if(t.dilations.reduce((l,c)=>l+c,0)>0&&t.dilations.length!==i)throw new Error(`dilations should be ${i}D`);if(t.strides.reduce((l,c)=>l+c,0)>0&&t.strides.length!==i)throw new Error(`strides should be ${i}D`);if(t.pads.reduce((l,c)=>l+c,0)>0&&t.pads.length!==i*2)throw new Error(`pads should be ${i*2}D`);if(t.outputPadding.length!==i&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${i}D`);if(t.kernelShape.reduce((l,c)=>l+c,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Ss=(e,t,n,r)=>{let o=e.kernelCustomData.wT??e.compute(pe(t[1],[2,3,0,1]),{inputs:[1],outputs:[n.wIsConst?-2:-1]})[0];n.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=o);let i=[t[0],o];t.length===3&&i.push(t[2]),e.compute(ws(i,n,r),{inputs:i})},vl=(e,t)=>{let n=t.format==="NHWC",r=[e.inputs[0].reshape(n?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&r.push(e.inputs[2]);let o=t.kernelShape;(o.length===0||o[0]===0)&&(o=[e.inputs[1].dims[2]]);let i=t.dilations;(i.length===0||i[0]===0)&&(i=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let a=t.pads;a.length===0&&(a=[0,0]),a=[0,a[0],0,a[1]],s=[1].concat(s),i=[1].concat(i),o=[1].concat(o);let u=t.outputPadding;u=[0].concat(u);let d=vs({...t,pads:a,strides:s,dilations:i,kernelShape:o,outputPadding:u},r);Ss(e,r,d,l=>n?[l[0],l[2],l[3]]:[l[0],l[1],l[3]])},Ts=(e,t)=>{if($l(e.inputs,t),e.inputs[0].dims.length===3)vl(e,t);else{let n=vs(t,e.inputs);Ss(e,e.inputs,n)}}});var xl,Cs,As,Es=k(()=>{"use strict";V();q();ie();K();xl=(e,t,n,r)=>{let o=x.size(t),i=t.length,s=S("input",e,i),a=C("output",e,i),u=n.dataType===6?n.getInt32Array()[0]:Number(n.getBigInt64Array()[0]),d=x.normalizeAxis(u,i),l=c=>{let p=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,f=O("uniforms.input_shape","uniforms.axis",i),m=r.reverse?p+(r.exclusive?" + 1":""):"0",h=r.reverse?f:p+(r.exclusive?"":" + 1");return`
                ${c.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,a)}
                ${c.mainStart()}
                  ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${a.offsetToIndices("global_idx")};
                  var sum = ${a.type.value}(0);
                  let first : i32 = ${m};
                  let last : i32 = ${h};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${a.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:r.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:[{type:12,data:o},{type:12,data:d},...P(t,t)]}),getShaderSource:l}},Cs=(e,t)=>{let n=e.inputs[0].dims,r=e.inputs[0].dataType,o=e.inputs[1];e.compute(xl(r,n,o,t),{inputs:[0]})},As=e=>{let t=e.exclusive===1,n=e.reverse===1;return N({exclusive:t,reverse:n})}});var Sl,Tl,Il,ks,Ps,zs=k(()=>{"use strict";V();q();ie();K();Sl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Tl=(e,t,n,r)=>{let o=[];o.push(`fn perm(i: ${r.type.indices}) -> ${n.type.indices} {
    var a: ${n.type.indices};`);for(let i=0;i<t;++i)o.push(n.indicesSet("a",e[i],`i[${i}]`));return o.push("return a;}"),o.join(`
`)},Il=(e,t)=>{let n,r,o,i,s,a,u=t.format==="NHWC",d=t.blocksize,l=t.mode==="DCR";u?([n,r,o,i]=e.dims,s=l?[n,r,o,d,d,i/d**2]:[n,r,o,i/d**2,d,d],a=l?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([n,r,o,i]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=l?[n,d,d,i/d**2,r,o]:[n,i/d**2,d,d,r,o],a=l?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let c=e.reshape(s),p=c.dims.length,f=e.dataType,m=S("a",f,p),h=C("output",f,p),b=y=>`
  ${y.registerUniform("output_size","u32").declareVariables(m,h)}

  ${Tl(a,p,m,h)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${h.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${h.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:y=>{let g=u?[n,r*d,o*d,i/d**2]:[n,i/d**2,r*d,o*d],_=x.size(g),w=c.dims,v=x.sortBasedOnPerm(w,a);return{outputs:[{dims:g,dataType:y[0].dataType}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:[{type:12,data:_},...P(w,v)]}},getShaderSource:b}},ks=(e,t)=>{Sl(e.inputs),e.compute(Il(e.inputs[0],t))},Ps=e=>N({blocksize:e.blocksize,mode:e.mode,format:e.format})});var rr,ln,Bs,Cl,Al,or,ir,Ds,El,Os,Ms,Us=k(()=>{"use strict";V();q();ie();K();rr="[a-zA-Z]|\\.\\.\\.",ln="("+rr+")+",Bs="^"+ln+"$",Cl="("+ln+",)*"+ln,Al="^"+Cl+"$",or=class{constructor(t=-1){this.symbolToIndices=new Map,this.inputIndex=t}addSymbol(t,n){let r=this.symbolToIndices.get(t);r===void 0?r=[n]:r.push(n),this.symbolToIndices.set(t,r)}},ir=class{constructor(t,n){this.equation=n;this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,o]=n.includes("->")?n.split("->",2):[n,""];if(!r.match(RegExp(Al)))throw new Error("Invalid LHS term");if(r.split(",").forEach((a,u)=>{let d=t[u].dims.slice();if(!a.match(RegExp(Bs)))throw new Error("Invalid LHS term");let l=this.processTerm(a,!0,d,u);this.lhs.push(l)}),o==="")o+=[...this.symbolToInfo.entries()].filter(([a,u])=>u.count===1||a==="...").map(([a])=>a).join("");else if(!o.match(RegExp(ln)))throw new Error("Invalid RHS");o.match(RegExp(rr,"g"))?.forEach(a=>{if(a==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let u=this.symbolToInfo.get(a);if(u===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(u.dimValue)}}),this.rhs=this.processTerm(o,!1,this.outputDims)}addSymbol(t,n,r){let o=this.symbolToInfo.get(t);if(o!==void 0){if(o.dimValue!==n&&o.count!==1)throw new Error("Dimension mismatch");o.count++,o.inputIndices.push(r)}else o={count:1,dimValue:n,inputIndices:[r]};this.symbolToInfo.set(t,o)}processTerm(t,n,r,o=-1){let i=r.length,s=!1,a=[],u=0;if(!t.match(RegExp(Bs))&&!n&&t!=="")throw new Error("Invalid LHS term");let d=t.match(RegExp(rr,"g")),l=new or(o);return d?.forEach((c,p)=>{if(c==="..."){if(s)throw new Error("Only one ellipsis is allowed per input term");s=!0;let f=i-d.length+1;if(f<0)throw new Error("Ellipsis out of bounds");if(a=r.slice(u,u+f),this.hasEllipsis){if(this.ellipsisDims.length!==a.length||this.ellipsisDims.toString()!==a.toString())throw new Error("Ellipsis dimensions mismatch")}else if(n)this.hasEllipsis=!0,this.ellipsisDims=a;else throw new Error("Ellipsis must be specified in the LHS");for(let m=0;m<a.length;m++){let h=String.fromCharCode(48+m);l.addSymbol(h,p+m),this.addSymbol(h,r[u++],o)}}else l.addSymbol(c,p+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(c,r[u++],o)}),l}},Ds=e=>e+"_max",El=(e,t,n,r)=>{let i=e.map(l=>l.length).map((l,c)=>S(`input${c}`,t,l)),s=x.size(r),a=C("output",t,r.length),u=[...n.symbolToInfo.keys()].filter(l=>!n.rhs.symbolToIndices.has(l)),d=l=>{let c=[],p="var prod = 1.0;",f="var sum = 0.0;",m="sum += prod;",h=[],b=[],y=[],g=[],_=n.symbolToInfo.size===n.rhs.symbolToIndices.size;n.symbolToInfo.forEach((v,$)=>{if(n.rhs.symbolToIndices.has($)){let T=n.rhs.symbolToIndices.get($)?.[0];T!==void 0&&n.lhs.forEach((I,A)=>{if(v.inputIndices.includes(A)){let z=I.symbolToIndices.get($);if(z===void 0)throw new Error("Invalid symbol error");z.forEach(M=>{c.push(`${i[A].indicesSet(`input${A}Indices`,M,a.indicesGet("outputIndices",T))}`)})}})}else n.lhs.forEach((T,I)=>{if(v.inputIndices.includes(I)){let A=T.symbolToIndices.get($);if(A===void 0)throw new Error("Invalid symbol error");A.forEach(z=>{h.push(`${i[I].indicesSet(`input${I}Indices`,z,`${$}`)}`)}),g.push(`prod *= ${i[I].getByIndices(`input${I}Indices`)};`)}}),b.push(`for(var ${$}: u32 = 0; ${$} < uniforms.${Ds($)}; ${$}++) {`),y.push("}")});let w=_?[...c,`let sum = ${i.map((v,$)=>v.getByIndices(`input${$}Indices`)).join(" * ")};`]:[...c,f,...b,...h,p,...g,m,...y];return`
            ${l.registerUniforms(u.map(v=>({name:`${Ds(v)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...i,a)}

            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${a.offsetToIndices("global_idx")};
            ${i.map((v,$)=>`var input${$}Indices: ${i[$].type.indices};`).join(`
`)}
            ${w.join(`
`)};
            ${a.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:n.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let l=u.filter(p=>n.symbolToInfo.has(p)).map(p=>({type:12,data:n.symbolToInfo.get(p)?.dimValue||0}));l.push({type:12,data:s});let c=e.map((p,f)=>[...P(p)]).reduce((p,f)=>p.concat(f),l);return c.push(...P(r)),{outputs:[{dims:r,dataType:t}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:c}},getShaderSource:d}},Os=(e,t)=>{let n=new ir(e.inputs,t.equation),r=n.outputDims,o=e.inputs.map((i,s)=>i.dims);e.compute(El(o,e.inputs[0].dataType,n,r))},Ms=e=>{let t=e.equation.replace(/\s+/g,"");return N({equation:t})}});var kl,Rs,Pl,zl,Vs,Ns=k(()=>{"use strict";V();q();K();kl=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,n=Array.from(e[1].getBigInt64Array(),Number),r=n.length<t.length?0:n.length-t.length,o=t.length<n.length?0:t.length-n.length;for(;r<n.length&&o<t.length;++r,++o)if(n[r]!==t[o]&&n[r]!==1&&t[o]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Rs=(e,t)=>{let n=e.length-t.length,r=[];for(let o=0;o<n;++o)r.push(e[o]);for(let o=0;o<t.length;++o)r.push(t[o]===1?e[o+n]:t[o]);return r},Pl=(e,t)=>e.length>t.length?Rs(e,t):Rs(t,e),zl=e=>{let t=e[0].dims,n=Array.from(e[1].getBigInt64Array(),Number),r=Pl(t,n),o=e[0].dataType,i=o===9||x.size(t)===1,s=o===9||t.length>0&&t[t.length-1]%4===0?4:1,a=i||r.length>0&&r[r.length-1]%4===0?4:1,u=Math.ceil(x.size(r)/a),d=c=>{let p=S("input",o,t.length,s),f=C("output",o,r.length,a),m;if(o===9){let h=(b,y,g="")=>`
          let outputIndices${y} = ${f.offsetToIndices(`outputOffset + ${y}u`)};
          let offset${y} = ${p.broadcastedIndicesToOffset(`outputIndices${y}`,f)};
          let index${y} = offset${y} / 4u;
          let component${y} = offset${y} % 4u;
          ${b}[${y}] = ${g}(${p.getByOffset(`index${y}`)}[component${y}]);
        `;m=`
        let outputOffset = global_idx * ${a};
        var data = vec4<u32>(0);
        ${h("data",0,"u32")}
        ${h("data",1,"u32")}
        ${h("data",2,"u32")}
        ${h("data",3,"u32")}
        ${f.setByOffset("global_idx","data")}
      }`}else m=`
        let outputIndices = ${f.offsetToIndices(`global_idx * ${a}`)};
        let inputOffset = ${p.broadcastedIndicesToOffset("outputIndices",f)};
        let data = ${f.type.value}(${p.getByOffset(`inputOffset / ${s}`)});
        ${f.setByOffset("global_idx","data")}
      }`;return`
    ${c.registerUniform("vec_size","u32").declareVariables(p,f)}
    ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${m}`},l=[{type:12,data:u},...P(t,r)];return{name:"Expand",shaderCache:{hint:`${r.length};${s}${a}`,inputDependencies:["rank"]},getShaderSource:d,getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l})}},Vs=e=>{kl(e.inputs),e.compute(zl(e.inputs),{inputs:[0]})}});var Bl,Ls,Ws=k(()=>{"use strict";V();q();K();nn();Bl=e=>{let t=e[0].dataType,n=x.size(e[0].dims),r=x.size(e[1].dims),o=r%4===0,i=s=>{let a=S("x",t,[1],4),u=S("bias",t,[1],4),d=C("y",t,[1],4),l=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],c=f=>`
      let bias${f}_offset: u32 = (global_idx * 4 + ${f}) % uniforms.bias_size;
      let bias${f} = ${u.getByOffset(`bias${f}_offset / 4`)}[bias${f}_offset % 4];`,p=o?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${c(0)}${c(1)}${c(2)}${c(3)}
      let bias = ${a.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(l).declareVariables(a,u,d)}

    ${Zn(ce(t))}

    ${s.mainStart(Ye)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${a.getByOffset("global_idx")};
      ${p}
      let x_in = x + bias;
      ${d.setByOffset("global_idx",Qn("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${o}`,inputDependencies:["type","type"]},getShaderSource:i,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(n/4)},{type:12,data:r}],dispatchGroup:{x:Math.ceil(n/Ye/4)}})}},Ls=e=>{e.inputs.length<2||x.size(e.inputs[1].dims)===0?Ui(e):e.compute(Bl(e.inputs))}});var Dl,Ol,Gs,Hs,qs=k(()=>{"use strict";V();q();ie();K();Dl=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},Ol=(e,t)=>{let n=e[0].dims,r=e[1].dims,o=n.length,i=x.normalizeAxis(t.axis,o),s=n.slice(0);s.splice(i,1,...r);let a=n[i],u=e[0].dataType===9?4:1,d=Math.ceil(x.size(s)/u),l=[{type:12,data:d},{type:6,data:a},{type:12,data:i},...P(e[0].dims,e[1].dims,s)],c=p=>{let f=S("data",e[0].dataType,e[0].dims.length,u),m=S("inputIndices",e[1].dataType,e[1].dims.length),h=C("output",e[0].dataType,s.length,u),b=g=>{let _=r.length,w=`var indicesIndices${g}  = ${m.type.indices}(0);`;for(let v=0;v<_;v++)w+=`${_>1?`indicesIndices${g}[${v}]`:`indicesIndices${g}`} = ${s.length>1?`outputIndices${g}[uniforms.axis + ${v}]`:`outputIndices${g}`};`;w+=`
          var idx${g} = ${m.getByIndices(`indicesIndices${g}`)};
          if (idx${g} < 0) {
            idx${g} = idx${g} + uniforms.axisDimLimit;
          }
          var dataIndices${g} : ${f.type.indices};
        `;for(let v=0,$=0;v<o;v++)v===i?(w+=`${o>1?`dataIndices${g}[${v}]`:`dataIndices${g}`} = u32(idx${g});`,$+=_):(w+=`${o>1?`dataIndices${g}[${v}]`:`dataIndices${g}`} = ${s.length>1?`outputIndices${g}[${$}]`:`outputIndices${g}`};`,$++);return w},y;if(e[0].dataType===9){let g=(_,w,v="")=>`
          let outputIndices${w} = ${h.offsetToIndices(`outputOffset + ${w}u`)};
          ${b(w)};
          let offset${w} = ${f.indicesToOffset(`dataIndices${w}`)};
          let index${w} = offset${w} / 4u;
          let component${w} = offset${w} % 4u;
          ${_}[${w}] = ${v}(${f.getByOffset(`index${w}`)}[component${w}]);
        `;y=`
        let outputOffset = global_idx * ${u};
        var value = vec4<u32>(0);
        ${g("value",0,"u32")}
        ${g("value",1,"u32")}
        ${g("value",2,"u32")}
        ${g("value",3,"u32")}
        ${h.setByOffset("global_idx","value")}
      `}else y=`
      let outputIndices = ${h.offsetToIndices("global_idx")};
      ${b("")};
      let value = ${f.getByIndices("dataIndices")};
      ${h.setByOffset("global_idx","value")};
      `;return`
      ${p.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(f,m,h)}
      ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${y}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:l}),getShaderSource:c}},Gs=e=>N({axis:e.axis}),Hs=(e,t)=>{let n=e.inputs;Dl(n),e.compute(Ol(e.inputs,t))}});var Ml,Fs,Ks,js=k(()=>{"use strict";V();q();K();Ml=(e,t,n,r,o,i,s,a,u)=>{let d=[{type:12,data:i},{type:12,data:r},{type:12,data:o},{type:12,data:n},{type:12,data:s},{type:12,data:a},{type:12,data:u}],l=[i];d.push(...P(t.dims,l));let c=p=>{let f=S("indices_data",t.dataType,t.dims.length),m=C("input_slice_offsets_data",12,1,1),h=[f,m],b=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:o.length},{name:"sizes_from_slice_dims_data",type:"u32",length:n.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${p.registerUniforms(b).declareVariables(...h)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${o.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${n.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${o.length}_${n.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:l,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:d}),getShaderSource:c},{inputs:[t],outputs:[-1]})[0]},Fs=(e,t)=>{let n=e.inputs,r=n[0].dims,o=n[0].dataType,i=n[1].dims,s=i[i.length-1],a=x.sizeToDimension(i,i.length-1),u=x.sizeFromDimension(r,t.batchDims+s),d=x.sizeToDimension(r,t.batchDims),l=x.sizeFromDimension(r,t.batchDims),c=a/d,p=new Array(s),f=u;for(let w=0;w<s;++w)p[s-1-w]=f,f*=r[t.batchDims+s-1-w];let m=Ml(e,n[1],p,t.batchDims,r,a,c,l,s),h=t.batchDims+s;if(h>r.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let b=i.slice(0,-1).concat(r.slice(h)),y=x.size(b),g=[{type:12,data:y},{type:12,data:u},...P(n[0].dims,m.dims,b)],_=w=>{let v=S("data",n[0].dataType,n[0].dims.length),$=S("slice_offsets",12,m.dims.length),T=C("output",n[0].dataType,b.length);return`
          ${w.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(v,$,T)}
            ${w.mainStart()}
            ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:b,dataType:o}],dispatchGroup:{x:Math.ceil(y/64)},programUniforms:g}),getShaderSource:_},{inputs:[n[0],m]})},Ks=e=>({batchDims:e.batch_dims,cacheKey:""})});var Ul,Rl,Zs,Qs,Xs=k(()=>{"use strict";V();q();ie();K();Ul=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let n=x.normalizeAxis(t.quantizeAxis,e[0].dims.length),r=t.blockSize,o=e[0],i=e[2],s=e.length===4?e[3]:void 0;if(i.dims.length!==o.dims.length||!o.dims.map((a,u)=>u===n?Math.ceil(a/r)===i.dims[u]:a===i.dims[u]).reduce((a,u)=>a&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==o.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==i.dims.length||!s.dims.map((a,u)=>a===i.dims[u]).reduce((a,u)=>a&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},Rl=(e,t)=>{let n=e[0].dims,r=e[1].dims,o=n.length,i=x.normalizeAxis(t.gatherAxis,o),s=x.normalizeAxis(t.quantizeAxis,o),a=n.slice(0);a.splice(i,1,...r);let u=x.size(a),d=e[2].dataType,c=e[0].dataType===22,p=[{type:12,data:u},{type:12,data:s},{type:12,data:i},{type:12,data:t.blockSize},...P(...e.map((m,h)=>m.dims),a)],f=m=>{let h=S("data",e[0].dataType,e[0].dims.length),b=S("inputIndices",e[1].dataType,e[1].dims.length),y=S("scales",e[2].dataType,e[2].dims.length),g=e.length>3?S("zeroPoint",e[3].dataType,e[3].dims.length):void 0,_=C("output",d,a.length),w=[h,b,y];g&&w.push(g);let v=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${m.registerUniforms(v).declareVariables(...w,_)}
        ${m.mainStart()}
        let output_indices = ${_.offsetToIndices("global_idx")};
        var indices_indices = ${b.type.indices}(0);
        ${r.length>1?`
          for (var i: u32 = 0; i < ${r.length}; i++) {
            let index = ${_.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${b.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${_.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${h.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${_.indicesGet("output_indices","i")};
          ${h.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${b.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${n[i]};
        }
        ${h.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${a.length}; i++) {
          let index = ${_.indicesGet("output_indices",`i + ${r.length} - 1`)};
          ${h.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${h.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${h.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${y.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${y.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${y.getByIndices("scale_indices")};
        ${g?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${g.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${g.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${ce(d)}(quantized_data - zero_point) * scale;
        ${_.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((m,h)=>h!==1).map(m=>m.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(m,h)=>"rank")},getRunData:()=>({outputs:[{dims:a,dataType:d}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p}),getShaderSource:f}},Zs=(e,t)=>{let n=e.inputs;Ul(n,t),e.compute(Rl(e.inputs,t))},Qs=e=>N({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})});var Vl,Nl,Ys,Js,ea=k(()=>{"use strict";V();q();ie();K();Vl=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},Nl=(e,t)=>{let n=e[0].dims,r=e[0].dataType,o=n.length,i=e[1].dims,s=e[1].dataType,a=x.normalizeAxis(t.axis,o),u=n[a],d=i.slice(0),l=x.size(d),c=S("input",r,o),p=S("indicesInput",s,i.length),f=C("output",r,d.length),m=[{type:12,data:l},{type:6,data:u},{type:12,data:a}];return m.push(...P(n,i,d)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:m}),getShaderSource:y=>`
      ${y.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(c,p,f)}
      ${y.mainStart()}
      ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${f.offsetToIndices("global_idx")};

      var idx = ${p.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${c.type.indices}(outputIndices);
      ${c.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${c.getByIndices("inputIndices")};

      ${f.setByOffset("global_idx","value")};
  }`}},Ys=e=>N({axis:e.axis}),Js=(e,t)=>{let n=e.inputs;Vl(n),e.compute(Nl(e.inputs,t))}});var Ll,Wl,ta,na,ra=k(()=>{"use strict";V();q();K();Ll=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},Wl=(e,t)=>{let n=e[0].dims.slice(),r=e[1].dims.slice(),[o,i,s]=Gt.getShapeOfGemmResult(n,t.transA,r,t.transB,e.length===3?e[2].dims:void 0),a=[o,i];if(!a)throw new Error("Can't use gemm on the given tensors");let u=16,d=Math.ceil(i/u),l=Math.ceil(o/u),c=!0,p=x.size(a),f=[{type:12,data:c?d:p},{type:12,data:o},{type:12,data:i},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(f.push(...P(e[2].dims)),m.push("rank")),f.push(...P(a));let h=y=>{let g="";t.transA&&t.transB?g="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?g="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?g="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(g="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let _=t.alpha===1?"":"value *= uniforms.alpha;",w=S("a",e[0].dataType,e[0].dims),v=S("b",e[1].dataType,e[1].dims),$=w.type.value,T=null,I=[w,v];e.length===3&&(T=S("c",e[2].dataType,e[2].dims.length),I.push(T));let A=C("output",e[0].dataType,a.length);I.push(A);let z=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${y.registerUniforms(z).declareVariables(...I)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${$}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${g}
    }

    ${_}
    ${T!=null?`let cOffset = ${T.broadcastedIndicesToOffset("vec2(m, n)",A)}; value += ${$}(uniforms.beta) * ${T.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},b=y=>{let g=S("a",e[0].dataType,e[0].dims),_=S("b",e[1].dataType,e[1].dims),w=null,v=[g,_];e.length===3&&(w=S("c",e[2].dataType,e[2].dims.length),v.push(w));let $=C("output",e[0].dataType,a.length);v.push($);let T=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],I="",A="";t.transA&&t.transB?(A=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${_.type.value}(0);
      }
      `,I="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(A=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${_.type.value}(0);
      }
      `,I="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(A=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${_.type.value}(0);
      }
      `,I="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(A=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${_.type.value}(0);
      }
      `,I="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let z=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${y.registerUniforms(T).declareVariables(...v)}
  var<workgroup> tile_a: array<array<${g.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${_.type.storage}, ${u}>, ${u}>;
  ${y.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${$.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${A}
      k_start = k_start + ${u};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${u}; k++) {
        ${I}
      }
      workgroupBarrier();
    }

    ${z}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${w!=null?`let cOffset = ${w.broadcastedIndicesToOffset("vec2(m, n)",$)}; value += ${$.type.value}(uniforms.beta) * ${w.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return c?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:d*l},programUniforms:f}),getShaderSource:b}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:f}),getShaderSource:h}},ta=e=>{let t=e.transA,n=e.transB,r=e.alpha,o=e.beta;return{transA:t,transB:n,alpha:r,beta:o,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},na=(e,t)=>{Ll(e.inputs),e.compute(Wl(e.inputs,t))}});var Ne,Ke,it,st,Gl,Hl,ql,Fl,Kl,jl,Zl,Ql,oa,ia,sa=k(()=>{"use strict";V();q();ie();K();[Ne,Ke,it,st]=[0,1,2,3],Gl=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Hl=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,ql=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,Fl=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Kl=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,jl=(e,t,n)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Ne}] = batch;
     indices[${Ke}] = channel;`+(()=>{switch(n.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${it}] = u32(r);
            indices[${st}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${it}] = u32(clamp(r, 0, H - 1));
          indices[${st}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${it}] = gs_reflect(r, border[1], border[3]);
          indices[${st}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${n.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,Zl=(e,t,n)=>(()=>{switch(n.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Ne}], indices[${Ke}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Ne}], indices[${Ke}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Ne}], indices[${Ke}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Ne}], indices[${Ke}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Ne}], indices[${Ke}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Ne}], indices[${Ke}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${n.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Ql=(e,t)=>{let n=S("x",e[0].dataType,e[0].dims.length),r=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],o=S("grid",e[1].dataType,r.length,2),i=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(i=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Ne,Ke,it,st]=[0,3,1,2]);let s=C("output",e[0].dataType,i.length),a=n.type.value,u=x.size(i),d=[{type:12,data:u},...P(e[0].dims,r,i)],l=c=>`
  ${c.registerUniform("output_size","u32").declareVariables(n,o,s)}
  ${Hl}
  ${ql(a)}
  ${Fl(t)}
  ${Kl(t)}
  ${jl(n,a,t)}

  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${it}]);
      let W_in = i32(uniforms.x_shape[${st}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${Ne}], indices[${it}], indices[${st}]);
      let nxy = ${o.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${Zl(s,a,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:c=>{let p=x.size(i);return{outputs:[{dims:i,dataType:c[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:d}},getShaderSource:l}},oa=(e,t)=>{Gl(e.inputs),e.compute(Ql(e.inputs,t))},ia=e=>N({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})});var ge,Jl,ua,aa,ec,_t,da,sr=k(()=>{"use strict";V();q();ie();Zt();en();K();Ve();ge=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Jl=(e,t)=>{let n=e[0],r=ge(e,1),o=ge(e,2),i=ge(e,3),s=ge(e,4),a=ge(e,5),u=ge(e,6),d=ge(e,7);if(n.dims.length!==3&&n.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let l=n.dims[0],c=n.dims[1],p=n.dims.length===3?n.dims[2]:t.numHeads*n.dims[4],f=c,m=0,h=0,b=Math.floor(p/t.numHeads);if(u&&d&&x.size(u.dims)&&x.size(d.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==l||u.dims[1]!==t.numHeads||u.dims[3]!==b)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==l||d.dims[1]!==t.numHeads||d.dims[3]!==b)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==d.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=u.dims[2],h=u.dims[2]}else if(u&&x.size(u.dims)||d&&x.size(d.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let y;if(r&&x.size(r.dims)>0){if(n.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(r.dims.length<3||r.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(n.dims[0]!==r.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(r.dims.length===3){if(r.dims[2]!==n.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');y=2,f=r.dims[1]}else if(r.dims.length===5){if(r.dims[2]!==t.numHeads||r.dims[3]!==2||r.dims[4]!==b)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(o)throw new Error('Expect "value" be none when "key" has packed kv format.');y=5,f=r.dims[1]}else{if(r.dims[1]!==t.numHeads||r.dims[3]!==b)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');y=0,f=r.dims[2]}}else{if(n.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(n.dims[2]!==t.numHeads||n.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');y=3}if(i&&x.size(i.dims)>0){if(i.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(r&&r.dims.length===5&&r.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let g=m+f,_=0;if(s&&x.size(s.dims)>0){_=8;let T=s.dims;throw T.length===1?T[0]===l?_=1:T[0]===3*l+2&&(_=3):T.length===2&&T[0]===l&&T[1]===g&&(_=5),_===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let w=!1,v=p;if(o&&x.size(o.dims)>0){if(o.dims.length!==3&&o.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(n.dims[0]!==o.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(o.dims.length===3){if(f!==o.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');v=o.dims[2]}else{if(f!==o.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');v=o.dims[1]*o.dims[3],w=!0}}let $=!1;if(s&&x.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(a&&x.size(a.dims)>0){if(a.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(a.dims[0]!==l||a.dims[1]!==t.numHeads||a.dims[2]!==c||a.dims[3]!==g)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:c,pastSequenceLength:m,kvSequenceLength:f,totalSequenceLength:g,maxSequenceLength:h,inputHiddenSize:0,hiddenSize:p,vHiddenSize:v,headSize:b,vHeadSize:Math.floor(v/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:_,scale:t.scale,broadcastResPosBias:$,passPastInKv:w,qkvFormat:y}},ua=e=>N({...e}),aa=N({perm:[0,2,1,3]}),ec=(e,t,n,r,o,i,s)=>{let a=[r,o,i],u=x.size(a),d=[{type:12,data:u},{type:12,data:s},{type:12,data:i}],l=c=>{let p=C("qkv_with_bias",t.dataType,a),f=S("qkv",t.dataType,a),m=S("bias",n.dataType,a),h=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${c.registerUniforms(h).declareVariables(f,m,p)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d}),getShaderSource:l},{inputs:[t,n],outputs:[-1]})[0]},_t=(e,t,n,r,o,i,s,a)=>{let u=i;if(s&&x.size(s.dims)>0){if(r===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=ec(e,i,s,t,r,n*o,a),u=u.reshape([t,r,n,o]),n===1||r===1?u:e.compute(pe(u,aa.perm),{inputs:[u],outputs:[-1]})[0]}else return i.dims.length===3&&(u=i.reshape([t,r,n,o])),n===1||r===1?u:e.compute(pe(u,aa.perm),{inputs:[u],outputs:[-1]})[0]},da=(e,t)=>{let n=Jl(e.inputs,t),r=e.inputs[0],o=ge(e.inputs,1),i=ge(e.inputs,2),s=ge(e.inputs,3),a=ge(e.inputs,4),u=ge(e.inputs,5),d=ge(e.inputs,6),l=ge(e.inputs,7);if(r.dims.length===5)throw new Error("Packed QKV is not implemented");if(o?.dims.length===5)throw new Error("Packed KV is not implemented");let c=o&&i&&o.dims.length===4&&i.dims.length===4,p=_t(e,n.batchSize,n.numHeads,n.sequenceLength,n.headSize,r,s,0);if(c)return ot(e,p,o,i,a,void 0,d,l,u,n);if(!o||!i)throw new Error("key and value must be provided");let f=_t(e,n.batchSize,n.numHeads,n.kvSequenceLength,n.headSize,o,s,n.hiddenSize),m=_t(e,n.batchSize,n.numHeads,n.kvSequenceLength,n.vHeadSize,i,s,2*n.hiddenSize);ot(e,p,f,m,a,void 0,d,l,u,n)}});var tc,nc,rc,oc,ar,la,ca,ur=k(()=>{"use strict";V();q();ie();K();tc=e=>{if(!e||e.length<1)throw new Error("too few inputs")},nc=(e,t)=>{let n=[],r=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(o=>n.push(Number(o))),r=n.length),N({numOutputs:r,axis:t.axis,splitSizes:n})},rc=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${O("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,oc=e=>{let t=e.length,n=[];for(let r=0;r<t;++r){let o=e[r].setByIndices("indices","input[global_idx]");t===1?n.push(o):r===0?n.push(`if (output_number == ${r}u) { ${o} }`):r===t-1?n.push(`else { ${o} }`):n.push(`else if (output_number == ${r}) { ${o} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${n.join(`
`)}
      }`},ar=(e,t)=>{let n=e[0].dims,r=x.size(n),o=e[0].dataType,i=x.normalizeAxis(t.axis,n.length),s=new Array(t.numOutputs),a=S("input",o,n.length),u=new Array(t.numOutputs),d=[],l=[],c=0,p=[{type:12,data:r}];for(let m=0;m<t.numOutputs;m++){c+=t.splitSizes[m],u[m]=c;let h=n.slice();h[i]=t.splitSizes[m],l.push(h),s[m]=C(`output${m}`,o,h.length),d.push({dims:l[m],dataType:e[0].dataType})}p.push({type:12,data:u},...P(n,...l));let f=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(a,...s)}
  ${rc(u.length)}
  ${oc(s)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${a.offsetToIndices("global_idx")};
    var index = ${a.indicesGet("indices",i)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${O("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${a.indicesSet("indices",i,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:f,getRunData:()=>({outputs:d,dispatchGroup:{x:Math.ceil(r/64)},programUniforms:p})}},la=(e,t)=>{tc(e.inputs);let n=e.inputs.length===1?t:nc(e.inputs,t);e.compute(ar(e.inputs,n),{inputs:[0]})},ca=e=>{let t=e.axis,n=e.splitSizes,r=e.numOutputs<0?n.length:e.numOutputs;if(r!==n.length)throw new Error("numOutputs and splitSizes length must be equal");return N({axis:t,numOutputs:r,splitSizes:n})}});var ic,cn,pa,dr=k(()=>{"use strict";V();q();ie();K();ic=(e,t)=>{let[n,r,o,i]=e,{numHeads:s,rotaryEmbeddingDim:a}=t;if(n.dims.length!==3&&n.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${n.dims.length}`);if(!x.areEqual(r.dims,[])&&!x.areEqual(r.dims,[1])&&r.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${r.dims.length}`);if(o.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${o.dims.length}`);if(i.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${i.dims.length}`);if(!x.areEqual(o.dims,i.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(a>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=n.dims[0],d=n.dims[n.dims.length-2],l=o.dims[0],c=x.sizeFromDimension(n.dims,1)/d,p=a===0?o.dims[1]*2:c/s;if(a>p)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(r.dims.length===2){if(u!==r.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${r.dims[0]}`);if(d!==r.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${r.dims[1]}`)}if(p/2!==o.dims[1]&&a/2!==o.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${o.dims[1]}`);if(d>l)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},cn=(e,t)=>{let{interleaved:n,numHeads:r,rotaryEmbeddingDim:o,scale:i}=t,s=e[0].dims[0],a=x.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],d=a/u,l=e[2].dims[1],c=o===0?l*2:d/r,p=new Array(s,u,d/c,c-l),f=x.computeStrides(p),m=[{type:1,data:i},{type:12,data:p},{type:12,data:f},...e[0].dims.length===3?new Array({type:12,data:[a,d,c,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[a,c,u*c,1]}):[],...P(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],h=b=>{let y=S("input",e[0].dataType,e[0].dims.length),g=S("position_ids",e[1].dataType,e[1].dims.length),_=S("cos_cache",e[2].dataType,e[2].dims.length),w=S("sin_cache",e[3].dataType,e[3].dims.length),v=C("output",e[0].dataType,e[0].dims.length);return b.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:p.length},{name:"global_strides",type:"u32",length:f.length},{name:"input_output_strides",type:"u32",length:f.length}]),`
        ${b.declareVariables(y,g,_,w,v)}

        ${b.mainStart(Ye)}
          let half_rotary_emb_dim = uniforms.${_.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${g.broadcastedIndicesToOffset("bsnh.xy",C("",g.type.tensor,2))};
            let position_id =
                u32(${g.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${n});
            let j = i + select(half_rotary_emb_dim, 1, ${n});
            let re = ${y.getByOffset("i")} * ${_.get("position_id","bsnh[3]")} -
                ${y.getByOffset("j")} * ${w.get("position_id","bsnh[3]")};
            ${v.setByOffset("i","re")}
            let im = ${y.getByOffset("i")} * ${w.get("position_id","bsnh[3]")} +
                ${y.getByOffset("j")} * ${_.get("position_id","bsnh[3]")};
            ${v.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${v.setByOffset("k",y.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:N({interleaved:n}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:h,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(x.size(p)/Ye)},programUniforms:m})}},pa=(e,t)=>{ic(e.inputs,t),e.compute(cn(e.inputs,t))}});var sc,ac,ma,uc,fa,ha=k(()=>{"use strict";ie();V();en();sr();ur();Ve();dr();K();sc=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let n=e[0],r=e[1],o=e[2],i=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(n.dims.length!==3&&n.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let a=!1,u=n.dims[0],d=n.dims[1],l=n.dims.length===3?a?n.dims[2]/3:n.dims[2]:t.numHeads*n.dims[4],c=d,p=0,f=!r||r.dims.length===0,m=Math.floor(f?l/(t.numHeads+2*t.kvNumHeads):l/t.numHeads);f&&(l=m*t.numHeads);let h=i&&i.dims.length!==0,b=s&&s.dims.length!==0;if(h&&i.dims.length===4&&i.dims[0]===u&&i.dims[1]!==t.kvNumHeads&&i.dims[2]===t.kvNumHeads&&i.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(h&&b){if(i.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');p=i.dims[2]}else if(h||b)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let g=1;if(r&&r.dims.length>0){if(n.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(r.dims.length<3||r.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(n.dims[0]!==r.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(r.dims.length===3){if(n.dims[2]%r.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');c=r.dims[1]}else if(r.dims.length===5){if(r.dims[2]!==t.numHeads||r.dims[3]!==2||r.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(o)throw new Error('Expect "value" be none when "key" has packed kv format.');c=r.dims[1]}else{if(r.dims[1]!==t.numHeads||r.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');c=r.dims[2]}}else{if(n.dims.length!==3&&n.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(n.dims.length===5&&(n.dims[2]!==t.numHeads||n.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');g=3}let _=0,w=!1,v=t.kvNumHeads?m*t.kvNumHeads:l;if(o&&o.dims.length>0){if(o.dims.length!==3&&o.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(n.dims[0]!==o.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(o.dims.length===3){if(c!==o.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');v=o.dims[2]}else{if(c!==o.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');v=o.dims[1]*o.dims[3],w=!0}}let $=e.length>4?e[5]:void 0;if($&&$.dims.length!==1&&$.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:d,pastSequenceLength:p,kvSequenceLength:c,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:l,vHiddenSize:v,headSize:m,vHeadSize:Math.floor(v/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:_,scale:t.scale,broadcastResPosBias:!1,passPastInKv:w,qkvFormat:g}},ac=N({perm:[0,2,1,3]}),ma=(e,t,n)=>{let r=t,o=n.kvNumHeads;return t.dims.length===3&&n.kvSequenceLength!==0&&(r=t.reshape([n.batchSize,n.kvSequenceLength,o,n.headSize]),r=e.compute(pe(r,ac.perm),{inputs:[r],outputs:[-1]})[0]),r},uc=(e,t,n,r)=>{let o=7,i=["type","type"],s=[e*t],a=e*t,u=[{type:12,data:a},{type:12,data:t},{type:12,data:e}],d=l=>{let c=S("seq_lens",n.dataType,n.dims),p=S("total_seq_lens",r.dataType,r.dims),f=C("pos_ids",o,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${l.registerUniforms(m).declareVariables(c,p,f)}
  ${l.mainStart()}
    ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${p.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${c.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${f.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${f.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${f.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:i},getRunData:()=>({outputs:[{dims:s,dataType:o}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:u}),getShaderSource:d}},fa=(e,t)=>{let n=sc(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let r=e.inputs[0],o=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,i=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,a=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,d=e.inputs.length>5?e.inputs[6]:void 0,l=n.kvNumHeads?n.kvNumHeads:n.numHeads,c=N({axis:2,numOutputs:3,splitSizes:[n.numHeads*n.headSize,l*n.headSize,l*n.headSize]}),[p,f,m]=!o&&!i?e.compute(ar([r],c),{inputs:[r],outputs:[-1,-1,-1]}):[r,o,i],h,b;if(t.doRotary){let w=e.compute(uc(n.batchSize,n.sequenceLength,u,d),{inputs:[u,d],outputs:[-1]})[0],v=e.inputs[7],$=e.inputs[8],T=N({interleaved:t.rotaryInterleaved!==0,numHeads:n.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),I=[p,w,v,$],A=[-1];h=e.compute(cn(I,T),{inputs:I,outputs:A})[0],I.splice(0,1,f);let z=N({interleaved:t.rotaryInterleaved!==0,numHeads:n.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});b=e.compute(cn(I,z),{inputs:I,outputs:A})[0]}let y=_t(e,n.batchSize,n.numHeads,n.sequenceLength,n.headSize,t.doRotary?h:p,void 0,0),g=ma(e,t.doRotary?b:f,n),_=ma(e,m,n);ot(e,y,g,_,void 0,void 0,s,a,void 0,n,u,d)}});var ga,dc,lc,ya,ba=k(()=>{"use strict";V();q();Ve();K();ga=(e,t,n,r,o,i,s,a)=>{let u=X(i),d=u===1?"f32":`vec${u}f`,l=u===1?"vec2f":`mat2x${u}f`,c=o*s,p=64;c===1&&(p=256);let f=[o,s,i/u],m=[o,s,2],h=["rank","type","type"],b=[];b.push(...P(f,m));let y=g=>{let _=S("x",t.dataType,3,u),w=S("scale",n.dataType,n.dims),v=S("bias",r.dataType,r.dims),$=C("output",1,3,2),T=[_,w,v,$];return`
  var<workgroup> workgroup_shared : array<${l}, ${p}>;
  const workgroup_size = ${p}u;
  ${g.declareVariables(...T)}
  ${g.mainStart(p)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${d}(0);
    var squared_sum = ${d}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${d}(${_.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${l}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${Te("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${Te("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${a}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${a};${p}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:c},programUniforms:b}),getShaderSource:y},{inputs:[t,n,r],outputs:[-1]})[0]},dc=(e,t,n)=>{let r=t[0].dims,o=r,i=2,s=r[0],a=r[1],u=x.sizeFromDimension(r,i),d=X(u),l=x.size(o)/d,c=ga(e,t[0],t[1],t[2],s,u,a,n.epsilon),p=[s,a,u/d],f=[s,a],m=["type","none"],h=b=>{let y=S("x",t[0].dataType,p.length,d),g=S("scale_shift",1,f.length,2),_=C("output",t[0].dataType,p.length,d),w=[y,g,_];return`
  ${b.registerUniform("output_size","u32").declareVariables(...w)}
  ${b.mainStart()}
  ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${_.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${g.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${y.getByOffset("global_idx")} * ${_.type.value}(scale_shift.x) + ${_.type.value}(scale_shift.y);
      ${_.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${d}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:[{type:12,data:l},...P(p,f,p)]}),getShaderSource:h},{inputs:[t[0],c]})},lc=(e,t,n)=>{let r=t[0].dims,o=r,i=r[0],s=r[r.length-1],a=x.sizeFromDimension(r,1)/s,u=X(s),d=x.size(o)/u,l=[{type:12,data:a},{type:12,data:Math.floor(s/u)}],c=["type","type"],p=!1,f=[0,r.length-1];for(let y=0;y<r.length-2;y++)p=p||r[y+1]!==1,f.push(y+1);p=p&&r[r.length-1]!==1;let m=p?e.compute(pe(e.inputs[0],f),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:r.length},(y,g)=>r[f[g]])),h=ga(e,m,t[1],t[2],i,a,s,n.epsilon),b=y=>{let g=re(t[0].dataType),_=u===1?"vec2f":`mat${u}x2f`,w=T=>{let I=T===0?"x":"y",A=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${g}(${A}(scale.${I}))`;case 2:return`vec2<${g}>(${A}(scale[0].${I}, scale[1].${I}))`;case 4:return`vec4<${g}>(${A}(scale[0].${I}, scale[1].${I}, scale[2].${I}, scale[3].${I}))`;default:throw new Error(`Not supported compoents ${u}`)}},v=S("input",t[0].dataType,t[0].dims,u),$=C("output",t[0].dataType,o,u);return`
  @group(0) @binding(0) var<storage, read> input : array<${v.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${_}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${$.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${y.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${w(0)}, ${w(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:c},getRunData:()=>({outputs:[{dims:o,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:l}),getShaderSource:b},{inputs:[t[0],h]})},ya=(e,t)=>{t.format==="NHWC"?lc(e,e.inputs,t):dc(e,e.inputs,t)}});var cc,pc,_a,wa=k(()=>{"use strict";V();q();K();cc=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},pc=(e,t,n)=>{let r=t.simplified,o=e[0].dims,i=e[1],s=!r&&e[2],a=o,u=x.normalizeAxis(t.axis,o.length),d=x.sizeToDimension(o,u),l=x.sizeFromDimension(o,u),c=x.size(i.dims),p=s?x.size(s.dims):0;if(c!==l||s&&p!==l)throw new Error(`Size of X.shape()[axis:] == ${l}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${c} and bias size of ${p}`);let f=[];for(let v=0;v<o.length;++v)v<u?f.push(o[v]):f.push(1);let m=X(l),h=["type","type"],b=[{type:12,data:d},{type:1,data:l},{type:12,data:Math.floor(l/m)},{type:1,data:t.epsilon}];s&&h.push("type");let y=n>1,g=n>2,_=v=>{let $=re(e[0].dataType),T=[S("x",e[0].dataType,e[0].dims,m),S("scale",i.dataType,i.dims,m)];s&&T.push(S("bias",s.dataType,s.dims,m)),T.push(C("output",e[0].dataType,a,m)),y&&T.push(C("mean_data_output",1,f)),g&&T.push(C("inv_std_output",1,f));let I=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${v.registerUniforms(I).declareVariables(...T)}
  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${qn("f32",m)};
    var mean_square_vector = ${qn("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Je($,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${Te("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${Te("mean_square_vector",m)} / uniforms.norm_size ${r?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Je($,m,"x[j + offset]")};
      let f32scale = ${Je($,m,"scale[j]")};
      output[j + offset] = ${T[0].type.value}((f32input ${r?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Je($,m,"bias[j]")}`:""}
      );
    }

    ${y?"mean_data_output[global_idx] = mean":""};
    ${g?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},w=[{dims:a,dataType:e[0].dataType}];return y&&w.push({dims:f,dataType:1}),g&&w.push({dims:f,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${n};${r}`,inputDependencies:h},getRunData:()=>({outputs:w,dispatchGroup:{x:Math.ceil(d/64)},programUniforms:b}),getShaderSource:_}},_a=(e,t)=>{cc(e.inputs),e.compute(pc(e.inputs,t,e.outputCount))}});var mc,$a,va=k(()=>{"use strict";q();an();un();mc=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},$a=e=>{mc(e.inputs);let t=Pe.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let n=t[t.length-1],r=e.inputs[0].dims[e.inputs[0].dims.length-1];if(n<8&&r<8)e.compute(sn(e.inputs,{activation:""},t));else{let o=t[t.length-2],i=x.size(e.inputs[0].dims.slice(0,-2)),s=x.size(e.inputs[1].dims.slice(0,-2));if(i!==1&&o===1&&s===1){let a=e.inputs[0].reshape([1,i,r]),u=e.inputs[1].reshape([1,r,n]),d=[1,i,n],l=[a,u];e.compute(bt(l,{activation:""},t,d),{inputs:l})}else e.compute(bt(e.inputs,{activation:""},t))}}});var fc,hc,gc,xa,Sa,Ta=k(()=>{"use strict";V();q();ie();K();fc=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let n=e[0],r=n.dims.length;if(n.dims[r-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let o=Math.floor((t.k+t.blockSize-1)/t.blockSize),i=t.blockSize/8*t.bits,s=e[1];if(!x.areEqual(s.dims,[t.n,o,i]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let u=e[2].dims;if(x.size(u)!==t.n*o)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,c=t.n*(t.bits===8?o:Math.floor((o*t.bits+7)/8));if(x.size(l)!==c)throw new Error("zeroPoints input size error.")}},hc=(e,t)=>{let n=e[0].dims,r=n.length,o=n[r-2],i=t.k,s=t.n,a=n.slice(0,r-2),u=x.size(a),l=e[1].dims[2]/4,c=e[0].dataType,p=X(t.k),f=X(l),m=X(s),h=a.concat([o,s]),b=o>1&&s/m%2===0?2:1,y=x.size(h)/m/b,g=64,_=[],w=[u,o,i/p],v=x.convertShape(e[1].dims).slice();v.splice(-1,1,l/f),_.push(...P(w)),_.push(...P(v)),_.push(...P(e[2].dims)),e.length===4&&_.push(...P(x.convertShape(e[3].dims)));let $=[u,o,s/m];_.push(...P($));let T=I=>{let A=w.length,z=S("a",e[0].dataType,A,p),M=S("b",12,v.length,f),U=S("scales",e[2].dataType,e[2].dims.length),G=[z,M,U],B=e.length===4?S("zero_points",12,e[3].dims.length):void 0;B&&G.push(B);let ee=$.length,W=C("output",e[0].dataType,ee,m),D=re(e[0].dataType),Z=(()=>{switch(p){case 1:return`array<${D}, 8>`;case 2:return`mat4x2<${D}>`;case 4:return`mat2x4<${D}>`;default:throw new Error(`${p}-component is not supported.`)}})(),R=()=>{let se=`
          // reuse a data
            var input_offset = ${z.indicesToOffset(`${z.type.indices}(batch, row, word_offset)`)};
            var a_data: ${Z};
            for (var j: u32 = 0; j < ${8/p}; j++) {
              a_data[j] = ${z.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let H=0;H<m*b;H++)se+=`
            b_value = ${f===1?`b${H}_data`:`b${H}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${Z}(${Array.from({length:4},(E,L)=>`${D}(b_value_lower[${L}]), ${D}(b_value_upper[${L}])`).join(", ")});
            b_dequantized_values = ${p===1?`${Z}(${Array.from({length:8},(E,L)=>`(b_quantized_values[${L}] - ${B?`zero_point${H}`:"zero_point"}) * scale${H}`).join(", ")});`:`(b_quantized_values - ${Z}(${Array(8).fill(`${B?`zero_point${H}`:"zero_point"}`).join(",")})) * scale${H};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(H/m)}]${m>1?`[${H%m}]`:""} += ${Array.from({length:8/p},(E,L)=>`${p===1?`a_data[${L}] * b_dequantized_values[${L}]`:`dot(a_data[${L}], b_dequantized_values[${L}])`}`).join(" + ")};
          `;return se},Q=()=>{let se=`
            var col_index = col * ${m};
            ${B?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${D}(8);`}
            `;for(let H=0;H<m*b;H++)se+=`
            let scale${H} = ${U.getByOffset("col_index * nBlocksPerCol + block")};
            ${B?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${B.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${H} = ${D}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return se},we=()=>{let se=`col_index = col * ${m};`;for(let H=0;H<m*b;H++)se+=`
            let b${H}_data = ${M.getByIndices(`${M.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return se+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${Z};
            var b_dequantized_values: ${Z};`,se};return`
        var<workgroup> workgroup_shared: array<${W.type.value}, ${b*g}>;
        ${I.declareVariables(...G,W)}
        ${I.mainStart([g,1,1])}
          let output_indices = ${W.offsetToIndices(`(global_idx / ${g}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${g}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/p};
            ${Q()}
            for (var word: u32 = 0; word < ${l}; word += ${f}) {
              ${we()}
              for (var i: u32 = 0; i < ${f}; i++) {
                ${R()}
                word_offset += ${8/p};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${b}) {
            var output_value: ${W.type.value} = ${W.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${g}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${b};
            }
            ${W.setByIndices(`${W.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${p};${f};${m};${b};${g}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:h,dataType:c}],dispatchGroup:{x:y},programUniforms:_}),getShaderSource:T}},gc=(e,t)=>{let n=e[0].dims,r=n.length,o=n[r-2],i=t.k,s=t.n,a=n.slice(0,r-2),u=x.size(a),l=e[1].dims[2]/4,c=e[0].dataType,p=X(t.k),f=X(l),m=a.concat([o,s]),h=128,b=s%8===0?8:s%4===0?4:1,y=h/b,g=y*f*8,_=g/p,w=g/t.blockSize,v=x.size(m)/b,$=[],T=[u,o,i/p],I=x.convertShape(e[1].dims).slice();I.splice(-1,1,l/f),$.push(...P(T)),$.push(...P(I)),$.push(...P(e[2].dims)),e.length===4&&$.push(...P(x.convertShape(e[3].dims)));let A=[u,o,s];$.push(...P(A));let z=M=>{let U=T.length,G=S("a",e[0].dataType,U,p),B=S("b",12,I.length,f),ee=S("scales",e[2].dataType,e[2].dims.length),W=[G,B,ee],D=e.length===4?S("zero_points",12,e[3].dims.length):void 0;D&&W.push(D);let Z=A.length,R=C("output",e[0].dataType,Z),Q=re(e[0].dataType),we=()=>{switch(p){case 1:return`
          let a_data0 = vec4<${Q}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${Q}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${Q}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${Q}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${p}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${G.type.value}, ${_}>;
        var<workgroup> inter_results: array<array<${R.type.value}, ${y}>, ${b}>;
        ${M.declareVariables(...W,R)}
        ${M.mainStart([y,b,1])}
          let output_indices = ${R.offsetToIndices(`workgroup_index * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${w} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${_};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${_}; a_offset += ${h})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${G.getByIndices(`${G.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${G.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${w} + local_id.x;
            ${D?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${D.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${Q}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${Q}(8);`}
            let scale = ${ee.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${B.getByIndices(`${B.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/p};
            for (var i: u32 = 0; i < ${f}; i++) {
              ${we()}
              let b_value = ${f===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${Q}>(${Array.from({length:4},(se,H)=>`${Q}(b_value_lower[${H}]), ${Q}(b_value_upper[${H}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${Q}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(se,H)=>`${`dot(a_data${H}, b_dequantized_values[${H}])`}`).join(" + ")};
              word_offset += ${8/p};
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${R.type.value} = ${R.type.value}(0);
            for (var b = 0u; b < ${y}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${R.setByIndices(`${R.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${p};${f};${y};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:c}],dispatchGroup:{x:v},programUniforms:$}),getShaderSource:z}},xa=(e,t)=>{fc(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(gc(e.inputs,t)):e.compute(hc(e.inputs,t))},Sa=e=>N(e)});var yc,bc,_c,wc,$c,vc,xc,Sc,Ia,Ca=k(()=>{"use strict";V();q();K();yc=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},bc=(e,t,n)=>{let r="";for(let o=t-1;o>=0;--o)r+=`
            k = i32(${e.indicesGet("indices",o)}) - ${O("uniforms.pads",o,n)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${O("uniforms.x_shape",o,t)})) {
              break;
            }
            offset += k * i32(${O("uniforms.x_strides",o,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${r}
            value = x[offset];
          }
      `},_c=(e,t,n)=>{let r="";for(let o=t-1;o>=0;--o)r+=`
                k = i32(${e.indicesGet("indices",o)}) - ${O("uniforms.pads",o,n)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${O("uniforms.x_shape",o,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${O("uniforms.x_shape",o,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${O("uniforms.x_strides",o,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${r}
              value = x[offset];
          `},wc=(e,t,n)=>{let r="";for(let o=t-1;o>=0;--o)r+=`
                k = i32(${e.indicesGet("indices",o)}) - ${O("uniforms.pads",o,n)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${O("uniforms.x_shape",o,t)})) {
                  k = i32(${O("uniforms.x_shape",o,t)}) - 1;
                }
                offset += k * i32(${O("uniforms.x_strides",o,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${r}
              value = x[offset];
          `},$c=(e,t,n)=>{let r="";for(let o=t-1;o>=0;--o)r+=`
                k = i32(${e.indicesGet("indices",o)}) - ${O("uniforms.pads",o,n)};
                if (k < 0)  {
                  k += i32(${O("uniforms.x_shape",o,t)}]);
                }
                if (k >= i32(${O("uniforms.x_shape",o,t)})) {
                  k -= i32(${O("uniforms.x_shape",o,t)});
                }
                offset += k * i32(${O("uniforms.x_strides",o,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${r}
              value = x[offset];
          `},vc=(e,t,n)=>{switch(n.mode){case 0:return bc(e,t,n.pads.length);case 1:return _c(e,t,n.pads.length);case 2:return wc(e,t,n.pads.length);case 3:return $c(e,t,n.pads.length);default:throw new Error("Invalid mode")}},xc=(e,t)=>{let n=x.padShape(e[0].dims.slice(),t.pads),r=e[0].dims,o=x.size(n),i=[{type:12,data:o},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&i.push({type:s?e[2].dataType:1,data:t.value}),i.push(...P(e[0].dims,n));let a=["rank"],u=d=>{let l=C("output",e[0].dataType,n.length),c=S("x",e[0].dataType,r.length),p=c.type.value,f=vc(l,r.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?p:"f32"}),`
            ${d.registerUniforms(m).declareVariables(c,l)}
            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${l.offsetToIndices("global_idx")};

            var value = ${p}(0);
            ${f}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(x.size(n)/64)},programUniforms:i}),getShaderSource:u}},Sc=(e,t)=>{if(e.length>1){let n=e[1].getBigInt64Array(),r=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,o=e[0].dims.length,i=new Int32Array(2*o).fill(0);if(e.length>=4){let a=e[3].getBigInt64Array();for(let u=0;u<a.length;u++)i[Number(a[u])]=Number(n[u]),i[Number(a[u])+o]=Number(n[u+a.length])}else n.forEach((a,u)=>i[Number(u)]=Number(a));let s=[];return i.forEach(a=>s.push(a)),{mode:t.mode,value:r,pads:s}}else return t},Ia=(e,t)=>{yc(e.inputs);let n=Sc(e.inputs,t);e.compute(xc(e.inputs,n),{inputs:[0]})}});var pn,Aa,Ea,ka,Pa,Tc,Ic,za,Ba,Da,Oa,Ma,Ua,Ra,Va,Na,La,Wa,Ga,Ha=k(()=>{"use strict";ye();V();q();K();pn=e=>{if(te.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Aa=(e,t,n)=>{let r=t.format==="NHWC",o=e.dims.slice();r&&o.splice(1,0,o.pop());let i=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),a=t.strides.slice(),u=i?t.dilations.slice():[],d=t.pads.slice();Xe.adjustPoolAttributes(n,o,s,a,u,d);let l=Xe.computePoolOutputShape(n,o,a,u,s,d,t.autoPad),c=Object.assign({},t);i?Object.assign(c,{kernelShape:s,strides:a,pads:d,dilations:u,cacheKey:t.cacheKey}):Object.assign(c,{kernelShape:s,strides:a,pads:d,cacheKey:t.cacheKey});let p=l.slice();return p.push(p.splice(1,1)[0]),[c,r?p:l]},Ea=(e,t)=>{let n=t.format==="NHWC",r=x.size(e),o=x.size(t.kernelShape),i=[{type:12,data:r},{type:12,data:o}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let a=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],d=t.pads[t.pads.length/2-1],l=t.pads[t.pads.length-1],c=!!(d+l);i.push({type:12,data:a},{type:12,data:u},{type:12,data:d},{type:12,data:l}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let p=!1;if(t.kernelShape.length===2){let f=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],h=t.pads[t.pads.length/2-2],b=t.pads[t.pads.length-2];p=!!(h+b),i.push({type:12,data:f},{type:12,data:m},{type:12,data:h},{type:12,data:b}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[i,s,!0,c,p]}else{if(n)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let a=x.computeStrides(t.kernelShape);i.push({type:12,data:a},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:a.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((d,l)=>d+l);return[i,s,!!u,!1,!1]}},ka=(e,t,n,r,o,i,s,a,u,d,l,c)=>{let p=o.format==="NHWC",f=t.type.value,m=C("output",t.type.tensor,r);if(o.kernelShape.length<=2){let h="",b="",y="",g=n-(p?2:1);if(l?h=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${g}] = indices[${g}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${g}] < 0 || xIndices[${g}]
                      >= uniforms.x_shape[${g}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${i}
                }`:h=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${g}] = indices[${g}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${i}
                }`,o.kernelShape.length===2){let w=n-(p?3:2);c?b=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${w}] < 0 || xIndices[${w}] >= uniforms.x_shape[${w}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:b=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sh - uniforms.phStart + j;
                `,y=`
              }
            `}return`
            ${e.registerUniforms(u).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var value = ${f}(${a});
              var pad = 0;
              ${b}
              ${h}
              ${y}
              ${s}

              output[global_idx] = value;
            }`}else{if(p)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let h=o.kernelShape.length,b=o.pads.length,y="";return d?y=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${i}
              }`:y=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${i}
            `,`
            ${e.registerUniforms(u).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var offsets: array<u32, ${h}>;

              var value = ${f}(${a});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${h-1}u; j++) {
                  offsets[j] = offset / ${O("uniforms.kernelStrides","j",h)};
                  offset -= offsets[j] * ${O("uniforms.kernelStrides","j",h)};
                }
                offsets[${h-1}] = offset;

                isPad = false;
                for (var j = ${n-h}u; j < ${n}u; j++) {
                  xIndices[j] = indices[j] * ${O("uniforms.strides",`j - ${n-h}u`,h)}
                    + offsets[j - ${n-h}u] - ${O("uniforms.pads","j - 2u",b)};
                  ${y}
              }
              ${s}

              output[global_idx] = value;
            }`}},Pa=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Tc=e=>`${Pa(e)};${e.countIncludePad}`,Ic=e=>`${Pa(e)};${e.storageOrder};${e.dilations}`,za=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Ba=(e,t,n,r)=>{let[o,i]=Aa(t,r,n),s=S("x",t.dataType,t.dims.length),a=s.type.value,u="value += x_val;",d="";o.countIncludePad?d+=`value /= ${a}(uniforms.kernelSize);`:d+=`value /= ${a}(i32(uniforms.kernelSize) - pad);`;let[l,c,p,f,m]=Ea(i,o);l.push(...P(t.dims,i));let h=["rank"];return{name:e,shaderCache:{hint:`${r.cacheKey};${p};${f};${m}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:i,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(x.size(i)/64)},programUniforms:l}),getShaderSource:b=>ka(b,s,t.dims.length,i.length,o,u,d,0,c,p,f,m)}},Da=e=>{let t=e.count_include_pad!==0,n=za(e);if(n.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let r={countIncludePad:t,...n,cacheKey:""};return{...r,cacheKey:Tc(r)}},Oa=(e,t)=>{pn(e.inputs),e.compute(Ba("AveragePool",e.inputs[0],!1,t))},Ma={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Ua=e=>{let t=e.format;return{format:t,...Ma,cacheKey:t}},Ra=(e,t)=>{pn(e.inputs),e.compute(Ba("GlobalAveragePool",e.inputs[0],!0,t))},Va=(e,t,n,r)=>{let[o,i]=Aa(t,r,n),s=`
      value = max(x_val, value);
    `,a="",u=S("x",t.dataType,t.dims.length),d=["rank"],[l,c,p,f,m]=Ea(i,o);return l.push(...P(t.dims,i)),{name:e,shaderCache:{hint:`${r.cacheKey};${p};${f};${m}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:i,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(x.size(i)/64)},programUniforms:l}),getShaderSource:h=>ka(h,u,t.dims.length,i.length,o,s,a,t.dataType===10?-65504:-1e5,c,p,f,m)}},Na=(e,t)=>{pn(e.inputs),e.compute(Va("MaxPool",e.inputs[0],!1,t))},La=e=>{let t=e.storage_order,n=e.dilations,r=za(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let o={storageOrder:t,dilations:n,...r,cacheKey:""};return{...o,cacheKey:Ic(o)}},Wa=e=>{let t=e.format;return{format:t,...Ma,cacheKey:t}},Ga=(e,t)=>{pn(e.inputs),e.compute(Va("GlobalMaxPool",e.inputs[0],!0,t))}});var Ac,Ec,qa,Fa,Ka=k(()=>{"use strict";V();q();ie();K();Ac=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((n,r)=>n===e[2].dims[r]).reduce((n,r)=>n&&r,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((o,i)=>i===t.axis||o===e[0].dims[i]).reduce((o,i)=>o&&i,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let n=e[0].dims[t.axis],r=e[1].dims[t.axis];if(t.blockSize<Math.ceil(n/r)||t.blockSize>Math.ceil(n/(r-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Ec=(e,t)=>{let n=x.normalizeAxis(t.axis,e[0].dims.length),r=e[0].dataType,o=r===3,i=e[0].dims,s=e[1].dataType,a=x.size(i),u=r===3||r===2,d=u?[Math.ceil(x.size(e[0].dims)/4)]:e[0].dims,l=e[1].dims,c=e.length>2?e[2]:void 0,p=c?u?[Math.ceil(x.size(c.dims)/4)]:c.dims:void 0,f=l.length===0||l.length===1&&l[0]===1,m=f===!1&&l.length===1,h=X(a),b=f&&(!u||h===4),y=b?h:1,g=b&&!u?h:1,_=S("input",u?12:r,d.length,g),w=S("scale",s,l.length),v=c?S("zero_point",u?12:r,p.length):void 0,$=C("output",s,i.length,y),T=[_,w];v&&T.push(v);let I=[d,l];c&&I.push(p);let A=[{type:12,data:a/y},{type:12,data:n},{type:12,data:t.blockSize},...P(...I,i)],z=M=>{let U=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${M.registerUniforms(U).declareVariables(...T,$)}
      ${M.mainStart()}
          ${M.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${$.offsetToIndices("global_idx")};

          // Set input x
          ${u?`
            let input = ${_.getByOffset("global_idx / 4")};
            let x_vec = ${o?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${y===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${_.getByOffset("global_idx")};`};

          // Set scale input
          ${f?`let scale_value= ${w.getByOffset("0")}`:m?`
            let scale_index = ${$.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${w.getByOffset("scale_index")};`:`
            var scale_indices: ${w.type.indices} = output_indices;
            let index = ${w.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${w.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${w.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${v?f?u?`
                let zero_point_input = ${v.getByOffset("0")};
                let zero_point_vec =  ${o?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${v.getByOffset("0")}`:m?u?`
                let zero_point_index = ${$.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${v.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${o?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${$.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${v.getByOffset("zero_point_index")};`:u?`
                let zero_point_offset = ${w.indicesToOffset("scale_indices")};
                let zero_point_input = ${v.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${o?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${v.getByIndices("scale_indices")};`:`let zero_point_value = ${u?o?"i32":"u32":_.type.value}(0);`};
      // Compute and write output
      ${$.setByOffset("global_idx",`${$.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:v?["rank","rank","rank"]:["rank","rank"]},getShaderSource:z,getRunData:()=>({outputs:[{dims:i,dataType:s}],dispatchGroup:{x:Math.ceil(a/y/64),y:1,z:1},programUniforms:A})}},qa=(e,t)=>{Ac(e.inputs,t),e.compute(Ec(e.inputs,t))},Fa=e=>N({axis:e.axis,blockSize:e.blockSize})});var kc,Pc,ja,Za=k(()=>{"use strict";ye();V();K();kc=(e,t,n)=>{let r=e===t,o=e<t&&n<0,i=e>t&&n>0;if(r||o||i)throw new Error("Range these inputs' contents are invalid.")},Pc=(e,t,n,r)=>{let o=Math.abs(Math.ceil((t-e)/n)),i=[o],s=o,a=[{type:12,data:s},{type:r,data:e},{type:r,data:n},...P(i)],u=d=>{let l=C("output",r,i.length),c=l.type.value,p=[{name:"outputSize",type:"u32"},{name:"start",type:c},{name:"delta",type:c}];return`
        ${d.registerUniforms(p).declareVariables(l)}
        ${d.mainStart()}
        ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${c}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${r}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:i,dataType:r}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:a})}},ja=e=>{let t=0,n=0,r=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],n=e.inputs[1].getInt32Array()[0],r=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],n=e.inputs[1].getFloat32Array()[0],r=e.inputs[2].getFloat32Array()[0]),te.webgpu.validateInputContent&&kc(t,n,r),e.compute(Pc(t,n,r,e.inputs[0].dataType),{inputs:[]})}});var zc,Bc,Qa,Xa,Ya=k(()=>{"use strict";V();q();ie();K();zc=(e,t,n,r)=>{if(e!=="none"&&r!=="i32"&&r!=="u32"&&r!=="f32")throw new Error(`Input ${r} is not supported with reduction ${e}.`);let o=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,i=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${n};`;case"add":return r==="i32"||r==="u32"?`atomicAdd(&${t}, bitcast<${r}>(${n}));`:`
              ${o}bitcast<${r}>(oldValue) + (${n})${i}`;case"max":return r==="i32"||r==="u32"?`atomicMax(&${t}, bitcast<${r}>(${n}));`:`
                ${o}max(bitcast<f32>(oldValue), (${n}))${i}`;case"min":return r==="i32"||r==="u32"?`atomicMin(&${t}, bitcast<${r}>(${n}));`:`${o}min(bitcast<${r}>(oldValue), (${n}))${i}`;case"mul":return`${o}(bitcast<${r}>(oldValue) * (${n}))${i}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Bc=(e,t)=>{let n=e[0].dims,r=e[1].dims,o=n,i=1,s=Math.ceil(x.sizeToDimension(r,r.length-1)/i),a=r[r.length-1],u=x.sizeFromDimension(n,a),d=[{type:12,data:s},{type:12,data:a},{type:12,data:u},...P(e[1].dims,e[2].dims,o)],l=c=>{let p=S("indices",e[1].dataType,e[1].dims.length),f=S("updates",e[2].dataType,e[2].dims.length,i),m=t.reduction!=="none"&&t.reduction!==""?So("output",e[0].dataType,o.length):C("output",e[0].dataType,o.length,i);return`
      ${c.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(p,f,m)}
      ${c.mainStart()}
        ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${zc(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:l}},Qa=e=>N({reduction:e.reduction}),Xa=(e,t)=>{e.compute(Bc(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}});var Dc,Oc,Mc,Ja,Uc,Rc,Vc,Nc,Lc,Wc,Gc,Hc,eu,qc,Fc,Kc,jc,Zc,tu,nu,ru=k(()=>{"use strict";V();q();ie();K();Dc=(e,t)=>{if(e.every(n=>n>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Oc=(e,t,n)=>{t.every(o=>o>=0&&o<n||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let r=new Array(n).fill(1);return t.forEach((o,i)=>r[o]=e[i]),r},Mc=(e,t,n,r,o,i)=>{let[s,a,u]=n>10?[1,2,3]:[-1,e.length>1?1:-1,-1],d=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(l=>i.push(l));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(a>0&&e.length>a&&e[a].dims.length===1&&e[a].dims[0]>0){if(e[a].getFloat32Array().forEach(l=>r.push(l)),r.length!==0&&r.length!==d&&n>=18&&r.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Dc(r,t),t.axes.length>0&&Oc(r,t.axes,d).forEach((l,c)=>r[c]=l)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(l=>o.push(Number(l))),o.length!==0&&o.length!==d&&n>=18&&o.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(r.length!==0&&r.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(o.length!==0&&o.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof r<"u"&&typeof o<"u"&&r.length>0&&o.length>d)throw new Error("Resize requires only of scales or sizes to be specified")},Ja=(e,t,n,r)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${r}(big / (${n}));
  let fract = ${r}(big % (${n})) / ${r}(${n});
  return whole + fract;
`,Uc=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Ja("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Ja("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",Rc=(e,t,n)=>`fn getNearestPixelFromOriginal(xOriginal: ${n}, isDownSample: bool) -> ${n} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Vc=(e,t,n)=>{let r=new Array(n).fill(0).concat(new Array(n).fill(1)),o=e.length===0?r:e.slice();return t.length>0?(t.forEach((i,s)=>{r[i]=o[s],r[s+n]=o[t.length+s]}),r):o},Nc=(e,t,n,r)=>{let o=[];if(n.length>0)if(r.length>0){if(e.forEach(i=>o.push(i)),Math.max(...r)>e.length)throw new Error("axes is out of bound");r.forEach((i,s)=>o[i]=n[s])}else n.forEach(i=>o.push(i));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");o=e.map((i,s)=>Math.round(i*t[s]))}return o},Lc=(e,t,n)=>{let r=(()=>{switch(n.keepAspectRatioPolicy){case"not_larger":return n.axes.length>0?Math.min(...n.axes.map(i=>t[i]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return n.axes.length>0?Math.max(...n.axes.map(i=>t[i]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${n.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let o=e.slice();return n.axes.length>0?(n.axes.forEach(i=>t[i]=r),n.axes.forEach(i=>o[i]=Math.round(e[i]*t[i]))):(t.fill(r,0,t.length),o.forEach((i,s)=>o[s]=Math.round(i*t[s]))),o},Wc=(e,t,n,r,o)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${n.length}> {
      var original_indices: array<${e.type.value}, ${n.length}>;
      for (var i:u32 = 0; i < ${n.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${O("uniforms.scales","i",r)};
        var roi_low = ${O("uniforms.roi","i",o)};
        var roi_hi = ${O("uniforms.roi",`i + ${t.length}`,o)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${O("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${O("uniforms.output_shape","i",n.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,Gc=(e,t,n,r,o,i,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${O("uniforms.scales","i",o)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${O("uniforms.roi","i",i)};
          var roi_hi = ${O("uniforms.roi",`i + ${n.length}`,i)};
          var input_shape_i = ${O("uniforms.input_shape","i",n.length)};
          var output_shape_i = ${O("uniforms.output_shape","i",r.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,Hc=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${O("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,eu=(e,t,n,r)=>e.rank>r?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",n,"batch")};
`:"",qc=(e,t,n,r,o)=>{let[s,a,u,d]=n.length===2?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",a,`max(0, min(row, ${n[a]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(col, ${n[u]} - 1))`)};
      ${eu(e,d,s,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${l} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${l} = originalIndices[${a}];
      var col:${l} = originalIndices[${u}];
      ${r?`if (row < 0 || row > (${n[a]} - 1) || col < 0 || col > (${n[u]} - 1)) {
        return ${o};
      }`:""};
      row = max(0, min(row, ${n[a]} - 1));
      col = max(0, min(col, ${n[u]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${n.length>2?`u32(originalIndices[${d}])`:"0"};
      var batch: u32 =  ${n.length>2?`u32(originalIndices[${s}])`:"0"};
      var x11: ${l} = getInputValue(batch, channel, row1, col1);
      var x12: ${l} = getInputValue(batch, channel, row1, col2);
      var x21: ${l} = getInputValue(batch, channel, row2, col1);
      var x22: ${l} = getInputValue(batch, channel, row2, col2);
      var dx1: ${l} = abs(row - ${l}(row1));
      var dx2: ${l} = abs(${l}(row2) - row);
      var dy1: ${l} = abs(col - ${l}(col1));
      var dy2: ${l} = abs(${l}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},Fc=(e,t,n,r,o,i,s,a,u,d)=>{let l=n.length===2,c=!0,[p,f]=l?[0,1]:c?[2,3]:[1,2],m=e.type.value,h=b=>{let y=b===p?"row":"col";return`
      fn ${y}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${m} {
        var output_index = ${t.indicesGet("output_indices",b)};
        var originalIdx: ${m} = getOriginalCoordinateFromResizedCoordinate(output_index, ${o[b]},
        ${r[b]}, ${n[b]}, ${i[b]}, ${i[b]} + ${n.length});
        var fractOriginalIdx: ${m} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${a} && (originalIdx < 0 || originalIdx > (${n[b]} - 1))) {
          return ${u};
        }
        var data: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${y}: ${m} = originalIdx + ${m}(i);
          if (${y} < 0 || ${y} >= ${n[b]}) {
            ${d?`coefs[i + 1] = 0.0;
                        continue;`:a?`return ${u};`:`${y} = max(0, min(${y}, ${n[b]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",b,`u32(${y})`)};
          data[i + 1] = ${b===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${h(p)};
    ${h(f)};
  fn getCubicInterpolationCoefs(s: ${m}) -> array<${m}, 4> {
    var absS = abs(s);
    var coeffs: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${m} = 1.0 - absS;
    var twoMinusAbsS: ${m} = 2.0 - absS;
    var onePlusAbsS: ${m} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${m}, 4>, coefs: array<${m}, 4>) -> ${m} {
    var coefsSum: ${m} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${m} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},Kc=(e,t,n,r,o)=>{let[s,a,u,d,l]=n.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],c=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${c} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",a,`max(0, min(depth, ${n[a]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(height, ${n[u]} - 1))`)};
      ${e.indicesSet("input_indices",d,`max(0, min(width, ${n[d]} - 1))`)};
      ${eu(e,l,s,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${c} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${c} = originalIndices[${a}];
      var height:${c} = originalIndices[${u}];
      var width:${c} = originalIndices[${d}];
      ${r?`if (depth < 0 || depth > (${n[a]} - 1) || height < 0 || height > (${n[u]} - 1) || width < 0 || (width > ${n[d]} - 1)) {
      return ${o};
        }`:""};

    depth = max(0, min(depth, ${n[a]} - 1));
      height = max(0, min(height, ${n[u]} - 1));
      width = max(0, min(width, ${n[d]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${n.length>3?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${n.length>3?`u32(originalIndices[${s}])`:"0"};

      var x111: ${c} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${c} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${c} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${c} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${c} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${c} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${c} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${c} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${c} = abs(depth - ${c}(depth1));
      var dx2: ${c} = abs(${c}(depth2) - depth);
      var dy1: ${c} = abs(height - ${c}(height1));
      var dy2: ${c} = abs(${c}(height2) - height);
      var dz1: ${c} = abs(width - ${c}(width1));
      var dz2: ${c} = abs(${c}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},jc=(e,t,n,r,o,i)=>{let s=e.dims,a=Vc(i,t.axes,s.length),u=Nc(s,r,o,t.axes),d=r.slice();r.length===0&&(d=s.map((g,_)=>g===0?1:u[_]/g),t.keepAspectRatioPolicy!=="stretch"&&(u=Lc(s,d,t)));let l=C("output",e.dataType,u.length),c=S("input",e.dataType,s.length),p=x.size(u),f=s.length===u.length&&s.every((g,_)=>g===u[_]),m=t.coordinateTransformMode==="tf_crop_and_resize",h=t.extrapolationValue,b=c.type.value,y=g=>`
      ${f?"":`
      ${Uc(t.coordinateTransformMode,b)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Hc(c,s)};
              ${Rc(t.nearestMode,n,b)};
              ${Gc(c,l,s,u,d.length,a.length,m)};
              `;case"linear":return`
              ${Wc(l,s,u,d.length,a.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${qc(c,l,s,m,h)}`;if(s.length===3||s.length===5)return`${Kc(c,l,s,m,h)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${Fc(c,l,s,u,d,a,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${g.registerUniform("output_size","u32").registerUniform("scales","f32",d.length).registerUniform("roi","f32",a.length).declareVariables(c,l)}
      ${g.mainStart()}
        ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${f?"output[global_idx] = input[global_idx];":`
        let output_indices = ${l.offsetToIndices("global_idx")};
        var input_indices: ${c.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${c.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${n}|${d.length>0?t.mode==="cubic"?d:d.length:""}|${o.length>0?o:""}|${a.length>0?a:""}|${f}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:y,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:[{type:12,data:p},{type:1,data:d},{type:1,data:a},...P(s,u)]})}},Zc=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},tu=(e,t)=>{let n=[],r=[],o=[],i=Zc(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Mc(e.inputs,t,i,n,r,o),e.compute(jc(e.inputs[0],t,i,n,r,o),{inputs:[0]})},nu=e=>{let t=e.antialias,n=e.axes,r=e.coordinateTransformMode,o=e.cubicCoeffA,i=e.excludeOutside!==0,s=e.extrapolationValue,a=e.keepAspectRatioPolicy,u=e.mode,d=e.nearestMode===""?"simple":e.nearestMode;return N({antialias:t,axes:n,coordinateTransformMode:r,cubicCoeffA:o,excludeOutside:i,extrapolationValue:s,keepAspectRatioPolicy:a,mode:u,nearestMode:d})}});var Qc,Xc,ou,iu=k(()=>{"use strict";V();q();K();Qc=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],n=e[1],r=e[2];if(t.dataType!==n.dataType||t.dataType!==r.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(n.dims.length!==3&&n.dims.length!==2)throw new Error("Skip must be 2D or 3D");let o=t.dims[t.dims.length-1],i=t.dims[t.dims.length-2];if(n.dims[n.dims.length-1]!==o)throw new Error("Skip must have the same hidden size as input");if(n.dims[n.dims.length-2]!==i)throw new Error("Skip must have the same sequence length as input");if(r.dims.length!==1)throw new Error("Gamma must be 1D");if(r.dims[r.dims.length-1]!==o)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==o)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==o)throw new Error("Bias must have the same hidden size as input")}},Xc=(e,t,n,r)=>{let o=t.simplified,i=e[0].dims,s=x.size(i),a=i,u=s,d=i.slice(-1)[0],l=r?i.slice(0,-1).concat(1):[],c=!o&&e.length>3,p=e.length>4,f=r&&n>1,m=r&&n>2,h=n>3,b=64,y=X(d),g=[{type:12,data:u},{type:12,data:y},{type:12,data:d},{type:1,data:t.epsilon}],_=v=>{let $=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],T=[S("x",e[0].dataType,e[0].dims,y),S("skip",e[1].dataType,e[1].dims,y),S("gamma",e[2].dataType,e[2].dims,y)];c&&T.push(S("beta",e[3].dataType,e[3].dims,y)),p&&T.push(S("bias",e[4].dataType,e[4].dims,y)),T.push(C("output",e[0].dataType,a,y)),f&&T.push(C("mean_output",1,l)),m&&T.push(C("inv_std_output",1,l)),h&&T.push(C("input_skip_bias_sum",e[0].dataType,a,y));let I=re(e[0].dataType),A=re(1,y);return`

      ${v.registerUniforms($).declareVariables(...T)}
      var<workgroup> sum_shared : array<${A}, ${b}>;
      var<workgroup> sum_squared_shared : array<${A}, ${b}>;

      ${v.mainStart([b,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${b};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${b};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${b-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${p?"bias[offset1d + i]":I+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${h?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Je(I,y,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${b};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${Te("sum",y)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${Te("square_sum",y)} / f32(uniforms.hidden_size) ${o?"":"- mean * mean"} + uniforms.epsilon);
        ${f?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${o?"":`- ${I}(mean)`}) *
            ${I}(inv_std_dev) * gamma[offset1d + i]
            ${c?"+ beta[offset1d + i]":""};
        }
      }`},w=[{dims:a,dataType:e[0].dataType}];return n>1&&w.push({dims:l,dataType:1}),n>2&&w.push({dims:l,dataType:1}),n>3&&w.push({dims:i,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${y};${f};${m};${h}`,inputDependencies:e.map((v,$)=>"type")},getShaderSource:_,getRunData:()=>({outputs:w,dispatchGroup:{x:Math.ceil(u/d)},programUniforms:g})}},ou=(e,t)=>{Qc(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(Xc(e.inputs,t,e.outputCount,!1),{outputs:r})}});var Yc,mn,Jc,su,ep,tp,au,uu,du=k(()=>{"use strict";V();q();ie();K();Yc=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((n,r)=>{if(e[r+1].dataType!==6&&e[r+1].dataType!==7)throw new Error(`Input ${r} must be an array of int32 or int64`)})},mn=(e,t)=>{let n=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(r=>n.push(Number(r)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(r=>n.push(Number(r)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return n},Jc=(e,t)=>{if(e.length>1){let n=mn(e,1),r=mn(e,2),o=mn(e,3);return o.length===0&&(o=[...Array(e[0].dims.length).keys()]),N({starts:n,ends:r,axes:o})}else return t},su=(e,t,n,r,o)=>{let i=e;return e<0&&(i+=n[r[t]]),o[t]<0?Math.max(0,Math.min(i,n[r[t]]-1)):Math.max(0,Math.min(i,n[r[t]]))},ep=(e,t,n)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${n.length-1}; i >= 0; i--) {
            let input_shape_i = ${O("uniforms.input_shape","i",n.length)};
            let steps_i = ${O("uniforms.steps","i",n.length)};
            let signs_i = ${O("uniforms.signs","i",n.length)};
            let starts_i = ${O("uniforms.starts","i",n.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,tp=(e,t)=>{let n=e[0].dims,r=x.size(n),o=t.axes.length>0?x.normalizeAxes(t.axes,n.length):[...Array(n.length).keys()],i=mn(e,4);i.forEach(y=>y!==0||(()=>{throw new Error("step cannot be 0")})),i.length===0&&(i=Array(o.length).fill(1));let s=t.starts.map((y,g)=>su(y,g,n,o,i)),a=t.ends.map((y,g)=>su(y,g,n,o,i));if(o.length!==s.length||o.length!==a.length)throw new Error("start, ends and axes should have the same number of elements");if(o.length!==n.length)for(let y=0;y<n.length;++y)o.includes(y)||(s.splice(y,0,0),a.splice(y,0,n[y]),i.splice(y,0,1));let u=i.map(y=>Math.sign(y));i.forEach((y,g,_)=>{if(y<0){let w=(a[g]-s[g])/y,v=s[g],$=v+w*i[g];s[g]=$,a[g]=v,_[g]=-y}});let d=n.slice(0);o.forEach((y,g)=>{d[y]=Math.ceil((a[y]-s[y])/i[y])});let l={dims:d,dataType:e[0].dataType},c=C("output",e[0].dataType,d.length),p=S("input",e[0].dataType,e[0].dims.length),f=x.size(d),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:i.length}],h=[{type:12,data:f},{type:12,data:s},{type:6,data:u},{type:12,data:i},...P(e[0].dims,d)],b=y=>`
      ${y.registerUniforms(m).declareVariables(p,c)}
        ${ep(p,c,n)}
        ${y.mainStart()}
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${c.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${c.setByOffset("global_idx",p.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${s.length}_${i.length}`,inputDependencies:["rank"]},getShaderSource:b,getRunData:()=>({outputs:[l],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:h})}},au=(e,t)=>{Yc(e.inputs,t);let n=Jc(e.inputs,t);e.compute(tp(e.inputs,n),{inputs:[0]})},uu=e=>{let t=e.starts,n=e.ends,r=e.axes;return N({starts:t,ends:n,axes:r})}});var np,rp,lu,cu,pu=k(()=>{"use strict";V();q();ie();Ve();K();np=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},rp=(e,t)=>{let n=e.inputs[0],r=n.dims,o=x.size(r),i=r.length,s=x.normalizeAxis(t.axis,i),a=s<r.length-1,u,d=[];a?(d=Array.from({length:i},(T,I)=>I),d[s]=i-1,d[i-1]=s,u=e.compute(pe(n,d),{inputs:[n],outputs:[-1]})[0]):u=n;let l=u.dims,c=l[i-1],p=o/c,f=X(c),m=c/f,h=64;p===1&&(h=256);let b=(T,I)=>I===4?`max(max(${T}.x, ${T}.y), max(${T}.z, ${T}.w))`:I===2?`max(${T}.x, ${T}.y)`:I===3?`max(max(${T}.x, ${T}.y), ${T}.z)`:T,y=S("x",u.dataType,u.dims,f),g=C("result",u.dataType,u.dims,f),_=y.type.value,w=re(u.dataType)==="f32"?`var threadMax = ${_}(-3.402823e+38f);`:`var threadMax = ${_}(-65504.0h);`,v=T=>`
      var<workgroup> rowMaxShared : ${_};
      var<workgroup> rowSumShared : ${_};
      var<workgroup> threadShared : array<${_}, ${h}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${_} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${_}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${T.registerUniform("packedCols","i32").declareVariables(y,g)}
      ${T.mainStart(h)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${h};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${w}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${_}(${b("threadShared[0]",f)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${_}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${_}(${Te("threadShared[0]",f)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${_}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,$=e.compute({name:"Softmax",shaderCache:{hint:`${f};${h}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:l,dataType:u.dataType}],dispatchGroup:{x:p},programUniforms:[{type:6,data:m}]}),getShaderSource:v},{inputs:[u],outputs:[a?-1:0]})[0];a&&e.compute(pe($,d),{inputs:[$]})},lu=(e,t)=>{np(e.inputs),rp(e,t)},cu=e=>N({axis:e.axis})});var mu,op,ip,sp,fu,hu=k(()=>{"use strict";V();q();K();mu=e=>Array.from(e.getBigInt64Array(),Number),op=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(mu(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},ip=(e,t)=>{let n=[];for(let r=0;r<e.length;++r)n.push(e[r]*t[r]);return n},sp=(e,t)=>{let n=e[0].dims,r=t??mu(e[1]),o=ip(n,r),i=x.size(o),s=e[0].dataType,a=S("input",s,n.length),u=C("output",s,o.length),d=l=>`
      const inputShape = ${a.indices(...n)};
      ${l.registerUniform("output_size","u32").declareVariables(a,u)}
      ${l.mainStart()}
      ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${u.offsetToIndices("global_idx")};
      var input_indices: ${a.type.indices};
      for (var i = 0; i < ${n.length}; i++) {
        let input_dim_i = ${a.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

        ${a.indicesSet("input_indices","i","input_dim_value")}
      }
      ${u.setByOffset("global_idx",a.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${r}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:[{type:12,data:i},...P(e[0].dims,o)]}),getShaderSource:d}},fu=e=>{op(e.inputs),e.compute(sp(e.inputs),{inputs:[0]})}});var ap,up,gu,yu=k(()=>{"use strict";V();q();K();ap=(e,t,n,r,o)=>{let i=C("output_data",o,n.length,4),s=S("a_data",t[1].dataType,t[1].dims.length,4),a=S("b_data",t[2].dataType,t[2].dims.length,4),u=S("c_data",t[0].dataType,t[0].dims.length,4),d,l=(c,p,f)=>`select(${p}, ${c}, ${f})`;if(!r)d=i.setByOffset("global_idx",l(s.getByOffset("global_idx"),a.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let c=(p,f,m="")=>{let h=`a_data[index_a${f}][component_a${f}]`,b=`b_data[index_b${f}][component_b${f}]`,y=`bool(c_data[index_c${f}] & (0xffu << (component_c${f} * 8)))`;return`
            let output_indices${f} = ${i.offsetToIndices(`global_idx * 4u + ${f}u`)};
            let offset_a${f} = ${s.broadcastedIndicesToOffset(`output_indices${f}`,i)};
            let offset_b${f} = ${a.broadcastedIndicesToOffset(`output_indices${f}`,i)};
            let offset_c${f} = ${u.broadcastedIndicesToOffset(`output_indices${f}`,i)};
            let index_a${f} = offset_a${f} / 4u;
            let index_b${f} = offset_b${f} / 4u;
            let index_c${f} = offset_c${f} / 4u;
            let component_a${f} = offset_a${f} % 4u;
            let component_b${f} = offset_b${f} % 4u;
            let component_c${f} = offset_c${f} % 4u;
            ${p}[${f}] = ${m}(${l(h,b,y)});
          `};o===9?d=`
            var data = vec4<u32>(0);
            ${c("data",0,"u32")}
            ${c("data",1,"u32")}
            ${c("data",2,"u32")}
            ${c("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:d=`
            ${c("output_data[global_idx]",0)}
            ${c("output_data[global_idx]",1)}
            ${c("output_data[global_idx]",2)}
            ${c("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(u,s,a,i)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${d}
      }`},up=e=>{let t=e[1].dims,n=e[2].dims,r=e[0].dims,o=e[1].dataType,i=!(x.areEqual(t,n)&&x.areEqual(n,r)),s=t,a=x.size(t);if(i){let d=Pe.calcShape(Pe.calcShape(t,n,!1),r,!1);if(!d)throw new Error("Can't perform where op on the given tensors");s=d,a=x.size(s)}let u=Math.ceil(a/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:d=>ap(d,e,s,i,o),getRunData:()=>({outputs:[{dims:s,dataType:o}],dispatchGroup:{x:Math.ceil(a/64/4)},programUniforms:[{type:12,data:u},...P(r,t,n,s)]})}},gu=e=>{e.compute(up(e.inputs))}});var bu,_u=k(()=>{"use strict";Jo();en();ni();oi();Gi();es();rs();_s();Is();Es();zs();Us();Ns();Ws();qs();js();Xs();ea();ra();sa();ha();ba();wa();va();Ta();sr();Ca();Ha();Ka();Za();Ya();Yt();ru();dr();iu();du();pu();ur();hu();Ve();nn();yu();bu=new Map([["Abs",[ii]],["Acos",[si]],["Acosh",[ai]],["Add",[Hi]],["ArgMax",[Yo,Kn]],["ArgMin",[Xo,Kn]],["Asin",[ui]],["Asinh",[di]],["Atan",[li]],["Atanh",[ci]],["Attention",[ei]],["AveragePool",[Oa,Da]],["BatchNormalization",[ti]],["BiasAdd",[ri]],["BiasSplitGelu",[Wi]],["Cast",[mi,pi]],["Ceil",[hi]],["Clip",[fi]],["Concat",[ts,ns]],["Conv",[nr,tr]],["ConvTranspose",[Ts,xs]],["Cos",[gi]],["Cosh",[yi]],["CumSum",[Cs,As]],["DepthToSpace",[ks,Ps]],["DequantizeLinear",[qa,Fa]],["Div",[qi]],["Einsum",[Os,Ms]],["Elu",[bi,gt]],["Equal",[Fi]],["Erf",[_i]],["Exp",[wi]],["Expand",[Vs]],["FastGelu",[Ls]],["Floor",[$i]],["FusedConv",[nr,tr]],["Gather",[Hs,Gs]],["GatherElements",[Js,Ys]],["GatherBlockQuantized",[Zs,Qs]],["GatherND",[Fs,Ks]],["Gelu",[vi]],["Gemm",[na,ta]],["GlobalAveragePool",[Ra,Ua]],["GlobalMaxPool",[Ga,Wa]],["Greater",[Qi]],["GreaterOrEqual",[Yi]],["GridSample",[oa,ia]],["GroupQueryAttention",[fa]],["HardSigmoid",[ki,Ei]],["InstanceNormalization",[ya]],["LayerNormalization",[_a]],["LeakyRelu",[xi,gt]],["Less",[Xi]],["LessOrEqual",[Ji]],["Log",[Vi]],["MatMul",[$a]],["MatMulNBits",[xa,Sa]],["MaxPool",[Na,La]],["Mul",[Ki]],["MultiHeadAttention",[da,ua]],["Neg",[Ti]],["Not",[Si]],["Pad",[Ia]],["Pow",[ji]],["QuickGelu",[Ni,gt]],["Range",[ja]],["Reciprocal",[Ii]],["ReduceMin",[qo]],["ReduceMean",[No]],["ReduceMax",[Ho]],["ReduceSum",[Ko]],["ReduceProd",[Fo]],["ReduceL1",[Lo]],["ReduceL2",[Wo]],["ReduceLogSum",[Zo]],["ReduceLogSumExp",[Go]],["ReduceSumSquare",[jo]],["Relu",[Ci]],["Resize",[tu,nu]],["RotaryEmbedding",[pa]],["ScatterND",[Xa,Qa]],["Sigmoid",[Ai]],["Sin",[Pi]],["Sinh",[zi]],["Slice",[au,uu]],["SkipLayerNormalization",[ou]],["Split",[la,ca]],["Sqrt",[Bi]],["Softmax",[lu,cu]],["Sub",[Zi]],["Tan",[Di]],["Tanh",[Mi]],["ThresholdedRelu",[Ri,gt]],["Tile",[fu]],["Transpose",[Co,Ao]],["Where",[gu]]])});var fn,wu=k(()=>{"use strict";ye();ke();K();fn=class{constructor(t){this.backend=t;this.repo=new Map,this.attributesBound=!1}getArtifact(t){return this.repo.get(t)}setArtifact(t,n){this.repo.set(t,n)}run(t,n,r,o,i){he(t.programInfo.name);let s=this.backend.device,a=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let u=[];for(let l of n)u.push({binding:u.length,resource:{buffer:l.buffer}});for(let l of r)u.push({binding:u.length,resource:{buffer:l.buffer}});i&&u.push({binding:u.length,resource:i});let d=s.createBindGroup({layout:t.computePipeline.getBindGroupLayout(0),entries:u,label:t.programInfo.name});if(this.backend.sessionStatus==="capturing"){let l={kernelId:this.backend.currentKernelId,computePipeline:t.computePipeline,bindGroup:d,dispatchGroup:o};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(l)}a.setPipeline(t.computePipeline),a.setBindGroup(0,d),a.dispatchWorkgroups(...o),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),fe(t.programInfo.name)}dispose(){}build(t,n){he(t.name);let r=this.backend.device,o=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(c=>{r.features.has(c.feature)&&o.push(`enable ${c.extension};`)});let s=To(n,this.backend.device.limits),a=t.getShaderSource(s),u=`${o.join(`
`)}
${s.additionalImplementations}
${a}`,d=r.createShaderModule({code:u,label:t.name});j("verbose",()=>`[WebGPU] ${t.name} shader code: ${u}`);let l=r.createComputePipeline({compute:{module:d,entryPoint:"main"},layout:"auto",label:t.name});return fe(t.name),{programInfo:t,computePipeline:l,uniformVariablesInfo:s.variablesInfo}}normalizeDispatchGroupSize(t){let n=typeof t=="number"?t:t.x,r=typeof t=="number"?1:t.y||1,o=typeof t=="number"?1:t.z||1,i=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(n<=i&&r<=i&&o<=i)return[n,r,o];let s=n*r*o,a=Math.ceil(Math.sqrt(s));if(a>i){if(a=Math.ceil(Math.cbrt(s)),a>i)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[a,a,a]}else return[a,a,1]}}});var $u={};nt($u,{WebGpuBackend:()=>cr});var dp,lp,lr,cr,vu=k(()=>{"use strict";ye();V();ke();On();xo();_u();wu();dp=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let n=[];for(let r=0;r<e.length;++r){let o=e[r].dataType;switch(t[r]){case"none":{n.push("");break}case"type":{n.push(`${o}`);break}case"rank":{let i=e[r].dims.length;n.push(`${o};${i}`);break}case"dims":{let i=e[r].dims.join(",");n.push(`${o};${i}`);break}default:throw new Error(`unsupported input dependency: ${t[r]}`)}}return n.join("|")},lp=(e,t,n)=>{let r=e.name;return e.shaderCache?.hint&&(r+="["+e.shaderCache.hint+"]"),r+=":"+n+`:${dp(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,r},lr=class{constructor(t){t&&(this.architecture=t.architecture,this.vendor=t.vendor)}isArchitecture(t){return this.architecture===t}isVendor(t){return this.vendor===t}},cr=class{constructor(){this.currentSessionId=null;this.currentKernelId=null;this.commandEncoder=null;this.computePassEncoder=null;this.maxDispatchNumber=16;this.pendingDispatchNumber=0;this.pendingKernels=[];this.pendingQueries=new Map;this.sessionStatus="default";this.capturedCommandList=new Map;this.capturedPendingKernels=new Map;this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let t=this.kernelCustomData.get(this.currentKernelId);return t||(t={},this.kernelCustomData.set(this.currentKernelId,t)),t}async initialize(t,n){this.env=t;let r=[],o={requiredLimits:{maxComputeWorkgroupStorageSize:n.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:n.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:n.limits.maxStorageBufferBindingSize,maxBufferSize:n.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:n.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:n.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:n.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:n.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},i=s=>n.features.has(s)&&r.push(s)&&!0;i("chromium-experimental-timestamp-query-inside-passes")||i("timestamp-query"),i("shader-f16"),i("subgroups"),this.device=await n.requestDevice(o),this.adapterInfo=new lr(n.info||await n.requestAdapterInfo()),this.gpuDataManager=vo(this),this.programManager=new fn(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Wt(t.logLevel,!!t.debug),this.device.onuncapturederror=s=>{s.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${s.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:n,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let t=this.getCommandEncoder(),n={};this.queryType==="at-passes"&&(n.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=t.beginComputePass(n)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;he(),this.endComputePass();let t;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),t=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(t,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,t,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&t.mapAsync(GPUMapMode.READ).then(()=>{let n=new BigUint64Array(t.getMappedRange()),r=this.pendingQueries.get(t);for(let o=0;o<n.length/2;o++){let i=r[o],s=i.kernelId,a=this.kernels.get(s),u=a.kernelType,d=a.kernelName,l=i.programName,c=i.inputTensorViews,p=i.outputTensorViews,f=n[o*2],m=n[o*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let h=Number(f-this.queryTimeBase),b=Number(m-this.queryTimeBase);if(!Number.isSafeInteger(h)||!Number.isSafeInteger(b))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:c.map(y=>({dims:y.dims,dataType:Ee(y.dataType)})),outputsMetadata:p.map(y=>({dims:y.dims,dataType:Ee(y.dataType)})),kernelId:s,kernelType:u,kernelName:d,programName:l,startTime:h,endTime:b});else{let y="";c.forEach((_,w)=>{y+=`input[${w}]: [${_.dims}] | ${Ee(_.dataType)}, `});let g="";p.forEach((_,w)=>{g+=`output[${w}]: [${_.dims}] | ${Ee(_.dataType)}, `}),console.log(`[profiling] kernel "${s}|${u}|${d}|${l}" ${y}${g}start time: ${h} ns, execution time: ${b-h} ns`)}ct("GPU",`${l}::${f}::${m}`)}t.unmap(),this.pendingQueries.delete(t)}),fe()}run(t,n,r,o,i,s){he(t.name);let a=[];for(let _=0;_<n.length;++_){let w=n[_].data;if(w===0)continue;let v=this.gpuDataManager.get(w);if(!v)throw new Error(`no GPU data for input: ${w}`);a.push(v)}let{outputs:u,dispatchGroup:d,programUniforms:l}=t.getRunData(n),c=r.length===0?u.map((_,w)=>w):r;if(c.length!==u.length)throw new Error(`Output size ${c.length} must be equal to ${u.length}.`);let p=[],f=[];for(let _=0;_<u.length;++_){if(!Number.isInteger(c[_])||c[_]<-3||c[_]>=s)throw new Error(`Invalid output index: ${c[_]}`);if(c[_]===-3)continue;let w=c[_]===-1,v=c[_]===-2,$=w||v?i(u[_].dataType,u[_].dims):o(c[_],u[_].dataType,u[_].dims);if(p.push($),$.data===0)continue;let T=this.gpuDataManager.get($.data);if(!T)throw new Error(`no GPU data for output: ${$.data}`);if(w&&this.temporaryData.push(T),v){let I=this.kernelPersistentData.get(this.currentKernelId);I||(I=[],this.kernelPersistentData.set(this.currentKernelId,I)),I.push(T)}f.push(T)}if(a.length!==n.length||f.length!==p.length){if(f.length===0)return fe(t.name),p;throw new Error(`Program ${t.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let m;if(l){let _=0,w=[];l.forEach(I=>{let A=typeof I.data=="number"?[I.data]:I.data;if(A.length===0)return;let z=I.type===10?2:4,M,U;I.type===10?(U=A.length>4?16:A.length>2?8:A.length*z,M=A.length>4?16:z*A.length):(U=A.length<=2?A.length*z:16,M=16),_=Math.ceil(_/U)*U,w.push(_);let G=I.type===10?8:4;_+=A.length>4?Math.ceil(A.length/G)*M:A.length*z});let v=16;_=Math.ceil(_/v)*v;let $=new ArrayBuffer(_);l.forEach((I,A)=>{let z=w[A],M=typeof I.data=="number"?[I.data]:I.data;if(I.type===6)new Int32Array($,z,M.length).set(M);else if(I.type===12)new Uint32Array($,z,M.length).set(M);else if(I.type===10)new Uint16Array($,z,M.length).set(M);else if(I.type===1)new Float32Array($,z,M.length).set(M);else throw new Error(`Unsupported uniform type: ${Ee(I.type)}`)});let T=this.gpuDataManager.create(_,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(T.buffer,0,$,0,_),this.gpuDataManager.release(T.id),m={offset:0,size:_,buffer:T.buffer}}let h=this.programManager.normalizeDispatchGroupSize(d),b=h[1]===1&&h[2]===1,y=lp(t,n,b),g=this.programManager.getArtifact(y);if(g||(g=this.programManager.build(t,h),this.programManager.setArtifact(y,g),j("info",()=>`[artifact] key: ${y}, programName: ${t.name}`)),l&&g.uniformVariablesInfo){if(l.length!==g.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${g.uniformVariablesInfo.length}, got ${l.length} in program "${g.programInfo.name}".`);for(let _=0;_<l.length;_++){let w=l[_],v=w.type,$=typeof w.data=="number"?1:w.data.length,[T,I]=g.uniformVariablesInfo[_];if(v!==T||$!==I)throw new Error(`Uniform variable ${_} mismatch: expect type ${T} with size ${I}, got type ${v} with size ${$} in program "${g.programInfo.name}".`)}}if(j("info",()=>`[ProgramManager] run "${t.name}" (key=${y}) with ${h[0]}x${h[1]}x${h[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let _={kernelId:this.currentKernelId,programName:g.programInfo.name,inputTensorViews:n,outputTensorViews:p};this.pendingKernels.push(_),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(_)}return this.programManager.run(g,a,f,h,m),fe(t.name),p}upload(t,n){this.gpuDataManager.upload(t,n)}memcpy(t,n){this.gpuDataManager.memcpy(t,n)}async download(t,n){await this.gpuDataManager.download(t,n)}alloc(t){return this.gpuDataManager.create(t).id}free(t){return this.gpuDataManager.release(t)}createKernel(t,n,r,o){let i=bu.get(t);if(!i)throw new Error(`kernel not implemented: ${t}`);let s={kernelType:t,kernelName:o,kernelEntry:i[0],attributes:[i[1],r]};this.kernels.set(n,s)}releaseKernel(t){let n=this.kernelPersistentData.get(t);if(n){for(let r of n)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(t)}this.kernelCustomData.delete(t),this.kernels.delete(t)}computeKernel(t,n,r){let o=this.kernels.get(t);if(!o)throw new Error(`kernel not created: ${t}`);let i=o.kernelType,s=o.kernelName,a=o.kernelEntry,u=o.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${i}] ${s}" is not allowed to be called recursively`);this.currentKernelId=t,u[0]&&(u[1]=u[0](u[1]),u[0]=void 0),j("info",()=>`[WebGPU] Start to run kernel "[${i}] ${s}"...`);let d=this.env.debug;this.temporaryData=[];try{return d&&this.device.pushErrorScope("validation"),a(n,u[1]),0}catch(l){return r.push(Promise.resolve(`[WebGPU] Kernel "[${i}] ${s}" failed. ${l}`)),1}finally{d&&r.push(this.device.popErrorScope().then(l=>l?`GPU validation error for kernel "[${i}] ${s}": ${l.message}`:null));for(let l of this.temporaryData)this.gpuDataManager.release(l.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(t,n,r,o){let i=this.sessionExternalDataMapping.get(t);i||(i=new Map,this.sessionExternalDataMapping.set(t,i));let s=i.get(n),a=this.gpuDataManager.registerExternalBuffer(r,o,s);return i.set(n,[a,r]),a}unregisterBuffers(t){let n=this.sessionExternalDataMapping.get(t);n&&(n.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(t))}getBuffer(t){let n=this.gpuDataManager.get(t);if(!n)throw new Error(`no GPU data for buffer: ${t}`);return n.buffer}createDownloader(t,n,r){return async()=>{let o=await Ln(this,t,n);return Ht(o.buffer,r)}}writeTimestamp(t){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,t)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){j("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){j("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){j("info","replay"),this.sessionStatus="replaying";let t=this.capturedCommandList.get(this.currentSessionId),n=this.capturedPendingKernels.get(this.currentSessionId),r=t.length;this.pendingKernels=[];for(let o=0;o<r;o++){let i=this.getComputePassEncoder(),s=t[o];this.writeTimestamp(this.pendingDispatchNumber*2),i.setPipeline(s.computePipeline),i.setBindGroup(0,s.bindGroup),i.dispatchWorkgroups(...s.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(n[o]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(t){this.unregisterBuffers(t),this.capturedCommandList.has(t)&&this.capturedCommandList.delete(t),this.capturedPendingKernels.has(t)&&this.capturedPendingKernels.delete(t),this.gpuDataManager.onReleaseSession(t)}onRunStart(t){this.currentSessionId=t,this.setQueryType()}}});var xu={};nt(xu,{init:()=>cp});var wt,pr,cp,Su=k(()=>{"use strict";V();ke();q();bo();wt=class e{constructor(t,n,r,o){this.module=t;this.dataType=n;this.data=r;this.dims=o}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=x.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=x.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=x.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=x.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(x.size(t)!==x.size(this.dims))throw new Error("Invalid new shape");return new e(this.module,this.dataType,this.data,t)}},pr=class{constructor(t,n,r){this.module=t;this.backend=n;this.customDataOffset=0;this.customDataSize=0;this.adapterInfo=n.adapterInfo;let o=t.PTR_SIZE,i=r/t.PTR_SIZE,s=o===4?"i32":"i64";this.opKernelContext=Number(t.getValue(o*i++,s));let a=Number(t.getValue(o*i++,s));this.outputCount=Number(t.getValue(o*i++,s)),this.customDataOffset=Number(t.getValue(o*i++,"*")),this.customDataSize=Number(t.getValue(o*i++,s));let u=[];for(let d=0;d<a;d++){let l=Number(t.getValue(o*i++,s)),c=Number(t.getValue(o*i++,"*")),p=Number(t.getValue(o*i++,s)),f=[];for(let m=0;m<p;m++)f.push(Number(t.getValue(o*i++,s)));u.push(new wt(t,l,c,f))}this.inputs=u}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(t,n){let r=n?.inputs?.map(a=>typeof a=="number"?this.inputs[a]:a)??this.inputs,o=n?.outputs??[],i=(a,u,d)=>new wt(this.module,u,this.output(a,d),d),s=(a,u)=>{let d=qe(a,u);if(!d)throw new Error(`Unsupported data type: ${a}`);let l=d>0?this.backend.gpuDataManager.create(d).id:0;return new wt(this.module,a,l,u)};return this.backend.run(t,r,o,i,s,this.outputCount)}output(t,n){let r=this.module.stackSave();try{let o=this.module.PTR_SIZE,i=o===4?"i32":"i64",s=this.module.stackAlloc((1+n.length)*o);this.module.setValue(s,n.length,i);for(let a=0;a<n.length;a++)this.module.setValue(s+o*(a+1),n[a],i);return this.module._JsepOutput(this.opKernelContext,t,s)}catch(o){throw new Error(`Failed to generate kernel's output[${t}] with dims [${n}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${o}`)}finally{this.module.stackRestore(r)}}},cp=async(e,t,n,r)=>{let o=t.jsepInit;if(!o)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let i=(vu(),dt($u)).WebGpuBackend,s=new i;await s.initialize(n,r),o("webgpu",[s,a=>s.alloc(Number(a)),a=>s.free(a),(a,u,d,l=!1)=>{if(l)j("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(a)}, dst=${Number(u)}, size=${Number(d)}`),s.memcpy(Number(a),Number(u));else{j("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(a)}, gpuDataId=${Number(u)}, size=${Number(d)}`);let c=t.HEAPU8.subarray(Number(a>>>0),Number(a>>>0)+Number(d));s.upload(Number(u),c)}},async(a,u,d)=>{j("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${a}, dataOffset=${u}, size=${d}`),await s.download(Number(a),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+d)>>>0))},(a,u,d)=>s.createKernel(a,Number(u),d,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),a=>s.releaseKernel(a),(a,u,d,l)=>{j("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${d}, kernel=${a}, contextDataOffset=${u}`);let c=new pr(t,s,Number(u));return s.computeKernel(Number(a),c,l)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let i=new jt(n);o("webnn",[i,()=>i.reserveTensorId(),s=>i.releaseTensorId(s),async(s,a,u,d,l)=>i.ensureTensor(s,a,u,d,l),(s,a)=>{i.uploadTensor(s,a)},async(s,a)=>i.downloadTensor(s,a),(s,a)=>i.registerMLContext(s,a),!!n.trace])}}});var pp,Et,kt,et,mp,Tu,pt,Pt,zt,Iu,Bt,Dt,Ot,An=k(()=>{"use strict";ye();oo();so();V();Ge();Rt();Bn();pp=(e,t)=>{ne()._OrtInit(e,t)!==0&&Y("Can't initialize onnxruntime.")},Et=async e=>{pp(e.wasm.numThreads,ft(e.logLevel))},kt=async(e,t)=>{ne().asyncInit?.();let n=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(n){if(typeof n.limits!="object"||typeof n.features!="object"||typeof n.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let r=e.webgpu.powerPreference;if(r!==void 0&&r!=="low-power"&&r!=="high-performance")throw new Error(`Invalid powerPreference setting: "${r}"`);let o=e.webgpu.forceFallbackAdapter;if(o!==void 0&&typeof o!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${o}"`);if(n=await navigator.gpu.requestAdapter({powerPreference:r,forceFallbackAdapter:o}),!n)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let r=(Su(),dt(xu)).init;t==="webgpu"&&await r("webgpu",ne(),e,n),t==="webnn"&&await r("webnn",ne(),e)}},et=new Map,mp=e=>{let t=ne(),n=t.stackSave();try{let r=t.PTR_SIZE,o=t.stackAlloc(2*r);t._OrtGetInputOutputCount(e,o,o+r)!==0&&Y("Can't get session input/output count.");let s=r===4?"i32":"i64";return[Number(t.getValue(o,s)),Number(t.getValue(o+r,s))]}finally{t.stackRestore(n)}},Tu=(e,t)=>{let n=ne(),r=n.stackSave(),o=0;try{let i=n.PTR_SIZE,s=n.stackAlloc(2*i);n._OrtGetInputOutputMetadata(e,t,s,s+i)!==0&&Y("Can't get session input/output metadata.");let u=Number(n.getValue(s,"*"));o=Number(n.getValue(s+i,"*"));let d=n.HEAP32[o/4];if(d===0)return[u,0];let l=n.HEAPU32[o/4+1],c=[];for(let p=0;p<l;p++){let f=Number(n.getValue(o+8+p*i,"*"));c.push(f!==0?n.UTF8ToString(f):Number(n.getValue(o+8+(p+l)*i,"*")))}return[u,d,c]}finally{n.stackRestore(r),o!==0&&n._OrtFree(o)}},pt=e=>{let t=ne(),n=t._malloc(e.byteLength);if(n===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,n),[n,e.byteLength]},Pt=async(e,t)=>{let n,r,o=ne();Array.isArray(e)?[n,r]=e:e.buffer===o.HEAPU8.buffer?[n,r]=[e.byteOffset,e.byteLength]:[n,r]=pt(e);let i=0,s=0,a=0,u=[],d=[],l=[];try{if([s,u]=await io(t),t?.externalData&&o.mountExternalData){let w=[];for(let v of t.externalData){let $=typeof v=="string"?v:v.path;w.push(ht(typeof v=="string"?v:v.data).then(T=>{o.mountExternalData($,T)}))}await Promise.all(w)}for(let w of t?.executionProviders??[])if((typeof w=="string"?w:w.name)==="webnn"){if(o.shouldTransferToMLTensor=!1,typeof w!="string"){let $=w,T=$?.context,I=$?.gpuDevice,A=$?.deviceType,z=$?.powerPreference;T?o.currentContext=T:I?o.currentContext=await o.webnnCreateMLContext(I):o.currentContext=await o.webnnCreateMLContext({deviceType:A,powerPreference:z})}else o.currentContext=await o.webnnCreateMLContext();break}i=await o._OrtCreateSession(n,r,s),o.webgpuOnCreateSession?.(i),i===0&&Y("Can't create a session."),o.jsepOnCreateSession?.(),o.currentContext&&(o.webnnRegisterMLContext(i,o.currentContext),o.currentContext=void 0,o.shouldTransferToMLTensor=!0);let[c,p]=mp(i),f=!!t?.enableGraphCapture,m=[],h=[],b=[],y=[],g=[];for(let w=0;w<c;w++){let[v,$,T]=Tu(i,w);v===0&&Y("Can't get an input name."),d.push(v);let I=o.UTF8ToString(v);m.push(I),b.push($===0?{name:I,isTensor:!1}:{name:I,isTensor:!0,type:Ee($),shape:T})}for(let w=0;w<p;w++){let[v,$,T]=Tu(i,w+c);v===0&&Y("Can't get an output name."),l.push(v);let I=o.UTF8ToString(v);h.push(I),y.push($===0?{name:I,isTensor:!1}:{name:I,isTensor:!0,type:Ee($),shape:T});{if(f&&t?.preferredOutputLocation===void 0){g.push("gpu-buffer");continue}let A=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[I]??"cpu",z=o.webnnIsGraphOutput;if(A==="cpu"&&z&&z(i,I)){g.push("ml-tensor-cpu-output");continue}if(A!=="cpu"&&A!=="cpu-pinned"&&A!=="gpu-buffer"&&A!=="ml-tensor")throw new Error(`Not supported preferred output location: ${A}.`);if(f&&A!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${A}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);g.push(A)}}let _=null;return g.some(w=>w==="gpu-buffer"||w==="ml-tensor"||w==="ml-tensor-cpu-output")&&(a=o._OrtCreateBinding(i),a===0&&Y("Can't create IO binding."),_={handle:a,outputPreferredLocations:g,outputPreferredLocationsEncoded:g.map(w=>w==="ml-tensor-cpu-output"?"ml-tensor":w).map(w=>zn(w))}),et.set(i,[i,d,l,_,f,!1]),[i,m,h,b,y]}catch(c){throw d.forEach(p=>o._OrtFree(p)),l.forEach(p=>o._OrtFree(p)),a!==0&&o._OrtReleaseBinding(a)!==0&&Y("Can't release IO binding."),i!==0&&o._OrtReleaseSession(i)!==0&&Y("Can't release session."),c}finally{o._free(n),s!==0&&o._OrtReleaseSessionOptions(s)!==0&&Y("Can't release session options."),u.forEach(c=>o._free(c)),o.unmountExternalData?.()}},zt=e=>{let t=ne(),n=et.get(e);if(!n)throw new Error(`cannot release session. invalid session id: ${e}`);let[r,o,i,s,a]=n;s&&(a&&t._OrtClearBoundOutputs(s.handle)!==0&&Y("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&Y("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),o.forEach(u=>t._OrtFree(u)),i.forEach(u=>t._OrtFree(u)),t._OrtReleaseSession(r)!==0&&Y("Can't release session."),et.delete(e)},Iu=async(e,t,n,r,o,i,s=!1)=>{if(!e){t.push(0);return}let a=ne(),u=a.PTR_SIZE,d=e[0],l=e[1],c=e[3],p=c,f,m;if(d==="string"&&(c==="gpu-buffer"||c==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&c!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${i} when enableGraphCapture is true.`);if(c==="gpu-buffer"){let y=e[2].gpuBuffer;m=qe(He(d),l);{let g=a.jsepRegisterBuffer;if(!g)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');f=g(r,i,y,m)}}else if(c==="ml-tensor"){let y=e[2].mlTensor;m=qe(He(d),l);let g=a.webnnRegisterMLTensor;if(!g)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');f=g(r,y,He(d),l)}else{let y=e[2];if(Array.isArray(y)){m=u*y.length,f=a._malloc(m),n.push(f);for(let g=0;g<y.length;g++){if(typeof y[g]!="string")throw new TypeError(`tensor data at index ${g} is not a string`);a.setValue(f+g*u,_e(y[g],n),"*")}}else{let g=a.webnnIsGraphInput,_=a.webnnIsGraphOutput;if(d!=="string"&&g&&_){let w=a.UTF8ToString(o);if(g(r,w)||_(r,w)){let v=He(d);m=qe(v,l),p="ml-tensor";let $=a.webnnCreateTemporaryTensor,T=a.webnnUploadTensor;if(!$||!T)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let I=await $(r,v,l);T(I,new Uint8Array(y.buffer,y.byteOffset,y.byteLength)),f=I}else m=y.byteLength,f=a._malloc(m),n.push(f),a.HEAPU8.set(new Uint8Array(y.buffer,y.byteOffset,m),f)}else m=y.byteLength,f=a._malloc(m),n.push(f),a.HEAPU8.set(new Uint8Array(y.buffer,y.byteOffset,m),f)}}let h=a.stackSave(),b=a.stackAlloc(4*l.length);try{l.forEach((g,_)=>a.setValue(b+_*u,g,u===4?"i32":"i64"));let y=a._OrtCreateTensor(He(d),f,m,b,l.length,zn(p));y===0&&Y(`Can't create tensor for input/output. session=${r}, index=${i}.`),t.push(y)}finally{a.stackRestore(h)}},Bt=async(e,t,n,r,o,i)=>{let s=ne(),a=s.PTR_SIZE,u=et.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let d=u[0],l=u[1],c=u[2],p=u[3],f=u[4],m=u[5],h=t.length,b=r.length,y=0,g=[],_=[],w=[],v=[],$=s.stackSave(),T=s.stackAlloc(h*a),I=s.stackAlloc(h*a),A=s.stackAlloc(b*a),z=s.stackAlloc(b*a);try{[y,g]=ro(i),Ue("wasm prepareInputOutputTensor");for(let B=0;B<h;B++)await Iu(n[B],_,v,e,l[t[B]],t[B],f);for(let B=0;B<b;B++)await Iu(o[B],w,v,e,c[r[B]],h+r[B],f);Re("wasm prepareInputOutputTensor");for(let B=0;B<h;B++)s.setValue(T+B*a,_[B],"*"),s.setValue(I+B*a,l[t[B]],"*");for(let B=0;B<b;B++)s.setValue(A+B*a,w[B],"*"),s.setValue(z+B*a,c[r[B]],"*");if(p&&!m){let{handle:B,outputPreferredLocations:ee,outputPreferredLocationsEncoded:W}=p;if(l.length!==h)throw new Error(`input count from feeds (${h}) is expected to be always equal to model's input count (${l.length}).`);Ue("wasm bindInputsOutputs");for(let D=0;D<h;D++){let Z=t[D];await s._OrtBindInput(B,l[Z],_[D])!==0&&Y(`Can't bind input[${D}] for session=${e}.`)}for(let D=0;D<b;D++){let Z=r[D];o[D]?.[3]?s._OrtBindOutput(B,c[Z],w[D],0)!==0&&Y(`Can't bind pre-allocated output[${D}] for session=${e}.`):s._OrtBindOutput(B,c[Z],0,W[Z])!==0&&Y(`Can't bind output[${D}] to ${ee[D]} for session=${e}.`)}Re("wasm bindInputsOutputs"),et.set(e,[d,l,c,p,f,!0])}s.jsepOnRunStart?.(d),s.webnnOnRunStart?.(d);let M;p?M=await s._OrtRunWithBinding(d,p.handle,b,A,y):M=await s._OrtRun(d,I,T,h,z,b,A,y),M!==0&&Y("failed to call OrtRun().");let U=[],G=[];Ue("wasm ProcessOutputTensor");for(let B=0;B<b;B++){let ee=Number(s.getValue(A+B*a,"*"));if(ee===w[B]){U.push(o[B]);continue}let W=s.stackSave(),D=s.stackAlloc(4*a),Z=!1,R,Q=0;try{s._OrtGetTensorData(ee,D,D+a,D+2*a,D+3*a)!==0&&Y(`Can't access output tensor data on index ${B}.`);let se=a===4?"i32":"i64",H=Number(s.getValue(D,se));Q=s.getValue(D+a,"*");let E=s.getValue(D+a*2,"*"),L=Number(s.getValue(D+a*3,se)),oe=[];for(let ue=0;ue<L;ue++)oe.push(Number(s.getValue(E+ue*a,se)));s._OrtFree(E)!==0&&Y("Can't free memory for tensor dims.");let $e=oe.reduce((ue,ae)=>ue*ae,1);R=Ee(H);let Se=p?.outputPreferredLocations[r[B]];if(R==="string"){if(Se==="gpu-buffer"||Se==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let ue=[];for(let ae=0;ae<$e;ae++){let Le=s.getValue(Q+ae*a,"*"),vt=s.getValue(Q+(ae+1)*a,"*"),gr=ae===$e-1?void 0:vt-Le;ue.push(s.UTF8ToString(Le,gr))}U.push([R,oe,ue,"cpu"])}else if(Se==="gpu-buffer"&&$e>0){let ue=s.jsepGetBuffer;if(!ue)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let ae=ue(Q),Le=qe(H,$e);if(Le===void 0||!Nt(R))throw new Error(`Unsupported data type: ${R}`);Z=!0,U.push([R,oe,{gpuBuffer:ae,download:s.jsepCreateDownloader(ae,Le,R),dispose:()=>{s._OrtReleaseTensor(ee)!==0&&Y("Can't release tensor.")}},"gpu-buffer"])}else if(Se==="ml-tensor"&&$e>0){let ue=s.webnnEnsureTensor,ae=s.webnnIsGraphInputOutputTypeSupported;if(!ue||!ae)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(qe(H,$e)===void 0||!Lt(R))throw new Error(`Unsupported data type: ${R}`);if(!ae(e,R,!1))throw new Error(`preferredLocation "ml-tensor" for ${R} output is not supported by current WebNN Context.`);let vt=await ue(e,Q,H,oe,!1);Z=!0,U.push([R,oe,{mlTensor:vt,download:s.webnnCreateMLTensorDownloader(Q,R),dispose:()=>{s.webnnReleaseTensorId(Q),s._OrtReleaseTensor(ee)}},"ml-tensor"])}else if(Se==="ml-tensor-cpu-output"&&$e>0){let ue=s.webnnCreateMLTensorDownloader(Q,R)(),ae=U.length;Z=!0,G.push((async()=>{let Le=[ae,await ue];return s.webnnReleaseTensorId(Q),s._OrtReleaseTensor(ee),Le})()),U.push([R,oe,[],"cpu"])}else{let ue=rt(R),ae=new ue($e);new Uint8Array(ae.buffer,ae.byteOffset,ae.byteLength).set(s.HEAPU8.subarray(Q,Q+ae.byteLength)),U.push([R,oe,ae,"cpu"])}}finally{s.stackRestore(W),R==="string"&&Q&&s._free(Q),Z||s._OrtReleaseTensor(ee)}}p&&!f&&(s._OrtClearBoundOutputs(p.handle)!==0&&Y("Can't clear bound outputs."),et.set(e,[d,l,c,p,f,!1]));for(let[B,ee]of await Promise.all(G))U[B][2]=ee;return Re("wasm ProcessOutputTensor"),U}finally{s.webnnOnRunEnd?.(d),s.stackRestore($),_.forEach(M=>s._OrtReleaseTensor(M)),w.forEach(M=>s._OrtReleaseTensor(M)),v.forEach(M=>s._free(M)),y!==0&&s._OrtReleaseRunOptions(y),g.forEach(M=>s._free(M))}},Dt=e=>{let t=ne(),n=et.get(e);if(!n)throw new Error("invalid session id");let r=n[0],o=t._OrtEndProfiling(r);o===0&&Y("Can't get an profile file name."),t._OrtFree(o)},Ot=e=>{let t=[];for(let n of e){let r=n[2];!Array.isArray(r)&&"buffer"in r&&t.push(r.buffer)}return t}});var tt,xe,$t,gn,yn,hn,mr,fr,at,ut,hp,Cu,Au,Eu,ku,Pu,zu,Bu,hr=k(()=>{"use strict";ye();An();Ge();Ct();tt=()=>!!te.wasm.proxy&&typeof document<"u",$t=!1,gn=!1,yn=!1,fr=new Map,at=(e,t)=>{let n=fr.get(e);n?n.push(t):fr.set(e,[t])},ut=()=>{if($t||!gn||yn||!xe)throw new Error("worker not ready")},hp=e=>{switch(e.data.type){case"init-wasm":$t=!1,e.data.err?(yn=!0,mr[1](e.data.err)):(gn=!0,mr[0]()),hn&&(URL.revokeObjectURL(hn),hn=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=fr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}default:}},Cu=async()=>{if(!gn){if($t)throw new Error("multiple calls to 'initWasm()' detected.");if(yn)throw new Error("previous call to 'initWasm()' failed.");if($t=!0,tt())return new Promise((e,t)=>{xe?.terminate(),eo().then(([n,r])=>{try{xe=r,xe.onerror=i=>t(i),xe.onmessage=hp,mr=[e,t];let o={type:"init-wasm",in:te};if(!o.in.wasm.wasmPaths&&n){let i=Mt();i&&(o.in.wasm.wasmPaths=i)}xe.postMessage(o),hn=n}catch(o){t(o)}},t)});try{await At(te.wasm),await Et(te),gn=!0}catch(e){throw yn=!0,e}finally{$t=!1}}},Au=async e=>{if(tt())return ut(),new Promise((t,n)=>{at("init-ep",[t,n]);let r={type:"init-ep",in:{epName:e,env:te}};xe.postMessage(r)});await kt(te,e)},Eu=async e=>tt()?(ut(),new Promise((t,n)=>{at("copy-from",[t,n]);let r={type:"copy-from",in:{buffer:e}};xe.postMessage(r,[e.buffer])})):pt(e),ku=async(e,t)=>{if(tt()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return ut(),new Promise((n,r)=>{at("create",[n,r]);let o={type:"create",in:{model:e,options:{...t}}},i=[];e instanceof Uint8Array&&i.push(e.buffer),xe.postMessage(o,i)})}else return Pt(e,t)},Pu=async e=>{if(tt())return ut(),new Promise((t,n)=>{at("release",[t,n]);let r={type:"release",in:e};xe.postMessage(r)});zt(e)},zu=async(e,t,n,r,o,i)=>{if(tt()){if(n.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(o.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return ut(),new Promise((s,a)=>{at("run",[s,a]);let u=n,d={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:r,options:i}};xe.postMessage(d,Ot(u))})}else return Bt(e,t,n,r,o,i)},Bu=async e=>{if(tt())return ut(),new Promise((t,n)=>{at("end-profiling",[t,n]);let r={type:"end-profiling",in:e};xe.postMessage(r)});Dt(e)}});var Du,gp,bn,Ou=k(()=>{"use strict";ye();hr();V();It();Bn();Du=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},gp=e=>{switch(e[3]){case"cpu":return new ve(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Nt(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:n,download:r,dispose:o}=e[2];return ve.fromGpuBuffer(n,{dataType:t,dims:e[1],download:r,dispose:o})}case"ml-tensor":{let t=e[0];if(!Lt(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:n,download:r,dispose:o}=e[2];return ve.fromMLTensor(n,{dataType:t,dims:e[1],download:r,dispose:o})}default:throw new Error(`invalid data location: ${e[3]}`)}},bn=class{async fetchModelAndCopyToWasmMemory(t){return Eu(await ht(t))}async loadModel(t,n){he();let r;typeof t=="string"?r=await this.fetchModelAndCopyToWasmMemory(t):r=t,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await ku(r,n),fe()}async dispose(){return Pu(this.sessionId)}async run(t,n,r){he();let o=[],i=[];Object.entries(t).forEach(p=>{let f=p[0],m=p[1],h=this.inputNames.indexOf(f);if(h===-1)throw new Error(`invalid input '${f}'`);o.push(m),i.push(h)});let s=[],a=[];Object.entries(n).forEach(p=>{let f=p[0],m=p[1],h=this.outputNames.indexOf(f);if(h===-1)throw new Error(`invalid output '${f}'`);s.push(m),a.push(h)});let u=o.map((p,f)=>Du(p,()=>`input "${this.inputNames[i[f]]}"`)),d=s.map((p,f)=>p?Du(p,()=>`output "${this.outputNames[a[f]]}"`):null),l=await zu(this.sessionId,i,u,a,d,r),c={};for(let p=0;p<l.length;p++)c[this.outputNames[a[p]]]=s[p]??gp(l[p]);return fe(),c}startProfiling(){}endProfiling(){Bu(this.sessionId)}}});var Uu={};nt(Uu,{OnnxruntimeWebAssemblyBackend:()=>_n,initializeFlags:()=>Mu,wasmBackend:()=>yp});var Mu,_n,yp,Ru=k(()=>{"use strict";ye();hr();Ou();Mu=()=>{(typeof te.wasm.initTimeout!="number"||te.wasm.initTimeout<0)&&(te.wasm.initTimeout=0);let e=te.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),te.wasm.simd=!1),typeof te.wasm.proxy!="boolean"&&(te.wasm.proxy=!1),typeof te.wasm.trace!="boolean"&&(te.wasm.trace=!1),typeof te.wasm.numThreads!="number"||!Number.isInteger(te.wasm.numThreads)||te.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)te.wasm.numThreads=1;else{let t=typeof navigator>"u"?$n("node:os").cpus().length:navigator.hardwareConcurrency;te.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},_n=class{async init(t){Mu(),await Cu(),await Au(t)}async createInferenceSessionHandler(t,n){let r=new bn;return await r.loadModel(t,n),r}},yp=new _n});var _p={};nt(_p,{InferenceSession:()=>Nr,TRACE:()=>ct,TRACE_EVENT_BEGIN:()=>Ue,TRACE_EVENT_END:()=>Re,TRACE_FUNC_BEGIN:()=>he,TRACE_FUNC_END:()=>fe,Tensor:()=>ve,default:()=>bp,env:()=>te,registerBackend:()=>We});ye();ye();ye();var Fr="1.23.2";var bp=Cn;{let e=(Ru(),dt(Uu)).wasmBackend;We("webgpu",e,5),We("webnn",e,5),We("cpu",e,10),We("wasm",e,10)}Object.defineProperty(te.versions,"web",{value:Fr,enumerable:!0});return dt(_p);})();
/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
typeof exports=="object"&&typeof module=="object"&&(module.exports=ort);
//# sourceMappingURL=ort.min.js.map
