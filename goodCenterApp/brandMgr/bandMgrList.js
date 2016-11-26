function loadData(){
    $('#dg').datagrid({
        title : '设备列表模式',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : true,
        rownumbers : true,
        pagination : true,
        singleSelect : true,
        border : false,
        striped : true,
        toolbar : [ {
            text : '查看详情',
            iconCls : 'icon-script_link',
            handler : function() {
                viewDetail();
            }
        }, '-', {
            iconCls : 'icon-help',
            handler : function() {
                alert('帮助按钮');
            }
        } ],
        columns : [ [ {
            field : 'itemid',
            title : 'itemid',
            width : 100,
            align : 'center',
            hidden : true
        }, {
            field : 'productid',
            title : '设备名称',
            width : 100,
            align : 'center'
        }, {
            field : 'listprice',
            title : '设备类型',
            width : 100,
            align : 'center'
        }, {
            field : 'unitcost',
            title : '备案编号',
            width : 100,
            align : 'center'
        }, {
            field : 'attr1',
            title : '当前状态',
            width : 100,
            align : 'center'
        }, {
            field : 'status',
            title : '更新时间',
            width : 100,
            align : 'center'
        } ] ]
    });
    // 先通过ajax获取数据，然后再传给datagrid
    // https://bas.gimiscloud.com/api/crane/machinelist
    // json/data_machine_list.json

    $.ajax({
        method : 'GET',
        url : $apiBaseURL + "ocr-productcenter/catelog-mgr/getchannelrestocking?context=3|3|lj|aaa",
        async : false,
        dataType : 'json',
        success : function(ret) {
            var data = ret.rows;
            $('#dg').datagrid({
                data: data
            });
        },
        error : function() {
            alert('error');
        }
    });

    var pager = $('#dg').datagrid().datagrid('getPager');	// get the pager of datagrid
    pager.pagination({
        buttons:[{
            iconCls:'icon-search',
            handler:function(){
                alert('search');
            }
        },{
            iconCls:'icon-add',
            handler:function(){
                alert('add');
            }
        },{
            iconCls:'icon-edit',
            handler:function(){
                alert('edit');
            }
        }]
    });
}

function GetAccessToken() {
    return ((/access_token=(\w+)/ig.exec(window.location) || [])[1]) || '';
}
