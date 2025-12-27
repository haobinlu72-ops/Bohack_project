"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateElementProps = generateElementProps;
exports.generatePropExp = generatePropExp;
const CompilerDOM = require("@vue/compiler-dom");
const shared_1 = require("@vue/shared");
const picomatch_1 = require("picomatch");
const shared_2 = require("../../utils/shared");
const codeFeatures_1 = require("../codeFeatures");
const inlayHints_1 = require("../inlayHints");
const utils_1 = require("../utils");
const camelized_1 = require("../utils/camelized");
const unicode_1 = require("../utils/unicode");
const wrapWith_1 = require("../utils/wrapWith");
const elementDirectives_1 = require("./elementDirectives");
const elementEvents_1 = require("./elementEvents");
const interpolation_1 = require("./interpolation");
const objectProperty_1 = require("./objectProperty");
function* generateElementProps(options, ctx, node, props, strictPropsCheck, failedPropExps) {
    const isComponent = node.tagType === CompilerDOM.ElementTypes.COMPONENT;
    for (const prop of props) {
        if (prop.type === CompilerDOM.NodeTypes.DIRECTIVE
            && prop.name === 'on') {
            if (prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                && !prop.arg.loc.source.startsWith('[')
                && !prop.arg.loc.source.endsWith(']')) {
                if (!isComponent) {
                    yield `...{ `;
                    yield* (0, elementEvents_1.generateEventArg)(options, prop.arg.loc.source, prop.arg.loc.start.offset);
                    yield `: `;
                    yield* (0, elementEvents_1.generateEventExpression)(options, ctx, prop);
                    yield `},`;
                }
                else {
                    yield `...{ '${(0, shared_1.camelize)('on-' + prop.arg.loc.source)}': {} as any },`;
                }
                yield utils_1.newLine;
            }
            else if (prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                && prop.arg.loc.source.startsWith('[')
                && prop.arg.loc.source.endsWith(']')) {
                failedPropExps?.push({ node: prop.arg, prefix: `(`, suffix: `)` });
                failedPropExps?.push({ node: prop.exp, prefix: `() => {`, suffix: `}` });
            }
            else if (!prop.arg
                && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
                failedPropExps?.push({ node: prop.exp, prefix: `(`, suffix: `)` });
            }
        }
    }
    for (const prop of props) {
        if (prop.type === CompilerDOM.NodeTypes.DIRECTIVE
            && ((prop.name === 'bind' && prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION)
                || prop.name === 'model')
            && (!prop.exp || prop.exp.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION)) {
            let propName;
            if (prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
                propName = prop.arg.constType === CompilerDOM.ConstantTypes.CAN_STRINGIFY
                    ? prop.arg.content
                    : prop.arg.loc.source;
            }
            else {
                propName = getModelPropName(node, options.vueCompilerOptions);
            }
            if (propName === undefined
                || options.vueCompilerOptions.dataAttributes.some(pattern => (0, picomatch_1.isMatch)(propName, pattern))) {
                if (prop.exp && prop.exp.constType !== CompilerDOM.ConstantTypes.CAN_STRINGIFY) {
                    failedPropExps?.push({ node: prop.exp, prefix: `(`, suffix: `)` });
                }
                continue;
            }
            if (prop.name === 'bind'
                && prop.modifiers.some(m => m.content === 'prop' || m.content === 'attr')) {
                propName = propName.slice(1);
            }
            const shouldSpread = propName === 'style' || propName === 'class';
            const shouldCamelize = isComponent && getShouldCamelize(options, prop, propName);
            const features = getPropsCodeFeatures(strictPropsCheck);
            if (shouldSpread) {
                yield `...{ `;
            }
            yield* (0, wrapWith_1.wrapWith)('template', prop.loc.start.offset, prop.loc.end.offset, codeFeatures_1.codeFeatures.verification, ...(prop.arg
                ? (0, objectProperty_1.generateObjectProperty)(options, ctx, propName, prop.arg.loc.start.offset, features, shouldCamelize)
                : (0, wrapWith_1.wrapWith)('template', prop.loc.start.offset, prop.loc.start.offset + 'v-model'.length, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion, propName)), `: `, ...(0, wrapWith_1.wrapWith)('template', prop.arg?.loc.start.offset ?? prop.loc.start.offset, prop.arg?.loc.end.offset ?? prop.loc.end.offset, codeFeatures_1.codeFeatures.verification, ...generatePropExp(options, ctx, prop, prop.exp)));
            if (shouldSpread) {
                yield ` }`;
            }
            yield `,${utils_1.newLine}`;
            if (isComponent && prop.name === 'model' && prop.modifiers.length) {
                const propertyName = prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                    ? !prop.arg.isStatic
                        ? `[__VLS_tryAsConstant(\`\${${prop.arg.content}}Modifiers\`)]`
                        : (0, shared_1.camelize)(propName) + `Modifiers`
                    : `modelModifiers`;
                yield* (0, elementDirectives_1.generateModifiers)(options, ctx, prop, propertyName);
                yield utils_1.newLine;
            }
        }
        else if (prop.type === CompilerDOM.NodeTypes.ATTRIBUTE) {
            if (options.vueCompilerOptions.dataAttributes.some(pattern => (0, picomatch_1.isMatch)(prop.name, pattern))) {
                continue;
            }
            const shouldSpread = prop.name === 'style' || prop.name === 'class';
            const shouldCamelize = isComponent && getShouldCamelize(options, prop, prop.name);
            const features = getPropsCodeFeatures(strictPropsCheck);
            if (shouldSpread) {
                yield `...{ `;
            }
            yield* (0, wrapWith_1.wrapWith)('template', prop.loc.start.offset, prop.loc.end.offset, codeFeatures_1.codeFeatures.verification, ...(0, objectProperty_1.generateObjectProperty)(options, ctx, prop.name, prop.loc.start.offset, features, shouldCamelize), `: `, ...(prop.value
                ? generateAttrValue(prop.value, codeFeatures_1.codeFeatures.withoutNavigation)
                : [`true`]));
            if (shouldSpread) {
                yield ` }`;
            }
            yield `,${utils_1.newLine}`;
        }
        else if (prop.name === 'bind'
            && !prop.arg
            && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
            if (prop.exp.loc.source === '$attrs') {
                ctx.bindingAttrLocs.push(prop.exp.loc);
            }
            else {
                yield* (0, wrapWith_1.wrapWith)('template', prop.exp.loc.start.offset, prop.exp.loc.end.offset, codeFeatures_1.codeFeatures.verification, `...`, ...generatePropExp(options, ctx, prop, prop.exp));
                yield `,${utils_1.newLine}`;
            }
        }
    }
}
function* generatePropExp(options, ctx, prop, exp) {
    if (!exp) {
        yield `{}`;
    }
    else if (prop.arg?.loc.start.offset !== prop.exp?.loc.start.offset) {
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, 'template', codeFeatures_1.codeFeatures.all, exp.loc.source, exp.loc.start.offset, `(`, `)`);
    }
    else {
        const propVariableName = (0, shared_1.camelize)(exp.loc.source);
        if (utils_1.identifierRegex.test(propVariableName)) {
            const codes = (0, camelized_1.generateCamelized)(exp.loc.source, 'template', exp.loc.start.offset, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion);
            if (options.destructuredPropNames.has(propVariableName) || ctx.hasLocalVariable(propVariableName)) {
                yield* codes;
            }
            else if (options.templateRefNames.has(propVariableName)) {
                yield `__VLS_unref(`;
                yield* codes;
                yield `)`;
            }
            else {
                ctx.accessExternalVariable(propVariableName, exp.loc.start.offset);
                yield `__VLS_ctx.`;
                yield* codes;
            }
            ctx.inlayHints.push((0, inlayHints_1.createVBindShorthandInlayHintInfo)(prop.loc, propVariableName));
        }
    }
}
function* generateAttrValue(node, features) {
    const quote = node.loc.source.startsWith("'") ? "'" : '"';
    const offset = (0, shared_2.getAttributeValueOffset)(node);
    yield quote;
    yield* (0, unicode_1.generateUnicode)(node.content, offset, features);
    yield quote;
}
function getShouldCamelize(options, prop, propName) {
    return (prop.type !== CompilerDOM.NodeTypes.DIRECTIVE
        || !prop.arg
        || (prop.arg.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION && prop.arg.isStatic))
        && (0, shared_2.hyphenateAttr)(propName) === propName
        && !options.vueCompilerOptions.htmlAttributes.some(pattern => (0, picomatch_1.isMatch)(propName, pattern));
}
function getPropsCodeFeatures(strictPropsCheck) {
    return {
        ...codeFeatures_1.codeFeatures.withoutHighlightAndCompletion,
        ...strictPropsCheck
            ? codeFeatures_1.codeFeatures.verification
            : codeFeatures_1.codeFeatures.doNotReportTs2353AndTs2561,
    };
}
function getModelPropName(node, vueCompilerOptions) {
    for (const modelName in vueCompilerOptions.experimentalModelPropName) {
        const tags = vueCompilerOptions.experimentalModelPropName[modelName];
        for (const tag in tags) {
            if (node.tag === tag || node.tag === (0, shared_2.hyphenateTag)(tag)) {
                const val = tags[tag];
                if (typeof val === 'object') {
                    const arr = Array.isArray(val) ? val : [val];
                    for (const attrs of arr) {
                        let failed = false;
                        for (const attr in attrs) {
                            const attrNode = node.props.find(prop => prop.type === CompilerDOM.NodeTypes.ATTRIBUTE && prop.name === attr);
                            if (!attrNode || attrNode.value?.content !== attrs[attr]) {
                                failed = true;
                                break;
                            }
                        }
                        if (!failed) {
                            // all match
                            return modelName || undefined;
                        }
                    }
                }
            }
        }
    }
    for (const modelName in vueCompilerOptions.experimentalModelPropName) {
        const tags = vueCompilerOptions.experimentalModelPropName[modelName];
        for (const tag in tags) {
            if (node.tag === tag || node.tag === (0, shared_2.hyphenateTag)(tag)) {
                const attrs = tags[tag];
                if (attrs === true) {
                    return modelName || undefined;
                }
            }
        }
    }
    return 'modelValue';
}
//# sourceMappingURL=elementProps.js.map