import React,{useState,useEffect} from 'react';
import api from 'dhis2api';
import constants from '../constants';
import {SMSAlert} from './sms-alert';
import moment from 'moment';

const apiWrapper = new api.wrapper();

export function WatchPanel(props){
    const [alertMessages,setAlertMessages] = useState(null);
    const [selOU,setSelOU] = useState(props.data.me.organisationUnits[0].id);
    const [selMsgType,setSelMsgType] = useState("all");
    const [eventStatus,setEventStatus] = useState("ACTIVE");
    const [loader,setLoader] = useState(true);

    const [dates,setDates] = useState({
        end: moment().format("YYYY-MM-DD"),
        start: moment().subtract(7,'d').format("YYYY-MM-DD"),
        
    })
    const userGroupMap = props.data.userGroups.reduce(function(map,obj){
        if (obj.code)
            map[obj.code]=obj;
        return map;
    },[]);

    const identifiedLevelsOptionMap = props.data.identifiedLevelOptions.reduce(function(map,obj){
        if (obj.code)
            map[obj.code]=obj;
        return map;
    },[]);
    
    function getFilters(){
        var filters = [];

        if (selMsgType != "all"){
            filters.push(`filter=${constants.de_message_type}:in:${selMsgType}`)
        }

        if (eventStatus !="all"){
            filters.push(`status=${eventStatus}`)
        }

        
        if (filters.length==0){
            return ""
        }

        return filters.join("&");
    }
    
    function getEvents(callback){

        var messageTypeFilter = getFilters();

        
        apiWrapper.getObj(`events.json?program=${constants.program_sms_inbox}\
&orgUnit=${selOU}\
&ouMode=DESCENDANTS\
&startDate=${dates.start}\
&endDate=${dates.end}\
&paging=false\
&order=eventDate:DESC
&${messageTypeFilter}`,
                          (error,response,body)=>{
                              if (error){
                                  alert("An unexpected Error occurred"+JSON.stringify(error));
                                  callback();
                                  return;
                              }
                              
                              var events = body.events;
                              
                              if (events.length==0){
                                  setAlertMessages(<tr><td>No Data Found</td></tr>);
                                  callback();
                                  return;
                              }
                              
                              var alerts = events.reduce(function(list,obj){
                                  list.push(<SMSAlert key={"SMSAlert_"+obj.event}
                                            event={obj}
                                            userGroupMap={userGroupMap}
                                            identifiedLevelsOptionMap = {identifiedLevelsOptionMap} />);
                                  return list;
                              },[]);
                              
                              setAlertMessages(alerts);
                              callback();
                          });
        
    }
    
    props.services.ouSelectCallback.selected = function(ou){
        setSelOU(ou.id);
    }
    
    useEffect(function(){
        getEvents(()=>{
            setLoader(false);
        })
    },[]);
    
    function fetchMessages(ou,program){
        
        
    }

    function refresh(){
        
        setLoader(true)
        getEvents(function(){
            setLoader(false)
        });
    }

    function startDateChanged(e){
        setDates({...dates,'start':e.target.value})
    }

    function endDateChanged(e){
        setDates({...dates,'end':e.target.value})
    }

    function onMessageTypeChange(e){
        setSelMsgType(e.target.selectedOptions[0].value);
    }

    function onEventStatusChange(e){
        setEventStatus(e.target.selectedOptions[0].value);
    }
    
    return <div id="main" className="">

        <table>
        <tbody>
        <tr>
        <td>Select Start Date:</td>
        <td><input  type="date" onChange={startDateChanged} value={dates.start}></input></td>

        <td>Select End Date:</td>
        <td><input  type="date" onChange={endDateChanged} value={dates.end} ></input></td>
        </tr>
        <tr>
        <td>Select Message Type</td>
        <td><select onChange={onMessageTypeChange} value={selMsgType}>
        <option  value="all">All</option>
        <option  value="valid">Valid</option>
        <option  value="invalid">Invalid</option>
        <option  value="spam">Spam</option>

    </select>
        </td>

        <td>Select Status </td>
        <td><select onChange={onEventStatusChange} value={eventStatus}>
        <option  value="all">All</option>
        <option  value="ACTIVE">Open</option>
        <option  value="COMPLETED">Closed</option>

    </select>
        </td>
        </tr>
        <tr>
        <td><input type="button" className="refreshButton" value="Refresh" onClick={refresh}></input></td>
        </tr>
        </tbody>
        </table>
        
        <h2>Message Queue         <img style = {loader?{"display":"inline"} : {"display" : "none"}} src="./images/loader.gif" alt="loader.." height="32" width="32"></img> 
        </h2>

    
        <table className="report">
        <thead>
        <tr>
        <th>Facility</th>
        <th>Date </th>
        <th>Identified Level</th>
        <th>SMS</th>
        <th>#</th>
        <th>Status</th>
        <th>!</th>

    </tr>
        </thead>
        {alertMessages}
    </table>
        </div>
        
}
