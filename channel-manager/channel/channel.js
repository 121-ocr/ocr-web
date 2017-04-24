window.$token = localStorage.getItem("access_token");

//﻿var allotInvObjIndex;
var allotInvObj;

//clone的数据
var cloneAllotInvObj;
var currentDetailRowObj;

//主子表状态
var isHeadChanged = false;
var isBodyChanged = false;
var isNewRep = false;

//子表行状态
var editIndex = undefined;

//保存
function save(){
    if(isHeadChanged || isBodyChanged || isNewRep){

        $.ajax({
            method: 'POST',
            url: $apiRoot + "ocr-channel-manager/channel-org-mgr/create?token=" + window.$token,
            data: JSON.stringify(cloneAllotInvObj),
            async: true,
            dataType: 'json',
            beforeSend: function (x) {
                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            },
            success: function (data) {

                //-------刷新关联属性------
                cloneAllotInvObj = data;
                allotInvObj = cloneAllotInvObj;

                var dgList = $('#dgList');
                var row = dgList.datagrid('getSelected');
                var index = dgList.datagrid('getRowIndex', row);
                row['bo_id'] = data.bo_id;
                row['sale_date'] = data.sale_date;
                row['salesman'] = data.salesman;

                row.obj = allotInvObj;
                dgList.datagrid('refreshRow', index);

                resetState();
                alert_autoClose('提示','保存成功!');

            },
            error: function (x, e) {
                alert(e.toString(), 0, "友好提醒");
            }
        });

    }
}

function resetState(){
    editIndex = undefined;
    isNewRep = false;
    isHeadChanged = false;
    isBodyChanged = false;
}

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '仓库列表',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : false,
        onBeforeSelect: onBeforeSelect,
        onSelect: onRowSelected,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        }
    });
}


function detailListSetting(){
	$('#win').window({
    width:600,
    height:400,
    modal:true
});
}


function onBeforeSelect(index,row){
    if(isBodyChanged || isHeadChanged){
        $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
        return false;
    }
    return true;
}






//构建分页条件
function buildGoodsQueryCond(total, pageNum, cateLog) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 10,
            total: total,
            total_page: -1
        },
        query: {'sales_catelogs.inner_code':cateLog}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}




$.extend($.fn.datagrid.methods, {
    editCell: function(jq,param){
        return jq.each(function(){
            var opts = $(this).datagrid('options');
            var fields = $(this).datagrid('getColumnFields',true).concat($(this).datagrid('getColumnFields'));
            for(var i=0; i<fields.length; i++){
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor1 = col.editor;
                if (fields[i] != param.field){
                    col.editor = null;
                }
            }
            $(this).datagrid('beginEdit', param.index);
            for(var i=0; i<fields.length; i++){
                var col = $(this).datagrid('getColumnOption', fields[i]);
                col.editor = col.editor1;
            }
        });
    }
});


function endEditing(){
    if (editIndex == undefined){return true}
    if ($('#detailDg').datagrid('validateRow', editIndex)){
        $('#detailDg').datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    } else {
        return false;
    }
}
function onClickCell(index, field){
    if (endEditing()){

        isBodyChanged = true;

        $('#detailDg').datagrid('selectRow', index)
            .datagrid('editCell', {index:index,field:field});
        editIndex = index;
    }

}

function onAfterEdit(index, row){
    var a = 0;
}

function onEndEdit(index, row) {

    refreshSubTotalRows(); //刷新小计列
}

