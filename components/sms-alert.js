import React,{useState,useEffect} from 'react';
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

    const [sentReceipt,setSentReceipt] = useState(function(){

        if (!eventDVMap[constants.de_sms_sent_status]){
            return "";
        }else if( eventDVMap[constants.de_sms_sent_status].value!='SENT'){
            return eventDVMap[constants.de_sms_sent_status].value;
        }
        
        if (!eventDVMap[constants.de_sent_json]){
            return "";
        }
        
        try{
            var smsRes = parseSMSResponse(JSON.parse(eventDVMap[constants.de_sent_json]));
            return smsres.receipts;
        }catch(e){
            return ""
        }
        
    });
    const [loader,setLoader] = useState(false);
    const [expand,setExpand] = useState(false);
    const [comment,setComment] = useState(eventDVMap[constants.de_comment]?eventDVMap[constants.de_comment].value:undefined);
    const [finalMessage,setFinalMessage] = useState("");
    const [recipients,setRecipients] = useState("");
    
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
          //  alert("Level Not Recognized");
            return
        }
    
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
        
        if (confirm(`Are you sure you want to continue?`)){
            setLoader(true);
            SMS.sendBulk("[TEST]"+finalMessage,users,postSendSMS)
        }        
        
        function postSendSMS(error,response,body){
            
            if (error){
                setSentReceipt("Error with SMS Service");
                setLoader(false);
                setExpand(false)
                return
            }

            if (body.error){
                setSentReceipt("Error while Sending SMS:"+body.response);
                setLoader(false);
                setExpand(false)
                return
            }

            var smsResponseParsed = parseSMSResponse(body);
            if (smsResponseParsed.error){
                debugger
                setSentReceipt("Error while Sending SMS :"+smsResponseParsed.receipts);
                setLoader(false);
                setExpand(false)
                return
            }
            
            saveOrUpdateDV(constants.de_sms_sent_status,"SENT");
            saveOrUpdateDV(constants.de_recepeints,userData.names.join(","));
            saveOrUpdateDV(constants.de_sent_message,finalMessage);
            saveOrUpdateDV(constants.de_sent_json,JSON.stringify(body));
            saveOrUpdateDV(constants.de_comment,comment);

            event.status = "COMPLETED";
            saveEvent((error,response,body) => {
                
                var eventSaveStatus = getEventSaveResponseString(error,response,body);
               
                setSentReceipt(`${smsResponseParsed.receipts} ${eventSaveStatus}`);
                setLoader(false);
                setExpand(false)
                
            })
            
        }
    }

    function getEventSaveResponseString(error,response,body){
        if (error){
            return  "Error"
        }

        try{
            if (body.response.importCount.updated=="1" || body.response.importCount.imported=="1"){
                return "";
            }
        }catch(e){
            return "Error_"
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
            setSentReceipt("CLOSED"+eventSaveStatus);
            
        })
    }

    function spam(){
        setLoader(true);
        saveOrUpdateDV(constants.de_sms_sent_status,"CLOSED-SPAM");
        saveOrUpdateDV(constants.de_message_type,"spam");
        saveOrUpdateDV(constants.de_comment,comment);

        event.status = "COMPLETED";
        saveEvent(function(error,response,body){
            var eventSaveStatus = getEventSaveResponseString(error,response,body);

            setLoader(false);
            setSentReceipt("CLOSED-SPAM"+eventSaveStatus);
            
        })
    }
    
    function saveEvent(callback){
        var apiWrapper = new api.wrapper();
        apiWrapper.putObj("events/"+event.event,event,callback)
    }

    function parseSMSResponse(data){
        var res = {
            error : true,
            message : "",
            receipts:null 
        }

        if (!data.response){
            res.message= "SMS Response Not valid";
        }

            
        res.receipts = data.response.SMSMessageData.Recipients.reduce(function(list,obj){
            if (obj.statusCode!=101){
                res.error=true;
            }
            list.push(`XXXXX${obj.number.substring(5,8)} ( ${obj.status})`);
            
            return list;
        },[]);
        
        return res;
    }
    
    function getSentStatusDescription(callback){

        if (!eventDVMap[constants.de_sms_sent_status]){
            return "";
        }else if( eventDVMap[constants.de_sms_sent_status].value!='SENT'){
            return eventDVMap[constants.de_sms_sent_status].value;
        }
        
        if (!eventDVMap[constants.de_sent_json]){
            return "";
        }

        var smsResponse = getSentReceiptsStatus(eventDVMap[constants.de_sent_json]);
        var str = (smsResponse.error?"ERROR":"SENT")+`--  ${eventDVMap[constants.de_sent_message]?eventDVMap[constants.de_sent_message].value:undefined}  \
  TO--   ${smsResponse.receipts}`;

        return str;

        function getSentReceiptsStatus(data){

            var error = false;
            if (!data){
                return "No Sent SMS Data Found";
            }

            try{
                data = JSON.parse(data.value);
            }catch(e){
                return "Sent  Data not JSON parsed"
            }

            if (!data.response){
                
                return 
            }

            
            var receipts = data.response.SMSMessageData.Recipients.reduce(function(list,obj){
                if (obj.statusCode!=101){
                    error=true;
                }
                list.push(`XXXXX${obj.number.substring(5,8)} ( ${obj.status})`);
                
                return list;
            },[])
   
            return {receipts: receipts.join(" , "),error:error};
        }
    }

    function onRowClick(){
        setExpand(!expand);

        var users = getUsers();
        if (!users || users.length==0){
            setRecipients(null);
            
            return;
        }
        
        setRecipients( users.reduce(function(data,obj,index){
            data.push(<li>{obj.name}
                      (  {obj.phoneNumber?"....."+obj.phoneNumber.substring(5,8):"NA"} )
                      </li>)
            return data;
        },[]));
        
        setSMSString();

    }

    function setSMSString(){
        setFinalMessage(`${identifiedLevel?identifiedLevel.value:""} received \
from ${event.orgUnitName} \
on ${moment(event.eventDate).format("YYYY-MM-DD") }.
${comment?comment:""}`);

    }

    useEffect(() => {
        setSMSString();
    },[comment]);
    
    function onCommentChange(e){
        setComment(e.target.value);
       

    }
    
    function getButtonClass(type){

        if (loader){
            return "hidden";
        }
        
        switch (type){
            
        case 'verify':
            
            if ( event.status=="COMPLETED"){
                return "hidden"
            }

            return ""
            break;
        case 'cancel':
        case 'spam':
            if (event.status == "COMPLETED"){
                return "hidden"
            }else {
                return ""
            }
            break;
        case 'resend':
            if( event.status=="COMPLETED"){
                return ""
            }
            return "hidden"
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
      
        <textarea placeholder="Enter Comment..." rows="7" cols="30" value={comment} onChange={onCommentChange} />
        </td>
      
        
        <td colSpan="2">
        <h4>Recipients</h4>
        <ul>
        {recipients?recipients:"No Users Found!"}
        </ul>
        </td>
        <td colSpan="1">
        <h4>SMS Preview</h4>
        {recipients?finalMessage:""}
    </td>
    
        <td colSpan="1">
        <input id="verifyButton" className={getButtonClass('verify')} type="button" value="Verify" onClick={verify}></input>
        <input id="resendButton" className={getButtonClass('resend')} type="button" value="Resend" onClick={verify}></input>  
        </td>
        </tr>
        
        </tbody>
        
}
