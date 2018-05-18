var staticsVersion="1.100.0"; function getIframe(cb) {
  if(!window.baseUrl) {
    var getSiteInfo = Wix.getSiteInfo || Wix.Worker.getSiteInfo;
    getSiteInfo(function (info) {
      //console.log(info);

      var pathArray = info.baseUrl.split('/');
      var protocol = pathArray[0];
      var host = pathArray[2];
      window.baseUrl = protocol + '//' + host;
      var iframe = getIframeRaw();
      if(cb) cb(iframe);
    });
  } else {
    var iframe = getIframeRaw();
    if(cb) cb(iframe);
  }
}
function getIframeRaw() {

  var asdkTpaIframeId = 'asdkTpa';

  var iframe;
  try {
    iframe = document.getElementById(asdkTpaIframeId);

    if (!iframe) {
      if (typeof staticsVersion == "undefined") {
        staticsVersion = "1.84.0";
      }
      var service = '/ding-dashboard-statics/' + staticsVersion;
      var asdkScriptUrl = '/asdk/handler.html';// + '?ck=' + (new Date()).getTime();

      var asdkMainSrc;
      var getViewMode = (Wix.Utils && Wix.Utils.getViewMode) || (Wix.Worker && Wix.Worker.Utils && Wix.Worker.Utils.getViewMode);
      if (getViewMode() === 'preview' || getViewMode() === 'editor') {
        asdkMainSrc = '//editor.wix.com' + '/_partials' + service + asdkScriptUrl;
      } else {
        asdkMainSrc = window.baseUrl + '/_partials' + service + asdkScriptUrl;
      }

      iframe = document.createElement('iframe');
      iframe.id = asdkTpaIframeId;
      iframe.src = asdkMainSrc;
      iframe.style.backgroundColor = "transparent";
      iframe.frameBorder = "0";
      iframe.allowTransparency = "true";
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.onload=onLoadHandler;

      document.body.appendChild(iframe);
    }
  } catch(err) {
    console.error("Error on iframe fetch", err);
  }
  return iframe;
}

function dispatch(params) {
  getIframe(function(iframe) {
    if(iframe) {
      iframe.contentWindow.postMessage(JSON.stringify(params), "*");
    }
    else
      console.error("Can't find the asdk iframe");
  });
}
getIframe();


function onLoadHandler() {
  console.log("iframe loaded");
  var PubSub = Wix.PubSub || Wix.Worker.PubSub;
  PubSub.subscribe("asdk", function (event) {
    try {
      var params = event.data;
      var whitelistMethods = ['setWidgetFullScreen', 'setWidgetFixedOnBottom', 'setWidgetCss', 'setViewportContent'];
      if (whitelistMethods.indexOf(params.method) > -1) {
        console.log("Going to call", params);
        dispatch(params);
      } else {
        console.error('Unsupported method', params);
      }
    } catch (err) {
      console.error('Failed to execute ', err);
    }
  }, true);
}
