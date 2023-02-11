// Worker side
if (typeof document === typeof void 0) {
  importScripts("Promise.min.js");

  var RPC = {};
  RPC.init = function (proxy) {
    var rs;
    var loadP = new Promise(function (res, rej) {
      rs = res;
    });

    var sender = {};
    sender.supportTransferable = true;
    sender.transferables = [];

    // register worker's function to main thread, and test for support of transferable objects
    var ab = new ArrayBuffer(1);
    try {
      postMessage(
        {
          ts: "reg",
          fns: Object.keys(proxy),
          dummy: ab,
        },
        [ab]
      );

      // transferables not supported
      if (ab.byteLength) {
        sender.supportTransferable = false;
      }
    } catch (e) {
      // transferables not supported
      // also need to re-register the functions
      sender.supportTransferable = false;
      postMessage({
        ts: "reg",
        fns: Object.keys(proxy),
      });
    }

    addEventListener("message", function onmessage(evt) {
      // register sender's function to sender obj
      if (evt.data.ts === "reg") {
        evt.data.fns.forEach(function (fn) {
          sender[fn] = function () {
            postMessage(
              {
                ts: "w2s",
                fn: fn,
                args: Array.prototype.slice.call(arguments),
              },
              sender.supportTransferable ? sender.transferables : null
            );
            sender.transferables = [];
          };
        });
        rs(sender);
        return;
      }

      try {
        var result = proxy[evt.data.fn].apply(proxy, evt.data.args);
        postMessage(
          {
            ts: evt.data.ts,
            result: result,
          },
          sender.supportTransferable ? sender.transferables : null
        );
        sender.transferables = [];
      } catch (error) {
        postMessage({
          ts: evt.data.ts,
          error: error.toString(),
        });
      }
    });

    return loadP;
  };
} else {
  // Main thread side:
  var RPC = {};
  RPC.new = function (workersrc, senderProxy) {
    senderProxy = senderProxy || {};

    var rs;
    var loadP = new Promise(function (res, rej) {
      rs = res;
    });

    var obj = {};
    obj.supportTransferable = true;
    obj.worker = new Worker(workersrc);

    var ab = new ArrayBuffer(1);
    // reg fns and test for transferable support
    try {
      obj.worker.postMessage(
        {
          ts: "reg",
          fns: Object.keys(senderProxy),
          dummy: ab,
        },
        [ab]
      );

      // transferables not supported
      if (ab.byteLength) {
        obj.supportTransferable = false;
      }
    } catch (e) {
      // transferables not supported
      // also need to re-register the functions
      obj.supportTransferable = false;
      obj.worker.postMessage({
        ts: "reg",
        fns: Object.keys(senderProxy),
      });
    }

    obj.pendingPromises = {};
    obj.transferables = [];

    var that = obj;

    obj.worker.onmessage = function (e) {
      var ts = e.data.ts;
      if (!ts) throw new Error("Unknown timestamp");
      else if (ts === "reg") {
        e.data.fns.forEach(function (fn) {
          that[fn] = function () {
            var ts = Date.now();
            var p = new Promise(function (resolve, reject) {
              that.pendingPromises[ts] = {
                resolve: resolve,
                reject: reject,
              };
            });

            that.worker.postMessage(
              {
                fn: fn,
                args: Array.prototype.slice.call(arguments),
                ts: ts,
              },
              that.supportTransferable ? that.transferables : null
            );
            that.transferables = [];
            return p;
          };
        });
        rs(obj);
        return;
      } else if (ts === "w2s") {
        senderProxy[e.data.fn].apply(senderProxy, e.data.args);
        return;
      }

      var p = that.pendingPromises[ts];
      if (!p) throw new Error("Unknown response");

      var error = e.data.error;
      if (error) {
        p.reject(error);
      } else {
        p.resolve(e.data.result);
      }
      delete that.pendingPromises[ts];
    };
    return loadP;
  };
}
