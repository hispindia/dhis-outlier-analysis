
function SMS(params){

    function post(data,callback){
        
        var request = new XMLHttpRequest();
        request.open('POST', params.url, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('apiKey', params.apiKey);
        request.setRequestHeader('Accept', 'application/json');

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // Success!
                var data = JSON.parse(request.responseText);
                callback(null,request,data);
            } else {
                // We reached our target server, but it returned an error
                callback(request,null,null);
            }
        };
        
        request.onerror = function(e) {        
            // There was a connection error of some sort
            callback(e,null,null);

        };
        
        request.send(data);
    }
    
    this.send = function(msg,to,callback){
        var data = {
            username:params.username,
            to:to,
            message:msg
        };
            
        post(JSON.stringify(data),callback);

    }    
}

module.exports=SMS;
