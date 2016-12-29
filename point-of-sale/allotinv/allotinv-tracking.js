var replenishmentObjIndex;
var replenishmentObj;

var cloneReplenishmentObj;

//新增发货单
var newShipmentDetails = [];

//子表行状态
var editIndex = undefined;


function dgListSetting(){
    $('#dgList').datagrid({
        loadMsg: "正在加载，请稍等...",
        title : '补货单跟踪列表',
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
        },
        toolbar:'#tb'
    });
}

var subDetailDdv;
function detailListSetting(){
    $('#detailDg').datagrid({
        title : '补货单详情',
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
        onSelect: onDetailRowSelected,  //行选择事件
        autoUpdateDetail: false,
        view: detailview,
        detailFormatter:function(index,row){
            return '<div style="padding:2px"><table class="ddv"></table></div>';
        },
        onExpandRow: function(index,row){
            currentRowIndex = index;
            var ddv = $(this).datagrid('getRowDetail',index).find('table.ddv');
            subDetailDdv = ddv;
            ddv.datagrid({
                fitColumns:true,
                singleSelect:true,
                rownumbers:true,
                loadMsg:'',
                height:'auto',
                onSelect: onShipmentSelected,  //行选择事件
                //onEndEdit: onEndEdit,
                columns:[[
                    {field:'ship_quantity',title:'发货数量',width:'60px',editor:'shipQuantityEditor'},
                    {field:'ship_date',title:'发货日期',width:'100px',align:'left'},
                    {field:'ship_actor',title:'发货人',width:'60xp',align:'left'},
                    {field:'ship_code',title:'发货单号',width:'100px',align:'left'},
                    {field:'logistics_code',title:'物流单号',width:'100xp',align:'left', editor:'logisticsCodeEditor'},
                    {field:'is_shipped',title:'已发货',width:'100xp',align:'left'}
                ]],
                onResize:function(){
                    $('#detailDg').datagrid('fixDetailRowHeight',currentRowIndex);
                },
                onLoadSuccess:function(){
                    setTimeout(function(){
                        $('#detailDg').datagrid('fixDetailRowHeight',index);
                    },0);
                },
                view:detailview,
                detailFormatter: acceptDetailFormatter,
                onExpandRow: function(index,row) {
                    subDetailDdv.datagrid('resize', {});
                    setTimeout(function () {
                        subDetailDdv.datagrid('fixDetailRowHeight', index);
                        $('#detailDg').datagrid('fixDetailRowHeight', currentRowIndex);
                    }, 0);
               },
                onCollapseRow: function(index,row) {
                    subDetailDdv.datagrid('resize', {});
                    setTimeout(function () {
                        subDetailDdv.datagrid('fixDetailRowHeight', index);
                        $('#detailDg').datagrid('fixDetailRowHeight', currentRowIndex);
                    }, 0);
                }
            });
            //currentChannelRow = row.obj;
            loadShipmentInfos(ddv, row.obj.shipments);
            $('#detailDg').datagrid('fixDetailRowHeight',index);
        }
    });

}


function acceptDetailFormatter(rowIndex, rowData){
    return '<table style="border:0">' +
        '<tr>' +
        '<td style="width: 60px;border:0">实收数量</td>' +
        '<td style="width: 90px;border:0">' +  rowData.obj.accept_quantity +  '</td>' +
        '<td style="width: 60px;border:0">退返数量</td>' +
        '<td style="width: 90px;border:0">' +   rowData.obj.reject_quantity +  '</td>' +
        '<td style="width: 60px;border:0">签收人</td>' +
        '<td style="width: 90px;border:0">' +  rowData.obj.accept_actor +  '</td>' +
        '<td style="width: 60px;border:0">签收日期</td>' +
        '<td style="width: 90px;border:0">' +  rowData.obj.accept_date +  '</td>' +
        '</tr>' +
        '</table>';
}


function loadShipmentInfos(ddv, data){
    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];
        var isShipped = (dataItem.is_shipped)?"是":"否";
        var row_data = {
            ship_quantity: dataItem.ship_quantity,
            ship_date : dataItem.ship_date,
            ship_code : dataItem.ship_code,
            logistics_code : dataItem.logistics_code,
            is_shipped: isShipped,
            obj: dataItem
        };
        viewModel.push(row_data);
    }

    ddv.datagrid('loadData',viewModel);
}


