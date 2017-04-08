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

function resetState(){
    editIndex = undefined;
    isNewRep = false;
    isHeadChanged = false;
    isBodyChanged = false;
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

function detailListSetting(){
    $('#detailDg').datagrid({
        title : '安全库存预警详情',
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
        showFooter: true
    });

    $('#allowCatalogDg').datagrid({
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
        border : true
    });
}
//单元格加提示信息
function formatCellTooltip(value){
    return "<span title='" + value + "'>" + value + "</span>";
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


function query() {
    loadDgList();
}


//绑定表体数据
function bindDetailData(data){
    var dgLst = $('#detailDg');
    var viewModel = new Array();
    for ( var i in data) {
        var item = data[i];
        var row_data = {
            product_sku_code : item.goods.product_sku_code,
            warehousecode: item.warehouses.code,
            warehousename: item.warehouses.name,
            title : item.goods.title,
            sales_catelog: item.goods.sales_catelogs,
            bar_code : item.goods.product_sku.bar_code,
            specifications: item.goods.product_sku.product_specifications,
            base_unit: item.goods.product_sku.product_spu.base_unit,
            batch_code: item.invbatchcode,
            brand: item.goods.product_sku.product_spu.brand.name,
            manufacturer: item.goods.product_sku.product_spu.brand.manufacturer.name,
            onhandnum: item.onhandnum,
            safenum: item.safenum,
            stockoutnum: item.stockoutnum,
            isWarning: item.isWarning,
            obj: item
        };
        viewModel.push(row_data);
        //dgLst.datagrid('appendRow', row_data);
    }

    dgLst.datagrid({loadFilter: pagerFilter}).datagrid('loadData',viewModel);
}
//加载数据列表
function loadDgList(){

    var condStr = buildRepsQueryCond(0,1);

    //定义查询条件
    $.ajax({
        method : 'POST',
		url : $invcenterURL + "ocr-inventorycenter/safestockwarning/query?context=" + $token,
        async : true,
        data: condStr,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {

            bindDetailData(data);
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

