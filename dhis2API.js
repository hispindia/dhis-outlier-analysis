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


    this.periodService = function(){

        this.getPeriods = function(periodType,startDate,endDate){

            switch(periodType){
            case "Monthly" :
                debugger
                return  getMonthlyPeriods();
                default :
                return  getMonthlyPeriods();
                
                
            }

            function getMonthlyPeriods(){

                var periods = [];
                var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December');
                var MONTH_NAMES_SHORT=new Array('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');


                var today = new Date();
                var currentYear = today.getFullYear();
                var currentMonth = today.getMonth();
                
                for (var i=currentYear;i>=1990;i--){
                    while(currentMonth!=-1){
                        var monthStr = ""
                        var cm = currentMonth+1;
                        if (cm <10){
                            monthStr = "0";
                        }
                        periods.push(
                            {
                                id:i+monthStr+cm,
                                name : MONTH_NAMES_SHORT[currentMonth]+" "+i

                            }
                        );

                        currentMonth = (currentMonth-1);
                    }
                    currentMonth=11;
                }
                
                return periods;
            }
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
