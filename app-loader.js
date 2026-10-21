(function(){
  var parts=[];
  window.__531add=function(s){parts.push(s);};
  window.__531run=function(){
    try{ (0,eval)(parts.join("")); }
    catch(e){ console.error("531+ load error",e); document.body.innerHTML='<pre style="color:#e74c3c;padding:20px">531+ failed to load: '+(e&&e.message)+'</pre>'; }
  };
})();
