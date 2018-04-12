var _ajax = require('./ajax.js');


function  dhis2API(){

    var ajax = new _ajax("../../");
    
    this.organisationUnitService = function(){

        this.getOUGroups = function(fields,filters){
            return new Promise((resolve,reject) => {
                ajax.get("organisationUnitGroups?paging=false&fields="+fields+"&filters="+filters,function(error,reponse,body){
                    if(!error){
                        resolve(body)
                    }else{
                        reject(error)
                    }
                    
                })
            })
        }
    }
    
    this.dataStoreService = function(dataStoreName){

        this.getAllKeyValues = function(){
            return new Promise((resolve,reject) => {
                ajax.get("dataStore/"+dataStoreName,((error,response,body) => {
                    
                    if (error){
                        
                    }else{
                        var keyArray = [];
                        
                        body.forEach((key) => {
                            keyArray.push(this.getValue(key));
                        })
                        
                        Promise.all(keyArray).then(function(values){
                            resolve(values)
                        })
                    }
                    
                }))
            })
        }
            
            function getKeys(callback){
                                    
            ajax.get("dataStore",function(error,body,response){
                if (error){
                }else{
                    callback(response)
                }

            })
        }

        this.getValue = function(key,callback){
            if (callback){
                    ajax.get("dataStore/"+dataStoreName+"/"+key,callback)
            }else{
                return new Promise((resolve,reject) => {
                    ajax.get("dataStore/"+dataStoreName+"/"+key,function(error,response,body){
                        if (error){
                            reject(error);
                        }else{
                            resolve(body);
                        }
                    })

                })
            }
                
        }
        
        
        this.saveOrUpdate = function(jsonObj,callback){

            //TODO
            jsonObj.key = Math.floor(Math.random(0)*100000);
debugger
           ajax.update("dataStore/"+dataStoreName+"/"+jsonObj.key,jsonObj,function(error,response,body){
                if (error || body.status == "ERROR"){
                    // may be key not exist
                    ajax.save("dataStore/"+dataStoreName+"/"+jsonObj.key,jsonObj,function(error,response,body){
                        if (error){
                            console.log("Couldn't save data store key value")
                            return
                        }
                        debugger
                    })
                }
            })
            
        }
    }
    
}

module.exports = new dhis2API();
