window.getQueryString = function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);    //(r[2]);
    }else{
        var index1 = window.location.href.indexOf('?');
        if(index1>=0){
            r = window.location.href.substring(index1+1).match(reg);
        }else{
            r = window.location.href.substring(0).match(reg);
        }

        if (r != null) {
            return decodeURIComponent(r[2]);    //(r[2]);
        }
        //var ret = getQueryStringArgs(window.location.href,name);
    }
    return '';
};

//获取当前租户
window.getCurrentAcctInfo = function(){
/*    var defaultAcctInfo = localStorage.getItem("default_acct");
    if (defaultAcctInfo != undefined && defaultAcctInfo != null) {
        var defaultAcctObj = JSON.parse(defaultAcctInfo);
        loginAccount(defaultAcctObj);
    }*/
    var currentAcctInfo = sessionStorage.getItem("current_acct");
    return JSON.parse(currentAcctInfo);
};

//深度复制JSON
function cloneJsonObject(originalObj){
    return JSON.parse(JSON.stringify(originalObj));
}

//弹出后能自动关闭的Messager
function alert_autoClose(title,msg){
    var interval;
    var time=1000;
    var x=3;    //设置时间2s
    $.messager.show({
        title:title,
        msg:msg,
        showType:'show'
    });
    interval=setInterval(fun,time);
    function fun(){
        --x;
        if(x==0){
            clearInterval(interval);
            $(".messager-body").window('close');
        }
    };
}

//日期时间格式化
/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * eg:
 * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.format=function(fmt) {
    var o = {
        "M+" : this.getMonth()+1, //月份
        "d+" : this.getDate(), //日
        "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时
        "H+" : this.getHours(), //小时
        "m+" : this.getMinutes(), //分
        "s+" : this.getSeconds(), //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S" : this.getMilliseconds() //毫秒
    };
    var week = {
        "0" : "/u65e5",
        "1" : "/u4e00",
        "2" : "/u4e8c",
        "3" : "/u4e09",
        "4" : "/u56db",
        "5" : "/u4e94",
        "6" : "/u516d"
    };
    if(/(y+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    if(/(E+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);
    }
    for(var k in o){
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}

function removeByValue(arr, val) {
    for(var i=0; i<arr.length; i++){
        if(arr[i] == val){
            arr.splice(i, 1);
            break;
        }
    }
}
