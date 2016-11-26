function loadData(){
    $('#dg').datagrid({
        title : '渠道补货单列表',
        iconCls : 'icon-a_detail',
        fit : true,
        fitColumns : true,
        rownumbers : true,
        pagination : true,
        pageNumber: 1, //初始化的页码编号,默认1
        pageSize: 5, //每页的数据条数，默认10
        pageList: [5, 10, 20, 50, 100], //页面数据条数选择清单
        singleSelect : true,
        border : false
    });

    //定义查询条件
    $.ajax({
        method : 'GET',
        url : $apiBaseURL + "ocr-productcenter/catelog-mgr/get_replenishment?context=3|3|lj|aaa",
        async : true,
        dataType : 'json',
        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
        success : function(data) {
            //var data = ret.rows;
            $('#dg').datagrid('loadData',data);

            $('#dg').datagrid('getPager').pagination({
                displayMsg: '第 {from} - {to} 条 共 {total} 条',
                onSelectPage : function(pPageIndex, pPageSize) {
                    //改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
                    var gridOpts = $('#dg').datagrid('options');
                    gridOpts.pageNumber = pPageIndex;
                    gridOpts.pageSize = pPageSize;
                    //定义查询条件
                    $.ajax({
                        method : 'GET',
                        url : $apiBaseURL + "ocr-productcenter/catelog-mgr/getchannelrestocking?context=3|3|lj|aaa",
                        async : true,
                        dataType : 'json',
                        beforeSend: function (x) { x.setRequestHeader("Content-Type", "application/json; charset=utf-8"); },
                        success : function(data) {
                            //var data = ret.rows;
                            $('#dg').datagrid('loadData',data);
                        },
                        error: function (x, e) {
                            alert(e.toString(), 0, "友好提醒");
                        }
                    });
                }
            });

        },
        error: function (x, e) {
            layer.alert(e.toString(), 0, "友好提醒");
        }
    });







}

