import React,{useState,useEffect} from 'react';
import api from 'dhis2api';
import constants from '../constants';
import {SMSAlert} from './sms-alert';

const apiWrapper = new api.wrapper();

export function WatchPanel(props){
    const [alertMessages,setAlertMessages] = useState(null);
    const userGroupMap = props.data.userGroups.reduce(function(map,obj){
        if (obj.code)
            map[obj.code]=obj;
        return map;
    },[]);
    
    function getEvents(ou){
        
        apiWrapper.getObj(`events.json?program=${constants.program_sms_inbox}&orgUnit=${ou}&ouMode=DESCENDANTS&paging=false&filter=${constants.de_message_type}:in:valid`,function(error,response,body){
            
            postEventsFetch(body.events);
        });
    }
    
    function postEventsFetch(events){

        var alerts = events.reduce(function(list,obj){
            list.push(<SMSAlert key={"SMSAlert_"+obj.event} event={obj} userGroupMap={userGroupMap}  />);
            return list;
        },[]);
        setAlertMessages(alerts);
    }
    
    props.services.ouSelectCallback.selected = function(ou){
        getEvents(ou.id);
    }
    
    useEffect(function(){
        getEvents(props.data.me.organisationUnits[0].id)
    },[]);
    
    function fetchMessages(ou,program){
        
        
    }

    
    return <div>
        <table className="">
        <thead>
        <tr>
        <th>Facility</th>
        <th>Date </th>
        <th>SMS</th>
        <th>Status</th>
        <th>#</th>
        <th>##</th>

        </tr>
    </thead>
        <tbody>
        {alertMessages}
        </tbody>
    </table>
        </div>
    
}
