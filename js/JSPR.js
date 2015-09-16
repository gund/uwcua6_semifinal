/**
 * Created by alex on 31.05.14.
 */

function JSPR() {
}

JSPR.prototype.source = "";
JSPR.prototype.output = "";
JSPR.prototype.ast = {};
JSPR.prototype.error = "";

JSPR.prototype.process = function (program) {
    this.source = program || "";
    try {
        this.getAST();
        this.minAST();
        this.genJSFromAST();
    } catch (e) {
        this.error = e;
        return false;
    }
    return this.output;
};

JSPR.prototype.getAST = function () {
    this.ast = esprima.parse(this.source);
    console.log("AST Before:", esprima.parse(this.source));
};

JSPR.prototype.minAST = function () {
    var me = this;
    estraverse.replace(this.ast, {
        enter: function (node) {
            // Ompimize + - * /
            if (node.type === "BinaryExpression") {
                var val = me.optiBinExpr(node);
                return val !== null ? val : node;
            }
            // Optimize static calls
            if (node.type === "ExpressionStatement") {
                if (node.expression.type === "CallExpression" && node.expression.callee.type === "MemberExpression" && node.expression.callee.object.type === "Literal") {
                    var val = me.applyMethod(node.expression.callee.property.name, node.expression.callee.object.value, node.expression.arguments);
                    if (val !== null) node.expression = val;
                }
            }
        }
    });
    console.log("AST After:", this.ast);
};

JSPR.prototype.genJSFromAST = function () {
    this.output = escodegen.generate(this.ast, {format: {compact: true}});
    //console.log(this.output);
};

JSPR.prototype.applyAction = function (act, left, right) {
    switch (act) {
        case "+":
            return left + right;
        case "-":
            return left - right;
        case "*":
            return left * right;
        case "/":
            return left / right;
        case ">=":
            return left >= right;
        case "<=":
            return left <= right;
        case ">":
            return left > right;
        case "<":
            return left < right;
        case "==":
            return left == right;
        case "===":
            return left === right;
        case "!=":
            return left != right;
        case "!==":
            return left !== right;
        default:
            return null;
    }
};

JSPR.prototype.applyMethod = function (method, obj, args) {
    var type = typeof obj;
    switch (type) {
        case "string":
            switch (method) {
                case "concat":
                    for (var i = 0; i < args.length; ++i) {
                        switch (args[i].type) {
                            case "Literal":
                                obj = obj[method](args[i].value);
                                break;
                            case "BinaryExpression":
                                var val = this.optiBinExpr(args[i]);
                                if (val === null) return null;
                                obj = obj[method](val.value);
                                break;
                            case "ArrayExpression":
                                for (var j = 0; j < args[i].elements.length; ++j) {
                                    switch (args[i].elements[j].type) {
                                        case "Literal":
                                            obj = obj[method](args[i].elements[j].value);
                                            break;
                                        case "BinaryExpression":
                                            var val = this.optiBinExpr(args[i].elements[j]);
                                            if (val === null) return null;
                                            obj = obj[method](val.value);
                                            break;
                                        default:
                                            return null;
                                    }
                                }
                                break;
                            default:
                                return null;
                        }

                    }
                    return {
                        type: "Literal",
                        value: obj,
                        raw: this.raw(obj)
                    };
                    break;
                case "substr":
                    var ar = [];
                    for (var i = 0; i < args.length; ++i) {
                        switch (args[i].type) {
                            case "Literal":
                                ar.push(args[i].value);
                                break;
                            case "BinaryExpression":
                                var val = this.optiBinExpr(args[i].elements[j]);
                                if (val === null) return null;
                                ar.push(val.value);
                                break;
                            default:
                                return null;
                        }
                    }
                    if (ar.length == 2) obj = obj.substr(ar[0], ar[1]);
                    else obj = obj.substr(ar[0]);
                    return {
                        type: "Literal",
                        value: obj,
                        raw: this.raw(obj)
                    };
                    break;
                default:
                    return null;
            }
            break;
        default:
            return null;
    }
};

JSPR.prototype.raw = function (val) {
    if (typeof val === "string") return "'" + val + "'";
    else return "" + val + "";
};

JSPR.prototype.optiBinExpr = function (node) {
    if (node.left.type !== "Literal" || node.right.type !== "Literal") return null;
    var val = this.applyAction(node.operator, node.left.value, node.right.value);
    if (val === null) return null;
    node = {
        type: "Literal",
        value: val,
        raw: this.raw(val)
    };
    return node;
};