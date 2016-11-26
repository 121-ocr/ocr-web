require.config({
    baseUrl: "/ocr-web1/",
    paths: {
        text: "lib/requirejs/text",
        css: "lib/requirejs/css",
        jquery: "lib/jquery-easyui/jquery.min",
        easy_ui: "lib/jquery-easyui/jquery.easyui.min",
        constant: "js/constant"  //定义常量
    },
    shim: {
        'easy_ui': {
            deps: ["jquery"]
        }
    }
});


