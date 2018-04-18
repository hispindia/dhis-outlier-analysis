

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
    
    this.getSQLQuery = function(){


        var decocListCommaSeparated = mapping.decoc.reduce((str,obj) => {
            if (str==""){
                str = obj.de+"-"+obj.coc +"'"
            }else{
                str = str+ ",'"+obj.de+"-"+obj.coc +"'" ;
                
            }
            return str;
        },"")

        
        var subQuery = ""
      
        for (var key in ouGroupWiseDecocStringMap){
            
            if (subQuery == ""){
                subQuery =  middleQuery(selectedOULevel,selectedOUUID,startDate,endDate,key,ouGroupWiseDecocStringMap[key],selectedOUGroupUID,aggType) ;

            }else{

            }
            subQuery = subQuery + `
            union
               ` +  middleQuery(selectedOULevel,selectedOUUID,startDate,endDate,key,ouGroupWiseDecocStringMap[key],selectedOUGroupUID,aggType);
        }
        
        var query = `select json_agg(main.*) from (`
                                                   + subQuery
                                                   + ` )main group by pivot,pivotname order by pivotname`

        console.log(query)
        
        return query;

        

        function middleQuery(ouLevel,selectedOUUID,startDate,endDate,ouGroupUIDKeySelect,decocStr,selectedGroupUID,aggType){

            var selectedOUChildrenLevel = ouLevel+1;
            
            var ouGroupUIDs = ouGroupUIDKeySelect.replace("-","','");
            
            var subQuery = ` select facilities.organisationunitid
	    from _orgunitstructure facilities
	    where idlevel`+selectedOUChildrenLevel+` in ( select ou.organisationunitid
	                                  from organisationunit ou
	                                  where parentid in (select organisationunitid 
			                                     from organisationunit 
			                                     where uid = `+selectedOUUID+`))`;

            var suffixQ =   ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
	    where parentid in (select organisationunitid 
			       from organisationunit 
			       where uid = `+selectedOUUID+`) `;

            if (aggType == "agg_selected"){
                subQuery = ` select facilities.organisationunitid
	        from _orgunitstructure facilities
	        where facilities.organisationunitid in ( select ou.organisationunitid
	                                                      from organisationunit ou
	                                                      where parentid in (select organisationunitid 
			                                                         from organisationunit 
			                                                         where uid = `+selectedOUUID+`))`;                
            }
            

            
            if (selectedOUGroupUID!="-1"){
                subQuery = `select facilities.organisationunitid
	        from orgunitgroupmembers facilities
	        inner join orgunitgroup oug on oug.orgunitgroupid = facilities.orgunitgroupid
                inner join _orgunitstructure ous on ous.organisationunitid = facilities.organisationunitid
	        where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`) and ous.uidlevel`+ouLevel+` = `+selectedOUUID;

                suffixQ = ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value
                from orgunitgroupmembers facilities
	        inner join orgunitgroup oug on oug.orgunitgroupid = facilities.orgunitgroupid
                inner join _orgunitstructure ous on ous.organisationunitid = facilities.organisationunitid
                inner join organisationunit ou on ou.organisationunitid = facilities.organisationunitid
	        where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`) and ous.uidlevel`+ouLevel+` = `+selectedOUUID;
          
            }
            
            var groupQ = `and facilities.organisationunitid in (
	        select ougm.organisationunitid
	        from orgunitgroupmembers ougm
	        inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
	        where oug.uid in ('`+ouGroupUIDs+`')
	    )`;

            if (ouGroupUIDKeySelect!='nogroup'){
                subQuery = subQuery + groupQ;
            }
            
            var query = `select ous.uidlevel`+selectedOUChildrenLevel+` as pivot,
                max(ou.name) as pivotname,
                `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,concat(de.uid,'-',coc.uid) as decoc ,
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
	    and dv.sourceid in ( ` + subQuery + ` )
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
	    group by ous.uidlevel`+selectedOUChildrenLevel+`,concat(de.uid,'-',coc.uid)
            union all `+ suffixQ;
            
            return query;
        }
    }
}

module.exports = sqlQueryBuilder;