function appendgoods(){
	
	$('#win').window('open'); // open a window
}


	
function append(){

    if (endEditing()){

        var theDate = new Date();
        var theDateStr = theDate.format("yyyy-MM-dd");

        var newDetailObj = {
            detail_code: "",
            goods: {},
            // quantity: 0,
            nynum: 0,
            nsnum: 0,
            unqualifiednum: 0,
            locations: "",
            shelflife: 0,
            shelflifeunit:"",
            expdate:theDateStr,
            su_batch_code:"",
            batch_code: "",
            purchase_price: {},
            supply_price: {},
            supply_amount: {},
            discount: "",
            discount_amount: {},
            note: ""
        };
        cloneAllotInvObj.detail.push(newDetailObj);

        var rowData = {
            product_sku_code : "",
            title : "",
            sales_catelog: {},
            bar_code : "",
            specifications: {},
            base_unit: "",
            batch_code: "",
            // quantity: 0,
            nynum: 0,
            nsnum: 0,
            unqualifiednum: 0,
            locations: "",
            shelflife: 0,
            shelflifeunit:"",
            expdate:theDateStr,
            su_batch_code:"",
            purchase_price: 0.00,
            supply_price: 0.00,
            supply_amount: 0.00,
            discount: 0.00,
            discount_amount: 0.00,
            brand: "",
            manufacturer: "",
            note: "",
            obj: newDetailObj
        };

        $('#detailDg').datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        var data = $("#detailDg").datagrid('getData');
        data.originalRows.push(rowData);

        editIndex = $('#detailDg').datagrid('getRows').length-1;
        $('#detailDg').datagrid('selectRow', editIndex)
            .datagrid('beginEdit', editIndex);

        isBodyChanged = true;

    }
}

function newRep(){

    if (endEditing()){
        if(isBodyChanged || isHeadChanged){
            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
            return;
        }

        var dgList =  $('#dgList');
        var newObjIndex = dgList.datagrid('getRows').length;
        var newObj = {
            code: "",
            name: "",
            channel_type:{},
            level:{},
            region:{},
            ship_to:{
                address:{
                    region:{
                        code:"",
                        full_name:""
                    },
                    address_detail:""
                },
                contact:{
                    name:"",
                    phone:"",
                    email:"",
                }
            },
            customer: {
                code: "",
                name: ""
            },
            parentid:{}
        };

        var rowData = {
            code: "",
            name: "",
            channel_type:{},
            level:{},
            region:{},
            ship_to:{
                address:{
                    region:{
                        code:"",
                        full_name:""
                    },
                    address_detail:""
                },
                contact:{
                    name:"",
                    phone:"",
                    email:"",
                }
            },
            customer: {
                code: "",
                name: ""
            },
            parentid:{},
            obj: newObj
        };

        dgList.datagrid('appendRow',rowData);

        //必须加入到originalRows中，否则翻页会有问题
        //var data = dgList.datagrid('getData');
        //data.originalRows.push(rowData);

        dgList.datagrid('selectRow', newObjIndex);

        isNewRep = true;

        isBodyChanged = true;

    }
}

function removeDetail(){
    if (currentRowIndex == undefined){return}
    $('#detailDg').datagrid('cancelEdit', currentRowIndex)
        .datagrid('deleteRow', currentRowIndex);
    currentRowIndex = undefined;

    isBodyChanged = true;
}
/*function accept(){
    if (endEditing()){
        $('#detailDg').datagrid('acceptChanges');
    }
}*/

//回退表体
function rejectDetail(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;
    //克隆
    cloneAllotInvObj.detail = cloneJsonObject(allotInvObj.detail);
    bindSelectedDataToSubDetail(cloneAllotInvObj.detail);

    isBodyChanged = false;
}
/*function getChanges(){
    var rows = $('#detailDg').datagrid('getChanges');
    alert(rows.length+' rows are changed!');
}*/


//回退整个单据
function reject(){
    $('#detailDg').datagrid('rejectChanges');
    editIndex = undefined;

    if(isNewRep){
        removeRep();
    }else {
        //重新克隆
        cloneAllotInvObj = cloneJsonObject(allotInvObj);
        bindSelectedDataToCard(cloneAllotInvObj)
        bindSelectedDataToSubDetail(cloneAllotInvObj.detail);

        isHeadChanged = false;
        isBodyChanged = false;
        isNewRep = false;
    }
}

