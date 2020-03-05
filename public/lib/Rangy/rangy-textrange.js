/**
 * Text range module for Rangy.
 * Text-based manipulation and searching of ranges and selections.
 *
 * Features
 *
 * - Ability to move range boundaries by character or word offsets
 * - Customizable word tokenizer
 * - Ignores text nodes inside <script> or <style> elements or those hidden by CSS display and visibility properties
 * - Range findText method to search for text or regex within the page or within a range. Flags for whole words and case
 *   sensitivity
 * - Selection and range save/restore as text offsets within a node
 * - Methods to return visible text within a range or selection
 * - innerText method for elements
 *
 * References
 *
 * https://www.w3.org/Bugs/Public/show_bug.cgi?id=13145
 * http://aryeh.name/spec/innertext/innertext.html
 * http://dvcs.w3.org/hg/editing/raw-file/tip/editing.html
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Depends on Rangy core.
 *
 * Copyright 2015, Tim Down
 * Licensed under the MIT license.
 * Version: 1.3.0
 * Build date: 10 May 2015
 */

/**
 * Problem: handling of trailing spaces before line breaks is handled inconsistently between browsers.
 *
 * First, a <br>: this is relatively simple. For the following HTML:
 *
 * 1 <br>2
 *
 * - IE and WebKit render the space, include it in the selection (i.e. when the content is selected and pasted into a
 *   textarea, the space is present) and allow the caret to be placed after it.
 * - Firefox does not acknowledge the space in the selection but it is possible to place the caret after it.
 * - Opera does not render the space but has two separate caret positions on either side of the space (left and right
 *   arrow keys show this) and includes the space in the selection.
 *
 * The other case is the line break or breaks implied by block elements. For the following HTML:
 *
 * <p>1 </p><p>2<p>
 *
 * - WebKit does not acknowledge the space in any way
 * - Firefox, IE and Opera as per <br>
 *
 * One more case is trailing spaces before line breaks in elements with white-space: pre-line. For the following HTML:
 *
 * <p style="white-space: pre-line">1
 * 2</p>
 *
 * - Firefox and WebKit include the space in caret positions
 * - IE does not support pre-line up to and including version 9
 * - Opera ignores the space
 * - Trailing space only renders if there is a non-collapsed character in the line
 *
 * Problem is whether Rangy should ever acknowledge the space and if so, when. Another problem is whether this can be
 * feature-tested
 */
