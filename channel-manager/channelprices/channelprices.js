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
            url: $apiRoot + "ocr-channel-manager/pricepolicy-mgr/create?token=" + window.$token,
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
    $('#goodsDg').datagrid({
        loadMsg: "正在加载，请稍等...",
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : false,
        remoteSort: false,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 2, //每页的数据条数，默认10
        pageList: [2, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : true,
        onSelect: onGoodsSelected  //行选择事件
    });
}

function onGoodsSelected (index,rowData) {
    $('#goodsRefDialog').window('close');

    var selectdData = rowData;

    $('#goods').val(selectdData.title);

    //设置商品到当前表体行对象上
    cloneAllotInvObj.goods.product_sku_code = selectdData.product_sku_code;
    cloneAllotInvObj.goods.title = selectdData.title;
    cloneAllotInvObj.goods.account = selectdData.obj.account;

    isBodyChanged = true;

    // onGoodChange();
    //-------刷新关联属性------
    // updateParentListRow('sku', selectdData.product_sku_code);
    updateParentListRow('goods', selectdData.title);
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
            channel: {
                // code:"",
                // name:"",
                // account:""
            },
            goods: {
            },
            invbatchcode:"",
            supply_price:{
                tax_type:"",
                tax_rate:0.00,
                price_including_tax:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                },
                price:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            },
            retail_price:{
                tax_type:"",
                tax_rate:0.00,
                price_including_tax:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                },
                price:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            },
            lot_price:{
                tax_type:"",
                tax_rate:"",
                price_including_tax:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                },
                price:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            },
            commission:{
                computation_rule:{
                    code:"",
                    name:"",
                    value:"",
                },
                commission_value:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            }
        };

        var rowData = {
            channel: {
                // code:"",
                // name:"",
                // account:""
            },
            goods: {
            },
            invbatchcode:"",
            supply_price:{
                tax_type:"",
                tax_rate:0.00,
                price_including_tax:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                },
                price:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            },
            retail_price:{
                tax_type:"",
                tax_rate:"",
                price_including_tax:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                },
                price:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            },
            lot_price:{
                tax_type:"",
                tax_rate:0.00,
                price_including_tax:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                },
                price:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            },
            commission:{
                computation_rule:{
                    code:"",
                    name:"",
                    value:"",
                },
                commission_value:{
                    currency:{
                        currency_type:"",
                        money:0.00
                    },
                    original_currency: {
                        currency_type: "",
                        money: 0.00
                    }
                }
            },
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
                url :  $apiRoot + "ocr-channel-manager/pricepolicy-mgr/remove?token=" + window.$token,
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

            channel:dataItem.channel.name,
            goods:dataItem.goods.title,
            invbatchcode:dataItem.invbatchcode,
            supply_price:dataItem.supply_price.price_including_tax.currency.money,
            retail_price:dataItem.retail_price.price_including_tax.currency.money,
            lot_price:dataItem.lot_price.price_including_tax.currency.money,
            commission:dataItem.commission.computation_rule.name,
            // channel_type:dataItem.channel_type.name,
            // level:dataItem.level.name,
            // region:dataItem.region.name,
            // ship_to:dataItem.ship_to.address.address_detail,
            // customer:dataItem.customer.name,

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
        url :  $apiRoot + "ocr-channel-manager/pricepolicy-mgr/find_pagination?token=" + window.$token,
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
                            url :  $apiRoot + "ocr-channel-manager/pricepolicy-mgr/find_pagination?token=" + window.$token,
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


    $('#channel').textbox('setValue',data.channel.name);
    $('#goods').val(data.goods.title);
    $('#invbatchcode').textbox('setValue',data.invbatchcode);
    //供货价
    $('#sp_tax_type').textbox('setValue',data.supply_price.tax_type);
    $('#sp_tax_rate').textbox('setValue',data.supply_price.tax_rate);
    $('#sp_tax_currency_type').textbox('setValue',data.supply_price.price_including_tax.currency.currency_type);
    $('#sp_tax_money').textbox('setValue',data.supply_price.price_including_tax.currency.money);
    $('#sp_tax_o_currency_type').textbox('setValue',data.supply_price.price_including_tax.original_currency.currency_type);
    $('#sp_tax_o_money').textbox('setValue',data.supply_price.price_including_tax.original_currency.money);
    $('#sp_currency_type').textbox('setValue',data.supply_price.price.currency.currency_type);
    $('#sp_money').textbox('setValue',data.supply_price.price.currency.money);
    $('#sp_o_currency_type').textbox('setValue',data.supply_price.price.original_currency.currency_type);
    $('#sp_o_money').textbox('setValue',data.supply_price.price.original_currency.money);

    //零售价
    $('#rp_tax_type').textbox('setValue',data.retail_price.tax_type);
    $('#rp_tax_rate').textbox('setValue',data.retail_price.tax_rate);
    $('#rp_tax_currency_type').textbox('setValue',data.retail_price.price_including_tax.currency.currency_type);
    $('#rp_tax_money').textbox('setValue',data.retail_price.price_including_tax.currency.money);
    $('#rp_tax_o_currency_type').textbox('setValue',data.retail_price.price_including_tax.original_currency.currency_type);
    $('#rp_tax_o_money').textbox('setValue',data.retail_price.price_including_tax.original_currency.money);
    $('#rp_currency_type').textbox('setValue',data.retail_price.price.currency.currency_type);
    $('#rp_money').textbox('setValue',data.retail_price.price.currency.money);
    $('#rp_o_currency_type').textbox('setValue',data.retail_price.price.original_currency.currency_type);
    $('#rp_o_money').textbox('setValue',data.retail_price.price.original_currency.money);

    //批发价
    $('#lp_tax_type').textbox('setValue',data.lot_price.tax_type);
    $('#lp_tax_rate').textbox('setValue',data.lot_price.tax_rate);
    $('#lp_tax_currency_type').textbox('setValue',data.lot_price.price_including_tax.currency.currency_type);
    $('#lp_tax_money').textbox('setValue',data.lot_price.price_including_tax.currency.money);
    $('#lp_tax_o_currency_type').textbox('setValue',data.lot_price.price_including_tax.original_currency.currency_type);
    $('#lp_tax_o_money').textbox('setValue',data.lot_price.price_including_tax.original_currency.money);
    $('#lp_currency_type').textbox('setValue',data.lot_price.price.currency.currency_type);
    $('#lp_money').textbox('setValue',data.lot_price.price.currency.money);
    $('#lp_o_currency_type').textbox('setValue',data.lot_price.price.original_currency.currency_type);
    $('#lp_o_money').textbox('setValue',data.lot_price.price.original_currency.money);

    //佣金
    $('#computation_rule_code').textbox('setValue',data.commission.computation_rule.code);
    $('#computation_rule_name').textbox('setValue',data.commission.computation_rule.name);
    $('#computation_rule_value').textbox('setValue',data.commission.computation_rule.value);
    $('#commission_currency_type').textbox('setValue',data.commission.commission_value.currency.currency_type);
    $('#commission_money').textbox('setValue',data.commission.commission_value.currency.money);
    $('#commission_o_currency_type').textbox('setValue',data.commission.commission_value.original_currency.currency_type);
    $('#commission_o_money').textbox('setValue',data.commission.commission_value.original_currency.money);

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
function onGoodChange(newValue,oldValue){
    if(initialized) return;

    isBodyChanged =true;
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

function oninvbatchcodeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.invbatchcode = newValue;
    isBodyChanged =true;
    updateParentListRow('invbatchcode', cloneAllotInvObj.invbatchcode);
}
function onSPTaxTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.tax_type = newValue;
    isBodyChanged =true;

}
function onSPTaxRateChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.tax_rate = newValue;
    isBodyChanged =true;
}

function onSPTaxCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price_including_tax.currency.currency_type = newValue;
    isBodyChanged =true;
}

function onSPTaxMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price_including_tax.currency.money = newValue;
    isBodyChanged =true;
    updateParentListRow('supply_price', cloneAllotInvObj.supply_price.price_including_tax.currency.money);
}

function onSPTaxOCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price_including_tax.original_currency.currency_type = newValue;
    isBodyChanged =true;
}

function onSPTaxOMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price_including_tax.original_currency.money = newValue;
    isBodyChanged =true;
}

function onSPCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price.currency.currency_type = newValue;
    isBodyChanged =true;
}

function onSPMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price.currency.money = newValue;
    isBodyChanged =true;
}

function onSPOCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price.original_currency.currency_type = newValue;
    isBodyChanged =true;
}

function onSPOMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.supply_price.price.original_currency.money = newValue;
    isBodyChanged =true;
}

function onRPTaxTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.tax_type = newValue;
    isBodyChanged =true;
}

function onRPTaxRateChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.tax_rate = newValue;
    isBodyChanged =true;
}

function onRPTaxCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price_including_tax.currency.currency_type = newValue;
    isBodyChanged =true;
}

function onRPTaxMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price_including_tax.currency.money = newValue;
    isBodyChanged =true;
    updateParentListRow('retail_price', cloneAllotInvObj.retail_price.price_including_tax.currency.money);
}


function onRPTaxOCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price_including_tax.original_currency.currency_type = newValue;
    isBodyChanged =true;
}

function onRPTaxOMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price_including_tax.original_currency.money = newValue;
    isBodyChanged =true;
}




function onRPCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price.currency.currency_type = newValue;
    isBodyChanged =true;
}

function onRPMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price.currency.money = newValue;
    isBodyChanged =true;
}


function onRPOCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price.original_currency.currency_type = newValue;
    isBodyChanged =true;
}

function onRPOMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.retail_price.price.original_currency.money = newValue;
    isBodyChanged =true;
}










function onLPTaxTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.tax_type = newValue;
    isBodyChanged =true;
}

function onLPTaxRateChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.tax_rate = newValue;
    isBodyChanged =true;
}

function onLPTaxCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price_including_tax.currency.currency_type = newValue;
    isBodyChanged =true;
}

function onLPTaxMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price_including_tax.currency.money = newValue;
    isBodyChanged =true;
    updateParentListRow('lot_price', cloneAllotInvObj.lot_price.price_including_tax.currency.money);
}


function onLPTaxOCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price_including_tax.original_currency.currency_type = newValue;
    isBodyChanged =true;
}

function onLPTaxOMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price_including_tax.original_currency.money = newValue;
    isBodyChanged =true;
}




function onLPCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price.currency.currency_type = newValue;
    isBodyChanged =true;
}

function onLPMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price.currency.money = newValue;
    isBodyChanged =true;
}


function onLPOCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price.original_currency.currency_type = newValue;
    isBodyChanged =true;
}

function onLPOMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.lot_price.price.original_currency.money = newValue;
    isBodyChanged =true;
}








function onComputationRuleCodeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.commission.computation_rule.code = newValue;
    isBodyChanged =true;
}
function onComputationRuleNameChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.commission.computation_rule.name = newValue;
    isBodyChanged =true;
    updateParentListRow('commission', cloneAllotInvObj.commission.computation_rule.name);
}
function onComputationRuleValueChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.commission.computation_rule.value = newValue;
    isBodyChanged =true;
}
function onCommissionTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.commission.commission_value.currency.currency_type = newValue;
    isBodyChanged =true;
}
function onCommissionMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.commission.commission_value.currency.money = newValue;
    isBodyChanged =true;
}
function onCommissionOCurrencyTypeChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.commission.commission_value.original_currency.currency_type = newValue;
    isBodyChanged =true;
}
function onCommissionOMoneyChanged(newValue,oldValue) {
    if(initialized) return;
    cloneAllotInvObj.commission.commission_value.original_currency.money = newValue;
    isBodyChanged =true;
}



function onChannelSel(record){
    if(initialized) return;
    cloneAllotInvObj.channel.code = record.attributes.code;
    cloneAllotInvObj.channel.name = record.attributes.name;
    cloneAllotInvObj.channel.account = record.attributes.account;

    isBodyChanged = true;

    //-------刷新关联属性------
    updateParentListRow('channel', record.attributes.name);

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
        url: $apiRoot + "ocr-channel-manager/channel-mgr/findall?token=" + window.$token,
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
        url:$apiRoot + 'ocr-channel-manager/channel-mgr/findtree?context=3|3|lj|aaa',
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

function showGoodsRefDialog() {
    $('#goodsRefDialog').window('open');
}

//品类树选择，查询商品列表
function catelogTreeSel(node) {

    var catelog = node.attributes.inner_code;

    //定义查询条件
    var condition = buildGoodsQueryCond(0, 1, catelog);

    $.ajax({
        method: 'POST',
        url: $goodsURL + "ocr-goods-center/goods-mgr/findall?context=3|3|lj|aaa",
        data: condition,
        async: true,
        dataType: 'json',
        beforeSend: function (x) {
            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        },
        success: function (data) {

            bindGoodsDg(data);

            $('#goodsDg').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onBeforeRefresh: function () {
                    var thisDg = $('#goodsDg');
                    thisDg.pagination('loading...');
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage: function (pPageIndex, pPageSize) {
                    //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                    var gridOpts = $('#goodsDg').datagrid('options');
                    gridOpts.pageNumber = pPageIndex;
                    gridOpts.pageSize = pPageSize;

                    condition = buildGoodsQueryCond(0, pPageIndex, catelog);

                    //定义查询条件
                    $.ajax({
                        method: 'POST',
                        url: $goodsURL + "ocr-goods-center/goods-mgr/findall?context=3|3|lj|aaa",
                        data: condition,
                        async: true,
                        dataType: 'json',
                        beforeSend: function (x) {
                            x.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                        },
                        success: function (data) {

                            bindGoodsDg(data);
                        },
                        error: function (x, e) {
                            alert(e.toString(), 0, "友好提醒");
                        }
                    });
                }
            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });
}

//绑定商品datagrid
function bindGoodsDg(data) {
    var dgLst = $('#goodsDg');
    var viewModel = new Array();
    for (var i in data.datas) {
        var dataItem = data.datas[i];
        var row_data = {
            product_sku_code: dataItem.product_sku_code,
            title: dataItem.title,
            batch_code:dataItem.invbatchcode,
            sales_catelog: dataItem.sales_catelogs,
            bar_code: dataItem.product_sku.bar_code,
            specifications: dataItem.product_sku.product_specifications,
            base_unit: dataItem.product_sku.product_spu.base_unit,
            //quantity: dataItem.quantity,
            brand: dataItem.product_sku.product_spu.brand.name,
            manufacturer: dataItem.product_sku.product_spu.brand.manufacturer.name,
            obj: dataItem
        };
        viewModel.push(row_data);
    }

    dgLst.datagrid('loadData',{
        total: data.total,
        rows: viewModel
    });

}




