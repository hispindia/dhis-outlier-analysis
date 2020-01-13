import React,{useState} from 'react';
import api from 'dhis2api';
import constants from '../constants';
import sms from '../SMS';
import moment from 'moment';

const apiWrapper = new api.wrapper();
const SMS = new sms(constants.africas_talking_params);

function getSMSMessage(event){
    
    
    return `${level} message received from ${facility} on ${date}`;
}

export function SMSAlert(props){


    const [sentStatus,setSentStatus]= useState("pending");
    
    const event = props.event;
    const eventDVMap = event.dataValues.reduce(function(map,obj){
        map[obj.dataElement]=obj;
        return map;
    },[]);
    
    function verify(){
        var identifiedLevel = eventDVMap[constants.de_identified_level];

        if (!identifiedLevel ||
            !props.userGroupMap[identifiedLevel.value]){
            
        }

        var levelGroup = props.userGroupMap[identifiedLevel.value] 

        var userData = levelGroup.users.reduce(function(data,obj,index){
            if (obj.phoneNumber){
                data.names+=(index+1)+"\n "+obj.name;
                data.phones = obj.phoneNumber;
            }
            return data;
        },{names : "", phones : ""});

        if (confirm(`Following users will be notified through SMS : ${userData.names} \n
Are you sure you want to continue?
`)){
            
            const message = `${identifiedLevel.value} message received from ${event.orgUnitName} on ${moment(event.eventDate).format("YYYY-MM-DD") }`
            SMS.send("[TEST]"+message,userData.phones,function(error,response){
                if(error){
                    
                    return;
                }

                saveEvent()
                debugger
            })

        }

        
    }

    function saveEvent(){
        var apiWrapper = new api.wrapper();

        apiWrapper.putObj("events/"+event.event,event,function(error,response,body){
            debugger
        })
    }
    
    return <tr key={"tr_"+event.event}>
        <td key={"tr_ou_"+event.event}>{event.orgUnitName}</td>
        <td key={"tr_date_"+event.event}>{moment(event.eventDate).format("YYYY-MM-DD")}</td>
        <td key={"tr_sms_"+event.event}>{eventDVMap[constants.de_sms_content]?eventDVMap[constants.de_sms_content].value:"NULL"}</td>
        <td></td>
        <td key={"tr_action_"+event.event}>
        <input className={sentStatus=="pending"?"":"hidden"} type="button" value="Verify" onClick={verify}></input>
        <label className={sentStatus=="sent"?"":"hidden"}>SMS Sent</label>
        </td>
        <td></td>

    </tr>
    
}
