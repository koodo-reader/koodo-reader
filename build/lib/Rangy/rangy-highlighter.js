/**
 * Highlighter module for Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Depends on Rangy core, ClassApplier and optionally TextRange modules.
 *
 * Copyright 2015, Tim Down
 * Licensed under the MIT license.
 * Version: 1.3.0
 * Build date: 10 May 2015
 */
(function (factory, root) {
  if (typeof define == "function" && define.amd) {
    // AMD. Register as an anonymous module with a dependency on Rangy.
    define(["./rangy-core"], factory);
  } else if (typeof module != "undefined" && typeof exports == "object") {
    // Node/CommonJS style
    module.exports = factory(require("rangy"));
  } else {
    // No AMD or CommonJS support so we use the rangy property of root (probably the global variable)
    factory(root.rangy);
  }
})(function (rangy) {
  rangy.createModule("Highlighter", ["ClassApplier"], function (api, module) {
    var dom = api.dom;
    var contains = dom.arrayContains;
    var getBody = dom.getBody;
    var createOptions = api.util.createOptions;
    var forEach = api.util.forEach;
    var nextHighlightId = 1;

    // Puts highlights in order, last in document first.
    function compareHighlights(h1, h2) {
      return h1.characterRange.start - h2.characterRange.start;
    }

    function getContainerElement(doc, id) {
      return id ? doc.getElementById(id) : getBody(doc);
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    var highlighterTypes = {};

    function HighlighterType(type, converterCreator) {
      this.type = type;
      this.converterCreator = converterCreator;
    }

    HighlighterType.prototype.create = function () {
      var converter = this.converterCreator();
      converter.type = this.type;
      return converter;
    };

    function registerHighlighterType(type, converterCreator) {
      highlighterTypes[type] = new HighlighterType(type, converterCreator);
    }

    function getConverter(type) {
      var highlighterType = highlighterTypes[type];
      if (highlighterType instanceof HighlighterType) {
        return highlighterType.create();
      } else {
        throw new Error("Highlighter type '" + type + "' is not valid");
      }
    }

    api.registerHighlighterType = registerHighlighterType;

    /*----------------------------------------------------------------------------------------------------------------*/

    function CharacterRange(start, end) {
      this.start = start;
      this.end = end;
    }

    CharacterRange.prototype = {
      intersects: function (charRange) {
        return this.start < charRange.end && this.end > charRange.start;
      },

      isContiguousWith: function (charRange) {
        return this.start == charRange.end || this.end == charRange.start;
      },

      union: function (charRange) {
        return new CharacterRange(
          Math.min(this.start, charRange.start),
          Math.max(this.end, charRange.end)
        );
      },

      intersection: function (charRange) {
        return new CharacterRange(
          Math.max(this.start, charRange.start),
          Math.min(this.end, charRange.end)
        );
      },

      getComplements: function (charRange) {
        var ranges = [];
        if (this.start >= charRange.start) {
          if (this.end <= charRange.end) {
            return [];
          }
          ranges.push(new CharacterRange(charRange.end, this.end));
        } else {
          ranges.push(
            new CharacterRange(this.start, Math.min(this.end, charRange.start))
          );
          if (this.end > charRange.end) {
            ranges.push(new CharacterRange(charRange.end, this.end));
          }
        }
        return ranges;
      },

      toString: function () {
        return "[CharacterRange(" + this.start + ", " + this.end + ")]";
      },
    };

    CharacterRange.fromCharacterRange = function (charRange) {
      return new CharacterRange(charRange.start, charRange.end);
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    var textContentConverter = {
      rangeToCharacterRange: function (range, containerNode) {
        var bookmark = range.getBookmark(containerNode);
        return new CharacterRange(bookmark.start, bookmark.end);
      },

      characterRangeToRange: function (doc, characterRange, containerNode) {
        var range = api.createRange(doc);
        range.moveToBookmark({
          start: characterRange.start,
          end: characterRange.end,
          containerNode: containerNode,
        });

        return range;
      },

      serializeSelection: function (selection, containerNode) {
        var ranges = selection.getAllRanges(),
          rangeCount = ranges.length;
        var rangeInfos = [];

        var backward = rangeCount == 1 && selection.isBackward();

        for (var i = 0, len = ranges.length; i < len; ++i) {
          rangeInfos[i] = {
            characterRange: this.rangeToCharacterRange(
              ranges[i],
              containerNode
            ),
            backward: backward,
          };
        }

        return rangeInfos;
      },

      restoreSelection: function (selection, savedSelection, containerNode) {
        selection.removeAllRanges();
        var doc = selection.win.document;
        for (
          var i = 0,
            len = savedSelection.length,
            range,
            rangeInfo,
            characterRange;
          i < len;
          ++i
        ) {
          rangeInfo = savedSelection[i];
          characterRange = rangeInfo.characterRange;
          range = this.characterRangeToRange(
            doc,
            rangeInfo.characterRange,
            containerNode
          );
          selection.addRange(range, rangeInfo.backward);
        }
      },
    };

    registerHighlighterType("textContent", function () {
      return textContentConverter;
    });

    /*----------------------------------------------------------------------------------------------------------------*/

    // Lazily load the TextRange-based converter so that the dependency is only checked when required.
    registerHighlighterType(
      "TextRange",
      (function () {
        var converter;

        return function () {
          if (!converter) {
            // Test that textRangeModule exists and is supported
            var textRangeModule = api.modules.TextRange;
            if (!textRangeModule) {
              throw new Error("TextRange module is missing.");
            } else if (!textRangeModule.supported) {
              throw new Error("TextRange module is present but not supported.");
            }

            converter = {
              rangeToCharacterRange: function (range, containerNode) {
                return CharacterRange.fromCharacterRange(
                  range.toCharacterRange(containerNode)
                );
              },

              characterRangeToRange: function (
                doc,
                characterRange,
                containerNode
              ) {
                var range = api.createRange(doc);
                range.selectCharacters(
                  containerNode,
                  characterRange.start,
                  characterRange.end
                );
                return range;
              },

              serializeSelection: function (selection, containerNode) {
                return selection.saveCharacterRanges(containerNode);
              },

              restoreSelection: function (
                selection,
                savedSelection,
                containerNode
              ) {
                selection.restoreCharacterRanges(containerNode, savedSelection);
              },
            };
          }

          return converter;
        };
      })()
    );

    /*----------------------------------------------------------------------------------------------------------------*/

    function Highlight(
      doc,
      characterRange,
      classApplier,
      converter,
      id,
      containerElementId
    ) {
      if (id) {
        this.id = id;
        nextHighlightId = Math.max(nextHighlightId, id + 1);
      } else {
        this.id = nextHighlightId++;
      }
      this.characterRange = characterRange;
      this.doc = doc;
      this.classApplier = classApplier;
      this.converter = converter;
      this.containerElementId = containerElementId || null;
      this.applied = false;
    }

    Highlight.prototype = {
      getContainerElement: function () {
        return getContainerElement(this.doc, this.containerElementId);
      },

      getRange: function () {
        return this.converter.characterRangeToRange(
          this.doc,
          this.characterRange,
          this.getContainerElement()
        );
      },

      fromRange: function (range) {
        this.characterRange = this.converter.rangeToCharacterRange(
          range,
          this.getContainerElement()
        );
      },

      getText: function () {
        return this.getRange().toString();
      },

      containsElement: function (el) {
        return this.getRange().containsNodeContents(el.firstChild);
      },

      unapply: function () {
        this.classApplier.undoToRange(this.getRange());
        this.applied = false;
      },

      apply: function () {
        this.classApplier.applyToRange(this.getRange());
        this.applied = true;
      },

      getHighlightElements: function () {
        return this.classApplier.getElementsWithClassIntersectingRange(
          this.getRange()
        );
      },

      toString: function () {
        return (
          "[Highlight(ID: " +
          this.id +
          ", class: " +
          this.classApplier.className +
          ", character range: " +
          this.characterRange.start +
          " - " +
          this.characterRange.end +
          ")]"
        );
      },
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    function Highlighter(doc, type) {
      type = type || "textContent";
      this.doc = doc || document;
      this.classAppliers = {};
      this.highlights = [];
      this.converter = getConverter(type);
    }

    Highlighter.prototype = {
      addClassApplier: function (classApplier) {
        this.classAppliers[classApplier.className] = classApplier;
      },

      getHighlightForElement: function (el) {
        var highlights = this.highlights;
        for (var i = 0, len = highlights.length; i < len; ++i) {
          if (highlights[i].containsElement(el)) {
            return highlights[i];
          }
        }
        return null;
      },

      removeHighlights: function (highlights) {
        for (var i = 0, len = this.highlights.length, highlight; i < len; ++i) {
          highlight = this.highlights[i];
          if (contains(highlights, highlight)) {
            highlight.unapply();
            this.highlights.splice(i--, 1);
          }
        }
      },

      removeAllHighlights: function () {
        this.removeHighlights(this.highlights);
      },

      getIntersectingHighlights: function (ranges) {
        // Test each range against each of the highlighted ranges to see whether they overlap
        var intersectingHighlights = [],
          highlights = this.highlights;
        forEach(ranges, function (range) {
          //var selCharRange = converter.rangeToCharacterRange(range);
          forEach(highlights, function (highlight) {
            if (
              range.intersectsRange(highlight.getRange()) &&
              !contains(intersectingHighlights, highlight)
            ) {
              intersectingHighlights.push(highlight);
            }
          });
        });

        return intersectingHighlights;
      },

      highlightCharacterRanges: function (className, charRanges, options) {
        var i, len, j;
        var highlights = this.highlights;
        var converter = this.converter;
        var doc = this.doc;
        var highlightsToRemove = [];
        var classApplier = className ? this.classAppliers[className] : null;

        options = createOptions(options, {
          containerElementId: null,
          exclusive: true,
        });

        var containerElementId = options.containerElementId;
        var exclusive = options.exclusive;

        var containerElement, containerElementRange, containerElementCharRange;
        if (containerElementId) {
          containerElement = this.doc.getElementById(containerElementId);
          if (containerElement) {
            containerElementRange = api.createRange(this.doc);
            containerElementRange.selectNodeContents(containerElement);
            containerElementCharRange = new CharacterRange(
              0,
              containerElementRange.toString().length
            );
          }
        }

        var charRange,
          highlightCharRange,
          removeHighlight,
          isSameClassApplier,
          highlightsToKeep,
          splitHighlight;

        for (i = 0, len = charRanges.length; i < len; ++i) {
          charRange = charRanges[i];
          highlightsToKeep = [];

          // Restrict character range to container element, if it exists
          if (containerElementCharRange) {
            charRange = charRange.intersection(containerElementCharRange);
          }

          // Ignore empty ranges
          if (charRange.start == charRange.end) {
            continue;
          }

          // Check for intersection with existing highlights. For each intersection, create a new highlight
          // which is the union of the highlight range and the selected range
          for (j = 0; j < highlights.length; ++j) {
            removeHighlight = false;

            if (containerElementId == highlights[j].containerElementId) {
              highlightCharRange = highlights[j].characterRange;
              isSameClassApplier = classApplier == highlights[j].classApplier;
              splitHighlight = !isSameClassApplier && exclusive;

              // Replace the existing highlight if it needs to be:
              //  1. merged (isSameClassApplier)
              //  2. partially or entirely erased (className === null)
              //  3. partially or entirely replaced (isSameClassApplier == false && exclusive == true)
              if (
                (highlightCharRange.intersects(charRange) ||
                  highlightCharRange.isContiguousWith(charRange)) &&
                (isSameClassApplier || splitHighlight)
              ) {
                // Remove existing highlights, keeping the unselected parts
                if (splitHighlight) {
                  forEach(
                    highlightCharRange.getComplements(charRange),
                    function (rangeToAdd) {
                      highlightsToKeep.push(
                        new Highlight(
                          doc,
                          rangeToAdd,
                          highlights[j].classApplier,
                          converter,
                          null,
                          containerElementId
                        )
                      );
                    }
                  );
                }

                removeHighlight = true;
                if (isSameClassApplier) {
                  charRange = highlightCharRange.union(charRange);
                }
              }
            }

            if (removeHighlight) {
              highlightsToRemove.push(highlights[j]);
              highlights[j] = new Highlight(
                doc,
                highlightCharRange.union(charRange),
                classApplier,
                converter,
                null,
                containerElementId
              );
            } else {
              highlightsToKeep.push(highlights[j]);
            }
          }

          // Add new range
          if (classApplier) {
            highlightsToKeep.push(
              new Highlight(
                doc,
                charRange,
                classApplier,
                converter,
                null,
                containerElementId
              )
            );
          }
          this.highlights = highlights = highlightsToKeep;
        }

        // Remove the old highlights
        forEach(highlightsToRemove, function (highlightToRemove) {
          highlightToRemove.unapply();
        });

        // Apply new highlights
        var newHighlights = [];
        forEach(highlights, function (highlight) {
          if (!highlight.applied) {
            highlight.apply();
            newHighlights.push(highlight);
          }
        });

        return newHighlights;
      },

      highlightRanges: function (className, ranges, options) {
        var selCharRanges = [];
        var converter = this.converter;

        options = createOptions(options, {
          containerElement: null,
          exclusive: true,
        });

        var containerElement = options.containerElement;
        var containerElementId = containerElement ? containerElement.id : null;
        var containerElementRange;
        if (containerElement) {
          containerElementRange = api.createRange(containerElement);
          containerElementRange.selectNodeContents(containerElement);
        }

        forEach(ranges, function (range) {
          var scopedRange = containerElement
            ? containerElementRange.intersection(range)
            : range;
          selCharRanges.push(
            converter.rangeToCharacterRange(
              scopedRange,
              containerElement || getBody(range.getDocument())
            )
          );
        });

        return this.highlightCharacterRanges(className, selCharRanges, {
          containerElementId: containerElementId,
          exclusive: options.exclusive,
        });
      },

      highlightSelection: function (className, options) {
        var converter = this.converter;
        var classApplier = className ? this.classAppliers[className] : false;

        options = createOptions(options, {
          containerElementId: null,
          selection: api.getSelection(this.doc),
          exclusive: true,
        });

        var containerElementId = options.containerElementId;
        var exclusive = options.exclusive;
        var selection = options.selection;
        var doc = selection.win.document;
        var containerElement = getContainerElement(doc, containerElementId);

        if (!classApplier && className !== false) {
          throw new Error(
            "No class applier found for class '" + className + "'"
          );
        }

        // Store the existing selection as character ranges
        var serializedSelection = converter.serializeSelection(
          selection,
          containerElement
        );

        // Create an array of selected character ranges
        var selCharRanges = [];
        forEach(serializedSelection, function (rangeInfo) {
          selCharRanges.push(
            CharacterRange.fromCharacterRange(rangeInfo.characterRange)
          );
        });

        var newHighlights = this.highlightCharacterRanges(
          className,
          selCharRanges,
          {
            containerElementId: containerElementId,
            exclusive: exclusive,
          }
        );

        // Restore selection
        converter.restoreSelection(
          selection,
          serializedSelection,
          containerElement
        );

        return newHighlights;
      },

      unhighlightSelection: function (selection) {
        selection = selection || api.getSelection(this.doc);
        var intersectingHighlights = this.getIntersectingHighlights(
          selection.getAllRanges()
        );
        this.removeHighlights(intersectingHighlights);
        selection.removeAllRanges();
        return intersectingHighlights;
      },

      getHighlightsInSelection: function (selection) {
        selection = selection || api.getSelection(this.doc);
        return this.getIntersectingHighlights(selection.getAllRanges());
      },

      selectionOverlapsHighlight: function (selection) {
        return this.getHighlightsInSelection(selection).length > 0;
      },

      serialize: function (options) {
        var highlighter = this;
        var highlights = highlighter.highlights;
        var serializedType,
          serializedHighlights,
          convertType,
          serializationConverter;

        highlights.sort(compareHighlights);
        options = createOptions(options, {
          serializeHighlightText: false,
          type: highlighter.converter.type,
        });

        serializedType = options.type;
        convertType = serializedType != highlighter.converter.type;

        if (convertType) {
          serializationConverter = getConverter(serializedType);
        }

        serializedHighlights = ["type:" + serializedType];

        forEach(highlights, function (highlight) {
          var characterRange = highlight.characterRange;
          var containerElement;

          // Convert to the current Highlighter's type, if different from the serialization type
          if (convertType) {
            containerElement = highlight.getContainerElement();
            characterRange = serializationConverter.rangeToCharacterRange(
              highlighter.converter.characterRangeToRange(
                highlighter.doc,
                characterRange,
                containerElement
              ),
              containerElement
            );
          }

          var parts = [
            characterRange.start,
            characterRange.end,
            highlight.id,
            highlight.classApplier.className,
            highlight.containerElementId,
          ];

          if (options.serializeHighlightText) {
            parts.push(highlight.getText());
          }
          serializedHighlights.push(parts.join("$"));
        });

        return serializedHighlights.join("|");
      },

      deserialize: function (serialized) {
        var serializedHighlights = serialized.split("|");
        var highlights = [];

        var firstHighlight = serializedHighlights[0];
        var regexResult;
        var serializationType,
          serializationConverter,
          convertType = false;
        if (
          firstHighlight &&
          (regexResult = /^type:(\w+)$/.exec(firstHighlight))
        ) {
          serializationType = regexResult[1];
          if (serializationType != this.converter.type) {
            serializationConverter = getConverter(serializationType);
            convertType = true;
          }
          serializedHighlights.shift();
        } else {
          throw new Error("Serialized highlights are invalid.");
        }

        var classApplier,
          highlight,
          characterRange,
          containerElementId,
          containerElement;

        for (var i = serializedHighlights.length, parts; i-- > 0; ) {
          parts = serializedHighlights[i].split("$");
          characterRange = new CharacterRange(+parts[0], +parts[1]);
          containerElementId = parts[4] || null;

          // Convert to the current Highlighter's type, if different from the serialization type
          if (convertType) {
            containerElement = getContainerElement(
              this.doc,
              containerElementId
            );
            characterRange = this.converter.rangeToCharacterRange(
              serializationConverter.characterRangeToRange(
                this.doc,
                characterRange,
                containerElement
              ),
              containerElement
            );
          }

          classApplier = this.classAppliers[parts[3]];

          if (!classApplier) {
            throw new Error(
              "No class applier found for class '" + parts[3] + "'"
            );
          }

          highlight = new Highlight(
            this.doc,
            characterRange,
            classApplier,
            this.converter,
            parseInt(parts[2]),
            containerElementId
          );
          highlight.apply();
          highlights.push(highlight);
        }
        this.highlights = highlights;
      },
    };

    api.Highlighter = Highlighter;

    api.createHighlighter = function (doc, rangeCharacterOffsetConverterType) {
      return new Highlighter(doc, rangeCharacterOffsetConverterType);
    };
  });

  return rangy;
}, this);