function removeRep(){

    if (allotInvObjIndex == undefined || allotInvObjIndex == null){return}

    obj = new Object();
    obj._id = cloneAllotInvObj._id;

    $.messager.confirm('删除警告', '是否确认删除?', function(r){
        if (r){

            $.ajax({
                method: 'POST',
                url :  $apiRoot + "ocr-channel-manager/channel-org-mgr/remove?token=" + window.$token,
                data: JSON.stringify(obj),
                async: true,
                dataType: 'json',
                beforeSend: function (x) {
                    x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                },
                success: function (data) {
                    //$.messager.alert('提示','删除成功!');
                    resetState();

                    var dgList = $('#dgList');
                    dgList.datagrid('deleteRow', allotInvObjIndex);
                    currentRowIndex = undefined;

                    //$.messager.alert('提示','删除成功!');
                    alert_autoClose('提示','删除成功!');

                    //当前指针指向正确的位置
                    var rowCount = dgList.datagrid('getRows').length + 1;
                    if(rowCount > 0){
                        if(allotInvObjIndex == 0){
                            dgList.datagrid('selectRow',cloneAllotInvObj);
                        }else{
                            if(allotInvObjIndex == rowCount -1){
                                dgList.datagrid('selectRow',cloneAllotInvObj-1);
                            }else{
                                dgList.datagrid('selectRow',cloneAllotInvObj+1);
                            }
                        }
                    }
                },
                error: function (x, e) {
                    alert(e.toString(), 0, "友好提醒");
                }
            });
        }
    });
}

//单元格加提示信息
function formatCellTooltip(value){
    return "<span title='" + value + "'>" + value + "</span>";
}



//绑定列表行数据
function bindDgListData(data){
    var dgLst = $('#dgList');
    var viewModel = new Array();

	
     for ( var i in data.datas) {
        var dataItem = data.datas[i];

        var row_data = {

            name:dataItem.name,
            code:dataItem.code,
            channel_type:dataItem.channel_type.name,
            level:dataItem.level.name,
            region:dataItem.region.name,
            ship_to:dataItem.ship_to.address.address_detail,
            customer:dataItem.customer.name,

            obj: dataItem
        };
        viewModel.push(row_data);
    }
    dgLst.datagrid('loadData',{
                total: data.total,
                rows: viewModel
            });
}



//构建分页条件
function buildRepsQueryCond(total, pageNum) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 5,
            total: total,
            total_page: -1
        }
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}
var repCurrentPageIndex = 1;
//加载数据列表
function loadDgList(){

    var condStr = buildRepsQueryCond(0,1);

    //定义查询条件
    $.ajax({
        method : 'POST',
        url :  $apiRoot + "ocr-channel-manager/channel-org-mgr/findall?token=" + window.$token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {

            bindDgListData(data);

            $('#dgList').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh:function(){
                    var thisDg = $('#dgList');
                    thisDg.pagination('loading...');

                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                    if(isNewRep){
                        if(repCurrentPageIndex != pPageIndex) {
                            $('#dgList').datagrid('getPager').pagination('select', repCurrentPageIndex);
                            $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
                        }
                        return;
                    }else {
                        //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                        repCurrentPageIndex = pPageIndex;
                        var gridOpts = $('#dgList').datagrid('options');
                        gridOpts.pageNumber = pPageIndex;
                        gridOpts.pageSize = pPageSize;

                        condStr = buildRepsQueryCond(0, pPageIndex);

                        //定义查询条件
                        $.ajax({
                            method: 'POST',
                            url :  $apiRoot + "ocr-channel-manager/channel-org-mgr/findall?token=" + window.$token,
                            data: condStr,
                            async: true,
                            dataType: 'json',
                            beforeSend: function (x) {
                                x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                            },
                            success: function (data) {
                                bindDgListData(data);
                            },
                            error: function (x, e) {
                                alert(e.toString(), 0, "友好提醒");
                            }
                        });
                    }
                }
            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//行选择事件

var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    allotInvObjIndex = rowIndex;
    allotInvObj = rowData.obj;

    //克隆数据
    cloneAllotInvObj = cloneJsonObject(allotInvObj);

    bindSelectedDataToCard(cloneAllotInvObj);
   // bindSelectedDataToSubDetail(cloneAllotInvObj.detail);

    var viewModel = new Array();
    $('#locationsDg').datagrid('loadData',{
        total: 0,
        rows: viewModel
    });

    initialized = false;
}

var currentRowIndex = 0;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
    currentDetailRowObj = detailRowData.obj;
}

//绑定当前选择行的数据
function bindSelectedDataToCard(data){


    $('#code').textbox('setValue',data.code);
    $('#name').textbox('setValue',data.name);
    $('#channel_type').textbox('setValue',data.channel_type.name);
    $('#level').textbox('setValue',data.level.name);
    $('#region').textbox('setValue',data.region.name);
    $('#reg_code').textbox('setValue',data.ship_to.address.region.code);
    $('#full_name').textbox('setValue',data.ship_to.address.region.full_name);
    $('#address_detail').textbox('setValue',data.ship_to.address.address_detail);
    $('#linkman').textbox('setValue',data.ship_to.contact.name);
    $('#phone').textbox('setValue',data.ship_to.contact.phone);
    $('#email').textbox('setValue',data.ship_to.contact.email);
    $('#customercode').textbox('setValue',data.customer.code);
    $('#customername').textbox('setValue',data.customer.name);
    $('#parentid').textbox('setValue',data.parentid.name);
    // $('#bankaccount').textbox('setValue',data.accountinfo.bankaccount);
    // $('#credittype').textbox('setValue',data.creditinfo.credittype.name);
    // $('#grade').textbox('setValue',data.creditinfo.grade.name);

}



//卡片内容变更后刷新父列表
function updateParentListRow(field, value){
    //-------刷新关联属性------
    var dgList = $('#dgList');
    var row = dgList.datagrid('getSelected');
    var index = dgList.datagrid('getRowIndex', row);

    row[field] = value;
    dgList.datagrid('refreshRow', index);
}


function onCodeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.code = newValue;
    isBodyChanged =true;
    updateParentListRow('code', cloneAllotInvObj.code);
}
function onNameChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.name = newValue;
    isBodyChanged =true;
    updateParentListRow('name', cloneAllotInvObj.name);
}

