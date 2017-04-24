window.$token = localStorage.getItem("access_token");

var shipmentDg;
var currentReplenishment;

function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '已签收发货单',
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
        //onBeforeSelect: onBeforeSelect,
        onSelect: showShipmentDetail,  //行选择事件
        onLoadSuccess: function (data) {
            if (data.total > 0) {
                var dg = $(this);
                dg.datagrid('selectRow', 0);
                //$('#gridleft').datagrid('selectRow', 0);
            }
        },
        groupField:'group_id',
        view: groupview,
        groupFormatter:function(value, rows){
            return value + ' - (' + rows.length + ')';
        }
    });
}


function onShipmentBeforeSelect(index,row){
    if(isChanged){
        $.messager.alert('提示','签收未确认，请先提交或取消!');
        return false;
    }
    return true;
}

function loadShipments(ddv, replenishment, index){

    var query = {
        "bo.replenishments_id": replenishment.bo_id
    }

    $.ajax({
        method : 'POST',
        url : $apiRoot + "ocr-pointofsale/shipment-mgr/find_created?token=" + window.$token,
        async : true,
        data: JSON.stringify(query),
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(datas) {
            bindShipmentDg(ddv, datas);
            $('#dgList').datagrid('fixDetailRowHeight',index);
        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

}

//绑定列表行数据
function bindShipmentDg(ddv, datas){
    var viewModel = new Array();
    for ( var i in datas) {
        var dataItemBo = datas[i];
        var dataItem = dataItemBo.bo;
        var rowData = {
            bo_id: dataItem.bo_id,
            restocking_warehouse : dataItem.restocking_warehouse.name,
            target_warehouse : dataItem.target_warehouse.name,
            ship_date : dataItem.ship_date,
            is_completed: dataItem.is_completed,
            obj: dataItemBo
        };
        viewModel.push(rowData);
    }
    ddv.datagrid('loadData',viewModel);

}

var shipmentObj;
var originShipmentObj;
var shipmentIndex;
function showShipmentDetail(rowIndex, rowData) {
    shipmentIndex = rowIndex;

    originShipmentObj = rowData.obj;
    shipmentObj = cloneJsonObject(rowData.obj);

    bindShipmentDetail(shipmentObj);

}

function bindShipmentDetail(shipmentObj) {

    var detailDg = $('#detailDg');

    var rows = detailDg.datagrid('getRows');
    if (rows) {
        for (var i = rows.length - 1; i >= 0; i--) {
            var index = detailDg.datagrid('getRowIndex', rows[i]);
            detailDg.datagrid('deleteRow', index);
        }
    }

    for(var i in shipmentObj.bo.details) {
        var shipmentDetail = shipmentObj.bo.details[i];

        var shelfLife = "";
        if(shipmentDetail.shelf_life != undefined && shipmentDetail.shelf_life != null) {
            shelfLife = shipmentDetail.shelf_life;
        }
        var invbatchcode = "";
        if(shipmentDetail.invbatchcode != undefined && shipmentDetail.invbatchcode != null){
            invbatchcode = shipmentDetail.invbatchcode;
        }

        //shipmentDetail.accept_info.accept_quantity,
        //shipmentDetail.accept_info.reject_quantity,
        var rowData = {
            product_sku_code : shipmentDetail.goods.product_sku_code,
            title : shipmentDetail.goods.title,
            sales_catelog: shipmentDetail.goods.sales_catelogs,
            bar_code : shipmentDetail.goods.product_sku.bar_code,
            invbatchcode: invbatchcode,
            shelf_life: shelfLife,
            specifications: shipmentDetail.goods.product_sku.product_specifications,
            base_unit: shipmentDetail.goods.product_sku.product_spu.base_unit,
            quantity: shipmentDetail.quantity,
            supply_price: shipmentDetail.supply_price.price.currency.money,
            retail_price: shipmentDetail.retail_price.price.currency.money,
            accept_quantity: 0,
            reject_quantity: 0,
            accept_actor: "",
            obj: shipmentDetail
        };

        detailDg.datagrid('appendRow',rowData);

    }

}


function acceptDetailFormatter(rowIndex, rowData){
    return '<table style="border:0">' +
        '<tr>' +
        '<td style="width: 60px;border:0">实收数量</td>' +
        '<td style="width: 90px;border:0">' +  rowData.obj.accept_info.accept_quantity +  '</td>' +
        '<td style="width: 60px;border:0">退返数量</td>' +
        '<td style="width: 90px;border:0">' +   rowData.obj.accept_info.reject_quantity +  '</td>' +
        '<td style="width: 60px;border:0">签收人</td>' +
        '<td style="width: 90px;border:0">' +  rowData.obj.accept_info.accept_actor +  '</td>' +
        '<td style="width: 60px;border:0">签收日期</td>' +
        '<td style="width: 90px;border:0">' +  rowData.obj.accept_info.accept_date +  '</td>' +
        '</tr>' +
        '</table>';
}

var isChanged = false;

//签收数量
function acceptQuantityChanged(theInput, rowIndex){
    var value = theInput.value;
    if(value == ""){
        return;
    }

    var detailDg = $('#detailDg');
    var rows = detailDg.datagrid('getRows');
    var row = rows[rowIndex];

    if(row.obj.quantity < parseFloat(value)){
        alert_autoClose("提示","实收数量不能超过发出数量.");
        $(theInput).val(0).focus().select();
        return;
    }

    if(row.obj.accept_info == undefined || row.obj.accept_info == null){
        row.obj.accept_info = {
            accept_quantity: parseFloat(value)
        }
    }else{
        row.obj.accept_info.accept_quantity = parseFloat(value);
    }

    isChanged = true;
}

//退返数量
function rejectQuantityChanged(theInput, rowIndex){
    var value = theInput.value;
    if(value == ""){
        return;
    }

    var detailDg = $('#detailDg');
    var rows = detailDg.datagrid('getRows');
    var row = rows[rowIndex];

    if(row.obj.quantity < parseFloat(value)){
        alert_autoClose("提示","退返数量不能超过发出数量.");
        $(theInput).val(0).focus().select();
        return;
    }

    if(row.obj.accept_info == undefined || row.obj.accept_info == null){
        row.obj.accept_info = {
            reject_quantity: parseFloat(value)
        }
    }else{
        row.obj.accept_info.reject_quantity = parseFloat(value);
    }
    isChanged = true;
}

//签收人
function acceptActorChanged(theInput, rowIndex){
    var value = theInput.value;
    if(value == ""){
        return;
    }

    var detailDg = $('#detailDg');
    var rows = detailDg.datagrid('getRows');
    var row = rows[rowIndex];

    if(row.obj.accept_info == undefined || row.obj.accept_info == null){
        row.obj.accept_info = {
            accept_actor: value
        }
    }else{
        row.obj.accept_info.accept_actor = value;
    }
    isChanged = true;
}

function detailListSetting(){
    $('#detailDg').datagrid({
        title : '发货单详情',
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
        showFooter: true,
        //onLoadSuccess: addSubTotalRow,
        /*        onClickCell: onClickCell,
         onEndEdit: onEndEdit,*/
        //onSelect: onDetailRowSelected,  //行选择事件
        autoUpdateDetail: false,
        view:detailview,
        detailFormatter: acceptDetailFormatter
    });

}


//商品分类字段格式化
function formatCatelogsCol(catelogArray){
    //计算规格字符串
    var ret = '';
    for(var idx in catelogArray){
        var item = catelogArray[idx];
        if(idx == 0)
            ret = item.name;
        else
            ret += ',' + item.name;
    }
    return "<span title='" + ret + "'>" + ret + "</span>";
}


//回退整个单据
function reject(){

    shipmentObj = cloneJsonObject(originShipmentObj);
    bindShipmentDetail(shipmentObj);

    isChanged = false;
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
        var dataItemBo = data.datas[i];
        var dataItem = dataItemBo.bo;
        var row_data = {
            bo_id : dataItem.bo_id,
            from_account : dataItemBo.from_account,
            restocking_warehouse : dataItem.restocking_warehouse.name,
            target_warehouse : dataItem.target_warehouse.name,
            ship_date : dataItem.ship_date,
            accept_date : dataItem.accept_date,
            group_id: dataItem.replenishments_id + " - " + dataItemBo.from_account,
            obj: dataItemBo
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
        url : $apiRoot + "ocr-pointofsale/shipment-mgr/find_completed?token=" + window.$token,
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
                    alert('before refresh');
                    thisDg.pagination('loaded');
                },
                onSelectPage : function(pPageIndex, pPageSize) {
                    /*                   if(isNewRep){
                     if(repCurrentPageIndex != pPageIndex) {
                     $('#dgList').datagrid('getPager').pagination('select', repCurrentPageIndex);
                     $.messager.alert('数据变化提示','当前数据已经变化，请先保存或取消!');
                     }
                     return;
                     }else {*/
                    //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                    repCurrentPageIndex = pPageIndex;
                    var gridOpts = $('#dgList').datagrid('options');
                    gridOpts.pageNumber = pPageIndex;
                    gridOpts.pageSize = pPageSize;

                    condStr = buildRepsQueryCond(0, pPageIndex);

                    //定义查询条件
                    $.ajax({
                        method: 'POST',
                        url : $apiRoot + "ocr-pointofsale/shipment-mgr/find_completed?token=" + window.$token,
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

            });

        },
        error: function (x, e) {
            alert(e.toString(), 0, "友好提醒");
        }
    });

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



//构建“合计”行
function buildSubTotalRow(data) {
    var subTotal = {
        product_sku_code: '<span class="subtotal">合计</span>',
        quantity: '<span class="subtotal">' + compute(data, "quantity") + '</span>',
        title : '',
        sales_catelog: '',
        bar_code : '',
        specifications: '',
        base_unit: '',
        supply_price: '',
        retail_price: '',
        commission: '',
        brand: '',
        manufacturer: ''
    };
    return subTotal;
}

function compute(date, colName) {
    var total = 0;
    for (var i = 0; i < date.length; i++) {
        total += parseFloat(date[i][colName]);
    }
    return total;
}

//从新计算合计行
function refreshSubTotalRows(){
    //计算合计列
    var footerRows = $('#detailDg').datagrid('getFooterRows');
    var rows = $("#detailDg").datagrid("getRows"); //获取当前页的所有行。
    footerRows[0]['quantity'] = '<span class="subtotal">' + computeForRows(rows, "quantity") + '</span>';
    $('#detailDg').datagrid('reloadFooter');
}

function computeForRows(rows, colName) {
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        total += parseFloat(row[colName]);
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