(function(factory, root) {
    if (typeof define == "function" && define.amd) {
        // AMD. Register as an anonymous module with a dependency on Rangy.
        define(["./rangy-core"], factory);
    } else if (typeof module != "undefined" && typeof exports == "object") {
        // Node/CommonJS style
        module.exports = factory( require("rangy") );
    } else {
        // No AMD or CommonJS support so we use the rangy property of root (probably the global variable)
        factory(root.rangy);
    }
})(function(rangy) {
    rangy.createModule("TextRange", ["WrappedSelection"], function(api, module) {
        var UNDEF = "undefined";
        var CHARACTER = "character", WORD = "word";
        var dom = api.dom, util = api.util;
        var extend = util.extend;
        var createOptions = util.createOptions;
        var getBody = dom.getBody;


        var spacesRegex = /^[ \t\f\r\n]+$/;
        var spacesMinusLineBreaksRegex = /^[ \t\f\r]+$/;
        var allWhiteSpaceRegex = /^[\t-\r \u0085\u00A0\u1680\u180E\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]+$/;
        var nonLineBreakWhiteSpaceRegex = /^[\t \u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]+$/;
        var lineBreakRegex = /^[\n-\r\u0085\u2028\u2029]$/;

        var defaultLanguage = "en";

        var isDirectionBackward = api.Selection.isDirectionBackward;

        // Properties representing whether trailing spaces inside blocks are completely collapsed (as they are in WebKit,
        // but not other browsers). Also test whether trailing spaces before <br> elements are collapsed.
        var trailingSpaceInBlockCollapses = false;
        var trailingSpaceBeforeBrCollapses = false;
        var trailingSpaceBeforeBlockCollapses = false;
        var trailingSpaceBeforeLineBreakInPreLineCollapses = true;

        (function() {
            var el = dom.createTestElement(document, "<p>1 </p><p></p>", true);
            var p = el.firstChild;
            var sel = api.getSelection();
            sel.collapse(p.lastChild, 2);
            sel.setStart(p.firstChild, 0);
            trailingSpaceInBlockCollapses = ("" + sel).length == 1;

            el.innerHTML = "1 <br />";
            sel.collapse(el, 2);
            sel.setStart(el.firstChild, 0);
            trailingSpaceBeforeBrCollapses = ("" + sel).length == 1;

            el.innerHTML = "1 <p>1</p>";
            sel.collapse(el, 2);
            sel.setStart(el.firstChild, 0);
            trailingSpaceBeforeBlockCollapses = ("" + sel).length == 1;

            dom.removeNode(el);
            sel.removeAllRanges();
        })();

        /*----------------------------------------------------------------------------------------------------------------*/

        // This function must create word and non-word tokens for the whole of the text supplied to it
        function defaultTokenizer(chars, wordOptions) {
            var word = chars.join(""), result, tokenRanges = [];

            function createTokenRange(start, end, isWord) {
                tokenRanges.push( { start: start, end: end, isWord: isWord } );
            }

            // Match words and mark characters
            var lastWordEnd = 0, wordStart, wordEnd;
            while ( (result = wordOptions.wordRegex.exec(word)) ) {
                wordStart = result.index;
                wordEnd = wordStart + result[0].length;

                // Create token for non-word characters preceding this word
                if (wordStart > lastWordEnd) {
                    createTokenRange(lastWordEnd, wordStart, false);
                }

                // Get trailing space characters for word
                if (wordOptions.includeTrailingSpace) {
                    while ( nonLineBreakWhiteSpaceRegex.test(chars[wordEnd]) ) {
                        ++wordEnd;
                    }
                }
                createTokenRange(wordStart, wordEnd, true);
                lastWordEnd = wordEnd;
            }

            // Create token for trailing non-word characters, if any exist
            if (lastWordEnd < chars.length) {
                createTokenRange(lastWordEnd, chars.length, false);
            }

            return tokenRanges;
        }

        function convertCharRangeToToken(chars, tokenRange) {
            var tokenChars = chars.slice(tokenRange.start, tokenRange.end);
            var token = {
                isWord: tokenRange.isWord,
                chars: tokenChars,
                toString: function() {
                    return tokenChars.join("");
                }
            };
            for (var i = 0, len = tokenChars.length; i < len; ++i) {
                tokenChars[i].token = token;
            }
            return token;
        }

        function tokenize(chars, wordOptions, tokenizer) {
            var tokenRanges = tokenizer(chars, wordOptions);
            var tokens = [];
            for (var i = 0, tokenRange; tokenRange = tokenRanges[i++]; ) {
                tokens.push( convertCharRangeToToken(chars, tokenRange) );
            }
            return tokens;
        }

        var defaultCharacterOptions = {
            includeBlockContentTrailingSpace: true,
            includeSpaceBeforeBr: true,
            includeSpaceBeforeBlock: true,
            includePreLineTrailingSpace: true,
            ignoreCharacters: ""
        };

        function normalizeIgnoredCharacters(ignoredCharacters) {
            // Check if character is ignored
            var ignoredChars = ignoredCharacters || "";

            // Normalize ignored characters into a string consisting of characters in ascending order of character code
            var ignoredCharsArray = (typeof ignoredChars == "string") ? ignoredChars.split("") : ignoredChars;
            ignoredCharsArray.sort(function(char1, char2) {
                return char1.charCodeAt(0) - char2.charCodeAt(0);
            });

            /// Convert back to a string and remove duplicates
            return ignoredCharsArray.join("").replace(/(.)\1+/g, "$1");
        }

        var defaultCaretCharacterOptions = {
            includeBlockContentTrailingSpace: !trailingSpaceBeforeLineBreakInPreLineCollapses,
            includeSpaceBeforeBr: !trailingSpaceBeforeBrCollapses,
            includeSpaceBeforeBlock: !trailingSpaceBeforeBlockCollapses,
            includePreLineTrailingSpace: true
        };

        var defaultWordOptions = {
            "en": {
                wordRegex: /[a-z0-9]+('[a-z0-9]+)*/gi,
                includeTrailingSpace: false,
                tokenizer: defaultTokenizer
            }
        };

        var defaultFindOptions = {
            caseSensitive: false,
            withinRange: null,
            wholeWordsOnly: false,
            wrap: false,
            direction: "forward",
            wordOptions: null,
            characterOptions: null
        };

        var defaultMoveOptions = {
            wordOptions: null,
            characterOptions: null
        };

        var defaultExpandOptions = {
            wordOptions: null,
            characterOptions: null,
            trim: false,
            trimStart: true,
            trimEnd: true
        };

        var defaultWordIteratorOptions = {
            wordOptions: null,
            characterOptions: null,
            direction: "forward"
        };

        function createWordOptions(options) {
            var lang, defaults;
            if (!options) {
                return defaultWordOptions[defaultLanguage];
            } else {
                lang = options.language || defaultLanguage;
                defaults = {};
                extend(defaults, defaultWordOptions[lang] || defaultWordOptions[defaultLanguage]);
                extend(defaults, options);
                return defaults;
            }
        }

        function createNestedOptions(optionsParam, defaults) {
            var options = createOptions(optionsParam, defaults);
            if (defaults.hasOwnProperty("wordOptions")) {
                options.wordOptions = createWordOptions(options.wordOptions);
            }
            if (defaults.hasOwnProperty("characterOptions")) {
                options.characterOptions = createOptions(options.characterOptions, defaultCharacterOptions);
            }
            return options;
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        /* DOM utility functions */
        var getComputedStyleProperty = dom.getComputedStyleProperty;

        // Create cachable versions of DOM functions

        // Test for old IE's incorrect display properties
        var tableCssDisplayBlock;
        (function() {
            var table = document.createElement("table");
            var body = getBody(document);
            body.appendChild(table);
            tableCssDisplayBlock = (getComputedStyleProperty(table, "display") == "block");
            body.removeChild(table);
        })();

        var defaultDisplayValueForTag = {
            table: "table",
            caption: "table-caption",
            colgroup: "table-column-group",
            col: "table-column",
            thead: "table-header-group",
            tbody: "table-row-group",
            tfoot: "table-footer-group",
            tr: "table-row",
            td: "table-cell",
            th: "table-cell"
        };

        // Corrects IE's "block" value for table-related elements
        function getComputedDisplay(el, win) {
            var display = getComputedStyleProperty(el, "display", win);
            var tagName = el.tagName.toLowerCase();
            return (display == "block" &&
                    tableCssDisplayBlock &&
                    defaultDisplayValueForTag.hasOwnProperty(tagName)) ?
                defaultDisplayValueForTag[tagName] : display;
        }

        function isHidden(node) {
            var ancestors = getAncestorsAndSelf(node);
            for (var i = 0, len = ancestors.length; i < len; ++i) {
                if (ancestors[i].nodeType == 1 && getComputedDisplay(ancestors[i]) == "none") {
                    return true;
                }
            }

            return false;
        }

        function isVisibilityHiddenTextNode(textNode) {
            var el;
            return textNode.nodeType == 3 &&
                (el = textNode.parentNode) &&
                getComputedStyleProperty(el, "visibility") == "hidden";
        }

        /*----------------------------------------------------------------------------------------------------------------*/

    
        // "A block node is either an Element whose "display" property does not have
        // resolved value "inline" or "inline-block" or "inline-table" or "none", or a
        // Document, or a DocumentFragment."
        function isBlockNode(node) {
            return node &&
                ((node.nodeType == 1 && !/^(inline(-block|-table)?|none)$/.test(getComputedDisplay(node))) ||
                node.nodeType == 9 || node.nodeType == 11);
        }

        function getLastDescendantOrSelf(node) {
            var lastChild = node.lastChild;
            return lastChild ? getLastDescendantOrSelf(lastChild) : node;
        }

        function containsPositions(node) {
            return dom.isCharacterDataNode(node) ||
                !/^(area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param)$/i.test(node.nodeName);
        }

        function getAncestors(node) {
            var ancestors = [];
            while (node.parentNode) {
                ancestors.unshift(node.parentNode);
                node = node.parentNode;
            }
            return ancestors;
        }

        function getAncestorsAndSelf(node) {
            return getAncestors(node).concat([node]);
        }

        function nextNodeDescendants(node) {
            while (node && !node.nextSibling) {
                node = node.parentNode;
            }
            if (!node) {
                return null;
            }
            return node.nextSibling;
        }

        function nextNode(node, excludeChildren) {
            if (!excludeChildren && node.hasChildNodes()) {
                return node.firstChild;
            }
            return nextNodeDescendants(node);
        }

        function previousNode(node) {
            var previous = node.previousSibling;
            if (previous) {
                node = previous;
                while (node.hasChildNodes()) {
                    node = node.lastChild;
                }
                return node;
            }
            var parent = node.parentNode;
            if (parent && parent.nodeType == 1) {
                return parent;
            }
            return null;
        }

        // Adpated from Aryeh's code.
        // "A whitespace node is either a Text node whose data is the empty string; or
        // a Text node whose data consists only of one or more tabs (0x0009), line
        // feeds (0x000A), carriage returns (0x000D), and/or spaces (0x0020), and whose
        // parent is an Element whose resolved value for "white-space" is "normal" or
        // "nowrap"; or a Text node whose data consists only of one or more tabs
        // (0x0009), carriage returns (0x000D), and/or spaces (0x0020), and whose
        // parent is an Element whose resolved value for "white-space" is "pre-line"."
        function isWhitespaceNode(node) {
            if (!node || node.nodeType != 3) {
                return false;
            }
            var text = node.data;
            if (text === "") {
                return true;
            }
            var parent = node.parentNode;
            if (!parent || parent.nodeType != 1) {
                return false;
            }
            var computedWhiteSpace = getComputedStyleProperty(node.parentNode, "whiteSpace");

            return (/^[\t\n\r ]+$/.test(text) && /^(normal|nowrap)$/.test(computedWhiteSpace)) ||
                (/^[\t\r ]+$/.test(text) && computedWhiteSpace == "pre-line");
        }

        // Adpated from Aryeh's code.
        // "node is a collapsed whitespace node if the following algorithm returns
        // true:"
        function isCollapsedWhitespaceNode(node) {
            // "If node's data is the empty string, return true."
            if (node.data === "") {
                return true;
            }

            // "If node is not a whitespace node, return false."
            if (!isWhitespaceNode(node)) {
                return false;
            }

            // "Let ancestor be node's parent."
            var ancestor = node.parentNode;

            // "If ancestor is null, return true."
            if (!ancestor) {
                return true;
            }

            // "If the "display" property of some ancestor of node has resolved value "none", return true."
            if (isHidden(node)) {
                return true;
            }

            return false;
        }

        function isCollapsedNode(node) {
            var type = node.nodeType;
            return type == 7 /* PROCESSING_INSTRUCTION */ ||
                type == 8 /* COMMENT */ ||
                isHidden(node) ||
                /^(script|style)$/i.test(node.nodeName) ||
                isVisibilityHiddenTextNode(node) ||
                isCollapsedWhitespaceNode(node);
        }

        function isIgnoredNode(node, win) {
            var type = node.nodeType;
            return type == 7 /* PROCESSING_INSTRUCTION */ ||
                type == 8 /* COMMENT */ ||
                (type == 1 && getComputedDisplay(node, win) == "none");
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // Possibly overengineered caching system to prevent repeated DOM calls slowing everything down

        function Cache() {
            this.store = {};
        }

        Cache.prototype = {
            get: function(key) {
                return this.store.hasOwnProperty(key) ? this.store[key] : null;
            },

            set: function(key, value) {
                return this.store[key] = value;
            }
        };

        var cachedCount = 0, uncachedCount = 0;

        function createCachingGetter(methodName, func, objProperty) {
            return function(args) {
                var cache = this.cache;
                if (cache.hasOwnProperty(methodName)) {
                    cachedCount++;
                    return cache[methodName];
                } else {
                    uncachedCount++;
                    var value = func.call(this, objProperty ? this[objProperty] : this, args);
                    cache[methodName] = value;
                    return value;
                }
            };
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        function NodeWrapper(node, session) {
            this.node = node;
            this.session = session;
            this.cache = new Cache();
            this.positions = new Cache();
        }

        var nodeProto = {
            getPosition: function(offset) {
                var positions = this.positions;
                return positions.get(offset) || positions.set(offset, new Position(this, offset));
            },

            toString: function() {
                return "[NodeWrapper(" + dom.inspectNode(this.node) + ")]";
            }
        };

        NodeWrapper.prototype = nodeProto;

        var EMPTY = "EMPTY",
            NON_SPACE = "NON_SPACE",
            UNCOLLAPSIBLE_SPACE = "UNCOLLAPSIBLE_SPACE",
            COLLAPSIBLE_SPACE = "COLLAPSIBLE_SPACE",
            TRAILING_SPACE_BEFORE_BLOCK = "TRAILING_SPACE_BEFORE_BLOCK",
            TRAILING_SPACE_IN_BLOCK = "TRAILING_SPACE_IN_BLOCK",
            TRAILING_SPACE_BEFORE_BR = "TRAILING_SPACE_BEFORE_BR",
            PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK = "PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK",
            TRAILING_LINE_BREAK_AFTER_BR = "TRAILING_LINE_BREAK_AFTER_BR",
            INCLUDED_TRAILING_LINE_BREAK_AFTER_BR = "INCLUDED_TRAILING_LINE_BREAK_AFTER_BR";

        extend(nodeProto, {
            isCharacterDataNode: createCachingGetter("isCharacterDataNode", dom.isCharacterDataNode, "node"),
            getNodeIndex: createCachingGetter("nodeIndex", dom.getNodeIndex, "node"),
            getLength: createCachingGetter("nodeLength", dom.getNodeLength, "node"),
            containsPositions: createCachingGetter("containsPositions", containsPositions, "node"),
            isWhitespace: createCachingGetter("isWhitespace", isWhitespaceNode, "node"),
            isCollapsedWhitespace: createCachingGetter("isCollapsedWhitespace", isCollapsedWhitespaceNode, "node"),
            getComputedDisplay: createCachingGetter("computedDisplay", getComputedDisplay, "node"),
            isCollapsed: createCachingGetter("collapsed", isCollapsedNode, "node"),
            isIgnored: createCachingGetter("ignored", isIgnoredNode, "node"),
            next: createCachingGetter("nextPos", nextNode, "node"),
            previous: createCachingGetter("previous", previousNode, "node"),

            getTextNodeInfo: createCachingGetter("textNodeInfo", function(textNode) {
                var spaceRegex = null, collapseSpaces = false;
                var cssWhitespace = getComputedStyleProperty(textNode.parentNode, "whiteSpace");
                var preLine = (cssWhitespace == "pre-line");
                if (preLine) {
                    spaceRegex = spacesMinusLineBreaksRegex;
                    collapseSpaces = true;
                } else if (cssWhitespace == "normal" || cssWhitespace == "nowrap") {
                    spaceRegex = spacesRegex;
                    collapseSpaces = true;
                }

                return {
                    node: textNode,
                    text: textNode.data,
                    spaceRegex: spaceRegex,
                    collapseSpaces: collapseSpaces,
                    preLine: preLine
                };
            }, "node"),

            hasInnerText: createCachingGetter("hasInnerText", function(el, backward) {
                var session = this.session;
                var posAfterEl = session.getPosition(el.parentNode, this.getNodeIndex() + 1);
                var firstPosInEl = session.getPosition(el, 0);

                var pos = backward ? posAfterEl : firstPosInEl;
                var endPos = backward ? firstPosInEl : posAfterEl;

                /*
                 <body><p>X  </p><p>Y</p></body>

                 Positions:

                 body:0:""
                 p:0:""
                 text:0:""
                 text:1:"X"
                 text:2:TRAILING_SPACE_IN_BLOCK
                 text:3:COLLAPSED_SPACE
                 p:1:""
                 body:1:"\n"
                 p:0:""
                 text:0:""
                 text:1:"Y"

                 A character is a TRAILING_SPACE_IN_BLOCK iff:

                 - There is no uncollapsed character after it within the visible containing block element

                 A character is a TRAILING_SPACE_BEFORE_BR iff:

                 - There is no uncollapsed character after it preceding a <br> element

                 An element has inner text iff

                 - It is not hidden
                 - It contains an uncollapsed character

                 All trailing spaces (pre-line, before <br>, end of block) require definite non-empty characters to render.
                 */

                while (pos !== endPos) {
                    pos.prepopulateChar();
                    if (pos.isDefinitelyNonEmpty()) {
                        return true;
                    }
                    pos = backward ? pos.previousVisible() : pos.nextVisible();
                }

                return false;
            }, "node"),

            isRenderedBlock: createCachingGetter("isRenderedBlock", function(el) {
                // Ensure that a block element containing a <br> is considered to have inner text
                var brs = el.getElementsByTagName("br");
                for (var i = 0, len = brs.length; i < len; ++i) {
                    if (!isCollapsedNode(brs[i])) {
                        return true;
                    }
                }
                return this.hasInnerText();
            }, "node"),

            getTrailingSpace: createCachingGetter("trailingSpace", function(el) {
                if (el.tagName.toLowerCase() == "br") {
                    return "";
                } else {
                    switch (this.getComputedDisplay()) {
                        case "inline":
                            var child = el.lastChild;
                            while (child) {
                                if (!isIgnoredNode(child)) {
                                    return (child.nodeType == 1) ? this.session.getNodeWrapper(child).getTrailingSpace() : "";
                                }
                                child = child.previousSibling;
                            }
                            break;
                        case "inline-block":
                        case "inline-table":
                        case "none":
                        case "table-column":
                        case "table-column-group":
                            break;
                        case "table-cell":
                            return "\t";
                        default:
                            return this.isRenderedBlock(true) ? "\n" : "";
                    }
                }
                return "";
            }, "node"),

            getLeadingSpace: createCachingGetter("leadingSpace", function(el) {
                switch (this.getComputedDisplay()) {
                    case "inline":
                    case "inline-block":
                    case "inline-table":
                    case "none":
                    case "table-column":
                    case "table-column-group":
                    case "table-cell":
                        break;
                    default:
                        return this.isRenderedBlock(false) ? "\n" : "";
                }
                return "";
            }, "node")
        });

        /*----------------------------------------------------------------------------------------------------------------*/

        function Position(nodeWrapper, offset) {
            this.offset = offset;
            this.nodeWrapper = nodeWrapper;
            this.node = nodeWrapper.node;
            this.session = nodeWrapper.session;
            this.cache = new Cache();
        }

        function inspectPosition() {
            return "[Position(" + dom.inspectNode(this.node) + ":" + this.offset + ")]";
        }

        var positionProto = {
            character: "",
            characterType: EMPTY,
            isBr: false,

            /*
            This method:
            - Fully populates positions that have characters that can be determined independently of any other characters.
            - Populates most types of space positions with a provisional character. The character is finalized later.
             */
            prepopulateChar: function() {
                var pos = this;
                if (!pos.prepopulatedChar) {
                    var node = pos.node, offset = pos.offset;
                    var visibleChar = "", charType = EMPTY;
                    var finalizedChar = false;
                    if (offset > 0) {
                        if (node.nodeType == 3) {
                            var text = node.data;
                            var textChar = text.charAt(offset - 1);

                            var nodeInfo = pos.nodeWrapper.getTextNodeInfo();
                            var spaceRegex = nodeInfo.spaceRegex;
                            if (nodeInfo.collapseSpaces) {
                                if (spaceRegex.test(textChar)) {
                                    // "If the character at position is from set, append a single space (U+0020) to newdata and advance
                                    // position until the character at position is not from set."

                                    // We also need to check for the case where we're in a pre-line and we have a space preceding a
                                    // line break, because such spaces are collapsed in some browsers
                                    if (offset > 1 && spaceRegex.test(text.charAt(offset - 2))) {
                                    } else if (nodeInfo.preLine && text.charAt(offset) === "\n") {
                                        visibleChar = " ";
                                        charType = PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK;
                                    } else {
                                        visibleChar = " ";
                                        //pos.checkForFollowingLineBreak = true;
                                        charType = COLLAPSIBLE_SPACE;
                                    }
                                } else {
                                    visibleChar = textChar;
                                    charType = NON_SPACE;
                                    finalizedChar = true;
                                }
                            } else {
                                visibleChar = textChar;
                                charType = UNCOLLAPSIBLE_SPACE;
                                finalizedChar = true;
                            }
                        } else {
                            var nodePassed = node.childNodes[offset - 1];
                            if (nodePassed && nodePassed.nodeType == 1 && !isCollapsedNode(nodePassed)) {
                                if (nodePassed.tagName.toLowerCase() == "br") {
                                    visibleChar = "\n";
                                    pos.isBr = true;
                                    charType = COLLAPSIBLE_SPACE;
                                    finalizedChar = false;
                                } else {
                                    pos.checkForTrailingSpace = true;
                                }
                            }

                            // Check the leading space of the next node for the case when a block element follows an inline
                            // element or text node. In that case, there is an implied line break between the two nodes.
                            if (!visibleChar) {
                                var nextNode = node.childNodes[offset];
                                if (nextNode && nextNode.nodeType == 1 && !isCollapsedNode(nextNode)) {
                                    pos.checkForLeadingSpace = true;
                                }
                            }
                        }
                    }

                    pos.prepopulatedChar = true;
                    pos.character = visibleChar;
                    pos.characterType = charType;
                    pos.isCharInvariant = finalizedChar;
                }
            },

            isDefinitelyNonEmpty: function() {
                var charType = this.characterType;
                return charType == NON_SPACE || charType == UNCOLLAPSIBLE_SPACE;
            },

            // Resolve leading and trailing spaces, which may involve prepopulating other positions
            resolveLeadingAndTrailingSpaces: function() {
                if (!this.prepopulatedChar) {
                    this.prepopulateChar();
                }
                if (this.checkForTrailingSpace) {
                    var trailingSpace = this.session.getNodeWrapper(this.node.childNodes[this.offset - 1]).getTrailingSpace();
                    if (trailingSpace) {
                        this.isTrailingSpace = true;
                        this.character = trailingSpace;
                        this.characterType = COLLAPSIBLE_SPACE;
                    }
                    this.checkForTrailingSpace = false;
                }
                if (this.checkForLeadingSpace) {
                    var leadingSpace = this.session.getNodeWrapper(this.node.childNodes[this.offset]).getLeadingSpace();
                    if (leadingSpace) {
                        this.isLeadingSpace = true;
                        this.character = leadingSpace;
                        this.characterType = COLLAPSIBLE_SPACE;
                    }
                    this.checkForLeadingSpace = false;
                }
            },

            getPrecedingUncollapsedPosition: function(characterOptions) {
                var pos = this, character;
                while ( (pos = pos.previousVisible()) ) {
                    character = pos.getCharacter(characterOptions);
                    if (character !== "") {
                        return pos;
                    }
                }

                return null;
            },

            getCharacter: function(characterOptions) {
                this.resolveLeadingAndTrailingSpaces();

                var thisChar = this.character, returnChar;

                // Check if character is ignored
                var ignoredChars = normalizeIgnoredCharacters(characterOptions.ignoreCharacters);
                var isIgnoredCharacter = (thisChar !== "" && ignoredChars.indexOf(thisChar) > -1);

                // Check if this position's  character is invariant (i.e. not dependent on character options) and return it
                // if so
                if (this.isCharInvariant) {
                    returnChar = isIgnoredCharacter ? "" : thisChar;
                    return returnChar;
                }

                var cacheKey = ["character", characterOptions.includeSpaceBeforeBr, characterOptions.includeBlockContentTrailingSpace, characterOptions.includePreLineTrailingSpace, ignoredChars].join("_");
                var cachedChar = this.cache.get(cacheKey);
                if (cachedChar !== null) {
                    return cachedChar;
                }

                // We need to actually get the character now
                var character = "";
                var collapsible = (this.characterType == COLLAPSIBLE_SPACE);

                var nextPos, previousPos;
                var gotPreviousPos = false;
                var pos = this;

                function getPreviousPos() {
                    if (!gotPreviousPos) {
                        previousPos = pos.getPrecedingUncollapsedPosition(characterOptions);
                        gotPreviousPos = true;
                    }
                    return previousPos;
                }

                // Disallow a collapsible space that is followed by a line break or is the last character
                if (collapsible) {
                    // Allow a trailing space that we've previously determined should be included
                    if (this.type == INCLUDED_TRAILING_LINE_BREAK_AFTER_BR) {
                        character = "\n";
                    }
                    // Disallow a collapsible space that follows a trailing space or line break, or is the first character,
                    // or follows a collapsible included space
                    else if (thisChar == " " &&
                            (!getPreviousPos() || previousPos.isTrailingSpace || previousPos.character == "\n" || (previousPos.character == " " && previousPos.characterType == COLLAPSIBLE_SPACE))) {
                    }
                    // Allow a leading line break unless it follows a line break
                    else if (thisChar == "\n" && this.isLeadingSpace) {
                        if (getPreviousPos() && previousPos.character != "\n") {
                            character = "\n";
                        } else {
                        }
                    } else {
                        nextPos = this.nextUncollapsed();
                        if (nextPos) {
                            if (nextPos.isBr) {
                                this.type = TRAILING_SPACE_BEFORE_BR;
                            } else if (nextPos.isTrailingSpace && nextPos.character == "\n") {
                                this.type = TRAILING_SPACE_IN_BLOCK;
                            } else if (nextPos.isLeadingSpace && nextPos.character == "\n") {
                                this.type = TRAILING_SPACE_BEFORE_BLOCK;
                            }

                            if (nextPos.character == "\n") {
                                if (this.type == TRAILING_SPACE_BEFORE_BR && !characterOptions.includeSpaceBeforeBr) {
                                } else if (this.type == TRAILING_SPACE_BEFORE_BLOCK && !characterOptions.includeSpaceBeforeBlock) {
                                } else if (this.type == TRAILING_SPACE_IN_BLOCK && nextPos.isTrailingSpace && !characterOptions.includeBlockContentTrailingSpace) {
                                } else if (this.type == PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK && nextPos.type == NON_SPACE && !characterOptions.includePreLineTrailingSpace) {
                                } else if (thisChar == "\n") {
                                    if (nextPos.isTrailingSpace) {
                                        if (this.isTrailingSpace) {
                                        } else if (this.isBr) {
                                            nextPos.type = TRAILING_LINE_BREAK_AFTER_BR;

                                            if (getPreviousPos() && previousPos.isLeadingSpace && !previousPos.isTrailingSpace && previousPos.character == "\n") {
                                                nextPos.character = "";
                                            } else {
                                                nextPos.type = INCLUDED_TRAILING_LINE_BREAK_AFTER_BR;
                                            }
                                        }
                                    } else {
                                        character = "\n";
                                    }
                                } else if (thisChar == " ") {
                                    character = " ";
                                } else {
                                }
                            } else {
                                character = thisChar;
                            }
                        } else {
                        }
                    }
                }

                if (ignoredChars.indexOf(character) > -1) {
                    character = "";
                }


                this.cache.set(cacheKey, character);

                return character;
            },

            equals: function(pos) {
                return !!pos && this.node === pos.node && this.offset === pos.offset;
            },

            inspect: inspectPosition,

            toString: function() {
                return this.character;
            }
        };

        Position.prototype = positionProto;

        extend(positionProto, {
            next: createCachingGetter("nextPos", function(pos) {
                var nodeWrapper = pos.nodeWrapper, node = pos.node, offset = pos.offset, session = nodeWrapper.session;
                if (!node) {
                    return null;
                }
                var nextNode, nextOffset, child;
                if (offset == nodeWrapper.getLength()) {
                    // Move onto the next node
                    nextNode = node.parentNode;
                    nextOffset = nextNode ? nodeWrapper.getNodeIndex() + 1 : 0;
                } else {
                    if (nodeWrapper.isCharacterDataNode()) {
                        nextNode = node;
                        nextOffset = offset + 1;
                    } else {
                        child = node.childNodes[offset];
                        // Go into the children next, if children there are
                        if (session.getNodeWrapper(child).containsPositions()) {
                            nextNode = child;
                            nextOffset = 0;
                        } else {
                            nextNode = node;
                            nextOffset = offset + 1;
                        }
                    }
                }

                return nextNode ? session.getPosition(nextNode, nextOffset) : null;
            }),

            previous: createCachingGetter("previous", function(pos) {
                var nodeWrapper = pos.nodeWrapper, node = pos.node, offset = pos.offset, session = nodeWrapper.session;
                var previousNode, previousOffset, child;
                if (offset == 0) {
                    previousNode = node.parentNode;
                    previousOffset = previousNode ? nodeWrapper.getNodeIndex() : 0;
                } else {
                    if (nodeWrapper.isCharacterDataNode()) {
                        previousNode = node;
                        previousOffset = offset - 1;
                    } else {
                        child = node.childNodes[offset - 1];
                        // Go into the children next, if children there are
                        if (session.getNodeWrapper(child).containsPositions()) {
                            previousNode = child;
                            previousOffset = dom.getNodeLength(child);
                        } else {
                            previousNode = node;
                            previousOffset = offset - 1;
                        }
                    }
                }
                return previousNode ? session.getPosition(previousNode, previousOffset) : null;
            }),

            /*
             Next and previous position moving functions that filter out

             - Hidden (CSS visibility/display) elements
             - Script and style elements
             */
            nextVisible: createCachingGetter("nextVisible", function(pos) {
                var next = pos.next();
                if (!next) {
                    return null;
                }
                var nodeWrapper = next.nodeWrapper, node = next.node;
                var newPos = next;
                if (nodeWrapper.isCollapsed()) {
                    // We're skipping this node and all its descendants
                    newPos = nodeWrapper.session.getPosition(node.parentNode, nodeWrapper.getNodeIndex() + 1);
                }
                return newPos;
            }),

            nextUncollapsed: createCachingGetter("nextUncollapsed", function(pos) {
                var nextPos = pos;
                while ( (nextPos = nextPos.nextVisible()) ) {
                    nextPos.resolveLeadingAndTrailingSpaces();
                    if (nextPos.character !== "") {
                        return nextPos;
                    }
                }
                return null;
            }),

            previousVisible: createCachingGetter("previousVisible", function(pos) {
                var previous = pos.previous();
                if (!previous) {
                    return null;
                }
                var nodeWrapper = previous.nodeWrapper, node = previous.node;
                var newPos = previous;
                if (nodeWrapper.isCollapsed()) {
                    // We're skipping this node and all its descendants
                    newPos = nodeWrapper.session.getPosition(node.parentNode, nodeWrapper.getNodeIndex());
                }
                return newPos;
            })
        });

        /*----------------------------------------------------------------------------------------------------------------*/

        var currentSession = null;

        var Session = (function() {
            function createWrapperCache(nodeProperty) {
                var cache = new Cache();

                return {
                    get: function(node) {
                        var wrappersByProperty = cache.get(node[nodeProperty]);
                        if (wrappersByProperty) {
                            for (var i = 0, wrapper; wrapper = wrappersByProperty[i++]; ) {
                                if (wrapper.node === node) {
                                    return wrapper;
                                }
                            }
                        }
                        return null;
                    },

                    set: function(nodeWrapper) {
                        var property = nodeWrapper.node[nodeProperty];
                        var wrappersByProperty = cache.get(property) || cache.set(property, []);
                        wrappersByProperty.push(nodeWrapper);
                    }
                };
            }

            var uniqueIDSupported = util.isHostProperty(document.documentElement, "uniqueID");

            function Session() {
                this.initCaches();
            }

            Session.prototype = {
                initCaches: function() {
                    this.elementCache = uniqueIDSupported ? (function() {
                        var elementsCache = new Cache();

                        return {
                            get: function(el) {
                                return elementsCache.get(el.uniqueID);
                            },

                            set: function(elWrapper) {
                                elementsCache.set(elWrapper.node.uniqueID, elWrapper);
                            }
                        };
                    })() : createWrapperCache("tagName");

                    // Store text nodes keyed by data, although we may need to truncate this
                    this.textNodeCache = createWrapperCache("data");
                    this.otherNodeCache = createWrapperCache("nodeName");
                },

                getNodeWrapper: function(node) {
                    var wrapperCache;
                    switch (node.nodeType) {
                        case 1:
                            wrapperCache = this.elementCache;
                            break;
                        case 3:
                            wrapperCache = this.textNodeCache;
                            break;
                        default:
                            wrapperCache = this.otherNodeCache;
                            break;
                    }

                    var wrapper = wrapperCache.get(node);
                    if (!wrapper) {
                        wrapper = new NodeWrapper(node, this);
                        wrapperCache.set(wrapper);
                    }
                    return wrapper;
                },

                getPosition: function(node, offset) {
                    return this.getNodeWrapper(node).getPosition(offset);
                },

                getRangeBoundaryPosition: function(range, isStart) {
                    var prefix = isStart ? "start" : "end";
                    return this.getPosition(range[prefix + "Container"], range[prefix + "Offset"]);
                },

                detach: function() {
                    this.elementCache = this.textNodeCache = this.otherNodeCache = null;
                }
            };

            return Session;
        })();

        /*----------------------------------------------------------------------------------------------------------------*/

        function startSession() {
            endSession();
            return (currentSession = new Session());
        }

        function getSession() {
            return currentSession || startSession();
        }

        function endSession() {
            if (currentSession) {
                currentSession.detach();
            }
            currentSession = null;
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // Extensions to the rangy.dom utility object

        extend(dom, {
            nextNode: nextNode,
            previousNode: previousNode
        });

        /*----------------------------------------------------------------------------------------------------------------*/

        function createCharacterIterator(startPos, backward, endPos, characterOptions) {

            // Adjust the end position to ensure that it is actually reached
            if (endPos) {
                if (backward) {
                    if (isCollapsedNode(endPos.node)) {
                        endPos = startPos.previousVisible();
                    }
                } else {
                    if (isCollapsedNode(endPos.node)) {
                        endPos = endPos.nextVisible();
                    }
                }
            }

            var pos = startPos, finished = false;

            function next() {
                var charPos = null;
                if (backward) {
                    charPos = pos;
                    if (!finished) {
                        pos = pos.previousVisible();
                        finished = !pos || (endPos && pos.equals(endPos));
                    }
                } else {
                    if (!finished) {
                        charPos = pos = pos.nextVisible();
                        finished = !pos || (endPos && pos.equals(endPos));
                    }
                }
                if (finished) {
                    pos = null;
                }
                return charPos;
            }

            var previousTextPos, returnPreviousTextPos = false;

            return {
                next: function() {
                    if (returnPreviousTextPos) {
                        returnPreviousTextPos = false;
                        return previousTextPos;
                    } else {
                        var pos, character;
                        while ( (pos = next()) ) {
                            character = pos.getCharacter(characterOptions);
                            if (character) {
                                previousTextPos = pos;
                                return pos;
                            }
                        }
                        return null;
                    }
                },

                rewind: function() {
                    if (previousTextPos) {
                        returnPreviousTextPos = true;
                    } else {
                        throw module.createError("createCharacterIterator: cannot rewind. Only one position can be rewound.");
                    }
                },

                dispose: function() {
                    startPos = endPos = null;
                }
            };
        }

        var arrayIndexOf = Array.prototype.indexOf ?
            function(arr, val) {
                return arr.indexOf(val);
            } :
            function(arr, val) {
                for (var i = 0, len = arr.length; i < len; ++i) {
                    if (arr[i] === val) {
                        return i;
                    }
                }
                return -1;
            };

        // Provides a pair of iterators over text positions, tokenized. Transparently requests more text when next()
        // is called and there is no more tokenized text
        function createTokenizedTextProvider(pos, characterOptions, wordOptions) {
            var forwardIterator = createCharacterIterator(pos, false, null, characterOptions);
            var backwardIterator = createCharacterIterator(pos, true, null, characterOptions);
            var tokenizer = wordOptions.tokenizer;

            // Consumes a word and the whitespace beyond it
            function consumeWord(forward) {
                var pos, textChar;
                var newChars = [], it = forward ? forwardIterator : backwardIterator;

                var passedWordBoundary = false, insideWord = false;

                while ( (pos = it.next()) ) {
                    textChar = pos.character;


                    if (allWhiteSpaceRegex.test(textChar)) {
                        if (insideWord) {
                            insideWord = false;
                            passedWordBoundary = true;
                        }
                    } else {
                        if (passedWordBoundary) {
                            it.rewind();
                            break;
                        } else {
                            insideWord = true;
                        }
                    }
                    newChars.push(pos);
                }


                return newChars;
            }

            // Get initial word surrounding initial position and tokenize it
            var forwardChars = consumeWord(true);
            var backwardChars = consumeWord(false).reverse();
            var tokens = tokenize(backwardChars.concat(forwardChars), wordOptions, tokenizer);

            // Create initial token buffers
            var forwardTokensBuffer = forwardChars.length ?
                tokens.slice(arrayIndexOf(tokens, forwardChars[0].token)) : [];

            var backwardTokensBuffer = backwardChars.length ?
                tokens.slice(0, arrayIndexOf(tokens, backwardChars.pop().token) + 1) : [];

            function inspectBuffer(buffer) {
                var textPositions = ["[" + buffer.length + "]"];
                for (var i = 0; i < buffer.length; ++i) {
                    textPositions.push("(word: " + buffer[i] + ", is word: " + buffer[i].isWord + ")");
                }
                return textPositions;
            }


            return {
                nextEndToken: function() {
                    var lastToken, forwardChars;

                    // If we're down to the last token, consume character chunks until we have a word or run out of
                    // characters to consume
                    while ( forwardTokensBuffer.length == 1 &&
                        !(lastToken = forwardTokensBuffer[0]).isWord &&
                        (forwardChars = consumeWord(true)).length > 0) {

                        // Merge trailing non-word into next word and tokenize
                        forwardTokensBuffer = tokenize(lastToken.chars.concat(forwardChars), wordOptions, tokenizer);
                    }

                    return forwardTokensBuffer.shift();
                },

                previousStartToken: function() {
                    var lastToken, backwardChars;

                    // If we're down to the last token, consume character chunks until we have a word or run out of
                    // characters to consume
                    while ( backwardTokensBuffer.length == 1 &&
                        !(lastToken = backwardTokensBuffer[0]).isWord &&
                        (backwardChars = consumeWord(false)).length > 0) {

                        // Merge leading non-word into next word and tokenize
                        backwardTokensBuffer = tokenize(backwardChars.reverse().concat(lastToken.chars), wordOptions, tokenizer);
                    }

                    return backwardTokensBuffer.pop();
                },

                dispose: function() {
                    forwardIterator.dispose();
                    backwardIterator.dispose();
                    forwardTokensBuffer = backwardTokensBuffer = null;
                }
            };
        }

        function movePositionBy(pos, unit, count, characterOptions, wordOptions) {
            var unitsMoved = 0, currentPos, newPos = pos, charIterator, nextPos, absCount = Math.abs(count), token;
            if (count !== 0) {
                var backward = (count < 0);

                switch (unit) {
                    case CHARACTER:
                        charIterator = createCharacterIterator(pos, backward, null, characterOptions);
                        while ( (currentPos = charIterator.next()) && unitsMoved < absCount ) {
                            ++unitsMoved;
                            newPos = currentPos;
                        }
                        nextPos = currentPos;
                        charIterator.dispose();
                        break;
                    case WORD:
                        var tokenizedTextProvider = createTokenizedTextProvider(pos, characterOptions, wordOptions);
                        var next = backward ? tokenizedTextProvider.previousStartToken : tokenizedTextProvider.nextEndToken;

                        while ( (token = next()) && unitsMoved < absCount ) {
                            if (token.isWord) {
                                ++unitsMoved;
                                newPos = backward ? token.chars[0] : token.chars[token.chars.length - 1];
                            }
                        }
                        break;
                    default:
                        throw new Error("movePositionBy: unit '" + unit + "' not implemented");
                }

                // Perform any necessary position tweaks
                if (backward) {
                    newPos = newPos.previousVisible();
                    unitsMoved = -unitsMoved;
                } else if (newPos && newPos.isLeadingSpace && !newPos.isTrailingSpace) {
                    // Tweak the position for the case of a leading space. The problem is that an uncollapsed leading space
                    // before a block element (for example, the line break between "1" and "2" in the following HTML:
                    // "1<p>2</p>") is considered to be attached to the position immediately before the block element, which
                    // corresponds with a different selection position in most browsers from the one we want (i.e. at the
                    // start of the contents of the block element). We get round this by advancing the position returned to
                    // the last possible equivalent visible position.
                    if (unit == WORD) {
                        charIterator = createCharacterIterator(pos, false, null, characterOptions);
                        nextPos = charIterator.next();
                        charIterator.dispose();
                    }
                    if (nextPos) {
                        newPos = nextPos.previousVisible();
                    }
                }
            }


            return {
                position: newPos,
                unitsMoved: unitsMoved
            };
        }

        function createRangeCharacterIterator(session, range, characterOptions, backward) {
            var rangeStart = session.getRangeBoundaryPosition(range, true);
            var rangeEnd = session.getRangeBoundaryPosition(range, false);
            var itStart = backward ? rangeEnd : rangeStart;
            var itEnd = backward ? rangeStart : rangeEnd;

            return createCharacterIterator(itStart, !!backward, itEnd, characterOptions);
        }

        function getRangeCharacters(session, range, characterOptions) {

            var chars = [], it = createRangeCharacterIterator(session, range, characterOptions), pos;
            while ( (pos = it.next()) ) {
                chars.push(pos);
            }

            it.dispose();
            return chars;
        }

        function isWholeWord(startPos, endPos, wordOptions) {
            var range = api.createRange(startPos.node);
            range.setStartAndEnd(startPos.node, startPos.offset, endPos.node, endPos.offset);
            return !range.expand("word", { wordOptions: wordOptions });
        }

        function findTextFromPosition(initialPos, searchTerm, isRegex, searchScopeRange, findOptions) {
            var backward = isDirectionBackward(findOptions.direction);
            var it = createCharacterIterator(
                initialPos,
                backward,
                initialPos.session.getRangeBoundaryPosition(searchScopeRange, backward),
                findOptions.characterOptions
            );
            var text = "", chars = [], pos, currentChar, matchStartIndex, matchEndIndex;
            var result, insideRegexMatch;
            var returnValue = null;

            function handleMatch(startIndex, endIndex) {
                var startPos = chars[startIndex].previousVisible();
                var endPos = chars[endIndex - 1];
                var valid = (!findOptions.wholeWordsOnly || isWholeWord(startPos, endPos, findOptions.wordOptions));

                return {
                    startPos: startPos,
                    endPos: endPos,
                    valid: valid
                };
            }

            while ( (pos = it.next()) ) {
                currentChar = pos.character;
                if (!isRegex && !findOptions.caseSensitive) {
                    currentChar = currentChar.toLowerCase();
                }

                if (backward) {
                    chars.unshift(pos);
                    text = currentChar + text;
                } else {
                    chars.push(pos);
                    text += currentChar;
                }

                if (isRegex) {
                    result = searchTerm.exec(text);
                    if (result) {
                        matchStartIndex = result.index;
                        matchEndIndex = matchStartIndex + result[0].length;
                        if (insideRegexMatch) {
                            // Check whether the match is now over
                            if ((!backward && matchEndIndex < text.length) || (backward && matchStartIndex > 0)) {
                                returnValue = handleMatch(matchStartIndex, matchEndIndex);
                                break;
                            }
                        } else {
                            insideRegexMatch = true;
                        }
                    }
                } else if ( (matchStartIndex = text.indexOf(searchTerm)) != -1 ) {
                    returnValue = handleMatch(matchStartIndex, matchStartIndex + searchTerm.length);
                    break;
                }
            }

            // Check whether regex match extends to the end of the range
            if (insideRegexMatch) {
                returnValue = handleMatch(matchStartIndex, matchEndIndex);
            }
            it.dispose();

            return returnValue;
        }

        function createEntryPointFunction(func) {
            return function() {
                var sessionRunning = !!currentSession;
                var session = getSession();
                var args = [session].concat( util.toArray(arguments) );
                var returnValue = func.apply(this, args);
                if (!sessionRunning) {
                    endSession();
                }
                return returnValue;
            };
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // Extensions to the Rangy Range object

        function createRangeBoundaryMover(isStart, collapse) {
            /*
             Unit can be "character" or "word"
             Options:

             - includeTrailingSpace
             - wordRegex
             - tokenizer
             - collapseSpaceBeforeLineBreak
             */
            return createEntryPointFunction(
                function(session, unit, count, moveOptions) {
                    if (typeof count == UNDEF) {
                        count = unit;
                        unit = CHARACTER;
                    }
                    moveOptions = createNestedOptions(moveOptions, defaultMoveOptions);

                    var boundaryIsStart = isStart;
                    if (collapse) {
                        boundaryIsStart = (count >= 0);
                        this.collapse(!boundaryIsStart);
                    }
                    var moveResult = movePositionBy(session.getRangeBoundaryPosition(this, boundaryIsStart), unit, count, moveOptions.characterOptions, moveOptions.wordOptions);
                    var newPos = moveResult.position;
                    this[boundaryIsStart ? "setStart" : "setEnd"](newPos.node, newPos.offset);
                    return moveResult.unitsMoved;
                }
            );
        }

        function createRangeTrimmer(isStart) {
            return createEntryPointFunction(
                function(session, characterOptions) {
                    characterOptions = createOptions(characterOptions, defaultCharacterOptions);
                    var pos;
                    var it = createRangeCharacterIterator(session, this, characterOptions, !isStart);
                    var trimCharCount = 0;
                    while ( (pos = it.next()) && allWhiteSpaceRegex.test(pos.character) ) {
                        ++trimCharCount;
                    }
                    it.dispose();
                    var trimmed = (trimCharCount > 0);
                    if (trimmed) {
                        this[isStart ? "moveStart" : "moveEnd"](
                            "character",
                            isStart ? trimCharCount : -trimCharCount,
                            { characterOptions: characterOptions }
                        );
                    }
                    return trimmed;
                }
            );
        }

        extend(api.rangePrototype, {
            moveStart: createRangeBoundaryMover(true, false),

            moveEnd: createRangeBoundaryMover(false, false),

            move: createRangeBoundaryMover(true, true),

            trimStart: createRangeTrimmer(true),

            trimEnd: createRangeTrimmer(false),

            trim: createEntryPointFunction(
                function(session, characterOptions) {
                    var startTrimmed = this.trimStart(characterOptions), endTrimmed = this.trimEnd(characterOptions);
                    return startTrimmed || endTrimmed;
                }
            ),

            expand: createEntryPointFunction(
                function(session, unit, expandOptions) {
                    var moved = false;
                    expandOptions = createNestedOptions(expandOptions, defaultExpandOptions);
                    var characterOptions = expandOptions.characterOptions;
                    if (!unit) {
                        unit = CHARACTER;
                    }
                    if (unit == WORD) {
                        var wordOptions = expandOptions.wordOptions;
                        var startPos = session.getRangeBoundaryPosition(this, true);
                        var endPos = session.getRangeBoundaryPosition(this, false);

                        var startTokenizedTextProvider = createTokenizedTextProvider(startPos, characterOptions, wordOptions);
                        var startToken = startTokenizedTextProvider.nextEndToken();
                        var newStartPos = startToken.chars[0].previousVisible();
                        var endToken, newEndPos;

                        if (this.collapsed) {
                            endToken = startToken;
                        } else {
                            var endTokenizedTextProvider = createTokenizedTextProvider(endPos, characterOptions, wordOptions);
                            endToken = endTokenizedTextProvider.previousStartToken();
                        }
                        newEndPos = endToken.chars[endToken.chars.length - 1];

                        if (!newStartPos.equals(startPos)) {
                            this.setStart(newStartPos.node, newStartPos.offset);
                            moved = true;
                        }
                        if (newEndPos && !newEndPos.equals(endPos)) {
                            this.setEnd(newEndPos.node, newEndPos.offset);
                            moved = true;
                        }

                        if (expandOptions.trim) {
                            if (expandOptions.trimStart) {
                                moved = this.trimStart(characterOptions) || moved;
                            }
                            if (expandOptions.trimEnd) {
                                moved = this.trimEnd(characterOptions) || moved;
                            }
                        }

                        return moved;
                    } else {
                        return this.moveEnd(CHARACTER, 1, expandOptions);
                    }
                }
            ),

            text: createEntryPointFunction(
                function(session, characterOptions) {
                    return this.collapsed ?
                        "" : getRangeCharacters(session, this, createOptions(characterOptions, defaultCharacterOptions)).join("");
                }
            ),

            selectCharacters: createEntryPointFunction(
                function(session, containerNode, startIndex, endIndex, characterOptions) {
                    var moveOptions = { characterOptions: characterOptions };
                    if (!containerNode) {
                        containerNode = getBody( this.getDocument() );
                    }
                    this.selectNodeContents(containerNode);
                    this.collapse(true);
                    this.moveStart("character", startIndex, moveOptions);
                    this.collapse(true);
                    this.moveEnd("character", endIndex - startIndex, moveOptions);
                }
            ),

            // Character indexes are relative to the start of node
            toCharacterRange: createEntryPointFunction(
                function(session, containerNode, characterOptions) {
                    if (!containerNode) {
                        containerNode = getBody( this.getDocument() );
                    }
                    var parent = containerNode.parentNode, nodeIndex = dom.getNodeIndex(containerNode);
                    var rangeStartsBeforeNode = (dom.comparePoints(this.startContainer, this.endContainer, parent, nodeIndex) == -1);
                    var rangeBetween = this.cloneRange();
                    var startIndex, endIndex;
                    if (rangeStartsBeforeNode) {
                        rangeBetween.setStartAndEnd(this.startContainer, this.startOffset, parent, nodeIndex);
                        startIndex = -rangeBetween.text(characterOptions).length;
                    } else {
                        rangeBetween.setStartAndEnd(parent, nodeIndex, this.startContainer, this.startOffset);
                        startIndex = rangeBetween.text(characterOptions).length;
                    }
                    endIndex = startIndex + this.text(characterOptions).length;

                    return {
                        start: startIndex,
                        end: endIndex
                    };
                }
            ),

            findText: createEntryPointFunction(
                function(session, searchTermParam, findOptions) {
                    // Set up options
                    findOptions = createNestedOptions(findOptions, defaultFindOptions);

                    // Create word options if we're matching whole words only
                    if (findOptions.wholeWordsOnly) {
                        // We don't ever want trailing spaces for search results
                        findOptions.wordOptions.includeTrailingSpace = false;
                    }

                    var backward = isDirectionBackward(findOptions.direction);

                    // Create a range representing the search scope if none was provided
                    var searchScopeRange = findOptions.withinRange;
                    if (!searchScopeRange) {
                        searchScopeRange = api.createRange();
                        searchScopeRange.selectNodeContents(this.getDocument());
                    }

                    // Examine and prepare the search term
                    var searchTerm = searchTermParam, isRegex = false;
                    if (typeof searchTerm == "string") {
                        if (!findOptions.caseSensitive) {
                            searchTerm = searchTerm.toLowerCase();
                        }
                    } else {
                        isRegex = true;
                    }

                    var initialPos = session.getRangeBoundaryPosition(this, !backward);

                    // Adjust initial position if it lies outside the search scope
                    var comparison = searchScopeRange.comparePoint(initialPos.node, initialPos.offset);

                    if (comparison === -1) {
                        initialPos = session.getRangeBoundaryPosition(searchScopeRange, true);
                    } else if (comparison === 1) {
                        initialPos = session.getRangeBoundaryPosition(searchScopeRange, false);
                    }

                    var pos = initialPos;
                    var wrappedAround = false;

                    // Try to find a match and ignore invalid ones
                    var findResult;
                    while (true) {
                        findResult = findTextFromPosition(pos, searchTerm, isRegex, searchScopeRange, findOptions);

                        if (findResult) {
                            if (findResult.valid) {
                                this.setStartAndEnd(findResult.startPos.node, findResult.startPos.offset, findResult.endPos.node, findResult.endPos.offset);
                                return true;
                            } else {
                                // We've found a match that is not a whole word, so we carry on searching from the point immediately
                                // after the match
                                pos = backward ? findResult.startPos : findResult.endPos;
                            }
                        } else if (findOptions.wrap && !wrappedAround) {
                            // No result found but we're wrapping around and limiting the scope to the unsearched part of the range
                            searchScopeRange = searchScopeRange.cloneRange();
                            pos = session.getRangeBoundaryPosition(searchScopeRange, !backward);
                            searchScopeRange.setBoundary(initialPos.node, initialPos.offset, backward);
                            wrappedAround = true;
                        } else {
                            // Nothing found and we can't wrap around, so we're done
                            return false;
                        }
                    }
                }
            ),

            pasteHtml: function(html) {
                this.deleteContents();
                if (html) {
                    var frag = this.createContextualFragment(html);
                    var lastChild = frag.lastChild;
                    this.insertNode(frag);
                    this.collapseAfter(lastChild);
                }
            }
        });

        /*----------------------------------------------------------------------------------------------------------------*/

        // Extensions to the Rangy Selection object

        function createSelectionTrimmer(methodName) {
            return createEntryPointFunction(
                function(session, characterOptions) {
                    var trimmed = false;
                    this.changeEachRange(function(range) {
                        trimmed = range[methodName](characterOptions) || trimmed;
                    });
                    return trimmed;
                }
            );
        }

        extend(api.selectionPrototype, {
            expand: createEntryPointFunction(
                function(session, unit, expandOptions) {
                    this.changeEachRange(function(range) {
                        range.expand(unit, expandOptions);
                    });
                }
            ),

            move: createEntryPointFunction(
                function(session, unit, count, options) {
                    var unitsMoved = 0;
                    if (this.focusNode) {
                        this.collapse(this.focusNode, this.focusOffset);
                        var range = this.getRangeAt(0);
                        if (!options) {
                            options = {};
                        }
                        options.characterOptions = createOptions(options.characterOptions, defaultCaretCharacterOptions);
                        unitsMoved = range.move(unit, count, options);
                        this.setSingleRange(range);
                    }
                    return unitsMoved;
                }
            ),

            trimStart: createSelectionTrimmer("trimStart"),
            trimEnd: createSelectionTrimmer("trimEnd"),
            trim: createSelectionTrimmer("trim"),

            selectCharacters: createEntryPointFunction(
                function(session, containerNode, startIndex, endIndex, direction, characterOptions) {
                    var range = api.createRange(containerNode);
                    range.selectCharacters(containerNode, startIndex, endIndex, characterOptions);
                    this.setSingleRange(range, direction);
                }
            ),

            saveCharacterRanges: createEntryPointFunction(
                function(session, containerNode, characterOptions) {
                    var ranges = this.getAllRanges(), rangeCount = ranges.length;
                    var rangeInfos = [];

                    var backward = rangeCount == 1 && this.isBackward();

                    for (var i = 0, len = ranges.length; i < len; ++i) {
                        rangeInfos[i] = {
                            characterRange: ranges[i].toCharacterRange(containerNode, characterOptions),
                            backward: backward,
                            characterOptions: characterOptions
                        };
                    }

                    return rangeInfos;
                }
            ),

            restoreCharacterRanges: createEntryPointFunction(
                function(session, containerNode, saved) {
                    this.removeAllRanges();
                    for (var i = 0, len = saved.length, range, rangeInfo, characterRange; i < len; ++i) {
                        rangeInfo = saved[i];
                        characterRange = rangeInfo.characterRange;
                        range = api.createRange(containerNode);
                        range.selectCharacters(containerNode, characterRange.start, characterRange.end, rangeInfo.characterOptions);
                        this.addRange(range, rangeInfo.backward);
                    }
                }
            ),

            text: createEntryPointFunction(
                function(session, characterOptions) {
                    var rangeTexts = [];
                    for (var i = 0, len = this.rangeCount; i < len; ++i) {
                        rangeTexts[i] = this.getRangeAt(i).text(characterOptions);
                    }
                    return rangeTexts.join("");
                }
            )
        });

        /*----------------------------------------------------------------------------------------------------------------*/

        // Extensions to the core rangy object

        api.innerText = function(el, characterOptions) {
            var range = api.createRange(el);
            range.selectNodeContents(el);
            var text = range.text(characterOptions);
            return text;
        };

        api.createWordIterator = function(startNode, startOffset, iteratorOptions) {
            var session = getSession();
            iteratorOptions = createNestedOptions(iteratorOptions, defaultWordIteratorOptions);
            var startPos = session.getPosition(startNode, startOffset);
            var tokenizedTextProvider = createTokenizedTextProvider(startPos, iteratorOptions.characterOptions, iteratorOptions.wordOptions);
            var backward = isDirectionBackward(iteratorOptions.direction);

            return {
                next: function() {
                    return backward ? tokenizedTextProvider.previousStartToken() : tokenizedTextProvider.nextEndToken();
                },

                dispose: function() {
                    tokenizedTextProvider.dispose();
                    this.next = function() {};
                }
            };
        };

        /*----------------------------------------------------------------------------------------------------------------*/

        api.noMutation = function(func) {
            var session = getSession();
            func(session);
            endSession();
        };

        api.noMutation.createEntryPointFunction = createEntryPointFunction;

        api.textRange = {
            isBlockNode: isBlockNode,
            isCollapsedWhitespaceNode: isCollapsedWhitespaceNode,

            createPosition: createEntryPointFunction(
                function(session, node, offset) {
                    return session.getPosition(node, offset);
                }
            )
        };
    });
    
    return rangy;
}, this);