function onChanneltypeSelected(record) {
    if(initialized) return;
    cloneAllotInvObj.channel_type = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('channel_type', record.name);
}
function onLevelSelected(record) {
    if(initialized) return;
    cloneAllotInvObj.level = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('level', record.name);
}

function onRegionSelected(record) {
    if(initialized) return;
    cloneAllotInvObj.region = {
        code: record.code,
        name: record.name
    };
    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('region', record.name);
}

function onRegCodeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.ship_to.address.region.code = newValue;
    isBodyChanged =true;

}

function onFullNameChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.ship_to.address.region.full_name = newValue;
    isBodyChanged =true;

}

function onAddressDetailChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.ship_to.address.address_detail = newValue;
    isBodyChanged =true;
    updateParentListRow('ship_to', cloneAllotInvObj.ship_to.address.address_detail);
}



function onAddressChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.contactinfo.address = newValue;
    isBodyChanged =true;
    updateParentListRow('address', cloneAllotInvObj.contactinfo.address);
}

function onEmailChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.ship_to.contact.email = newValue;
    isBodyChanged =true;
    // updateParentListRow('email', cloneAllotInvObj.contactinfo.email);
}

function onlinkmanChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.ship_to.contact.name = newValue;
    isBodyChanged =true;
    // updateParentListRow('linkman', cloneAllotInvObj.contactinfo.linkman);
}

function onphoneChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.ship_to.contact.phone = newValue;
    isBodyChanged =true;
    // updateParentListRow('phone', cloneAllotInvObj.contactinfo.phone);
}

function onCustomerCodeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.customer.code = newValue;
    isBodyChanged =true;
    // updateParentListRow('phone', cloneAllotInvObj.contactinfo.phone);
}
function onCustomerNameChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.customer.name = newValue;
    isBodyChanged =true;
    updateParentListRow('customer', cloneAllotInvObj.customer.name);
}






function onChannelSelected(record){
    if(initialized) return;
    cloneAllotInvObj.parentid= {
        _id: record._id,
        name: record.name
    };

    isBodyChanged = true;
    //-------刷新关联属性------
    updateParentListRow('parentid', record.name);
}






//规格字段格式化
function formatSpecificationCol(specArray){
    //计算规格字符串
    var specifications = '';
    for(var specIdx in specArray){
        var specItem = specArray[specIdx];
        if(specIdx == 0)
            specifications = specItem.specification_name + ':' + specItem.specification_value;
        else
            specifications += ',' + specItem.specification_name + ':' + specItem.specification_value;
    }
    return "<span title='" + specifications + "'>" + specifications + "</span>";
}

