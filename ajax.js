
function ajax(base_url){
    
    this.get = function(url,callback){
        url = base_url+url;
        
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        
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
        
        request.send();
        
    }

    this.getReq = function(url,resolve){

        return new Promise((resolve,reject) => {
            this.getReq(url,function(error,response,body){
                resolve(error,response,body);            
            })
        })
    }
}

module.exports = ajax;