function onBeforeSelect(index,row){
    if(newShipmentDetails.length > 0){
        $.messager.alert('提示','有未提交的发货记录，请先提交或取消!');
        return false;
    }
    return true;
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

function onShipmentSelected(rowIndex, detailRowData){
    editIndex = rowIndex;
}


function getRepDetailItemObj(index){
    var parentDg = $('#detailDg');
    var parentRows = parentDg.datagrid('getRows');
    return parentRows[index].obj;
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
            code : dataItem.bo.bo_id,
            req_date : dataItem.bo.req_date,
            req_send_date: dataItem.bo.req_send_date,
            req_code : dataItem.bo.req_code,
            channel_name: dataItem.bo.channel.name,
            is_completed: dataItem.bo.is_completed,
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
function buildRepsQueryCond(total, pageNum, queryStatus) {
    var condition = {
        paging: {
            sort_field: "_id",
            sort_direction: -1,
            page_number: pageNum,
            page_size: 5,
            total: total,
            total_page: -1
        },
        query_status: queryStatus
    };
    var reqData = JSON.stringify(condition);
    return reqData;
}
var repCurrentPageIndex = 1;

function loadData(){
    var selectStatus = $('#statusCmb').combobox('getValue');
    loadDgList(selectStatus);
}

//加载数据列表
function loadDgList(status){

    var queryStatus = [];
    if(status == "incomming"){
        queryStatus = ["shipping","shipped"]
    }else if(status == "completed") {
        queryStatus = ["completed"]
    }
    var condStr = buildRepsQueryCond(0,1, queryStatus);

    //定义查询条件
    $.ajax({
        method : 'POST',
        url : $posURL + "ocr-pointofsale/replenishment-mgr/query?context=" + $token_pos,
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
                            url : $posURL + "ocr-pointofsale/replenishment-mgr/query?context=" + $token_pos,
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

//行选择事件

var initialized = false;
function onRowSelected (rowIndex, rowData) {
    initialized = true;

    replenishmentObjIndex = rowIndex;
    replenishmentObj = rowData.obj;

    cloneReplenishmentObj = cloneJsonObject(replenishmentObj);
    bindSelectedDataToSubDetail(cloneReplenishmentObj.bo.details);

    initialized = false;
}

var currentRowIndex = 0;
function onDetailRowSelected(rowIndex, detailRowData){
    currentRowIndex = rowIndex;
}

//绑定到子表
function bindSelectedDataToSubDetail(detailData){
    var detailDg = $('#detailDg');
    //detailDg.datagrid('loadData', { total: 0, rows: [] });
    bindDetailData(detailData);
}

//绑定表体数据
function bindDetailData(data){
    var dgLst = $('#detailDg');
    var viewModel = new Array();
    for ( var i in data) {
        var dataItem = data[i];
        var pickCompleted = (dataItem.pick_completed)?"是":"否";
        var shipCompleted = (dataItem.ship_completed)?"是":"否";

        var row_data = {
            restocking_warehouse: dataItem.restocking_warehouse.name,
            product_sku_code : dataItem.goods.product_sku_code,
            title : dataItem.goods.title,
            sales_catelog: dataItem.goods.sales_catelogs,
            bar_code : dataItem.goods.product_sku.bar_code,
            invbatchcode: dataItem.invbatchcode,
            shelf_life: dataItem.shelf_life,
            specifications: dataItem.goods.product_sku.product_specifications,
            base_unit: dataItem.goods.product_sku.product_spu.base_unit,
            quantity: dataItem.quantity,
            pick_quantity: dataItem.pick_quantity,
            pick_completed: pickCompleted,
            ship_completed: shipCompleted,
            obj: dataItem
        };
        viewModel.push(row_data);
        //dgLst.datagrid('appendRow', row_data);
    }

    dgLst.datagrid({loadFilter: pagerFilter}).datagrid('loadData',viewModel);
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