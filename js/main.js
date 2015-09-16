/**
 * Created by alex on 31.05.14.
 */

window.addEventListener("load", main);

function main() {
    console.log("APP Loaded!");
    // Load Codemirror
    var editor = CodeMirror.fromTextArea(document.getElementById("edit_ace"), {
        mode: "javascript"
    });
    var jspr = new JSPR();
    var status = document.getElementById("status");
    document.getElementById("save").addEventListener("click", function() {
        save(editor.getValue());
    });
    document.getElementById("open").addEventListener("click", function() {
        open(document.getElementById("file").files[0], editor);
    });
    document.getElementById("work").addEventListener("click", function () {
        console.log("Working...");
        var beforeLen = lengthInUtf8Bytes(editor.getValue()), afterLen = 0;
        var res = jspr.process(editor.getValue());
        if (res === false) {
            status.innerHTML = jspr.error;
        } else {
            editor.setValue(res);
            afterLen = lengthInUtf8Bytes(res);
            var ratio = (afterLen / beforeLen).toPrecision(3);
            status.innerHTML = "Size before: <b>" + beforeLen + "</b>, after: <b>" + afterLen + "</b> Compress ratio: <b>" + ratio + "</b>";
        }
    });
}

function lengthInUtf8Bytes(str) {
    var m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
}

function save(txt) {
    var blob = new Blob([txt], {type: "text/javascript;charset=utf-8"});
    saveAs(blob, "minifiyed.txt");
}

function open(name, editor) {
    //if (name.length > 0) {
        try {
            var reader = new FileReader();
            reader.readAsText(name, "UTF-8");
            reader.onerror = function (e) {
                throw Error(e);
            };
            reader.onload = function(e) {
                var fileString = e.target.result;
                editor.setValue(fileString);
            };
        } catch (e) {
            console.error(e);
        }
    //}
}