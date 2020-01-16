import React,{useState} from 'react';
import api from 'dhis2api';
import constants from '../constants';
import sms from '../SMS';
import moment from 'moment';

const apiWrapper = new api.wrapper();
const SMS = new sms(constants.africas_talking_params);

export function SMSAlert(props){

    const event = props.event;
    const eventDVMap = event.dataValues.reduce(function(map,obj){
        map[obj.dataElement]=obj;
        return map;
    },[]);

    const [sentReceipt,setSentReceipt] = useState(getSentStatusDescription());
    const [loader,setLoader] = useState(false);
    const [expand,setExpand] = useState(false);
    const [comment,setComment] = useState(eventDVMap[constants.de_comment]?eventDVMap[constants.de_comment].value:undefined);
    const identifiedLevel = eventDVMap[constants.de_identified_level];
    
    var message = "";

    function getUsers(){
        var users = [];

        if (props.userGroupMap.length==0){
            //    alert("No Responders Set.[User Groups Empty]. Please Contact Admin");
            //  return
        }
        
        var defaultUserGroup = props.userGroupMap[constants.user_group_default_level_code];

        if (!identifiedLevel){
            alert("Level Not Recognized");
            return
        }
        
        message = `${identifiedLevel.value} received \
from ${event.orgUnitName} \
on ${moment(event.eventDate).format("YYYY-MM-DD") }`
        var levelUserGroup = props.userGroupMap[identifiedLevel.value] 

        if (!defaultUserGroup &&
            !levelUserGroup){
            alert("No Responders Set.[Nneither Default Group Nor Level Group available] Please Contact Admin");
            return
        }

        
        if (levelUserGroup && levelUserGroup.users){
            levelGroup.users.reduce(function(users,obj,index){
                users.push(obj);
                return users;
            },users);
        }

        if (defaultUserGroup && defaultUserGroup.users){
            defaultUserGroup.users.reduce(function(users,obj,index){
                users.push(obj);
                return users
            },users);
        }

        if (users.length==0){
            alert("No Responders Set.[Users=0] Please contact Admin")
            return;
        }
        
        return users;
    }
    
    function verify(){

        var users = getUsers();
        if (!users || users.length==0){
            return;
        }
        
        var userData = users.reduce(function(data,obj,index){
            if (obj.phoneNumber){
                data.names.push(obj.name);
                data.phones.push(obj.phoneNumber);
            }
            return data;
        },{names : [], phones : []});
        
        if (confirm(`Following users will be notified through SMS : ${userData.names.join(",")} \n
Are you sure you want to continue?
`)){
            setLoader(true);
            SMS.send("[TEST]"+message,users,postSendSMS)
        }        

        function postSendSMS(sentReceipts){
            if (!sentReceipts){
                alert("An unexpected error occurred");
                return;
            }

            saveOrUpdateDV(constants.de_sms_sent_status,"SENT");
            saveOrUpdateDV(constants.de_recepeints,userData.names.join(","));
            saveOrUpdateDV(constants.de_sent_message,message);
            saveOrUpdateDV(constants.de_sent_json,JSON.stringify(sentReceipts));
            saveOrUpdateDV(constants.de_comment,comment);

            event.status = "COMPLETED";
            saveEvent(function(error,response,body){
                
                var eventSaveStatus = getEventSaveResponseString(error,response,body);
               
                setSentReceipt(`${getSentStatusDescription()}. Event:${eventSaveStatus}`);
                setLoader(false);
                
            })
            
        }
    }

    function getEventSaveResponseString(error,response,body){
        if (error){
            return  "Error"
        }else{
            return `[ httpStatus:${body.httpStatus} ,${JSON.stringify(body.response.importCount)} ]`
        }
    }
    
    
    function saveOrUpdateDV(de,val){
        
        var dv ={
            dataElement : de,
            value : val
        }
        
        if (!eventDVMap[de]){
            event.dataValues.push(dv)
            eventDVMap[dv.dataElement]=dv;
        }else{
            removeAllKeys(eventDVMap[dv.dataElement])
            eventDVMap[dv.dataElement].dataElement=dv.dataElement;
            eventDVMap[dv.dataElement].value=dv.value;
        }

        function removeAllKeys(obj){
            // TODO Add in utility
            for (var key in obj){
                delete obj[key]
            }
        }
    }
    
    function cancel(){

        setLoader(true);
        saveOrUpdateDV(constants.de_sms_sent_status,"CLOSED");
        saveOrUpdateDV(constants.de_comment,comment);

        event.status = "COMPLETED";
        saveEvent(function(error,response,body){
            var eventSaveStatus = getEventSaveResponseString(error,response,body);

            setLoader(false);
            setSentReceipt("Closed."+eventSaveStatus);
            
        })
    }

    function spam(){
        setLoader(true);
        saveOrUpdateDV(constants.de_sms_sent_status,"CLOSED");
        saveOrUpdateDV(constants.de_message_type,"spam");
        saveOrUpdateDV(constants.de_comment,comment);

        event.status = "COMPLETED";
        saveEvent(function(error,response,body){
            var eventSaveStatus = getEventSaveResponseString(error,response,body);

            setLoader(false);
            setSentReceipt("Closed and Marked as Spam."+eventSaveStatus);
            
        })
    }
    
    function saveEvent(callback){
        var apiWrapper = new api.wrapper();
        apiWrapper.putObj("events/"+event.event,event,callback)
    }

    function getSentStatusDescription(){
        
        if (!eventDVMap[constants.de_sent_json]){
            return "";
        }
        
        var str = `Sent [ ${eventDVMap[constants.de_sent_message].value} ] \
To ${getSentReceiptsStatus(eventDVMap[constants.de_sent_json])}`;

        return str;

        function getSentReceiptsStatus(data){

            if (!data){
                return "No Sent SMS Data Found";
            }

            try{
                data = JSON.parse(data.value);
            }catch(e){
                return "Sent  Data not JSON parsed"
            }
            
            var receipts = data.reduce(function(receipts,obj){
                var str = ""
                if (obj.error){
                    str=`User[${obj.user.name}] Error While sending SMS`;
                }else{
                    var msg="";
                    try{
                        msg = obj.response.message.SMSMessageData.Recipients[0].status;
                    }catch(e){
                        msg = "Error while parsing api response";
                    }
                    str = `[ ${obj.user.name}[ ${msg} ]]`;
                }
                
                receipts.push(str);                      
                return receipts;
            },[])

            return receipts.join(" , ");
        }
    }

    function onRowClick(){
        setExpand(!expand);
    }

    function onCommentChange(e){
        setComment(e.target.value);
    }
    
    function getButtonClass(type){

        if (loader){
            return "hidden";
        }
        
        switch (type){
        case 'verify':
            if (!sentReceipt){
                return ""
            }else {
                return "hidden"
            }
            break;
        case 'cancel':
        case 'spam':
            if (!sentReceipt){
                return ""
            }else {
                return "hidden"
            }
            break;
        }
        
        return ""
    }
    
    return <tbody><tr  key={"tr_"+event.event}>
        <td key={"tr_ou_"+event.event}>{event.orgUnitName}</td>
        <td key={"tr_date_"+event.event}>{moment(event.eventDate).format("YYYY-MM-DD")}</td>
        <td key={"tr_id_level_"+event.event}>{eventDVMap[constants.de_identified_level]?eventDVMap[constants.de_identified_level].value:"-"}</td>
        <td key={"tr_sms_"+event.event}>{eventDVMap[constants.de_sms_content]?eventDVMap[constants.de_sms_content].value:"NULL"}</td>
        <td key={"tr_action_"+event.event} onClick={onRowClick}>
        <img className = {!expand?"" : "hidden"} src="./images/expand.png" alt="loader.." height="18" width="18"></img> 
        <img className = { expand?"" : "hidden"} src="./images/collapse.png" alt="loader.." height="18" width="18"></img> 

        </td>
        <td>
        <img style = {loader?{"display":"inline"} : {"display" : "none"}} src="./images/loader.gif" alt="loader.." height="32" width="32"></img> 
        <label> {sentReceipt}</label>
        </td>

        <td>  <input id="cancelButton" className={getButtonClass('cancel')} type="button" value="Close" onClick={cancel}></input>
        <input id="spamButton" className={getButtonClass('spam')} type="button" value="Spam" onClick={spam}></input>
        </td>

    </tr>
        <tr className={expand?"":"hidden"}>
        <td colSpan="3">
      
        <textarea placeholder="Enter Comment..." rows="5" cols="45" value={comment} onChange={onCommentChange} />
        </td>
      
        
        <td colSpan="2">
        <ul>Receipeints
        <li>asasd</li>
        </ul>
        </td>
        <td colSpan="1">
        Final Message
        </td>
    
        <td colSpan="1">
        <input id="verifyButton" className={getButtonClass('verify')} type="button" value="Verify" onClick={verify}></input>
             
        </td>
        </tr>
        
        </tbody>
        
}
