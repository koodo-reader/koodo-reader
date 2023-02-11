var st = Date.now()
console.log("loading libunrar.js")
importScripts("./libunrar.js")
var elapt = Date.now() - st
console.log("Time taken to parse/load the lib: ", elapt)

importScripts('rpc.js')
var sender
var proxy = {
	unrar: function(data, password,useWorker){
		var cb = sender.progressShow
		var rarContent;
		if(useWorker==1) rarContent= readRARContentWorkerFS(data.map(function(d){return {name: d.name, content: d.content}}), password, cb);
			else rarContent= readRARContent(data.map(function(d){return {name: d.name, content: new Uint8Array(d.content)}}), password, cb);
		var transferables = []

		var rec = function(entry) {
			if(entry.type === 'file') {
				transferables.push(entry.fileContent.buffer)
			} else if(entry.type === 'dir') {
				Object.keys(entry.ls).forEach(function(k){
					rec(entry.ls[k])
				})
			} else {
				throw "Unknown type"
			}
		}
		rec(rarContent)
		sender.transferables = transferables
		return rarContent
	}
}
RPC.init(proxy).then(function(s){
	s.loaded()
	sender = s
})




