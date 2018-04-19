

function sqlQueryBuilder(mapping,selectedOU,selectedOUGroupUID,startDate,endDate,periodType,aggType){

    
    var children = selectedOU.children;
    var selectedOULevel = selectedOU.level;
    
    var selectedOUUID =  "'"+selectedOU.id+"'";
    
    startDate = getDate(periodType,startDate)
    endDate = getDate(periodType,endDate)
    var ouGroupWiseDecocStringMap = mapping.decoc.reduce((map,obj) => {
        
        var str = map[obj.ougroup];
        if (!str) {
            map[obj.ougroup] = "'"+obj.de+"-"+obj.coc+"'"
        }else{
            map[obj.ougroup] = str + ",'"+obj.de+"-"+obj.coc +"'";
            
        }
        
        
        return map;
    },[])
    
    
    function getDate(type,dateStr){

        switch(type){
        case 'monthly' : 
            return "'"+dateStr.substring(0,4)+"-"+dateStr.substring(4,6)+"-01'"
        }
        
    }

    this.getSourceIDSQLQuery = function(){


        switch(selectedOUGroupUID){

        case "-1" : // no group
            if (aggType == "use_captured"){
                return getUseCaptured()
            }
            else if (aggType == "agg_descendants"){
                return getAggDescendants();
            }
            break
            
        default : // group case
            if (aggType == "use_captured"){
                return getOUGroupUseCaptured()
            }
            else if (aggType == "agg_descendants"){
                return getOUGroupAggDescendants();
            }
        }
        
        
        function getOUGroupUseCaptured(){
            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
            from orgunitgroupmembers ougm
            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
            where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`)
            and ougm.organisationunitid  in (select ous.organisationunitid
                                             from _orgunitstructure ous
                                             where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`))
            
            group by ougroup`
            
            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){
                
                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                    
                }
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;
            
            return Q;

            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOUGroupUID){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                
                var Q =`select `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
                from orgunitgroupmembers ougm
                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                where oug.uid in (`+ouGroupUIDs+`)
                and ougm.organisationunitid in (select ougm.organisationunitid
                                                from orgunitgroupmembers ougm
                                                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                                                where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`))
                and ougm.organisationunitid in ((select ous.organisationunitid
                                             from _orgunitstructure ous
                                                 where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`)))
                group by ougroup`

                return Q;
            }
        }
        
        function getOUGroupAggDescendants(){
            
            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ous.organisationunitid::text,',') as sourceids
            from _orgunitstructure ous
            inner join organisationunit ou on ou.organisationunitid = ous.organisationunitid
            where ous.uidlevel`+selectedOULevel+ `  in( `+ selectedOUUID +`)
            and ou.uid in (`+getouGroupMemberDescendantSourceIDs(selectedOUGroupUID)+`)
            group by ougroup`
            
            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){
                
                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                    
                }
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;
            
            return Q;
            
            
            function getouGroupMemberDescendantSourceIDs(ouGroupUID){
               var Q = `select concat(string_agg(distinct one::text,','), 
	                               string_agg(distinct two::text,',') ,
	                               string_agg(distinct three::text,','),
	                               string_agg(distinct four::text,',') ,
	                               string_agg(distinct five::text,',') ,
	                               string_agg(distinct six::text,',') ,
	                               string_agg(distinct seven::text,','),
	                               string_agg(distinct eight::text,','),
	                               string_agg(distinct nine::text,',') ,
	                               string_agg(distinct ten::text,',') ,
	                               string_agg(distinct eleven::text,',')) as sourceuids
                from
	        (
                    select
                    concat(''''::text,ou.uid::text,''''::text) as one,
		    concat(''''::text,ou2.uid::text,''''::text) as two,
		    concat(''''::text,ou3.uid::text,''''::text) as three,
		    concat(''''::text,ou4.uid::text,''''::text) as four,
		    concat(''''::text,ou5.uid::text,''''::text) as five,
		    concat(''''::text,ou6.uid::text,''''::text) as six,
		    concat(''''::text,ou7.uid::text,''''::text) as seven,
		    concat(''''::text,ou8.uid::text,''''::text) as eight,
		    concat(''''::text,ou9.uid::text,''''::text) as nine,
		    concat(''''::text,ou10.uid::text,''''::text) as ten ,
		    concat(''''::text,ou11.uid::text,''''::text) as eleven
	            from orgunitgroupmembers ougm
	            inner join organisationunit ou on ou.organisationunitid =  ougm.organisationunitid
	            left join organisationunit ou2 on ou.organisationunitid =  ou2.parentid
	            left join organisationunit ou3 on ou2.organisationunitid =  ou3.parentid
	            left join organisationunit ou4 on ou3.organisationunitid =  ou4.parentid
	            left join organisationunit ou5 on ou4.organisationunitid =  ou5.parentid
	            left join organisationunit ou6 on ou5.organisationunitid =  ou6.parentid
	            left join organisationunit ou7 on ou5.organisationunitid =  ou7.parentid
	            left join organisationunit ou8 on ou5.organisationunitid =  ou8.parentid
	            left join organisationunit ou9 on ou5.organisationunitid =  ou9.parentid
	            left join organisationunit ou10 on ou5.organisationunitid =  ou10.parentid
	            left join organisationunit ou11 on ou5.organisationunitid =  ou11.parentid

	            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
	            where oug.uid in (` +"'"+ouGroupUID+"'"+ `)
	            group by ou.uid,ou2.uid,ou3.uid,ou4.uid,ou5.uid,ou6.uid,ou7.uid,ou8.uid,ou9.uid,ou10.uid,ou11.uid
                )main` 
                
                return Q;
            }
            
            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOUGroupUID){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                
                var Q =`select ` + "'" + ouGroupUIDKeySelect + "'" + ` as ougroup,string_agg(ous.organisationunitid::text,',') as sourceids
                from _orgunitstructure ous
                inner join organisationunit ou on ou.organisationunitid = ous.organisationunitid
                where ous.uidlevel`+selectedOULevel+ `  in( `+ selectedOUUID +`)
                and ou.uid in (`+getouGroupMemberDescendantSourceIDs(selectedOUGroupUID)+`)
                and ous.organisationunitid in (select ougm.organisationunitid
                                               from orgunitgroupmembers ougm
                                               inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                                               where oug.uid in (`+"'"+ouGroupUIDKeySelect+"'"+`))`             

                return Q;
            }
        }

        
        function getUseCaptured(){
            
            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ou.organisationunitid::text,',') as sourceids
            from organisationunit ou
            where ou.parentid  in (select organisationunitid from organisationunit where uid = `+selectedOUUID+`)
            group by ougroup`
            
            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){
                
                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel);
                    
                }
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;
            
            return Q;

            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOULevel){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                var Q =`select `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
                from orgunitgroupmembers ougm
                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                where oug.uid in (`+ouGroupUIDs+`)
                and ougm.organisationunitid in (select ou.organisationunitid
					        from organisationunit ou
                                                where ou.parentid  in (select organisationunitid from organisationunit where uid = `+selectedOUUID+`)
                                               )`
                return Q;
                
            }
        }

        function getAggDescendants(){

            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ous.organisationunitid::text,',') as sourceids
            from _orgunitstructure ous
            where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`)
            group by ougroup`

            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){

                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel);

                }
            }


            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;

            return Q;

            
            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOULevel){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                var Q =`select `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
                from orgunitgroupmembers ougm
                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                where oug.uid in (`+ouGroupUIDs+`)
                and ougm.organisationunitid in (select ous.organisationunitid
					        from _orgunitstructure ous
					        where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`)
                                               )`
                return Q;
                
            }
        }
        
    }
    
    this.getSQLQuery = function(ouGroupWiseSourceIDs){


        var decocListCommaSeparated = mapping.decoc.reduce((str,obj) => {
            if (str==""){
                str = obj.de+"-"+obj.coc +"'"
            }else{
                str = str+ ",'"+obj.de+"-"+obj.coc +"'" ;
                
            }
            return str;
        },"")

        var deListCommaSeparated = mapping.decoc.reduce((str,obj) => {
            if (str==""){
                str = "'"+obj.de+"'"
            }else{
                str = str+ ",'"+obj.de+"'" ;
                
            }
            return str;
        },"")


        var ouGroupIDWiseSourceIDs = ouGroupWiseSourceIDs.reduce((map,obj)=>{

            map[obj.ougroup] = obj.sourceids;
            return map;
        },[])
        
        var subQuery = ""

        switch(selectedOUGroupUID){
        case "-1": // no group - default case

            for (var ouGroupID in ouGroupWiseDecocStringMap){
                
                if (subQuery == ""){
                    subQuery =  getDefaultMiddleQuery(selectedOULevel,selectedOUUID,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],ouGroupIDWiseSourceIDs[ouGroupID]);
                }
                else
                {
                    subQuery = subQuery + `
                    union
                    ` +  getDefaultMiddleQuery(selectedOULevel,selectedOUUID,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],ouGroupIDWiseSourceIDs[ouGroupID]);
                }
            }
            break;         

        default : //group case
            
            for (var ouGroupID in ouGroupWiseDecocStringMap){

                var sourceids = ouGroupIDWiseSourceIDs[ouGroupID];

                if (!sourceids) {continue}
                
                if (subQuery == ""){
                    subQuery =  getGroupMiddleQuery(selectedOULevel,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],sourceids,selectedOUGroupUID);
                }
                else
                {
                    subQuery = subQuery + `
                    union
                    ` +  getGroupMiddleQuery(selectedOULevel,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],sourceids,selectedOUGroupUID);
                }
            }
            break;         
            
        }
        
        
        var query = `select json_agg(main.*) from (`
                                                   + subQuery
                                                   + ` )main group by pivot,pivotname order by pivotname`

    //    console.log(query)
        
        return query;

        function getDefaultMiddleQuery(ouLevel,selectedOUUID,startDate,endDate,ouGroupID,decocStr,sourceids){
            var selectedOUChildrenLevel = ouLevel+1;
            
            var suffixQ =   ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
	    where parentid in (select organisationunitid 
			       from organisationunit 
			       where uid = `+selectedOUUID+`) `;

            
            
            
            var query = `select ous.uidlevel`+selectedOUChildrenLevel+` as pivot,
                max(ou.name) as pivotname,
                `+
                "'"+ouGroupID+"'"+` as ougroup,
            concat(de.uid,'-',coc.uid) as decoc ,
            sum(dv.value :: float) as value
	    from datavalue dv
	    inner join period as pe on pe.periodid = dv.periodid 
	    inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
	    inner join dataelement as de on de.dataelementid = dv.dataelementid 
	    inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid 
	    inner join _orgunitstructure ous on ous.organisationunitid = dv.sourceid 
	    inner join organisationunit ou on ou.organisationunitid = ous.idlevel`+selectedOUChildrenLevel+`
	    where pe.startdate >= `+startDate+`
            and pe.startdate <= `+endDate+`
            and dv.attributeoptioncomboid=15
	    and dv.sourceid in ( ` + sourceids + ` )
            and dv.dataelementid in  (select dataelementid from dataelement where uid in (`+deListCommaSeparated+`))
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
	    group by ous.uidlevel`+selectedOUChildrenLevel+`,de.uid,coc.uid
            union all `+ suffixQ;
            
            return query;
            
        }
        
        function getGroupMiddleQuery(ouLevel,startDate,endDate,ouGroupID,decocStr,sourceids,selOrgUnitGroupUID){
            var selectedOUChildrenLevel = ouLevel+1;
            
            var suffixQ =   ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
            inner join orgunitgroupmembers ougm on ou.organisationunitid = ougm.organisationunitid
            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
	    where oug.uid in (`+"'"+selOrgUnitGroupUID+"'"+`)`

            
            
            
            var query = `select ou.uid as pivot,
                max(ou.name) as pivotname,
                `+
                "'"+ouGroupID+"'"+` as ougroup,
            concat(de.uid,'-',coc.uid) as decoc ,
            sum(dv.value :: float) as value
	    from datavalue dv
	    inner join period as pe on pe.periodid = dv.periodid 
	    inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
	    inner join dataelement as de on de.dataelementid = dv.dataelementid 
	    inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid 
	    inner join orgunitgroupmembers ougm on ougm.organisationunitid = dv.sourceid
            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
	    inner join organisationunit ou on ou.organisationunitid = ougm.organisationunitid
	    where pe.startdate >= `+startDate+`
            and pe.startdate <= `+endDate+`
            and dv.attributeoptioncomboid=15
	    and dv.sourceid in ( ` + sourceids + ` )
            and dv.dataelementid in  (select dataelementid from dataelement where uid in (`+deListCommaSeparated+`))
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
            and oug.uid in (`+"'"+selOrgUnitGroupUID+"'"+`)
	    group by ou.uid,de.uid,coc.uid
            union all `+ suffixQ;
            
            return query;

        }
    }
}

module.exports = sqlQueryBuilder;
