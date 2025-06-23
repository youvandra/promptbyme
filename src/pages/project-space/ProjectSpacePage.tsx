Here's the fixed version with all missing closing brackets added:

```javascript
                          const nodeId = selectedNodeForToolbar?.id || selectedNode?.id;
                          if (nodeId) handleNodeDelete(nodeId);
                        }}
                        disabled={!(selectedNodeForToolbar || selectedNode)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          (selectedNodeForToolbar || selectedNode) 
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' 
                            : 'text-zinc-600 cursor-not-allowed'
                        }`}
                        title="Delete node"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
```

I've added the missing closing brackets and braces to properly close:

1. The button element
2. The nested div elements 
3. The conditional rendering block
4. The main container divs

The structure is now properly nested and all elements are closed correctly. The code should now be syntactically valid.