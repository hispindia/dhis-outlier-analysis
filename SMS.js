
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
        
        request.send(JSON.stringify(data));
    }

    this.sendBulk = function(msg,users,callback){

        var phones = users.reduce(function(list,obj){
            if (obj.phoneNumber){
                list.push(obj.phoneNumber);
            }
            return list;
        },[]).join(";");
        
        var data = {
            to:phones,
            message:msg
        };
        
        post(data,callback);
        
    }
    
    this.send = function(msg,users,callback){
     

        function sendSMS(reference,index,msg,users,callback){
            if (users.length==index){
                callback(reference)
                return
            }

            if (!users[index].phoneNumber){
                sendSMS(reference,index+1,msg,users,callback)
                return;
            }
            
            var data = {
                to:users[index].phoneNumber,
                message:msg
            };
            
            post(data,function(error,response,body){
                var res = {
                    error : false,
                    response : body,
                    user : users[index]
                }
                
                if (error){
                    res.error = true;
                }else if (body.error){
                    res.error=true;
                }

                           
                reference.push(res); 
                sendSMS(reference,index+1,msg,users,callback)
            })
        }

        sendSMS([],0,msg,users,function(reference){
            callback(reference);
        })
        
    }    
}

module.exports=SMS;