//detail数据前台分页
function pagerFilter(data){
    if (typeof data.length == 'number' && typeof data.splice == 'function'){    // 判断数据是否是数组
        data = {
            total: data.length,
            rows: data,
            footer: [
                buildSubTotalRow(data)
            ]
        }
    }
    var dg = $(this);
    var opts = dg.datagrid('options');
    var pager = dg.datagrid('getPager');
    pager.pagination({
        onSelectPage:function(pageNum, pageSize){
            opts.pageNumber = pageNum;
            opts.pageSize = pageSize;
            pager.pagination('refresh',{
                pageNumber:pageNum,
                pageSize:pageSize
            });

            //bindDetailData(data);
            dg.datagrid('loadData',data);
        }
    });
    if (!data.originalRows){
        data.originalRows = (data.rows);
    }
    var start = (opts.pageNumber-1)*parseInt(opts.pageSize);
    var end = start + parseInt(opts.pageSize);
    data.rows = (data.originalRows.slice(start, end));
    data.footer =  [
        buildSubTotalRow(data.rows)
    ];
    return data;
}


function compute(date, colName) {
    var total = 0;
    for (var i = 0; i < date.length; i++) {
        total += parseFloat(date[i][colName]);
    }
    return total;
}



//排序
function compareDatetime(a,b){
    var oDate1 = new Date(a);
    var oDate2 = new Date(b);
    if(oDate1.getTime() > oDate2.getTime()){
        return 1;
        //alert('第一个大');
    } else if (oDate1.getTime() < oDate2.getTime()){
        return -1;
        //alert('第二个大');
    } else {
        return 0;
        //alert('相等');
    }
}

function compareDigit(a,b){
    if (a == b)
        return 0;
    return (a>b ? 1 : -1);
}

//显示商品选择对话框
function showLocationsRefDialog() {
    var dgLst =  $('#locationsRefDialog');
    dgLst.window('open');

}
$.extend($.fn.datagrid.defaults.editors, {
    locationsRef : {
        init: function(container, options)
        {
            var editorContainer = $('<div/>');
            //参照的编辑框
            var input = $("<input class='easyui-textbox' id='locationsEditor' style='width:100px'>");
            //参照按钮
            var button = $("<button style='width: 23px; height: 23px' onclick='showLocationsRefDialog();'>...</button>");

            editorContainer.append(input).append(button);
            editorContainer.appendTo(container);
            return input;
        },
        getValue: function(target)
        {
            return $(target).val();
            //return $(target).children("input").val();
        },
        setValue: function(target, value)
        {

            $(target).val(value);
            //$(target).children("input").val(value);
        },
        resize: function(target, width)
        {
            var span = $(target);
            if ($.boxModel == true){
                span.width(width - (span.outerWidth() - span.width()) - 30);
            } else {
                span.width(width - 30);
            }
        }

    }
});


					


//构建分页条件
function buildLocationsQueryCond(total, pageNum,sku,type) {
    var warehousecode = cloneAllotInvObj.warehouse.code;
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 2,
            total: total,
            total_page: -1
        },
        query: {'sku':sku,'type':type, 'warehousecode': warehousecode}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

function locationTreeSel() {
    
}





//构建分页条件
function buildGoodRefQueryCond(sku,nsnum,warehousecode) {
    var condition = {

        query: {'sku':sku,'type':"fixed",'nsnum':nsnum,"warehousecode":warehousecode}
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}

function refExpdateDateSel(date){
	var dd=date.format("yyyy-MM-dd");
	 $('#ref_expdatestr').val(dd);	
	
	
   
}

var channelLoader = function (param, success, error) {
    var condStr = buildRepsQueryCond(0,1);
    $.ajax({
        method: 'POST',
        url: $apiRoot + "ocr-channel-manager/channel-org-mgr/findall?token=" + window.$token,
        async: true,
        data: condStr,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
            success(data.datas);
        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            error.apply(this, args);
        }
    });
}
function showTree() {


    $.ajax({
        method: 'get',
        url:$apiRoot + 'ocr-channel-manager/channel-org-mgr/findtree?context=' + $token,
        async: true,

        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {
            $('#locationTree').tree({data:data});
            // success(data.result);

        },
        error: function (x, e) {
            var args = [];
            args.push(e);
            // error.apply(this, args);
        }
    });

    $('#channelTreeDlg').window('open');
}




