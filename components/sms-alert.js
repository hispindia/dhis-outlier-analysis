import React,{useState} from 'react';
import api from 'dhis2api';
import constants from '../constants';
import moment from 'moment';

const apiWrapper = new api.wrapper();

export function SMSAlert(props){
debugger
    const event = props.event;
    const eventDVMap = event.dataValues.reduce(function(map,obj){
        map[obj.dataElement]=obj;
        return map;
    },[]);

    function verify(){
        debugger
    }
    
    return <tr key={"tr_"+event.event}>
        <td key={"tr_ou_"+event.event}>{event.orgUnitName}</td>
        <td key={"tr_date_"+event.event}>{moment(event.eventDate).format("YYYY-MM-DD")}</td>
        <td key={"tr_sms_"+event.event}>{eventDVMap[constants.de_sms_content].value}</td>
        <td key={"tr_action_"+event.event}>
        <input type="button" value="Verify" onClick={verify}></input>
        </td>
        <td></td>

    </tr>
    
}
